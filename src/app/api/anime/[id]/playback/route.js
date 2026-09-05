import { getAnime } from "../../../../../lib/server/anilist.js";
import { getPlayback } from "../../../../../lib/server/playback.js";
import { apiFailure, apiSuccess, positiveInteger, ApiError } from "../../../../../lib/server/api.js";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const id = positiveInteger((await params).id);
    const query = new URL(request.url).searchParams;
    const episode = query.get("episode") || "1";
    const language = query.get("language") || "sub";
    if (!/^\d+(?:\.\d+)?$/.test(episode) || Number(episode) <= 0 || Number(episode) > 100000 || !["sub", "dub"].includes(language)) {
      throw new ApiError("Choose a valid episode and sub or dub language.", "PLAYBACK_INVALID_INPUT", 400);
    }
    const anime = await getAnime(id);
    return apiSuccess(await getPlayback(anime, episode, language), 60);
  } catch (error) {
    return apiFailure(error);
  }
}
