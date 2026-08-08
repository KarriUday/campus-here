import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound, resolveCycle } from "@/server/http";

/** Orientation audio is stored in Postgres like every other upload. */
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const orientations = await prisma.orientation.findMany({
    where: { cycleId: cycle.id },
    orderBy: { createdAt: "desc" },
    include: {
      postedBy: { select: { id: true, name: true } },
      audio: { select: { id: true, filename: true, size: true } },
    },
  });

  return NextResponse.json({
    orientations: orientations.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
      text: row.text,
      note: row.note,
      postedByLabel: row.postedByLabel,
      postedById: row.postedById,
      postedByName: row.postedBy.name,
      audioUrl: row.audioFileId ? `/api/orientation/${row.id}/audio` : null,
      createdAt: row.createdAt,
      // Only the author may delete their own post.
      canDelete: row.postedById === auth.session.userId,
    })),
  });
}

const TextSchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().min(2).max(300),
  postedByLabel: z.string().min(2).max(80),
  text: z.string().min(10, "Write the orientation text.").max(8000),
});

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const contentType = request.headers.get("content-type") ?? "";

  // Audio orientation: multipart with a file.
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const audio = form.get("audio");
    const title = String(form.get("title") ?? "").trim();
    const summary = String(form.get("summary") ?? "").trim();
    const postedByLabel = String(form.get("postedByLabel") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();

    if (!title || !summary) return badRequest("A title and summary are required.");
    if (!audio || typeof audio === "string") {
      return badRequest("Choose an audio file.");
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return badRequest(
        `Audio is larger than ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const file = await tx.uploadedFile.create({
        data: {
          filename: audio.name,
          mimeType: audio.type || "audio/mpeg",
          size: audio.size,
          bytes: Buffer.from(await audio.arrayBuffer()),
          kind: "ORIENTATION_AUDIO",
          uploadedById: auth.session.userId,
        },
      });
      return tx.orientation.create({
        data: {
          cycleId: cycle.id,
          type: "AUDIO",
          title,
          summary,
          postedByLabel: postedByLabel || "Coordinator",
          postedById: auth.session.userId,
          note: note || null,
          audioFileId: file.id,
        },
        select: { id: true, title: true, type: true },
      });
    });

    return NextResponse.json({ ok: true, orientation: created });
  }

  const parsed = TextSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const orientation = await prisma.orientation.create({
    data: {
      cycleId: cycle.id,
      type: "TEXT",
      title: parsed.data.title,
      summary: parsed.data.summary,
      postedByLabel: parsed.data.postedByLabel,
      postedById: auth.session.userId,
      text: parsed.data.text,
    },
    select: { id: true, title: true, type: true },
  });

  return NextResponse.json({ ok: true, orientation });
}

export async function DELETE(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An orientation id is required.");

  const orientation = await prisma.orientation.findUnique({ where: { id } });
  if (!orientation) return notFound("No such orientation.");

  // The prototype let faculty delete the coordinator's posts, because the
  // faculty screen simply rendered the admin one. Authorship is checked here.
  if (
    auth.session.role === "FACULTY" &&
    orientation.postedById !== auth.session.userId
  ) {
    return NextResponse.json(
      { error: "You can only delete orientations you posted." },
      { status: 403 },
    );
  }

  await prisma.orientation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
