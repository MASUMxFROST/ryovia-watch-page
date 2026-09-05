import { getAnime } from "../../../../../lib/server/anilist.js";
import { getMalAnime } from "../../../../../lib/server/mal.js";
import { apiFailure, apiSuccess } from "../../../../../lib/server/api.js";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const anime = await getAnime((await params).id);
    const data = anime.malId ? await getMalAnime(anime.malId) : null;
    return apiSuccess({ data, source: data?.source || null }, 600);
  } catch (error) { return apiFailure(error); }
}
