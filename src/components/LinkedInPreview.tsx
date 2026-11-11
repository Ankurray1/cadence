"use client";

import { Eye, Globe2, MessageSquareText, Monitor, Repeat2, Send, Smartphone, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { LinkedInMark } from "./Logo";

type Author = { name: string; headline: string; picture: string | null };

/** Truncate the way LinkedIn's feed does: max 3 lines or N chars, then "…more". */
export function foldText(body: string, mode: "mobile" | "desktop") {
  const limit = mode === "mobile" ? 140 : 210;
  const lines = body.split("\n");
  let out = "";
  let count = 0;
  for (let i = 0; i < lines.length && count < 3; i++) {
    const next = out ? out + "\n" + lines[i] : lines[i];
    if (next.length > limit) return { text: next.slice(0, limit).replace(/\s+\S*$/, ""), truncated: true };
    out = next;
    count++;
  }
  return { text: out, truncated: out.length < body.trimEnd().length };
}

const LI = { ink: "rgba(0,0,0,.9)", sub: "rgba(0,0,0,.6)", faint: "rgba(0,0,0,.4)" };

/**
 * The hero of the editor: a clearly-labelled preview stage showing the post exactly as it
 * will appear in the LinkedIn feed. No fake likes or comments: the post isn't live yet.
 */
export function LinkedInPreview({ author, body, imageUrl }: { author: Author; body: string; imageUrl: string | null }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const [expanded, setExpanded] = useState(false);
  const folded = foldText(body, mode);
  const initials = author.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <section className="relative flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-[#ece9f2] p-1.5">
      {/* Stage header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-3 text-ink">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-vivid px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-white uppercase">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
            Live preview
          </span>
          <span className="hidden text-[13px] text-muted sm:inline">This is how your post will look on LinkedIn</span>
        </div>
        <div className="flex rounded-full bg-white/70 p-1">
          {([["mobile", Smartphone], ["desktop", Monitor]] as const).map(([m, Icon]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setExpanded(false); }}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold capitalize transition ${mode === m ? "bg-vivid text-white" : "text-muted hover:text-ink"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {m}
            </button>
          ))}
        </div>
      </div>

      {/* LinkedIn feed canvas */}
      <div className="relative flex-1 overflow-y-auto rounded-[20px] bg-[#f4f2ee] px-4 py-6 ring-1 ring-black/5">
        <div className="mx-auto mb-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[rgba(0,0,0,.45)]">
          <LinkedInMark className="h-3.5 w-3.5 text-linkedin" /> Your LinkedIn feed · {mode === "mobile" ? "phone" : "desktop"}
        </div>

        <article
          className={`relative mx-auto overflow-hidden bg-white transition-all duration-300 ${mode === "mobile" ? "max-w-[375px] rounded-[28px] shadow-[0_0_0_8px_#1f1a2b,0_20px_40px_-12px_rgba(0,0,0,.35)]" : "max-w-[555px] rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_12px_30px_-12px_rgba(0,0,0,.25)]"}`}
          style={{ fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, sans-serif" }}
        >
          <span className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[rgba(0,0,0,.06)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[rgba(0,0,0,.5)] uppercase">
            <Eye className="h-3 w-3" /> Preview
          </span>

          <div className="flex gap-2 px-4 pt-3">
            {author.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.picture} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#dbe7f3] text-sm font-semibold text-[#0a66c2]">{initials}</div>
            )}
            <div className="min-w-0 pr-16 leading-tight">
              <div className="text-sm font-semibold" style={{ color: LI.ink }}>{author.name} <span className="font-normal" style={{ color: LI.sub }}>• You</span></div>
              <div className="truncate text-xs" style={{ color: LI.sub }}>{author.headline || "Your LinkedIn headline"}</div>
              <div className="flex items-center gap-1 text-xs" style={{ color: LI.sub }}>Now • <Globe2 className="h-3 w-3" /></div>
            </div>
          </div>

          <div className="px-4 pt-2 pb-3 text-sm leading-5 break-words whitespace-pre-wrap" style={{ color: LI.ink }}>
            {body ? (
              expanded || !folded.truncated ? (
                <>
                  {body}
                  {folded.truncated && (
                    <button onClick={() => setExpanded(false)} className="ml-1 hover:underline" style={{ color: LI.sub }}>show less</button>
                  )}
                </>
              ) : (
                <>
                  {folded.text}
                  <button onClick={() => setExpanded(true)} className="hover:text-[#0a66c2] hover:underline" style={{ color: LI.sub }}>…more</button>
                </>
              )
            ) : (
              <span style={{ color: LI.faint }}>Start writing on the left. Your post appears here exactly as LinkedIn will show it.</span>
            )}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imageUrl && <img src={imageUrl} alt="" className="max-h-[440px] w-full object-cover" />}

          {/* No fake engagement: the post isn't live yet */}
          <div className="mx-4 border-b border-black/10 py-2 text-[11px] italic" style={{ color: LI.faint }}>
            Reactions and comments will appear here once it’s published
          </div>
          <div className="grid grid-cols-4 px-1 py-1 opacity-60">
            {[[ThumbsUp, "Like"], [MessageSquareText, "Comment"], [Repeat2, "Repost"], [Send, "Send"]].map(([Icon, l]) => {
              const I = Icon as typeof ThumbsUp;
              return (
                <span key={l as string} className="flex items-center justify-center gap-1.5 rounded py-2.5 text-xs font-semibold" style={{ color: LI.sub }}>
                  <I className="h-4 w-4" /> <span className={mode === "mobile" ? "hidden" : ""}>{l as string}</span>
                </span>
              );
            })}
          </div>
        </article>

        {folded.truncated && !expanded && (
          <p className="mx-auto mt-4 max-w-[555px] text-center text-[12px]" style={{ color: LI.sub }}>
            👆 In the feed, people only see the text above <b>“…more”</b> until they click. Make those first lines count.
          </p>
        )}
      </div>
    </section>
  );
}
