document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle ---
  const themeToggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const sunIcon = `<svg class="sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonIcon = `<svg class="moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function applyTheme(theme) {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if (themeToggleButton) {
        themeToggleButton.innerHTML = sunIcon;
        themeToggleButton.setAttribute('aria-label', 'Switch to light mode');
      }
    } else {
      body.classList.remove('dark-mode');
      if (themeToggleButton) {
        themeToggleButton.innerHTML = moonIcon;
        themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDark) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  }

  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
  initializeTheme();

  // --- Bookstore Logic ---
  const bookGrid = document.getElementById('books-grid');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort');
  const resultsCount = document.getElementById('results-count');
  const toggleLayoutBtn = document.getElementById('toggleLayout');
  const filtersToggle = document.getElementById('filters-toggle');
  const filtersPanel = document.getElementById('filters-panel');
  const closeFilters = document.getElementById('close-filters');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const filtersOverlay = document.getElementById('filters-overlay');
  const genreSelect = document.getElementById('genre');
  const yearInput = document.getElementById('year');
  const typeSelect = document.getElementById('type');

  let books = [];
  let filteredBooks = [];
  let isGrid = true;
  let filterQueue = [];

  // --- Debounce Helper ---
  function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- Sorting Helpers ---
  function mergeSort(arr, key) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid), key);
    const right = mergeSort(arr.slice(mid), key);
    return merge(left, right, key);
  }
  function merge(left, right, key) {
    let result = [], i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if ((left[i][key] || '').toLowerCase() <= (right[j][key] || '').toLowerCase()) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  // --- Search Helper ---
  function linearSearch(arr, query) {
    query = query.toLowerCase();
    return arr.filter(book =>
      (book.title || '').toLowerCase().includes(query) ||
      (book.author || '').toLowerCase().includes(query)
    );
  }

  // --- Filter Queue ---
  function addFilter(filterFn) {
    filterQueue.push(filterFn);
  }
  function applyFilters(data) {
    let result = [...data];
    while (filterQueue.length > 0) {
      const filterFn = filterQueue.shift();
      result = filterFn(result);
    }
    return result;
  }

  // --- Fetch Books ---
  async function fetchBooks() {
    let url = '/books?';
    const q = searchInput ? searchInput.value.trim() : '';
    const genre = genreSelect ? genreSelect.value : '';
    const year = yearInput ? yearInput.value : '';
    const type = typeSelect ? typeSelect.value : '';
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (genre) url += `genre=${encodeURIComponent(genre)}&`;
    if (year) url += `year=${encodeURIComponent(year)}&`;
    if (type) url += `type=${encodeURIComponent(type)}&`;

    if (resultsCount) resultsCount.textContent = "Loading...";
    try {
      const res = await fetch(url);
      books = await res.json();
      filteredBooks = books;

      // Apply search
      if (q) filteredBooks = linearSearch(filteredBooks, q);

      // Apply filter queue
      filteredBooks = applyFilters(filteredBooks);

      renderBooks();
    } catch (err) {
      if (bookGrid) bookGrid.innerHTML = `<p class="error">⚠️ Cannot load books. Backend may be down.</p>`;
      if (resultsCount) resultsCount.textContent = "Connection lost";
    }
  }

  // --- Show Book Modal ---
  async function showBookModalById(bookId) {
    try {
      const res = await fetch(`/books/${bookId}`);
      if (!res.ok) return;
      const book = await res.json();

      document.getElementById('book-modal').style.display = 'flex';
      document.getElementById('modal-book-image').src = book.image_url || '';
      document.getElementById('modal-title').textContent = book.title || '';
      document.getElementById('modal-author').textContent = book.author ? `by ${book.author}` : '';
      document.getElementById('modal-genre').textContent = book.genre ? book.genre.toUpperCase() : '';
      document.getElementById('modal-stars').textContent = '⭐'.repeat(Math.round(book.rating || 0));
      document.getElementById('modal-rating-value').textContent = book.rating ? book.rating.toFixed(1) : '';
      document.getElementById('modal-review-count').textContent = book.reviews ? `(${book.reviews} reviews)` : '';
      document.getElementById('modal-description').textContent = book.description || '';
      document.getElementById('modal-pages').textContent = book.pages || '';
      document.getElementById('modal-year').textContent = book.year || '';
      document.getElementById('modal-isbn').textContent = book.isbn || '';
      document.getElementById('modal-price').textContent = book.price ? `$${book.price}` : '';
    } catch (e) {
      // handle error
    }
  }

  document.getElementById('modal-close').onclick = function() {
    document.getElementById('book-modal').style.display = 'none';
  };

  // --- Render Books ---
  function renderBooks() {
    if (!bookGrid) return;
    bookGrid.innerHTML = '';
    if (!filteredBooks.length) {
      bookGrid.innerHTML = `<p>No books found.</p>`;
      if (resultsCount) resultsCount.textContent = "0 books found";
      return;
    }
    filteredBooks.forEach(book => {
      const article = document.createElement('article');
      article.className = 'book';
      article.innerHTML = `
        <img src="${book.image_url}" alt="${book.title || 'Book Cover'}">
        <div class="info">
          <h4>${book.title || ''}</h4>
          <p>${book.author || ''}</p>
          <div class="meta">
            <span class="rating">⭐ ${book.rating || ''}</span>
            <span class="price">${book.price ? `$${book.price}` : ''}</span>
          </div>
        </div>
      `;
      article.onclick = () => showBookModalById(book._id);
      bookGrid.appendChild(article);
    });
    if (resultsCount) resultsCount.textContent = `${filteredBooks.length} books found`;
  }

  // --- Sorting ---
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortBy = sortSelect.value;
      if (sortBy === 'title' || sortBy === 'author') {
        filteredBooks = mergeSort(filteredBooks, sortBy);
      } else if (sortBy === 'recent' || sortBy === 'year') {
        filteredBooks.sort((a, b) => (b.year || 0) - (a.year || 0));
      }
      renderBooks();
    });
  }

  // --- Search ---
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      fetchBooks();
    }));
  }

  // --- Layout Toggle ---
  if (toggleLayoutBtn && bookGrid) {
    toggleLayoutBtn.addEventListener('click', () => {
      isGrid = !isGrid;
      bookGrid.className = isGrid ? 'book-grid' : 'book-list';
      toggleLayoutBtn.textContent = isGrid ? '🔲' : '📄';
    });
  }

  // --- Filters Panel (Sidebar) ---
  function openFiltersPanel() {
    if (filtersPanel) filtersPanel.classList.add('active');
    if (filtersOverlay) filtersOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeFiltersPanel() {
    if (filtersPanel) filtersPanel.classList.remove('active');
    if (filtersOverlay) filtersOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (filtersToggle) filtersToggle.addEventListener('click', openFiltersPanel);
  if (closeFilters) closeFilters.addEventListener('click', closeFiltersPanel);
  if (filtersOverlay) filtersOverlay.addEventListener('click', closeFiltersPanel);
  if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => {
    // Clear old filters
    filterQueue = [];
    // Add genre filter
    if (genreSelect && genreSelect.value) {
      addFilter(arr => arr.filter(book => book.genre === genreSelect.value));
    }
    // Add year filter
    if (yearInput && yearInput.value) {
      const yearVal = parseInt(yearInput.value, 10);
      if (!isNaN(yearVal)) {
        addFilter(arr => arr.filter(book => (book.year || 0) > yearVal));
      }
    }
    // Add type filter
    if (typeSelect && typeSelect.value) {
      addFilter(arr => arr.filter(book => book.type === typeSelect.value));
    }
    closeFiltersPanel();
    fetchBooks();
  });

  // --- Initial Load ---
  fetchBooks();
});