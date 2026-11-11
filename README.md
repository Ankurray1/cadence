# Cadence: LinkedIn studio for Claude

**Your Claude writes it. Cadence ships it.**

Cadence is a LinkedIn post studio and scheduler that runs on your own Claude. Claude does all the writing through MCP. Cadence stores the posts, lets you polish them with a pixel-accurate LinkedIn preview, and publishes them on schedule, even after the chat ends.

There is **no AI inside Cadence**: no OpenAI, Anthropic or other AI keys anywhere in the code.

## Connect Cadence to Claude (about 1 minute)

You don't need an account first. Claude walks you through signing in.

1. In claude.ai or the Claude app, go to **Settings → Connectors → Add custom connector**.
2. Name it **Cadence**, set the URL to `https://cadence-for-claude.vercel.app/api/mcp`, and click **Add**.
3. Click **Connect**. A Cadence window opens: sign in with LinkedIn or email (or create an account), then click **Allow access**. Done.
4. First prompt: *"Help me write a LinkedIn post about the biggest lesson from my last project. When it's final, save it to Cadence as a draft."*

Under the hood this is the standard MCP OAuth flow: protected-resource metadata, dynamic client registration, authorization code with PKCE, and refresh tokens. Custom connectors work on Free (1 connector), Pro, Max, Team and Enterprise.

### MCP tools
| Tool | What it does |
|---|---|
| `get_workspace` | Profile, timezone, current time, weekly goal, LinkedIn status, writing rules |
| `create_post` | Save a post as a draft (or schedule it), with an optional image URL |
| `update_post` / `get_post` | Revise a post. `get_post` shows whether the user edited it in the app |
| `list_posts` | Drafts, scheduled, posted or failed posts |
| `schedule_post` | Schedule or unschedule a post |
| `get_calendar` | Booked slots, so Claude can plan a content week |
| `publish_post_now` | Post immediately (only when the user explicitly asks) |
| `delete_post` | Remove a post |

## What the app does
- **Queue board**: Drafts / Scheduled / Posted, with a "From Claude · edited" badge
- **Editor**: live LinkedIn preview (mobile and desktop, with the real "…see more" fold), Unicode **bold**/*italic*, list helpers, image upload, side-by-side "Claude's original version" with restore, autosave
- **Calendar**: week view coloured by content pillar
- **Strategy**: weekly cadence goal ring and content pillar mix
- **Publishing**: LinkedIn OAuth ("Share on LinkedIn" product, `w_member_social`) with a scheduler that runs every minute. Without LinkedIn connected, the app runs in **demo mode**: publishing is simulated, and everything else works.

## Stack
Next.js 16 (App Router) on Vercel · Supabase Postgres (`cadence` schema) · `mcp-handler` (Streamable HTTP) · Supabase `pg_cron` + `pg_net` calls `/api/cron/publish` every minute.

## Environment variables
```
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres
SESSION_SECRET=<random 32+ bytes>
CRON_SECRET=<random, optional: Supabase pg_cron uses the secret stored in cadence.app_secrets>
APP_URL=https://<your-domain>
LINKEDIN_CLIENT_ID=<optional: enables real posting>
LINKEDIN_CLIENT_SECRET=<optional>
```

### LinkedIn app setup (for real posting)
1. Go to linkedin.com/developers → **Create app**. The app must be linked to a LinkedIn Company Page.
2. Under **Products**, add **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**.
3. Under **Auth**, add the redirect URL `https://<your-domain>/api/linkedin/callback`.
4. Copy the Client ID and Client Secret into the env vars and redeploy.
