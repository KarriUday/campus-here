import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  isWhatsAppConfigured,
  isWhatsAppDryRun,
  sendWhatsApp,
  whatsAppFrom,
  WhatsAppError,
} from "@/server/services/whatsapp";

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const scope =
    auth.session.role === "FACULTY" ? { sentById: auth.session.userId } : {};

  const messages = await prisma.whatsAppMessage.findMany({
    where: { cycleId: cycle.id, ...scope },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    dryRun: isWhatsAppDryRun(),
    configured: isWhatsAppConfigured(),
    from: whatsAppFrom(),
    history: messages.map((message) => ({
      id: message.id,
      toNumber: message.toNumber,
      bodyPreview: message.body.slice(0, 120),
      status: message.status,
      mode: message.mode,
      twilioSid: message.twilioSid,
      error: message.error,
      createdAt: message.createdAt,
    })),
  });
}

const SendSchema = z.object({
  body: z.string().min(1, "A message body is required.").max(1500),
  /** Extra numbers typed by hand, in addition to the resolved students. */
  extraNumbers: z.array(z.string()).default([]),
  /** FACULTY resolves to their own groups; ADMIN may target the whole cycle. */
  mode: z.enum(["MY_GROUPS", "ALL", "MANUAL_ONLY"]).default("MY_GROUPS"),
  documentsEmailed: z.boolean().default(false),
});

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = SendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const isFaculty = auth.session.role === "FACULTY";
  // A guide can never widen scope to the whole cycle.
  const mode = isFaculty && parsed.data.mode === "ALL" ? "MY_GROUPS" : parsed.data.mode;

  let numbers: string[] = [];
  if (mode !== "MANUAL_ONLY") {
    const students = await prisma.student.findMany({
      where: {
        phone: { not: null },
        ...(mode === "MY_GROUPS"
          ? {
              memberships: {
                some: {
                  cycleId: cycle.id,
                  group: {
                    allocation: {
                      facultyId: isFaculty ? auth.session.facultyId : undefined,
                      status: "ALLOCATED",
                    },
                  },
                },
              },
            }
          : { enrollments: { some: { cycleId: cycle.id } } }),
      },
      select: { phone: true },
    });
    numbers = students.map((s) => s.phone!).filter(Boolean);
  }
  numbers.push(...parsed.data.extraNumbers);

  try {
    const result = await sendWhatsApp({
      cycleId: cycle.id,
      sentById: auth.session.userId,
      numbers,
      body: parsed.data.body,
      documentsEmailed: parsed.data.documentsEmailed,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WhatsAppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
