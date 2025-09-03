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



  // --- View Switching Logic ---

  const landingPage = document.getElementById('landing-page');

  const searchPage = document.getElementById('search-page');

  const browseBooksBtn = document.getElementById('browse-books-btn');

  const searchInput = document.getElementById('search-input');

  const searchBtn = document.getElementById('search-btn');



  function showSearchPage() {

    landingPage.style.display = 'none';

    searchPage.style.display = 'flex';

  }



  if (browseBooksBtn) {

    browseBooksBtn.addEventListener('click', showSearchPage);

  }

  if (searchBtn) {

    searchBtn.addEventListener('click', () => {

      showSearchPage();

      // Additional logic to trigger search with input value

      // This is handled by the event listener below

    });

  }



  // --- Bookstore Logic ---

  const bookGrid = document.getElementById('books-grid');

  const sortSelect = document.getElementById('sort');

  const resultsCount = document.getElementById('results-count');

  const toggleLayoutBtn = document.getElementById('toggleLayout');

  const filtersToggle = document.getElementById('filter-toggle');

  const filtersPanel = document.getElementById('filters-panel');

  const closeFilters = document.getElementById('close-filters');

  const applyFiltersBtn = document.getElementById('apply-filters');

  const filtersOverlay = document.getElementById('filters-overlay');

  const genreSelect = document.getElementById('genre');

  const yearInput = document.getElementById('year');

  const categoriesPanel = document.getElementById('categories-panel');

  const typeList = document.getElementById('type-list');



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



  function applyFilters() {

    let tempBooks = [...books];

    filterQueue.forEach(filterFn => {

      tempBooks = filterFn(tempBooks);

    });

    filteredBooks = tempBooks;

    displayBooks(filteredBooks);

  }



  // --- Rendering Books ---

  function createBookElement(book) {

    const article = document.createElement('article');

    article.className = 'book';

    article.innerHTML = `

      <img src="${book.image_url}" alt="${book.title || 'Book Cover'}">

      <div class="info">

        <h4>${book.title || 'Untitled'}</h4>

        <p>${book.author || 'Unknown Author'}</p>

        <div class="meta">

          <span class="price">${book.price}</span>

          <span class="rating">

            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>

            ${book.rating || 'N/A'}

          </span>

        </div>

      </div>

    `;

    article.addEventListener('click', () => openModal(book));

    return article;

  }



  function displayBooks(bookList) {

    bookGrid.innerHTML = '';

    resultsCount.textContent = `Showing ${bookList.length} results`;

    if (bookList.length === 0) {

      bookGrid.innerHTML = '<p class="no-results">No books found matching your criteria.</p>';

      return;

    }

    const fragment = document.createDocumentFragment();

    bookList.forEach(book => {

      fragment.appendChild(createBookElement(book));

    });

    bookGrid.appendChild(fragment);

  }



  // --- Data Fetching and Initialization ---

  async function fetchData() {

    try {

      const response = await fetch('static/books.books.json');

      if (!response.ok) throw new Error('Network response was not ok');

      books = await response.json();

      populateCategories();

      filteredBooks = [...books];

      displayBooks(filteredBooks);

    } catch (error) {

      console.error('Error fetching data:', error);

      bookGrid.innerHTML = '<p>Error loading books. Please try again later.</p>';

    }

  }



  // --- Populate Categories Sidebar ---

  function populateCategories() {

    const types = new Set(books.map(book => book.type));

    typeList.innerHTML = `<li data-type="all" class="active">All Categories</li>`;

    types.forEach(type => {

      const li = document.createElement('li');

      li.textContent = type.charAt(0).toUpperCase() + type.slice(1);

      li.dataset.type = type;

      typeList.appendChild(li);

    });

   

    // Add event listeners for categories

    typeList.addEventListener('click', (e) => {

      const target = e.target.closest('li');

      if (!target) return;

      const selectedType = target.dataset.type;



      // Update active class

      document.querySelectorAll('#type-list li').forEach(item => item.classList.remove('active'));

      target.classList.add('active');



      filterQueue = [];

      if (selectedType !== 'all') {

        addFilter(arr => arr.filter(book => book.type === selectedType));

      }

      applyFilters();

    });

  }



  // --- Event Listeners ---

  searchInput.addEventListener('input', debounce(() => {

    showSearchPage();

    filterQueue = []; // Clear other filters on search

    if (searchInput.value) {

      addFilter(arr => linearSearch(arr, searchInput.value));

    } else {

      populateCategories();

    }

    applyFilters();

  }, 300));



  sortSelect.addEventListener('change', () => {

    const sortBy = sortSelect.value;

    if (sortBy === 'title' || sortBy === 'author') {

      filteredBooks = mergeSort(filteredBooks, sortBy);

    } else {

      filteredBooks = [...books]; // Reset to original order for 'recent'

    }

    displayBooks(filteredBooks);

  });

 

  // Advanced filters logic

  if (applyFiltersBtn) {

    applyFiltersBtn.addEventListener('click', (e) => {

      e.preventDefault();

      // Keep category filter, add advanced filters

      if (genreSelect.value) {

        addFilter(arr => arr.filter(book => book.genre === genreSelect.value));

      }

      if (yearInput.value) {

        const yearVal = parseInt(yearInput.value, 10);

        if (!isNaN(yearVal)) {

          addFilter(arr => arr.filter(book => (book.year || 0) >= yearVal));

        }

      }

      applyFilters();

      closeFiltersPanel();

    });

  }



  // --- Filters Panel (Sidebar) Toggler ---

  if (filtersToggle) {

    filtersToggle.addEventListener('click', openFiltersPanel);

  }

  if (closeFilters) {

    closeFilters.addEventListener('click', closeFiltersPanel);

  }

  if (filtersOverlay) {

    filtersOverlay.addEventListener('click', closeFiltersPanel);

  }



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



  // --- Layout Toggle ---

  if (toggleLayoutBtn) {

    toggleLayoutBtn.addEventListener('click', () => {

      isGrid = !isGrid;

      if (bookGrid) {

        bookGrid.style.display = isGrid ? 'grid' : 'list-item';

      }

      if (toggleLayoutBtn) {

        toggleLayoutBtn.textContent = isGrid ? '🔲' : '📄';

      }

    });

  }

 

  // --- Modal Logic ---

  const modal = document.getElementById('book-modal');

  const closeModalBtn = document.getElementById('close-modal');

  const modalTitle = document.getElementById('modal-title');

  const modalAuthor = document.getElementById('modal-author');

  const modalRatingValue = document.getElementById('modal-rating-value');

  const modalStars = document.getElementById('modal-stars');

  const modalDescription = document.getElementById('modal-description');

  const modalImage = document.getElementById('modal-image');

  const modalAmazonLink = document.getElementById('modal-amazon-link');



  function generateStars(rating) {

    const fullStars = Math.floor(rating);

    const halfStar = rating % 1 !== 0;

    let starsHtml = '';

    const starSvg = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>`;

    const halfStarSvg = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M128,179.54l-51,31a16,16,0,0,1-23.84-17.34l13.51-58.6L21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34Z" opacity="0.5"></path><path d="M239.2,97.29a16,16,0,0,0-13.81-11L166,81.17,142.72,25.81h0a15.95,15.95,0,0,0-29.44,0L90.07,81.17,30.61,86.32a16,16,0,0,0-9.11,28.06L66.61,153.8,53.09,212.34a16,16,0,0,0,23.84,17.34l51-31,51.11,31a16,16,0,0,0,23.84-17.34l-13.51-58.6,45.1-39.36A16,16,0,0,0,239.2,97.29Zm-15.22,5-45.1,39.36a16,16,0,0,0-5.08,15.71L187.35,216v0l-51.07-31a15.9,15.9,0,0,0-16.54,0l-51,31h0L82.2,157.4a16,16,0,0,0-5.08-15.71L32,102.35a.37.37,0,0,1,0-.09l59.44-5.14a16,16,0,0,0,13.35-9.75L128,32.08l23.2,55.29a16,16,0,0,0,13.35,9.75L224,102.26S224,102.32,224,102.33Z"></path></svg>`;



    for (let i = 0; i < fullStars; i++) {

      starsHtml += starSvg;

    }

    if (halfStar) {

      starsHtml += halfStarSvg;

    }

    // Add empty stars for the rest

    const emptyStars = 5 - Math.ceil(rating);

    const emptyStarSvg = `<svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg" class="text-gray-300 dark:text-gray-600"><path d="M239.2,97.29a16,16,0,0,0-13.81-11L166,81.17,142.72,25.81h0a15.95,15.95,0,0,0-29.44,0L90.07,81.17,30.61,86.32a16,16,0,0,0-9.11,28.06L66.61,153.8,53.09,212.34a16,16,0,0,0,23.84,17.34l51-31,51.11,31a16,16,0,0,0,23.84-17.34l-13.51-58.6,45.1-39.36A16,16,0,0,0,239.2,97.29Zm-15.22,5-45.1,39.36a16,16,0,0,0-5.08,15.71L187.35,216v0l-51.07-31a15.9,15.9,0,0,0-16.54,0l-51,31h0L82.2,157.4a16,16,0,0,0-5.08-15.71L32,102.35a.37.37,0,0,1,0-.09l59.44-5.14a16,16,0,0,0,13.35-9.75L128,32.08l23.2,55.29a16,16,0,0,0,13.35,9.75L224,102.26S224,102.32,224,102.33Z"></path></svg>`;

    for (let i = 0; i < emptyStars; i++) {

      starsHtml += emptyStarSvg;

    }

    return starsHtml;

  }



  function openModal(book) {

    modalTitle.textContent = book.title;

    modalAuthor.textContent = `By ${book.author}`;

    modalDescription.textContent = book.description;

    modalImage.src = book.image_url;



    // Set rating

    modalRatingValue.textContent = book.rating || 'N/A';

    modalStars.innerHTML = generateStars(book.rating);

   

    // Set Amazon link

    const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}%20${encodeURIComponent(book.author)}`;

    modalAmazonLink.href = amazonSearchUrl;



    modal.style.display = 'flex';

    document.body.style.overflow = 'hidden';

  }



  if (closeModalBtn) {

    closeModalBtn.addEventListener('click', () => {

      modal.style.display = 'none';

      document.body.style.overflow = '';

    });

  }



  window.addEventListener('click', (event) => {

    if (event.target === modal) {

      modal.style.display = 'none';

      document.body.style.overflow = '';

    }

  });



  fetchData();

});


