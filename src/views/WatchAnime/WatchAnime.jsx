"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaChevronRight, FaExternalLinkAlt, FaPlay, FaRedo, FaStar } from "react-icons/fa";
import "./watch-anime.css";
import RecommendedTopTen from "../../Layouts/RecommendedTopTen";

const PAGE_SIZE = 49;

export default function WatchAnime({ anime, initialEpisode = 1 }) {
  const [descIsCollapsed, setDescIsCollapsed] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [language, setLanguage] = useState("sub");
  const [series, setSeries] = useState(null);
  const [episodeStatus, setEpisodeStatus] = useState("loading");
  const [episodeError, setEpisodeError] = useState("");
  const [retry, setRetry] = useState(0);
  const [mal, setMal] = useState(null);
  const [ratingStatus, setRatingStatus] = useState(anime.malId ? "loading" : "unavailable");
  const [playing, setPlaying] = useState(false);
  const [frameLoading, setFrameLoading] = useState(false);
  const [playbackChecking, setPlaybackChecking] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [verifiedSource, setVerifiedSource] = useState(null);
  const playbackRequest = useRef(null);
  const [episodePage, setEpisodePage] = useState(0);

  useEffect(() => () => playbackRequest.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    setEpisodeStatus("loading");
    setEpisodeError("");
    setSeries(null);
    setPlaying(false);
    fetch(`/api/anime/${anime.id}/episodes`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Episodes could not be loaded.");
        return body;
      })
      .then((body) => {
        if (controller.signal.aborted) return;
        setSeries(body.data);
        setEpisodeStatus(body.status);
        const list = body.data?.episodes || [];
        const initial = list.findIndex((episode) => episode.number === initialEpisode);
        const index = initial >= 0 ? initial : 0;
        setSelectedEpisode(list[index]?.number || initialEpisode);
        setEpisodePage(Math.floor(index / PAGE_SIZE));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setEpisodeStatus("error");
        setEpisodeError(error.message || "The episode service is temporarily unavailable.");
      });
    return () => controller.abort();
  }, [anime.id, initialEpisode, retry]);

  useEffect(() => {
    if (!anime.malId) return;
    const controller = new AbortController();
    fetch(`/api/anime/${anime.id}/ratings`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Ratings unavailable");
        return response.json();
      })
      .then((body) => { if (!controller.signal.aborted) { setMal(body.data); setRatingStatus(body.data ? "ready" : "unavailable"); } })
      .catch(() => { if (!controller.signal.aborted) setRatingStatus("unavailable"); });
    return () => controller.abort();
  }, [anime.id, anime.malId]);

  const episodes = series?.episodes || [];
  const episodeIndex = episodes.findIndex((episode) => episode.number === selectedEpisode);
  const currentEpisode = episodes[episodeIndex];
  const sources = currentEpisode?.sources || [];
  const activeSource = sources.find((source) => source.language === language) || sources[0];
  const activeLanguage = activeSource?.language || language;
  const episodeLabel = String(selectedEpisode).padStart(2, "0");
  const visibleEpisodes = episodes.slice(episodePage * PAGE_SIZE, (episodePage + 1) * PAGE_SIZE);
  const pageCount = Math.ceil(episodes.length / PAGE_SIZE);

  function resetPlayer() {
    playbackRequest.current?.abort();
    playbackRequest.current = null;
    setPlaybackChecking(false);
    setPlaybackError("");
    setVerifiedSource(null);
    setPlaying(false);
    setFrameLoading(false);
  }

  function selectEpisode(episode) {
    if (!episode) return;
    resetPlayer();
    setSelectedEpisode(episode.number);
    setEpisodePage(Math.floor(episodes.indexOf(episode) / PAGE_SIZE));
    const url = new URL(window.location.href);
    url.searchParams.set("episode", String(episode.number));
    window.history.replaceState(null, "", url);
  }

  async function startPlayer() {
    if (!activeSource || playbackChecking) return;
    resetPlayer();
    const controller = new AbortController();
    playbackRequest.current = controller;
    setPlaybackChecking(true);
    try {
      const query = new URLSearchParams({ episode: String(selectedEpisode), language: activeLanguage });
      const response = await fetch(`/api/anime/${anime.id}/playback?${query}`, { signal: controller.signal });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(body.error?.message || "The player could not be reached. Try again shortly.");
      if (body.status !== "ready" || !body.source) {
        setPlaybackError(body.message || "This episode is currently unavailable. Try another language or viewing option.");
        return;
      }
      setVerifiedSource(body.source);
      setFrameLoading(true);
      setPlaying(true);
    } catch (error) {
      if (!controller.signal.aborted) setPlaybackError(error.message || "The player could not be reached.");
    } finally {
      if (!controller.signal.aborted) setPlaybackChecking(false);
    }
  }

  const episodeMessage = episodeStatus === "loading" ? "Finding episodes…"
    : episodeStatus === "error" ? "Episode service unavailable"
      : !episodes.length ? "No episodes available yet"
        : !activeSource ? "No player available for this episode" : "";

  return (
    <main className="watch-page">
      <section id="watch" className="watch-container" aria-labelledby="watch-title">
        <nav className="watch-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Discover</Link><FaChevronRight aria-hidden="true" />
          <span>Watch</span><FaChevronRight aria-hidden="true" />
          <span aria-current="page">{anime.title}</span>
        </nav>
        <header className="watch-heading">
          <div><p className="watch-eyebrow">Your next adventure</p><h1 id="watch-title">{anime.title}</h1></div>
          {currentEpisode && <span className="watch-episode-badge">Episode {episodeLabel}</span>}
        </header>
        <div className="watch-layout">
          <div className="watch-player-column">
            <div className="video-player">
              <div className="player-preview" style={{ backgroundImage: anime.banner || anime.poster ? `url(${anime.banner || anime.poster})` : undefined }}>
                {playing && verifiedSource ? (
                  <>
                    <iframe
                      key={`${currentEpisode.id}-${verifiedSource.id}`}
                      className="stream-frame"
                      src={verifiedSource.url}
                      title={`${anime.title} — Episode ${selectedEpisode} (${activeLanguage})`}
                      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      referrerPolicy="strict-origin-when-cross-origin"
                      onLoad={() => setFrameLoading(false)}
                      onError={() => { setFrameLoading(false); setPlaying(false); setPlaybackError("The player could not be opened. Try another viewing option below."); }}
                    />
                    {frameLoading && <div className="frame-loading" role="status">Opening player…</div>}
                  </>
                ) : (
                  <>
                    <div className="player-preview-shade" />
                    <div className="player-topline">
                      <span>{currentEpisode ? `EPISODE ${episodeLabel}` : anime.format}</span>
                      {currentEpisode && <span className="player-preview-label">Anikoto</span>}
                    </div>
                    {playbackChecking || playbackError ? (
                      <div className="player-message" role="status" aria-live="polite">
                        {playbackChecking ? <><span className="provider-spinner" aria-hidden="true" /><strong>Checking player…</strong></> : <><strong>Video currently unavailable</strong><p>{playbackError}</p><button type="button" onClick={startPlayer}><FaRedo aria-hidden="true" /> Try again</button></>}
                      </div>
                    ) : activeSource && episodeStatus === "ready" ? (
                      <div className="player-start">
                        <button type="button" className="player-play" aria-label={`Play episode ${selectedEpisode}`} onClick={startPlayer}><FaPlay aria-hidden="true" /></button>
                        <span>{currentEpisode.title || `Episode ${selectedEpisode}`}</span>
                      </div>
                    ) : (
                      <div className="player-message" role="status">
                        {episodeStatus === "loading" && <span className="provider-spinner" aria-hidden="true" />}
                        <strong>{episodeMessage}</strong>
                        {episodeStatus === "error" && <><p>{episodeError}</p><button type="button" onClick={() => setRetry((value) => value + 1)}><FaRedo aria-hidden="true" /> Try again</button></>}
                        {episodeStatus === "unavailable" && <p>Explore the viewing options below or try another series.</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="player-settings">
                <div className="player-setting-group"><span className="player-setting-label">Player</span><span className="provider-name">{activeSource ? "Anikoto" : "Unavailable"}</span></div>
                <div className="player-setting-group" role="group" aria-label="Audio language preference">
                  <span className="player-setting-label">Language</span>
                  {["sub", "dub"].map((item) => (
                    <button type="button" className={`server-tile ${activeSource && activeLanguage === item ? "selected" : ""}`} onClick={() => { resetPlayer(); setLanguage(item); }} aria-pressed={Boolean(activeSource && activeLanguage === item)} disabled={!sources.some((source) => source.language === item)} key={item}>{item === "dub" ? "Dub" : "Sub"}</button>
                  ))}
                </div>
                {playing && <button type="button" className="player-reset" onClick={resetPlayer}>Close player</button>}
              </div>
            </div>
            {series?.url && <p className="player-provider-note">Player supplied by Anikoto. <a href={series.url} target="_blank" rel="noopener noreferrer">Open on Anikoto <FaExternalLinkAlt aria-hidden="true" /></a></p>}
            {anime.streamingLinks?.length > 0 && <div className="streaming-links"><span>Also available on</span>{anime.streamingLinks.slice(0, 5).map((link) => <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url}>{link.site} <FaExternalLinkAlt aria-hidden="true" /></a>)}</div>}
          </div>
          <aside className="watch-sidebar" aria-label="Episodes and series details">
            <section className="episode-panel" aria-labelledby="episodes-heading">
              <div className="watch-panel-heading"><h2 id="episodes-heading">Episodes</h2><span>{episodeStatus === "loading" ? "Loading…" : `${episodes.length} available`}</span></div>
              {currentEpisode && <p className="episode-selection-status" aria-live="polite"><span className="episode-status-dot" /> Episode {episodeLabel}<span className="selected-episode-title">{currentEpisode.title}</span></p>}
              {pageCount > 1 && <label className="episode-range">Episode range<select value={episodePage} onChange={(event) => setEpisodePage(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, page) => <option value={page} key={page}>{episodes[page * PAGE_SIZE].number}–{episodes[Math.min(episodes.length - 1, (page + 1) * PAGE_SIZE - 1)].number}</option>)}</select></label>}
              <div className="episode-tiles-wrapper" aria-busy={episodeStatus === "loading"}>
                {visibleEpisodes.map((episode) => <button type="button" className={`episode-tile ${episode.number === selectedEpisode ? "selected" : ""}`} key={episode.id} onClick={() => selectEpisode(episode)} aria-pressed={episode.number === selectedEpisode} aria-label={`Episode ${episode.number}`} title={episode.title}>{String(episode.number).padStart(2, "0")}</button>)}
              </div>
              {!episodes.length && <p className="episode-empty">{episodeStatus === "loading" ? "Loading the episode list…" : episodeStatus === "error" ? "The episode list could not be loaded. Use Try again in the player." : "This series has no playable episodes in the current provider catalog."}</p>}
              <div className="episode-navigation">
                <button type="button" disabled={episodeIndex <= 0} onClick={() => selectEpisode(episodes[episodeIndex - 1])} aria-label="Previous episode"><FaArrowLeft aria-hidden="true" /> Previous</button>
                <button type="button" disabled={episodeIndex < 0 || episodeIndex >= episodes.length - 1} onClick={() => selectEpisode(episodes[episodeIndex + 1])} aria-label="Next episode">Next episode <FaArrowRight aria-hidden="true" /></button>
              </div>
            </section>
            <section className="series-panel" aria-labelledby="series-heading">
              <div className="series-summary">
                {anime.poster && <img className="series-poster" src={anime.poster} alt={`${anime.title} poster`} width="72" height="102" />}
                <div><p className="watch-eyebrow">About the series</p><h2 id="series-heading">{anime.title}</h2><p className="series-meta">{anime.format}{anime.year ? ` · ${anime.year}` : ""}{anime.durationMinutes ? ` · ${anime.durationMinutes} min` : ""}</p></div>
              </div>
              <div className="series-ratings"><a href={anime.siteUrl} target="_blank" rel="noopener noreferrer"><FaStar aria-hidden="true" /> {anime.score != null ? anime.score.toFixed(2) : "—"} <span>AniList</span></a>{anime.malId && <a href={`https://myanimelist.net/anime/${anime.malId}`} target="_blank" rel="noopener noreferrer"><FaStar aria-hidden="true" /> {mal?.score != null ? mal.score.toFixed(2) : "—"} <span>MAL{ratingStatus === "loading" ? "…" : ""}</span></a>}</div>
              <p className="series-meta">{anime.status}{anime.episodes ? ` · ${anime.episodes} episodes` : ""}</p>
              {ratingStatus === "unavailable" && anime.malId && <p className="rating-note">MAL rating is temporarily unavailable.</p>}
              <p id="series-description" className="series-description">{!anime.description ? "No synopsis available." : descIsCollapsed && anime.description.length > 180 ? `${anime.description.slice(0, 180).trim()}…` : anime.description}</p>
              {anime.description.length > 180 && <button type="button" className="description-toggle" aria-expanded={!descIsCollapsed} aria-controls="series-description" onClick={() => setDescIsCollapsed((value) => !value)}>{descIsCollapsed ? "Read more" : "Show less"}</button>}
              <div className="series-genres">{anime.genres.map((genre) => <Link href={`/?genre=${encodeURIComponent(genre)}`} key={genre}>{genre}</Link>)}</div>
            </section>
          </aside>
        </div>
      </section>
      <RecommendedTopTen data={anime.recommendations || []} />
    </main>
  );
}
