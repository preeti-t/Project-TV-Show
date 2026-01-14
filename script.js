const root = document.getElementById("root");
const searchInput = document.getElementById("search-input");
const matchCount = document.getElementById("match-count");
const episodeSelector = document.getElementById("episode-selector");
const statusMessage = document.getElementById("status-message");
const showSelector = document.getElementById("show-selector"); // Add this line
let allShows = [];

let allEpisodes = [];

/* Fetching Episodes */

function fetchEpisodes() {
  statusMessage.textContent = "Loading episodes...";

  fetch("https://api.tvmaze.com/shows/82/episodes")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load episode data");
      }
      return response.json();
    })
    .then((data) => {
      allEpisodes = data;
      statusMessage.textContent = "";

      renderEpisodes(allEpisodes);
      populateEpisodeSelector(allEpisodes);
      updateMatchCount(allEpisodes.length, allEpisodes.length);
    })
    .catch(() => {
      statusMessage.textContent =
        "Sorry, something went wrong while loading episodes. Please try again later.";
    });
}

function fetchShows() {
  fetch("https://api.tvmaze.com/shows")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load TV shows");
      }
      return response.json();
    })
    .then((data) => {
      allShows = data;
      populateShowSelector(allShows);
    })
    .catch(() => {
      statusMessage.textContent =
        "Sorry, something went wrong while loading TV shows.";
    });
}
function populateShowSelector(shows) {
  showSelector.innerHTML = "<option value=''>Select a show</option>";
  shows
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    .forEach((show) => {
      const option = document.createElement("option");
      option.value = show.id;
      option.textContent = show.name;
      showSelector.appendChild(option);
    });
}

showSelector.addEventListener("change", (event) => {
  const selectedShowId = event.target.value;

  if (selectedShowId) {
    fetchEpisodesForShow(selectedShowId);
  }
});

function fetchEpisodesForShow(showId) {
  statusMessage.textContent = "Loading episodes...";

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load episode data");
      }
      return response.json();
    })
    .then((data) => {
      allEpisodes = data;
      statusMessage.textContent = "";

      renderEpisodes(allEpisodes);
      populateEpisodeSelector(allEpisodes);
      updateMatchCount(allEpisodes.length, allEpisodes.length);
    })
    .catch(() => {
      statusMessage.textContent =
        "Sorry, something went wrong while loading episodes. Please try again later.";
    });
}

/* Helpers */

function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}

function updateMatchCount(shown, total) {
  matchCount.textContent = `Displaying ${shown}/${total} episodes`;
}

/* Render Episodes */

function renderEpisodes(episodes) {
  root.innerHTML = "";

  episodes.forEach((episode) => {
    const episodeDiv = document.createElement("div");
    episodeDiv.className = "episode";
    episodeDiv.id = formatEpisodeCode(episode.season, episode.number);

    episodeDiv.innerHTML = `
      <h2>
        ${episode.name} (${formatEpisodeCode(episode.season, episode.number)})
      </h2>
      
      <img src="${episode.image.medium}" alt="${episode.name}">
      <div>${episode.summary}</div> <!-- Display the summary directly -->
    `;

    root.appendChild(episodeDiv);
  });
}

/* Search */

function searchEpisodes(searchTerm) {
  const filteredEpisodes = allEpisodes.filter((episode) => {
    return (
      episode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  updateMatchCount(filteredEpisodes.length, allEpisodes.length);
  renderEpisodes(filteredEpisodes);
}

searchInput.addEventListener("input", (event) => {
  const searchTerm = event.target.value;

  if (searchTerm === "") {
    updateMatchCount(allEpisodes.length, allEpisodes.length);
    renderEpisodes(allEpisodes);
  } else {
    searchEpisodes(searchTerm);
  }
});

/* Episode Selector */

function populateEpisodeSelector(episodes) {
  episodeSelector.innerHTML = "<option value=''>Select an episode</option>";
  episodes.forEach((episode) => {
    const option = document.createElement("option");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);

    option.value = episodeCode;
    option.textContent = `${episodeCode} - ${episode.name}`;
    episodeSelector.appendChild(option);
  });
}

episodeSelector.addEventListener("change", (event) => {
  const selectedEpisodeCode = event.target.value;

  if (selectedEpisodeCode) {
    const selectedEpisodeDiv = document.getElementById(selectedEpisodeCode);

    if (selectedEpisodeDiv) {
      selectedEpisodeDiv.scrollIntoView({ behavior: "smooth" });
    }
  }
});

/*  Start App */

fetchShows();
