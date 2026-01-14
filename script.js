const showsView = document.getElementById("shows-view");
const episodesView = document.getElementById("episodes-view");
const statusMessage = document.getElementById("status-message");
const searchInput = document.getElementById("search-input");
const sortSelector = document.getElementById("sort-selector");
const episodeSelector = document.getElementById("episode-selector");
const backBtn = document.getElementById("back-to-shows");
const matchCount = document.getElementById("match-count");

let allShows = [];
let allEpisodes = [];
const cache = {};

/* UTILITIES */

function stripHTML(text) {
  return text ? text.replace(/<[^>]*>/g, "") : "";
}

function truncate(text, limit = 200) {
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

function getFavourites() {
  return JSON.parse(localStorage.getItem("favourites")) || [];
}

function toggleFavourite(showId) {
  let favs = getFavourites();
  favs = favs.includes(showId)
    ? favs.filter((id) => id !== showId)
    : [...favs, showId];
  localStorage.setItem("favourites", JSON.stringify(favs));
  renderShows(allShows);
}

/* FETCHING  */

async function fetchShows() {
  if (cache.shows) return cache.shows;

  statusMessage.textContent = "Loading shows...";
  const res = await fetch("https://api.tvmaze.com/shows");
  const data = await res.json();

  cache.shows = data;
  statusMessage.textContent = "";
  return data;
}

async function fetchEpisodes(showId) {
  if (cache[showId]) return cache[showId];

  statusMessage.textContent = "Loading episodes...";
  const res = await fetch(
    `https://api.tvmaze.com/shows/${showId}/episodes`
  );
  const data = await res.json();

  cache[showId] = data;
  statusMessage.textContent = "";
  return data;
}

/*  SHOWS  */

function renderShows(shows) {
  showsView.innerHTML = "";
  const favs = getFavourites();

  shows.forEach((show) => {
    const card = document.createElement("article");
    card.className = "show-card";

    const summaryText = stripHTML(show.summary || "");
    const shortSummary = truncate(summaryText);

    card.innerHTML = `
      <h2 class="show-title">${show.name}</h2>
      <img src="${show.image?.medium || ""}" alt="${show.name}">
      <p class="meta">
        ⭐ ${show.rating.average || "N/A"} |
        ${show.runtime || "?"} min |
        ${show.status}
      </p>
      <p class="genres">${show.genres.join(", ")}</p>
      <p class="summary">${shortSummary}</p>
      ${
        summaryText.length > 200
          ? `<button class="read-more">Read more</button>`
          : ""
      }
      <button class="fav-btn">
        ${favs.includes(show.id) ? "❤️ Favourite" : "🤍 Favourite"}
      </button>
    `;

    card.querySelector(".show-title").onclick = () =>
      loadEpisodes(show);

    card.querySelector(".fav-btn").onclick = (e) => {
      e.stopPropagation();
      toggleFavourite(show.id);
    };

    const readMoreBtn = card.querySelector(".read-more");
    if (readMoreBtn) {
      readMoreBtn.onclick = () => {
        const p = card.querySelector(".summary");
        const expanded = p.textContent === summaryText;
        p.textContent = expanded ? shortSummary : summaryText;
        readMoreBtn.textContent = expanded ? "Read more" : "Show less";
      };
    }

    showsView.appendChild(card);
  });

  matchCount.textContent = `Displaying ${shows.length} shows`;
}

/*  EPISODES  */

async function loadEpisodes(show) {
  showsView.hidden = true;
  episodesView.hidden = false;
  backBtn.hidden = false;
  episodeSelector.hidden = false;

  allEpisodes = await fetchEpisodes(show.id);
  renderEpisodes(allEpisodes);
  populateEpisodeSelector(allEpisodes);
}

function renderEpisodes(episodes) {
  episodesView.innerHTML = "";

  episodes.forEach((ep) => {
    const card = document.createElement("section");
    card.className = "episode";
    card.id = `S${String(ep.season).padStart(2, "0")}E${String(
      ep.number
    ).padStart(2, "0")}`;

    const summary = stripHTML(ep.summary || "");

    card.innerHTML = `
      <h3>${ep.name} (${card.id})</h3>
      <img src="${ep.image?.medium || ""}">
      <p>${truncate(summary)}</p>
    `;

    episodesView.appendChild(card);
  });

  matchCount.textContent = `Displaying ${episodes.length} episodes`;
}

function populateEpisodeSelector(episodes) {
  episodeSelector.innerHTML =
    "<option value=''>Jump to episode...</option>";

  episodes.forEach((ep) => {
    const code = `S${String(ep.season).padStart(2, "0")}E${String(
      ep.number
    ).padStart(2, "0")}`;

    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${code} - ${ep.name}`;
    episodeSelector.appendChild(opt);
  });
}

/*  EVENTS  */

episodeSelector.addEventListener("change", (e) => {
  const el = document.getElementById(e.target.value);
  el?.scrollIntoView({ behavior: "smooth" });
});

backBtn.onclick = () => {
  showsView.hidden = false;
  episodesView.hidden = true;
  backBtn.hidden = true;
  episodeSelector.hidden = true;
  matchCount.textContent = "";
};

sortSelector.onchange = () => {
  const sorted = [...allShows];
  sortSelector.value === "rating"
    ? sorted.sort(
        (a, b) =>
          (b.rating.average || 0) - (a.rating.average || 0)
      )
    : sorted.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        })
      );
  renderShows(sorted);
};

searchInput.oninput = () => {
  const term = searchInput.value.toLowerCase();
  renderShows(
    allShows.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        stripHTML(s.summary).toLowerCase().includes(term) ||
        s.genres.join(" ").toLowerCase().includes(term)
    )
  );
};

/*  INIT */

(async function start() {
  allShows = await fetchShows();
  renderShows(allShows);
})();
