"use client";

import Link from "next/link";

export default function WatchError({ reset }) {
  return <main className="watch-page route-message" role="alert"><h1>We couldn’t load this anime</h1><p>The catalog service may be busy. Please try again shortly.</p><div><button type="button" onClick={reset}>Try again</button><Link href="/">Back to discovery</Link></div></main>;
}
