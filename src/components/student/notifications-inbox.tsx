"use client";

import { Mail, Radio, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type InboxMessage = {
  id: string;
  subject: string;
  body: string;
  senderName: string;
  status: string;
  createdAt: string;
};

type Transport = "connecting" | "stream" | "polling";

const POLL_INTERVAL_MS = 5000;

/**
 * Two-tier delivery, the same arrangement the prototype used.
 *
 * Server-sent events are the fast path. On serverless the function is killed
 * at its execution limit, so the stream ends and this falls back to polling
 * `?since=` — which is what actually guarantees a message is never missed.
 */
export function NotificationsInbox({
  initial,
  serverTime,
}: {
  initial: InboxMessage[];
  serverTime: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [transport, setTransport] = useState<Transport>("connecting");
  const [refreshing, setRefreshing] = useState(false);
  const since = useRef(serverTime);
  const seen = useRef(new Set(initial.map((m) => m.id)));

  const absorb = useCallback((incoming: InboxMessage[]) => {
    const fresh = incoming.filter((m) => !seen.current.has(m.id));
    if (fresh.length === 0) return;
    for (const message of fresh) seen.current.add(message.id);
    setMessages((current) =>
      [...fresh, ...current].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    );
  }, []);

  const poll = useCallback(async () => {
    const res = await fetch(
      `/api/notifications?since=${encodeURIComponent(since.current)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    since.current = data.serverTime;
    absorb(data.notifications);
  }, [absorb]);

  useEffect(() => {
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const startPolling = () => {
      if (cancelled || pollTimer) return;
      setTransport("polling");
      pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    };

    try {
      source = new EventSource("/api/notifications/stream");

      source.addEventListener("connected", () => {
        if (!cancelled) setTransport("stream");
      });

      source.addEventListener("mail", (event) => {
        const message = JSON.parse((event as MessageEvent).data) as InboxMessage;
        absorb([message]);
        since.current = message.createdAt;
      });

      // The server closes at its duration cap; catch up by polling once, and
      // let EventSource's own retry re-establish the stream.
      source.addEventListener("bye", () => void poll());

      source.onerror = () => {
        source?.close();
        source = null;
        startPolling();
        void poll();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      source?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [absorb, poll]);

  return (
    <Card>
      <CardHeader
        title="Inbox"
        subtitle="Messages your coordinator and guide send you."
        actions={
          <>
            <Badge tone={transport === "stream" ? "success" : "neutral"}>
              <Radio className="mr-1 inline size-3" aria-hidden />
              {transport === "stream"
                ? "Live"
                : transport === "polling"
                  ? "Polling every 5s"
                  : "Connecting…"}
            </Badge>
            <Button
              size="sm"
              variant="secondary"
              loading={refreshing}
              onClick={async () => {
                setRefreshing(true);
                try {
                  await poll();
                } finally {
                  setRefreshing(false);
                }
              }}
              icon={<RefreshCw className="size-3.5" aria-hidden />}
            >
              Refresh
            </Button>
          </>
        }
      />
      <CardBody className="space-y-3">
        {messages.length === 0 ? (
          <EmptyState
            icon={<Mail className="size-6" aria-hidden />}
            title="No messages yet"
            description="Announcements and reminders appear here as they are sent."
          />
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="border-border-subtle border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink text-sm font-medium">{message.subject}</p>
                  <p className="text-ink-secondary text-xs">
                    From {message.senderName} ·{" "}
                    {new Date(message.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge
                  tone={
                    message.status === "DELIVERED"
                      ? "success"
                      : message.status === "FAILED"
                        ? "error"
                        : "neutral"
                  }
                >
                  {message.status}
                </Badge>
              </div>
              <p className="text-ink-secondary mt-3 border-primary border-l-2 pl-4 py-1 text-sm whitespace-pre-wrap">
                {message.body}
              </p>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
