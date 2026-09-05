import { Suspense } from "react";
import Discover from "../views/Discover/Discover";

export const metadata = {
  title: "Discover anime",
};

export default function Home() {
  return <Suspense fallback={<main className="watch-page">Loading the anime catalog…</main>}><Discover /></Suspense>;
}
