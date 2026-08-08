"use client";

import { Megaphone, Pause, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type OrientationRow = {
  id: string;
  type: "TEXT" | "AUDIO";
  title: string;
  summary: string;
  text: string | null;
  note: string | null;
  postedByLabel: string;
  postedByName: string;
  audioUrl: string | null;
  createdAt: string;
  canDelete: boolean;
};

/** Web Speech API, carried over from the prototype's Listen button. */
function speak(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function OrientationPanel({
  orientations,
  canPost,
  defaultPostedBy,
}: {
  orientations: OrientationRow[];
  canPost: boolean;
  defaultPostedBy: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<"TEXT" | "AUDIO">("TEXT");
  const [title, setTitle] = useState("Major Project Orientation");
  const [summary, setSummary] = useState(
    "Welcome and expectations for Review 0 and the allocation rules.",
  );
  const [postedByLabel, setPostedByLabel] = useState(defaultPostedBy);
  const [text, setText] = useState(
    "Hello everyone. Please form groups of exactly four, choose a clear domain, and submit six unique guide preferences. Review 0 will evaluate your problem statement, approach and feasibility. Maintain originality — similar titles are flagged automatically.",
  );
  const [audio, setAudio] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);

  function toggleSpeech(id: string, content: string) {
    if (speaking === id) {
      window.speechSynthesis.cancel();
      setSpeaking(null);
      return;
    }
    const started = speak(content, () => setSpeaking(null));
    if (!started) {
      toast({
        tone: "warning",
        title: "Text-to-speech unavailable",
        description: "This browser does not support the Web Speech API.",
      });
      return;
    }
    setSpeaking(id);
  }

  async function post() {
    setBusy(true);
    try {
      let res: Response;
      if (type === "AUDIO") {
        if (!audio) {
          toast({ tone: "warning", title: "Choose an audio file first." });
          return;
        }
        const form = new FormData();
        form.set("title", title);
        form.set("summary", summary);
        form.set("postedByLabel", postedByLabel);
        form.set("note", note);
        form.set("audio", audio);
        res = await fetch("/api/orientation", { method: "POST", body: form });
      } else {
        res = await fetch("/api/orientation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, summary, postedByLabel, text }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not post", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: "Orientation posted",
        description: "It now appears on every student dashboard for this cycle.",
      });
      setAudio(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/orientation?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast({ tone: "error", title: "Could not delete", description: data.error });
      return;
    }
    toast({ tone: "success", title: "Orientation deleted" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canPost && (
        <Card>
          <CardHeader
            title="Post an orientation"
            subtitle="Appears on the dashboard of every student in this cycle."
            actions={
              <Button
                onClick={post}
                loading={busy}
                icon={<Megaphone className="size-3.5" aria-hidden />}
              >
                Post
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Input
                label="Posted by"
                value={postedByLabel}
                onChange={(event) => setPostedByLabel(event.target.value)}
              />
              <Select
                label="Type"
                value={type}
                onChange={(event) => setType(event.target.value as "TEXT" | "AUDIO")}
              >
                <option value="TEXT">Text (students can listen)</option>
                <option value="AUDIO">Audio recording</option>
              </Select>
            </div>

            <Input
              label="Summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />

            {type === "TEXT" ? (
              <>
                <Textarea
                  label="Orientation text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-36"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleSpeech("draft", text)}
                  icon={
                    speaking === "draft" ? (
                      <Pause className="size-3.5" aria-hidden />
                    ) : (
                      <Play className="size-3.5" aria-hidden />
                    )
                  }
                >
                  {speaking === "draft" ? "Stop" : "Preview aloud"}
                </Button>
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="orientation-audio"
                    className="text-ink text-sm font-medium"
                  >
                    Audio file
                  </label>
                  <input
                    id="orientation-audio"
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setAudio(event.target.files?.[0] ?? null)}
                    className="border-border bg-surface-raised text-ink file:bg-surface file:text-ink mt-1.5 block w-full cursor-pointer border text-sm file:mr-3 file:cursor-pointer file:border-0 file:px-3 file:py-2.5 file:text-sm file:font-medium"
                  />
                  <p className="text-ink-tertiary mt-1.5 text-xs">Up to 8MB.</p>
                </div>
                <Input
                  label="Note (optional)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Duration, key points…"
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Posted orientations"
          subtitle="Most recent first."
          actions={<Badge tone="neutral">{orientations.length}</Badge>}
        />
        <CardBody className="space-y-3">
          {orientations.length === 0 ? (
            <EmptyState title="Nothing posted yet for this cycle" />
          ) : (
            orientations.map((item) => (
              <div
                key={item.id}
                className="border-border-subtle border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">{item.title}</p>
                    <p className="text-ink-secondary text-xs">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{item.type}</Badge>
                    {item.canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Delete ${item.title}`}
                        className="text-ink-tertiary hover:text-error-ink rounded p-1 transition-colors"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>

                {item.text && (
                  <>
                    <p className="text-ink-secondary mt-3 border-primary border-l-2 pl-4 py-1 text-sm leading-relaxed">
                      {item.text}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => toggleSpeech(item.id, item.text!)}
                      icon={
                        speaking === item.id ? (
                          <Pause className="size-3.5" aria-hidden />
                        ) : (
                          <Play className="size-3.5" aria-hidden />
                        )
                      }
                    >
                      {speaking === item.id ? "Stop" : "Listen"}
                    </Button>
                  </>
                )}

                {item.audioUrl && (
                  <audio controls src={item.audioUrl} className="mt-3 w-full">
                    <track kind="captions" />
                  </audio>
                )}
                {item.note && (
                  <p className="text-ink-tertiary mt-2 text-xs">{item.note}</p>
                )}

                <p className="text-ink-tertiary mt-2 text-xs">
                  Posted {new Date(item.createdAt).toLocaleString("en-IN")} by{" "}
                  {item.postedByLabel}
                  {item.postedByName !== item.postedByLabel &&
                    ` (${item.postedByName})`}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
