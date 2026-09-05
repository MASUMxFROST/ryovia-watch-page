"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft, FaArrowRight, FaSearch } from "react-icons/fa";
import Card from "../../components/Card/Card";
import { genres } from "../../components/Genre/Genre";
import "./discover.css";

const sorts = [
  { value: "TRENDING_DESC", label: "Trending now" },
  { value: "POPULARITY_DESC", label: "Most popular" },
  { value: "SCORE_DESC", label: "Top rated" },
];

export default function Discover() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim().slice(0, 100) || "";
  const genre = genres.includes(searchParams.get("genre")) ? searchParams.get("genre") : "";
  const sort = sorts.some((item) => item.value === searchParams.get("sort")) ? searchParams.get("sort") : "TRENDING_DESC";
  const requestedPage = Number(searchParams.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 500 ? requestedPage : 1;
  const [query, setQuery] = useState(search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const searchTimer = useRef(null);
  const localNavigationSearch = useRef(null);

  function navigate(changes = {}, { replace = false, scroll = false } = {}) {
    clearTimeout(searchTimer.current);
    searchTimer.current = null;
    // Read the current URL so consecutive filter changes preserve one another.
    const current = new URLSearchParams(window.location.search);
    const values = { search: query.trim(), genre: current.get("genre") || "", sort: current.get("sort") || "TRENDING_DESC", page: Number(current.get("page")) || 1, ...changes };
    const params = new URLSearchParams();
    if (values.search) params.set("search", values.search);
    if (values.genre) params.set("genre", values.genre);
    if (values.sort !== "TRENDING_DESC") params.set("sort", values.sort);
    if (values.page > 1) params.set("page", String(values.page));
    localNavigationSearch.current = values.search;
    const destination = params.size ? `/?${params}` : "/";
    // Next's native history integration updates useSearchParams without an RSC request.
    window.history[replace ? "replaceState" : "pushState"](null, "", destination);
    if (scroll) window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    const localChange = localNavigationSearch.current === search;
    localNavigationSearch.current = null;
    if (!localChange) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
    // Keep text entered while a previous search update was being rendered.
    if (searchTimer.current === null) setQuery(search);
  }, [search]);

  useEffect(() => {
    function restoreHistorySearch() {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
      localNavigationSearch.current = null;
      setQuery(new URLSearchParams(window.location.search).get("search")?.trim().slice(0, 100) || "");
    }
    window.addEventListener("popstate", restoreHistorySearch);
    return () => {
      window.removeEventListener("popstate", restoreHistorySearch);
      clearTimeout(searchTimer.current);
    };
  }, []);

  function changeQuery(value) {
    const nextQuery = value.slice(0, 100);
    setQuery(nextQuery);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => navigate({ search: nextQuery.trim(), page: 1 }, { replace: true }), 350);
  }

  function clearFilters() {
    setQuery("");
    navigate({ search: "", genre: "", sort: "TRENDING_DESC", page: 1 });
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    const params = new URLSearchParams({ page: String(page), perPage: "18", sort });
    if (search) params.set("search", search);
    if (genre) params.set("genre", genre);

    async function fetchAnime() {
      try {
        const response = await fetch(`/api/anime?${params}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "The anime catalog is unavailable. Please try again.");
        if (!controller.signal.aborted) setResult(body);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || "The anime catalog is unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchAnime();
    return () => controller.abort();
  }, [search, genre, sort, page, attempt]);

  const anime = result?.data || [];
  const hasFilters = Boolean(search || genre || sort !== "TRENDING_DESC");
  const heading = search ? `Results for “${search}”` : genre ? `${genre} anime` : sorts.find((item) => item.value === sort).label;

  return (
    <main className="discover-page" id="top">
      <header className="discover-heading">
        <div>
          <p className="discover-eyebrow">YOUR NEXT ADVENTURE</p>
          <h1>Find your next favorite.</h1>
          <p>Explore anime, compare ratings, and pick up a new story.</p>
        </div>
        <a className="discover-source" href="https://anilist.co" target="_blank" rel="noreferrer">Catalog by AniList <span aria-hidden="true">↗</span></a>
      </header>

      <section className="discover-filter-panel" aria-label="Filter anime">
        <form className="discover-search" role="search" onSubmit={(event) => {
          event.preventDefault();
          navigate({ search: query.trim(), page: 1 }, { replace: true });
        }}>
          <label htmlFor="discover-search-input">Search the catalog</label>
          <div className="discover-input-wrapper">
            <FaSearch aria-hidden="true" />
            <input id="discover-search-input" type="search" placeholder="Search by anime title…" autoComplete="off" maxLength={100} value={query} onChange={(event) => changeQuery(event.target.value)} />
          </div>
        </form>
        <label className="discover-genre-select" htmlFor="discover-genre">Genre
          <select id="discover-genre" value={genre} onChange={(event) => navigate({ genre: event.target.value, page: 1 })}>
            <option value="">All genres</option>
            {genres.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="discover-sort-controls">
          <span>Explore</span>
          <div className="discover-sort-buttons" aria-label="Sort anime">
            {sorts.map((item) => <button type="button" key={item.value} aria-pressed={sort === item.value} onClick={() => navigate({ sort: item.value, page: 1 })}>{item.label}</button>)}
          </div>
        </div>
      </section>

      <section className="discover-results" aria-labelledby="discover-results-heading" aria-busy={loading}>
        <div className="discover-results-heading">
          <h2 id="discover-results-heading">{heading}</h2>
          <div>
            {!loading && !error && <span>{anime.length} titles · Page {page}</span>}
            {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
        <p className="discover-sr-only" role="status">{loading ? "Loading anime…" : error ? "Unable to load anime." : `${anime.length} anime found on page ${page}.`}</p>

        {loading ? <div className="discover-grid" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <div className="discover-skeleton" key={index}><div /><span /><span /></div>)}</div> : error ? <div className="discover-message" role="alert"><h3>We couldn’t load the catalog</h3><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : !anime.length ? <div className="discover-message"><h3>No anime found</h3><p>Try a different title or choose another genre.</p>{hasFilters && <button type="button" onClick={clearFilters}>Browse all anime</button>}</div> : <div className="discover-grid">{anime.map((item) => <Card key={item.id} data={item} />)}</div>}

        {!loading && !error && (page > 1 || result?.pageInfo?.hasNextPage) && <nav className="discover-pagination" aria-label="Catalog pages">
          <button type="button" disabled={page <= 1} onClick={() => navigate({ page: page - 1 }, { scroll: true })}><FaArrowLeft aria-hidden="true" /> Previous</button>
          <span>Page {page}</span>
          <button type="button" disabled={!result?.pageInfo?.hasNextPage || page >= 500} onClick={() => navigate({ page: page + 1 }, { scroll: true })}>Next <FaArrowRight aria-hidden="true" /></button>
        </nav>}
      </section>
    </main>
  );
}
