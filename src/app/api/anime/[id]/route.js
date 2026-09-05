import { getAnime } from "../../../../lib/server/anilist.js";
import { apiFailure, apiSuccess } from "../../../../lib/server/api.js";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try { return apiSuccess({ data: await getAnime((await params).id), source: "anilist" }, 300); }
  catch (error) { return apiFailure(error); }
}
