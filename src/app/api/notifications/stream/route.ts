import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSelectedCycle } from "@/lib/cycle";

/**
 * Server-sent events for the student inbox.
 *
 * This is the fast path, not the guarantee. On serverless the function is
 * killed at its execution limit, so the stream closes and the browser
 * reconnects; the `?since=` polling endpoint is what actually guarantees
 * delivery. The prototype used the same two-tier arrangement, falling back to
 * a 5-second poll whenever its EventSource errored.
 */

/** Stop well before a typical serverless limit and let the client reconnect. */
const MAX_STREAM_MS = 50_000;
const POLL_INTERVAL_MS = 3_000;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT" || !session.studentId) {
    return new Response("Unauthorised", { status: 401 });
  }

  const cycle = await getSelectedCycle();
  if (!cycle) return new Response("No cycle selected", { status: 400 });

  const studentId = session.studentId;
  const cycleId = cycle.id;
  const encoder = new TextEncoder();
  let since = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("connected", { at: new Date().toISOString() });

      const startedAt = Date.now();
      let closed = false;

      const finish = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* already closed by the client */
        }
      };

      // The client disconnecting is the normal way this ends.
      request.signal.addEventListener("abort", finish);

      const timer = setInterval(async () => {
        if (closed) return;
        if (Date.now() - startedAt > MAX_STREAM_MS) {
          send("bye", { reason: "max-duration" });
          finish();
          return;
        }

        try {
          const fresh = await prisma.notification.findMany({
            where: { studentId, cycleId, createdAt: { gt: since } },
            orderBy: { createdAt: "asc" },
          });

          if (fresh.length > 0) {
            since = fresh[fresh.length - 1].createdAt;
            for (const notification of fresh) {
              send("mail", {
                id: notification.id,
                subject: notification.subject,
                body: notification.body,
                senderName: notification.senderName,
                status: notification.status,
                createdAt: notification.createdAt,
              });
            }
          } else {
            // Keeps proxies from closing an idle connection.
            send("ping", { at: new Date().toISOString() });
          }
        } catch {
          finish();
        }
      }, POLL_INTERVAL_MS);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Nginx and similar proxies buffer by default, which breaks SSE.
      "X-Accel-Buffering": "no",
    },
  });
}
