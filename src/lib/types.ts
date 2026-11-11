export const PILLARS = [
  "Thought leadership",
  "Story",
  "How-to",
  "Announcement",
  "Opinion",
] as const;
export type Pillar = (typeof PILLARS)[number];

export type PostStatus = "draft" | "scheduled" | "publishing" | "posted" | "failed";

export type Post = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  original_body: string | null;
  image_id: string | null;
  pillar: string;
  status: PostStatus;
  scheduled_at: string | null;
  posted_at: string | null;
  linkedin_urn: string | null;
  simulated: boolean;
  error: string | null;
  source: "claude" | "app";
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  headline: string;
  mcp_token: string;
  weekly_goal: number;
  is_demo: boolean;
  timezone: string;
};

export const MAX_CHARS = 3000;
export const FOLD_CHARS = 210;
