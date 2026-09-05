import { getAnime } from "../../../../../lib/server/anilist.js";
import { getAnikotoSeries } from "../../../../../lib/server/anikoto.js";
import { apiFailure, apiSuccess } from "../../../../../lib/server/api.js";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const anime = await getAnime((await params).id);
    const data = await getAnikotoSeries(anime);
    return apiSuccess({ data, source: "anikoto", status: data?.episodes.length ? "ready" : "unavailable" }, 120);
  } catch (error) { return apiFailure(error); }
}
