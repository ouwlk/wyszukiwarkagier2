import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const API_KEY = process.env.REACT_APP_RAWG_API_KEY;

function App() {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState([]);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem("recentSearches")) || []
  );
  const [view, setView] = useState("search"); // "search" | "favorites"

  const searchGames = async () => {
    if (!query) return;

    try {
      const res = await axios.get(
        `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=1`
      );

      if (res.data.results.length === 0) {
        setGames([]);
        alert("Nie znaleziono gry!");
        return;
      }

      const mainGame = res.data.results[0];

      const genreSlugs = mainGame.genres.slice(0, 3).map((g) => g.slug);
      const mainTags = mainGame.tags?.map((t) => t.slug) || [];

      let similarGames = [];
      for (let slug of genreSlugs) {
        const genreRes = await axios.get(
          `https://api.rawg.io/api/games?key=${API_KEY}&genres=${slug}&page_size=20`
        );
        similarGames.push(...genreRes.data.results);
      }

      const uniqueGames = Array.from(
        new Map(similarGames.map((g) => [g.id, g])).values()
      ).filter((g) => g.id !== mainGame.id);

      const gamesWithScore = uniqueGames
        .map((g) => {
          const gameTags = g.tags?.map((t) => t.slug) || [];
          const commonTags = gameTags.filter((tag) => mainTags.includes(tag));
          return { ...g, score: commonTags.length };
        })
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score);

      const allGames = [mainGame, ...gamesWithScore.slice(0, 10)];
      setGames(allGames);

      const updatedRecent = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 7);
      setRecentSearches(updatedRecent);
      localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
    } catch (err) {
      console.error("Błąd fetchowania:", err);
    }
  };

  const toggleFavorite = (game) => {
    let updatedFavs;
    if (favorites.find((f) => f.id === game.id)) {
      updatedFavs = favorites.filter((f) => f.id !== game.id);
    } else {
      updatedFavs = [...favorites, game];
    }
    setFavorites(updatedFavs);
    localStorage.setItem("favorites", JSON.stringify(updatedFavs));
  };

  return (
    <>
      {/* Przycisk przełączający widok */}
      <button
        className="favorites-button"
        onClick={() => setView(view === "search" ? "favorites" : "search")}
      >
        ⭐ Ulubione
      </button>

      <div className="background-overlay"></div>

      <div className="container">
        {/* WIDOK WYSZUKIWARKI */}
        {view === "search" && (
          <>
            <div className="search-panel">
              <input
                type="text"
                placeholder="Wpisz grę lub gatunek"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGames()}
              />
              <button onClick={searchGames}>Szukaj</button>
            </div>

            <ul className="results-list">
              {games.map((game) => (
                <li key={game.id} className="result-item">
                  <a
                    href={`https://rawg.io/games/${game.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-link"
                  >
                    {game.name}
                  </a>

                  <button
                    onClick={() => toggleFavorite(game)}
                    className="fav-btn"
                  >
                    {favorites.find((f) => f.id === game.id) ? "❤️" : "🤍"}
                  </button>
                </li>
              ))}
            </ul>

            <div className="recent-searches">
              {recentSearches.map((q, i) => (
                <div
                  key={i}
                  className="recent-tile"
                  onClick={() => {
                    setQuery(q);
                    searchGames();
                  }}
                >
                  {q}
                </div>
              ))}
            </div>
          </>
        )}

        {/* WIDOK ULUBIONE */}
        {view === "favorites" && (
          <div className="favorites-grid">
            {favorites.length === 0 ? (
              <p style={{ textAlign: "center", color: "#009900" }}>
                Brak ulubionych gier
              </p>
            ) : (
              favorites.map((game) => (
                <a
                  key={game.id}
                  href={`https://rawg.io/games/${game.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="favorite-card"
                >
                  {game.background_image && (
                    <img src={game.background_image} alt={game.name} />
                  )}
                  <span>{game.name}</span>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
