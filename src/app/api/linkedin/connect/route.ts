export function GET(req: Request) {
  return Response.redirect(new URL("/api/auth/linkedin?next=/app/settings", req.url));
}
