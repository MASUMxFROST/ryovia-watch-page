import { isMalConfigured } from "../../../lib/server/mal.js";

export function GET() {
  return Response.json({ status: "ok", providers: {
    anilist: { enabled: true },
    anikoto: { enabled: true },
    myanimelist: { mode: isMalConfigured() ? "official-with-jikan-fallback" : "jikan" },
  } }, { headers: { "Cache-Control": "no-store" } });
}
