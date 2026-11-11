import { ArrowLeftRight, FileQuestion } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getPost, listPosts } from "@/lib/posts";
import { getRetentionContext } from "@/lib/retention";
import { getAccount, postUrl } from "@/lib/linkedin";
import { Editor } from "@/components/Editor";
import { ClaudeMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

function WrongAccount({ exists, viewerEmail, id }: { exists: boolean; viewerEmail: string; id: string }) {
  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <div className="card w-full max-w-lg p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-apricot-soft text-apricot-dark">
          {exists ? <ArrowLeftRight className="h-6 w-6" /> : <FileQuestion className="h-6 w-6" />}
        </div>
        {exists ? (
          <>
            <h1 className="mt-5 font-display text-2xl font-bold">This post isn’t in your account</h1>
            <p className="mt-2 text-[15px] text-muted">
              You’re signed in as <b className="text-ink-2">{viewerEmail}</b>, and this post belongs to a different Cadence account.
            </p>
            <div className="mt-5 rounded-2xl bg-claude-soft p-4 text-left text-[13px] leading-relaxed text-ink-2">
              <div className="mb-1 flex items-center gap-2 font-semibold text-claude"><ClaudeMark className="h-4 w-4" /> Saved from Claude?</div>
              Claude’s Cadence connector may be linked to a different account. In Claude, open <b>Settings → Connectors → Cadence</b>, click <b>Disconnect</b>, then <b>Connect</b> and confirm the account card shows {viewerEmail}.
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <form action="/api/auth/logout" method="post">
                <input type="hidden" name="next" value={`/login?next=${encodeURIComponent(`/app/posts/${id}`)}`} />
                <button className="btn-primary">Switch Cadence account</button>
              </form>
              <Link href="/app" className="btn-secondary">Go to my posts</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-2xl font-bold">We couldn’t find that post</h1>
            <p className="mt-2 text-[15px] text-muted">It may have been deleted, or the link is incomplete.</p>
            <Link href="/app" className="btn-primary mt-6">Go to my posts</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ when?: string }> }) {
  const { id } = await params;
  const { when } = await searchParams;
  const user = await requireUser(`/app/posts/${id}`);
  const [post, acct] = await Promise.all([getPost(user.id, id), getAccount(user.id)]);
  if (!post) {
    const [row] = /^[0-9a-f-]{36}$/i.test(id) ? await sql`select 1 from posts where id = ${id}` : [];
    return <WrongAccount exists={Boolean(row)} viewerEmail={user.email} id={id} />;
  }
  const retention = post.status === "draft" || post.status === "failed"
    ? await getRetentionContext(user.id, await listPosts(user.id, "all", 500), user.timezone, user.weekly_goal)
    : null;
  return (
    <Editor
      initial={JSON.parse(JSON.stringify(post))}
      author={{ name: acct?.name || user.name, headline: user.headline, picture: acct?.picture ?? null }}
      linkedinConnected={Boolean(acct)}
      linkedinUrl={postUrl(post.linkedin_urn)}
      initialWhen={when}
      retention={retention}
    />
  );
}
