const showsRoot = document.getElementById("shows-root");
const episodesRoot = document.getElementById("root");
const statusMessage = document.getElementById("status-message");

const showSearchInput = document.getElementById("show-search");
const episodeSearchInput = document.getElementById("search-input");
const episodeSelector = document.getElementById("episode-selector");
const matchCount = document.getElementById("match-count");
const backLink = document.getElementById("back-to-shows");
const topBar = document.getElementById("top-bar");

/*  STATE & CACHE */

let allShows = [];
let allEpisodes = [];

const episodeCache = {};

/*  APP START */

fetchShows();

/*  FETCH SHOWS (ONCE) */

function fetchShows() {
  statusMessage.textContent = "Loading shows...";

  fetch("https://api.tvmaze.com/shows")
    .then((res) => res.json())
    .then((data) => {
      allShows = data.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      statusMessage.textContent = "";
      renderShows(allShows);
    })
    .catch(() => {
      statusMessage.textContent = "Failed to load shows.";
    });
}

/*  SHOWS LISTING */

function renderShows(shows) {
  showsRoot.innerHTML = "";

  shows.forEach((show) => {
    const card = document.createElement("div");
    card.className = "show-card";

    card.innerHTML = `
      <img src="${show.image?.medium || ""}" alt="${show.name}">
      <h2>${show.name}</h2>
      <p><strong>Genres:</strong> ${show.genres.join(", ")}</p>
      <p><strong>Status:</strong> ${show.status}</p>
      <p><strong>Rating:</strong> ${show.rating.average || "N/A"}</p>
      <p><strong>Runtime:</strong> ${show.runtime} mins</p>
      <div class="summary">${show.summary || ""}</div>
    `;

    card.addEventListener("click", () => {
      loadEpisodesForShow(show.id);
    });

    showsRoot.appendChild(card);
  });
}

/*  SHOW SEARCH */

showSearchInput.addEventListener("input", () => {
  const term = showSearchInput.value.toLowerCase();

  const filtered = allShows.filter((show) => {
    return (
      show.name.toLowerCase().includes(term) ||
      show.genres.join(" ").toLowerCase().includes(term) ||
      (show.summary || "").toLowerCase().includes(term)
    );
  });

  renderShows(filtered);
});

/*  EPISODES VIEW */

function loadEpisodesForShow(showId) {
  showsRoot.style.display = "none";
  showSearchInput.style.display = "none";
  topBar.style.display = "flex";
  backLink.style.display = "inline";

  if (episodeCache[showId]) {
    allEpisodes = episodeCache[showId];
    renderEpisodes(allEpisodes);
    setupEpisodeSelector(allEpisodes);
    return;
  }

  statusMessage.textContent = "Loading episodes...";

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((res) => res.json())
    .then((data) => {
      episodeCache[showId] = data;
      allEpisodes = data;
      statusMessage.textContent = "";

      renderEpisodes(allEpisodes);
      setupEpisodeSelector(allEpisodes);
    })
    .catch(() => {
      statusMessage.textContent = "Failed to load episodes.";
    });
}

/* RENDER EPISODES */

function renderEpisodes(episodes) {
  episodesRoot.innerHTML = "";

  episodes.forEach((ep) => {
    const code = formatEpisodeCode(ep.season, ep.number);

    const card = document.createElement("div");
    card.className = "episode";
    card.id = code;

    card.innerHTML = `
      <h2>${ep.name} (${code})</h2>
      <img src="${ep.image?.medium || ""}">
      <div>${ep.summary || ""}</div>
    `;

    episodesRoot.appendChild(card);
  });

  matchCount.textContent = `Displaying ${episodes.length}/${allEpisodes.length} episodes`;
}

/*  EPISODE SEARCH */

episodeSearchInput.addEventListener("input", () => {
  const term = episodeSearchInput.value.toLowerCase();

  const filtered = allEpisodes.filter((ep) => {
    return (
      ep.name.toLowerCase().includes(term) ||
      ep.summary.toLowerCase().includes(term)
    );
  });

  renderEpisodes(filtered);
});

/* EPISODE SELECTOR */

function setupEpisodeSelector(episodes) {
  episodeSelector.innerHTML = `<option value="">Select an episode</option>`;

  episodes.forEach((ep) => {
    const code = formatEpisodeCode(ep.season, ep.number);
    const option = document.createElement("option");

    option.value = code;
    option.textContent = `${code} - ${ep.name}`;
    episodeSelector.appendChild(option);
  });
}

episodeSelector.addEventListener("change", () => {
  document.getElementById(episodeSelector.value)?.scrollIntoView({
    behavior: "smooth",
  });
});

/* BACK TO SHOWS */

backLink.addEventListener("click", (e) => {
  e.preventDefault();

  showsRoot.style.display = "grid";
  showSearchInput.style.display = "block";
  topBar.style.display = "none";
  backLink.style.display = "none";

  episodesRoot.innerHTML = "";
  episodeSearchInput.value = "";
});

/*  HELPERS */

function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}
