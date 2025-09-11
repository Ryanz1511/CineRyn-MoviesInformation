document.addEventListener("DOMContentLoaded", () => {
  // update tahun di footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // tombol ganti tema (mun sudah ada)
  const toggleBtn = document.getElementById("theme-toggle");
  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) html.setAttribute("data-theme", savedTheme);
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // ----- gasan list Film Featured-----
  const bestMovies = [
    "Breaking Bad",
    "Better Call Saul",
    "the godfather",
    "the dark knight",
    "Jujutsu Kaisen",
    "Attack on Titan",
    "Dexter: New Blood",
    "500 days of summer",
    "Kimetzu no Yaiba",
    "Avengers",
    "Naruto",
    "Transformers",
    "Dragon Ball"
  ];

  const INTERVAL_MS = 4000;
  const API_KEY = "72ba2452"; // pastikan masih valid / ganti lawan API key pian

  const featured = document.querySelector(".featured");
  if (!featured) return console.warn("Element .featured kada ditemukan.");

  // pastikan struktur minimal ada di HTML: <h4>Featured</h4><img class="thumb"> <p>...</p>
  let featuredImg = featured.querySelector(".thumb");
  let featuredText = featured.querySelector("p");
  if (!featuredImg) {
    // fallback: bikin elemen lamun kada ada
    featuredImg = document.createElement("img");
    featuredImg.className = "thumb";
    featured.appendChild(featuredImg);
  }
  if (!featuredText) {
    featuredText = document.createElement("p");
    featuredText.style.marginTop = "10px";
    featured.appendChild(featuredText);
  }

  // gambar fallback (SVG data URI) -> aman tanpa minta file luar
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>
      <rect width='100%' height='100%' fill='#222'/>
      <text x='50%' y='50%' fill='#fff' font-family='Inter, Arial' font-size='20' text-anchor='middle' dominant-baseline='middle'>No image available</text>
    </svg>
  `;
  const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

  // cache sederhana supaya kada minta API terus
  const cache = {};

  function setFeaturedFallback() {
    featuredImg.classList.remove("show");
    setTimeout(() => {
      featuredImg.src = FALLBACK_IMG;
      featuredImg.alt = "No poster available";
      featuredText.innerHTML = 'Spotlight: Gambar Tidak ada tersedia.';
      featuredImg.classList.add("show");
    }, 250);
  }

  function preloadAndShow(movie) {
    if (!movie || !movie.Poster || movie.Poster === "N/A") {
      return setFeaturedFallback();
    }

    const imgLoader = new Image();
    imgLoader.crossOrigin = "anonymous"; // opsional
    imgLoader.onload = () => {
      // fade out -> ganti src -> fade in
      featuredImg.classList.remove("show");
      setTimeout(() => {
        featuredImg.src = movie.Poster;
        featuredImg.alt = movie.Title;
        featuredText.innerHTML = `Spotlight: <strong>${movie.Title}</strong> (${movie.Year}) — film rekomendasi CineRyn.`; 
        featuredImg.classList.add("show");
      }, 250);
    };
    imgLoader.onerror = () => {
      console.warn("Poster gagal di-load:", movie.Poster);
      setFeaturedFallback();
    };
    imgLoader.src = movie.Poster;
  }

  function loadBestMovieFeatured() {
    const keyword = bestMovies[Math.floor(Math.random() * bestMovies.length)];
    $.ajax({
      url: `https://www.omdbapi.com/?s=${encodeURIComponent(keyword)}&apikey=${API_KEY}`,
      success: (data) => {
        if (!data || !data.Search || data.Search.length === 0) {
          console.warn("OMDb: Tidak ada hasil untuk", keyword);
          return; // skip aja
        }

        // filter nang ada poster valid
        let valid = data.Search.filter(m => m && m.Poster && m.Poster !== "N/A");
        if (valid.length === 0) {
          console.warn("Tidak ada poster valid untuk", keyword);
          return; 
        }

        // pilih film acak lawan poster valid
        const randomMovie = valid[Math.floor(Math.random() * valid.length)];
        const imgLoader = new Image();
        imgLoader.onload = () => {
          featuredImg.classList.remove("show");
          setTimeout(() => {
            featuredImg.src = randomMovie.Poster;
            featuredImg.alt = randomMovie.Title;
            featuredText.innerHTML = `Spotlight: <strong>${randomMovie.Title}</strong> (${randomMovie.Year}) — film rekomendasi CineRyn.`;
            featuredImg.classList.add("show");
          }, 250);
        };
        imgLoader.onerror = () => {
          console.warn("Poster gagal dimuat, skip:", randomMovie.Poster);
          loadBestMovieFeatured();
        };
        imgLoader.src = randomMovie.Poster;
      },
      error: (err) => {
        console.error("OMDb request gagal:", err);
      }
    });
  }

  // pertama kali jalankan
  loadBestMovieFeatured();
  // jalanakan tiap beberapa detik
  setInterval(loadBestMovieFeatured, INTERVAL_MS);
}
);

