import { notFound } from "next/navigation";
import { getAnime } from "../../../lib/server/anilist.js";
import WatchAnime from "../../../views/WatchAnime/WatchAnime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }) {
  try {
    const anime = await getAnime((await params).id);
    return { title: anime.title, description: anime.description.slice(0, 160) };
  } catch { return { title: "Watch anime" }; }
}

export default async function WatchPage({ params, searchParams }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  let anime;
  try { anime = await getAnime(id); }
  catch (error) { if (error.status === 404) notFound(); throw error; }
  const query = await searchParams;
  const initialEpisode = typeof query.episode === "string" && /^\d+(?:\.\d+)?$/.test(query.episode) && Number(query.episode) > 0 && Number(query.episode) <= 100000 ? Number(query.episode) : 1;
  return <WatchAnime key={anime.id} anime={anime} initialEpisode={initialEpisode} />;
}
