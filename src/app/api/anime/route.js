import { getAnimeCatalog } from "../../../lib/server/anilist.js";
import { apiFailure, apiSuccess } from "../../../lib/server/api.js";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    return apiSuccess(await getAnimeCatalog(Object.fromEntries(params)), 60);
  } catch (error) { return apiFailure(error); }
}