// bagian gasan nyari film
const searchInput = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const grid = document.querySelector(".grid");

// fungsi nampilin kartu film
function renderMovies(movies) {
  grid.innerHTML = "";
  movies.slice(0, 10).forEach((movie) => {
    // skip lamun kada ada poster
    if (movie.Poster === "N/A") return;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${movie.Poster}" alt="${movie.Title}" />
      <h3>${movie.Title}</h3>
      <p>${movie.Year}</p>
    `;
    // klik kartu => detail film
    card.addEventListener("click", () => loadDetails(movie.imdbID));
    grid.appendChild(card);
  });
}

// fungsi nyari film
function searchMovies(query) {
  $.ajax({
    url: `https://www.omdbapi.com/?s=${query}&apikey=72ba2452`,
    success: (data) => {
      if (data.Response === "True") {
        renderMovies(data.Search);
      } else {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center">Kada ada hasil ditemukan.</p>`;
      }
    },
    error: (err) => console.log(err.responseText),
  });
}

// klik tombol search
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) searchMovies(query);
});

// tekan enter di input
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) searchMovies(query);
  }
});

// fungsi ngambil detail film
function loadDetails(id) {
  $.ajax({
    url: `https://www.omdbapi.com/?i=${id}&apikey=72ba2452`,
    success: (movie) => {
      showModal(movie);
    },
    error: (err) => console.log(err.responseText),
  });
}

// fungsi modal detail film
function showModal(movie) {
  let modal = document.getElementById("movie-modal");

  // lamun modal belum ada, bikin
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "movie-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.8)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "1000";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--card-bg);padding:20px;border-radius:12px;max-width:600px;width:90%;color:var(--text)">
      <button id="close-modal" style="float:right;padding:6px 10px;cursor:pointer">X</button>
      <h2>${movie.Title} (${movie.Year})</h2>
      <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image"}" alt="${movie.Title}" style="max-width:200px;margin:10px 0" />
      <p><strong>Genre:</strong> ${movie.Genre}</p>
      <p><strong>Director:</strong> ${movie.Director}</p>
      <p><strong>Actors:</strong> ${movie.Actors}</p>
      <p><strong>Plot:</strong> ${movie.Plot}</p>
      <p><strong>IMDB Rating:</strong> ⭐ ${movie.imdbRating}</p>
    </div>
  `;

  modal.style.display = "flex";

  document.getElementById("close-modal").onclick = () => {
    modal.style.display = "none";
  };
}



document.addEventListener("DOMContentLoaded", () => {
  showFollowPopup();
});

function showFollowPopup() {
  const popup = document.createElement("div");
  popup.className = "follow-popup";
  popup.innerHTML = `
    <div class="popup-content">
      <button class="popup-close">×</button>
      <img src="ico.jpg" alt="Instagram" class="popup-img" />
      <h2>✨ Halo, Sobat CineRyn!</h2>
      <p>Follow akun saya untuk update project keren lainnya 👇</p>
      <div class="popup-links">
        <a href="https://www.instagram.com/mryan_.__?igsh=MW5sMnpsMXpsY2w3dg==" target="_blank" class="btn">📸 Instagram</a>
        <a href="https://github.com/Ryanz1511" target="_blank" class="btn">💻 GitHub</a>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  popup.querySelector(".popup-close").onclick = () => {
    popup.remove();
  };
}


