import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Stream a stored orientation recording to any signed-in user. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/orientation/[id]/audio">,
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorised", { status: 401 });

  const { id } = await ctx.params;
  const orientation = await prisma.orientation.findUnique({
    where: { id },
    include: { audio: true },
  });
  if (!orientation?.audio) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(orientation.audio.bytes), {
    headers: {
      "Content-Type": orientation.audio.mimeType,
      "Content-Length": String(orientation.audio.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
