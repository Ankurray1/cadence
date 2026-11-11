import { ClaudeMark } from "./Logo";
import { CopyField, CopyPrompt } from "./ui/CopyButton";

export const MCP_URL = () => `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/api/mcp`;
export const FIRST_PROMPT = "Help me write a LinkedIn post about the biggest lesson from my last project. When it's final, save it to Cadence as a draft.";

export function ConnectSteps() {
  return (
    <ol className="space-y-5">
      <li className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vivid text-xs font-semibold text-white">1</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Copy the Cadence connector URL</div>
          <div className="mt-2"><CopyField value={MCP_URL()} /></div>
        </div>
      </li>
      <li className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vivid text-xs font-semibold text-white">2</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Add it to Claude</div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            In <b className="text-ink-2">claude.ai</b> or the Claude app: <b className="text-ink-2">Customize → Connectors → + Add → Add custom connector</b>. Paste the URL, name it <b className="text-ink-2">Cadence</b>, click <b className="text-ink-2">Add</b>, then <b className="text-ink-2">Connect</b>. Sign in with the <b className="text-ink-2">Cadence account you want Claude to save to</b> and confirm it on the account card. That’s it.
          </p>
        </div>
      </li>
      <li className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vivid text-xs font-semibold text-white">3</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Try your first prompt</div>
          <div className="mt-2"><CopyPrompt text={FIRST_PROMPT} /></div>
        </div>
      </li>
    </ol>
  );
}

export function ConnectClaudeCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-gradient-to-br from-claude-soft to-surface px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-claude shadow-[var(--shadow-soft)]"><ClaudeMark className="h-5 w-5" /></span>
        <div>
          <div className="font-medium">Connect Claude</div>
          <div className="text-xs text-muted">One-time setup · about 30 seconds</div>
        </div>
      </div>
      <div className={compact ? "p-5 text-[13px]" : "p-6"}>
        <ConnectSteps />
      </div>
    </div>
  );
}
