import frieren from "../media/posters/frieren.jpg";
import onePiece from "../media/posters/one-piece.jpg";
import demonSlayer from "../media/posters/demon-slayer.jpg";
import attackOnTitan from "../media/posters/attack-on-titan.jpg";
import deathNote from "../media/posters/death-note.jpg";
import hunterXHunter from "../media/posters/hunter-x-hunter.jpg";
import jujutsuKaisen from "../media/posters/jujutsu-kaisen.jpg";
import spyFamily from "../media/posters/spy-family.jpg";
import chainsawMan from "../media/posters/chainsaw-man.jpg";

export const watchPageAnime = {
  title: "Frieren: Beyond Journey's End",
  poster: frieren.src,
  description:
    "After the party of heroes defeated the Demon King, they restored peace to the land and returned to lives of solitude. Generations pass, and the elven mage Frieren comes face to face with humanity's mortality. She takes on a new apprentice and promises to fulfill the dying wishes of old friends.",
  episodeCount: 28,
};

const makeAnime = (id, title, image, episodes, score, type = "TV") => ({
  id,
  title,
  title_english: title,
  title_japanese: title,
  episodes,
  duration: "24 min",
  score,
  popularity: Math.round(score * 10000),
  rating: "PG-13",
  rank: id,
  favorites: Math.round(score * 3200),
  members: Math.round(score * 48000),
  status: "Finished Airing",
  type,
  synopsis: `Explore the world and story of ${title}.`,
  aired: { string: "Finished airing" },
  genres: [
    { mal_id: `${id}-1`, name: "Adventure" },
    { mal_id: `${id}-2`, name: "Fantasy" },
  ],
  images: {
    webp: {
      image_url: image,
      large_image_url: image,
    },
  },
});

export const recommendedAnime = [
  makeAnime(1, "One Piece", onePiece.src, 1110, 8.72),
  makeAnime(2, "Demon Slayer", demonSlayer.src, 26, 8.45),
  makeAnime(3, "Attack on Titan", attackOnTitan.src, 25, 8.55),
  makeAnime(4, "Death Note", deathNote.src, 37, 8.62),
  makeAnime(5, "Hunter x Hunter", hunterXHunter.src, 148, 9.03),
  makeAnime(6, "Jujutsu Kaisen", jujutsuKaisen.src, 24, 8.58),
  makeAnime(7, "SPY x FAMILY", spyFamily.src, 12, 8.49),
  makeAnime(8, "Chainsaw Man", chainsawMan.src, 12, 8.52),
];

export const genreList = [
  "Action",
  "Adventure",
  "Cars",
  "Comedy",
  "Dementia",
  "Demons",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Game",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Kids",
  "Magic",
  "Martial Arts",
  "Mecha",
  "Military",
  "Music",
  "Mystery",
  "Parody",
  "Police",
];
