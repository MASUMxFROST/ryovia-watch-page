import Link from "next/link";

export default function NotFound() {
  return <main className="watch-page route-message"><h1>Anime not found</h1><p>This page is unavailable. Find your next series in the catalog.</p><Link href="/">Discover anime</Link></main>;
}
