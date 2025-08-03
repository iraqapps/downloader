// Constants for API Endpoints
const BASE_API_URL = 'https://cinemana.shabakaty.com/api/android/';
const GROUPS_API = BASE_API_URL + 'videoGroups/lang/ar/level/0';
const VIDEO_INFO_API = BASE_API_URL + 'allVideoInfo/id/';
const SEASON_INFO_API = BASE_API_URL + 'videoSeason/id/';
const TRANSCODED_FILES_API = BASE_API_URL + 'transcoddedFiles/id/';
const PAGINATION_API = BASE_API_URL + 'videoListPagination?groupID=';
const SEARCH_API_BASE = BASE_API_URL + 'AdvancedSearch?videoTitle=';
const CATEGORIES_API = BASE_API_URL + 'categories'; 
const MOVIES_BY_CATEGORY_API = 'https://cinemana.shabakaty.com/api/android/video/V/2?categoryNb=';
const SERIES_BY_CATEGORY_API = 'https://cinemana.shabakaty.com/api/android/video/V/2?categoryNb=';
// DOM Elements
const mainContent = document.getElementById('main-content');
const movieSeriesListDiv = document.getElementById('movie-series-list');
const detailsSection = document.getElementById('details-section');
const qualityOptionsSection = document.getElementById('quality-options-section');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const homeNav = document.getElementById('home-nav');
const searchNav = document.getElementById('search-nav');
const filterButtonsContainer = document.getElementById('filter-buttons-container');
const filterMoviesBtn = document.getElementById('filterMovies');
const filterSeriesBtn = document.getElementById('filterSeries');
const favoritesNav = document.getElementById('favorites-nav');
const favoritesSection = document.getElementById('favorites-section');
const favoritesListDiv = document.getElementById('favorites-list');
const categoriesNav = document.getElementById('categories-nav');
const categoriesSection = document.getElementById('categories-section');
const categoriesListDiv = document.getElementById('categories-list');
const categoryContentSection = document.getElementById('category-content-section');
const categoryContentTitle = document.getElementById('category-content-title');
const categoryContentListDiv = document.getElementById('category-content-list');
const categoryFilterButtonsContainer = document.getElementById('category-filter-buttons-container');
const categoryFilterMoviesBtn = document.getElementById('categoryFilterMovies');
const categoryFilterSeriesBtn = document.getElementById('categoryFilterSeries');
// State Variables
let allGroupsData = [];
let allCategoriesData = [];
let currentSearchTerm = '';
let currentSearchPage = 0;
let isSearching = false;
let currentSearchType = 'all';
let currentCategoryFilter = 'movies';
let currentCategoryContent = {};
const FAVORITES_KEY = 'cinemanaFavorites';
let currentContentId = null;
let currentContentType = null;
let currentContentTitle = '';
let currentSeriesTitle = '';
let currentEpisodeSeason = '';
const navigationStack = [];


// ---------------- الدوال المساعدة (Helper Functions) ----------------

function formatDuration(seconds) {
    if (!seconds) return 'غير محدد';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const formattedM = m < 10 ? '0' + m : m;
    const formattedS = s < 10 ?
    '0' + s : s;
    if (h > 0) {
        return `${h}:${formattedM}:${formattedS}`;
    } else {
        return `${formattedM}:${formattedS}`;
    }
}

// الدوال المعدلة للتعامل مع النسخ إلى الحافظة
function copyToClipboard(text) {
    // حاول النسخ باستخدام Clipboard API الحديثة
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert('تم نسخ الرابط إلى الحافظة!');
        }).catch(err => {
            console.error('فشل النسخ باستخدام الطريقة الحديثة: ', err);
            // في حالة الفشل، استخدم الطريقة الاحتياطية
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // استخدم الطريقة القديمة كخيار احتياطي
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // تجنب انتقال الصفحة للأسفل عند التركيز على الحقل
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";

    // اجعل الحقل غير مرئي
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        const msg = successful ?
        'تم نسخ الرابط إلى الحافظة!' : 'فشل نسخ الرابط.';
        alert(msg);
    } catch (err) {
        console.error('فشل النسخ باستخدام الطريقة الاحتياطية: ', err);
        alert('فشل نسخ الرابط.');
    }

    document.body.removeChild(textArea);
}

// دالة جديدة لنسخ اسم المحتوى
function copyTitleToClipboard() {
    let titleToCopy = '';
    if (currentContentType === 'movie') {
        // إذا كان المحتوى فيلمًا، انسخ العنوان فقط
        titleToCopy = currentContentTitle;
    } else if (currentContentType === 'series' && currentSeriesTitle) {
        // إذا كان المحتوى مسلسلًا، انسخ اسم المسلسل مع اسم الموسم والحلقة
        const season = currentEpisodeSeason.match(/الموسم (\d+)/)?.[1];
        const episode = currentEpisodeSeason.match(/الحلقة (\d+)/)?.[1];
        if (season && episode) {
            titleToCopy = `${currentSeriesTitle} S${season}E${episode}`;
        } else {
            titleToCopy = currentSeriesTitle;
        }
    }
    
    if (titleToCopy) {
        copyToClipboard(titleToCopy);
    } else {
        alert('لم يتم العثور على عنوان لنسخه.');
    }
}

function loadFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
    const favorites = loadFavorites();
    return favorites.some(item => (item.id == id));
}

function toggleFavorite(id, title, imageUrl, kind) {
    let favorites = loadFavorites();
    const index = favorites.findIndex(item => (item.id == id));
    if (index > -1) {
        favorites.splice(index, 1);
        alert(`تمت إزالة "${title}" من المفضلة.`);
    } else {
        favorites.push({ id, title, imageUrl, kind });
        alert(`تمت إضافة "${title}" إلى المفضلة.`);
    }
    saveFavorites(favorites);
    updateFavoriteButtonState(id);
}

function updateFavoriteButtonState(id) {
    const favoriteButton = document.getElementById('favoriteButton');
    if (favoriteButton) {
        if (isFavorite(id)) {
            favoriteButton.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            favoriteButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
            favoriteButton.innerHTML = '<span class="material-icons text-base">star</span> إزالة من المفضلة';
        } else {
            favoriteButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            favoriteButton.classList.add('bg-gray-600', 'hover:bg-gray-700');
            favoriteButton.innerHTML = '<span class="material-icons text-base">star_border</span> إضافة إلى المفضلة';
        }
    }
}

function setActiveFilterButton(type) {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.classList.remove('bg-blue-600', 'text-white');
        button.classList.add('bg-gray-700', 'text-gray-300');
    });
    if (type === 'movies') {
        filterMoviesBtn.classList.add('bg-blue-600', 'text-white');
        filterMoviesBtn.classList.remove('bg-gray-700', 'text-gray-300');
    } else if (type === 'series') {
        filterSeriesBtn.classList.add('bg-blue-600', 'text-white');
        filterSeriesBtn.classList.remove('bg-gray-700', 'text-gray-300');
    }
}

function setActiveCategoryFilterButton(type) {
    document.querySelectorAll('#category-filter-buttons-container .filter-btn').forEach(button => {
        button.classList.remove('bg-blue-600', 'text-white');
        button.classList.add('bg-gray-700', 'text-gray-300');
    });
    if (type === 'movies') {
        categoryFilterMoviesBtn.classList.add('bg-blue-600', 'text-white');
        categoryFilterMoviesBtn.classList.remove('bg-gray-700', 'text-gray-300');
    } else if (type === 'series') {
        categoryFilterSeriesBtn.classList.add('bg-blue-600', 'text-white');
        categoryFilterSeriesBtn.classList.remove('bg-gray-700', 'text-gray-300');
    }
}

function createMovieCard(item) {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card', 'flex-none', 'w-40', 'bg-gray-800', 'rounded-lg', 'overflow-hidden', 'shadow-lg', 'transform', 'transition', 'duration-200', 'hover:scale-105', 'cursor-pointer', 'text-center', 'pb-2');
    movieCard.dataset.nb = item.id || item.nb;
    movieCard.dataset.kind = item.kind;
    movieCard.dataset.title = item.title || item.ar_title || item.en_title;
    const img = document.createElement('img');
    img.classList.add('w-full', 'h-52', 'block', 'object-cover', 'rounded-t-lg');
    img.src = item.imageUrl || item.imgObjUrl || 'placeholder.jpg';
    img.alt = item.title || item.ar_title || item.en_title || 'صورة غلاف';
    movieCard.appendChild(img);
    const cardTitle = document.createElement('h3');
    cardTitle.classList.add('text-base', 'text-gray-100', 'mt-2', 'mx-1', 'truncate');
    cardTitle.textContent = item.title || item.ar_title || item.en_title || 'عنوان غير معروف';
    movieCard.appendChild(cardTitle);
    movieCard.addEventListener('click', () => {
        currentContentId = item.id || item.nb;
        currentContentType = (item.kind === '1' ? 'movie' : 'series');
        currentContentTitle = item.title || item.ar_title || item.en_title || 'ملف';
        currentSeriesTitle = '';
        currentEpisodeSeason = '';
        fetchAndDisplayDetails(item.id || item.nb, item.kind);
        const lastState = navigationStack[navigationStack.length - 1];
        
        if (lastState && lastState.section === 'category-content-section') {
            pushToStack('details-section', { id: item.id || item.nb, kind: item.kind, fromCategory: true, categoryState: lastState.data });
        } else {
            pushToStack('details-section', { id: item.id || item.nb, kind: item.kind });
        }
    });
    return movieCard;
}

function createCategoryCard(category) {
    const categoryCard = document.createElement('div');
    categoryCard.classList.add('category-card', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center', 'p-4', 'bg-gray-800', 'rounded-lg', 'shadow-lg', 'transform', 'transition', 'duration-200', 'hover:scale-105', 'cursor-pointer');
    categoryCard.dataset.id = category.nb;
    categoryCard.dataset.title = category.ar_title;
    
    categoryCard.innerHTML = `
        <span class="material-icons text-5xl text-blue-500 mb-2">folder</span>
        <h3 class="text-base text-gray-100 font-bold">${category.ar_title ||
    category.en_title}</h3>
    `;

    categoryCard.addEventListener('click', () => {
        const categoryId = category.nb;
        const categoryTitle = category.ar_title || category.en_title;
        currentCategoryContent = {id: categoryId, title: categoryTitle};
        fetchAndDisplayCategoryContent(categoryId, categoryTitle, 0, currentCategoryFilter);
        pushToStack('category-content-section', {
            categoryId: categoryId,
            categoryTitle: categoryTitle,
            
            videoKind: currentCategoryFilter
        });
    });
    return categoryCard;
}

function createLoadMoreCard(id, initialPage, type, searchTerm = '', categoryTitle = '', videoKind = 'movies', searchType = '') {
    const loadMoreCard = document.createElement('div');
    loadMoreCard.classList.add('movie-card', 'flex-none', 'w-40', 'bg-gray-700', 'rounded-lg', 'overflow-hidden', 'shadow-lg', 'transform', 'transition', 'duration-200', 'hover:bg-gray-600', 'cursor-pointer', 'flex', 'flex-col', 'justify-center', 'items-center', 'text-center', 'text-gray-300');
    loadMoreCard.style.minHeight = '225px';
    const loadMoreButtonContent = document.createElement('div');
    loadMoreButtonContent.classList.add('flex', 'flex-col', 'items-center', 'gap-2');
    loadMoreButtonContent.innerHTML = '<span class="material-icons text-5xl text-blue-500">add_circle</span><h3 class="text-lg text-gray-100">عرض المزيد</h3>';
    loadMoreCard.appendChild(loadMoreButtonContent);
    loadMoreCard.dataset.id = id;
    loadMoreCard.dataset.page = initialPage;
    loadMoreCard.dataset.type = type;
    if (type === 'search') {
        loadMoreCard.dataset.searchTerm = searchTerm;
        loadMoreCard.dataset.searchType = searchType;
    } else if (type === 'category') {
        loadMoreCard.dataset.categoryTitle = categoryTitle;
        loadMoreCard.dataset.videoKind = videoKind;
    }
    loadMoreCard.addEventListener('click', async (event) => {
        const card = event.currentTarget;
        const idToFetch = card.dataset.id;
        let page = parseInt(card.dataset.page);
        const currentType = card.dataset.type;
        const currentSearchTermFromCard = card.dataset.searchTerm || '';
        const currentSearchTypeFromCard = card.dataset.searchType || '';
        const currentVideoKindFromCard = card.dataset.videoKind || '';
        const 
        targetGrid = card.parentNode;
        const originalContent = card.innerHTML;

        card.classList.add('pointer-events-none');
        card.classList.remove('hover:bg-gray-600');
        card.innerHTML = '<div class="flex flex-col items-center gap-2"><span class="material-icons text-5xl text-blue-500 animate-spin">sync</span><h3 class="text-lg text-gray-100">جاري التحميل...</h3></div>';
        try {
            let response;
            if (currentType === 'group') {
            
                response = await fetch(`${PAGINATION_API}${idToFetch}&level=0&itemsPerPage=12&page=${page}`);
            } else if (currentType === 'search') {
                let searchUrl = `${SEARCH_API_BASE}${encodeURIComponent(currentSearchTermFromCard)}%20&year=1900,2025&page=${page}&level=0`;
                if (currentSearchTypeFromCard === 'movies') {
                    searchUrl += '&type=movies';
                } else if (currentSearchTypeFromCard === 'series') {
                    searchUrl += '&type=series';
                }
                response = await fetch(searchUrl);
            } else if (currentType === 'category') {
                let apiUrl = '';
                if (currentVideoKindFromCard === 'movies') {
                    apiUrl = `${MOVIES_BY_CATEGORY_API}${idToFetch}&videoKind=1&langNb&itemsPerPage=30&pageNumber=${page}&level=0&sortParam=desc`;
                } else if (currentVideoKindFromCard === 'series') {
                    apiUrl = `${SERIES_BY_CATEGORY_API}${idToFetch}&videoKind=2&langNb=&itemsPerPage=30&pageNumber=${page}&level=0&sortParam=desc`;
                }
                response = await fetch(apiUrl);
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newItems = await response.json();
            if (newItems && newItems.length > 0) {
                newItems.forEach(item => {
                    const movieCard = createMovieCard(item);
                    targetGrid.insertBefore(movieCard, card);
                });
                card.dataset.page = page + 1;
                card.innerHTML = originalContent;
                card.classList.remove('pointer-events-none');
                card.classList.add('hover:bg-gray-600');
            } else {
                card.innerHTML = '<div class="flex flex-col items-center gap-2"><span class="material-icons text-5xl text-gray-500">info</span><h3 class="text-lg text-gray-400">لا يوجد المزيد</h3></div>';
                card.classList.remove('hover:bg-gray-600');
                card.classList.add('bg-gray-800', 'cursor-not-allowed');
                card.classList.add('pointer-events-none');
            }
        } catch (error) {
            console.error(`Error fetching more ${currentType} content:`, error);
            card.innerHTML = '<div class="flex flex-col items-center gap-2"><span class="material-icons text-5xl text-red-500">error</span><h3 class="text-lg text-red-400">خطأ في التحميل</h3></div>';
            card.classList.remove('hover:bg-gray-600');
            card.classList.add('bg-gray-800', 'cursor-not-allowed');
            card.classList.add('pointer-events-none');
        }
    });
    return loadMoreCard;
}

function renderMovieSeriesGroups(groupsToRender) {
    movieSeriesListDiv.innerHTML = '';
    if (!groupsToRender || groupsToRender.length === 0) {
        movieSeriesListDiv.innerHTML = '<p class="text-gray-400 text-center mt-10 text-lg">لا يوجد محتوى لعرضه حالياً في هذه المجموعات.</p>';
        return;
    }
    groupsToRender.forEach(group => {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('movie-series-section', 'mb-10');
        const title = document.createElement('h2');
        title.classList.add('section-title', 'text-2xl', 'text-gray-100', 'mb-5', 'text-right', 'pr-2', 'border-r-4', 'border-blue-400');
        title.textContent = group.title;
        sectionDiv.appendChild(title);
        const gridDiv = document.createElement('div');
        gridDiv.classList.add('movie-series-grid', 'flex', 'overflow-x-auto', 'gap-4', 'pb-4');
      
        const groupId = group.content && group.content.length > 0 ? group.content[0].list_id : null;
        gridDiv.dataset.groupId = groupId;
        gridDiv.dataset.currentPage = 0;
        group.content.forEach(item => {
            const movieCard = createMovieCard(item);
            gridDiv.appendChild(movieCard);
        });
        if (groupId) {
      
            const loadMoreCard = createLoadMoreCard(groupId, 1, 'group');
            gridDiv.appendChild(loadMoreCard);
        }
        sectionDiv.appendChild(gridDiv);
        movieSeriesListDiv.appendChild(sectionDiv);
    });
}

function renderCategories(categoriesToRender) {
    categoriesListDiv.innerHTML = '';
    if (categoriesToRender.length === 0) {
        categoriesListDiv.innerHTML = '<p class="text-gray-400 text-center w-full text-lg">لا توجد أقسام متاحة حالياً.</p>';
        return;
    }
    categoriesToRender.forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoriesListDiv.appendChild(categoryCard);
    });
}

function renderCategoryContent(content, categoryId, categoryTitle, currentPage, hasMore, videoKind) {
    categoryContentTitle.textContent = `${categoryTitle} (${videoKind === 'movies' ? 'أفلام' : 'مسلسلات'})`;
    categoryContentListDiv.innerHTML = '';
    if (content && content.length > 0) {
        content.forEach(item => {
            const movieCard = createMovieCard(item);
            categoryContentListDiv.appendChild(movieCard);
        });
        if (hasMore) {
            const loadMoreCard = createLoadMoreCard(categoryId, currentPage + 1, 'category', '', categoryTitle, videoKind);
            categoryContentListDiv.appendChild(loadMoreCard);
        }
    } else {
        categoryContentListDiv.innerHTML = `<p class="text-gray-400 text-center w-full text-lg">لا توجد أفلام أو مسلسلات في قسم "${categoryTitle}" حالياً.</p>`;
    }
}

function renderTranslations(translationsData, targetElement) {
    targetElement.innerHTML = '';
    if (translationsData && translationsData.length > 0) {
        translationsData.forEach(translation => {
            const li = document.createElement('li');
            li.classList.add('quality-item', 'bg-gray-700', 'p-4', 'rounded-lg', 'flex', 'justify-between', 'items-center', 'flex-wrap', 'gap-3');
            const linkText = document.createElement('span');
            linkText.classList.add('text-lg', 'text-gray-100', 'flex-grow');
            linkText.textContent = `ترجمة ${translation.name} (${translation.extention})`;
    
            li.appendChild(linkText);
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('flex', 'gap-2', 'items-center');
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-link-button', 'bg-green-600', 'text-white', 'rounded-md', 'py-2', 'px-3', 'text-sm', 'cursor-pointer', 'transition', 'duration-300', 'hover:bg-green-700', 'flex', 'items-center', 'gap-1', 'whitespace-nowrap');
            copyButton.innerHTML = '<span class="material-icons text-base">content_copy</span> نسخ الرابط';
            copyButton.onclick = (e) => {
                e.stopPropagation();
                copyToClipboard(translation.file);
            };
            buttonsContainer.appendChild(copyButton);
            li.appendChild(buttonsContainer);
            targetElement.appendChild(li);
        });
    } else {
        targetElement.innerHTML = '<p class="text-gray-400 text-center w-full mt-2">لا توجد ترجمات متاحة.</p>';
    }
}

// ---------------- الدوال الرئيسية (Core Functions) ----------------

function pushToStack(sectionId, data = null) {
    const lastState = navigationStack.length > 0 ?
    navigationStack[navigationStack.length - 1] : null;
    if (!lastState || lastState.section !== sectionId || JSON.stringify(lastState.data) !== JSON.stringify(data)) {
        history.pushState({ section: sectionId, data: data }, '', '');
        navigationStack.push({ section: sectionId, data: data });
    }
}

function popFromStack() {
    if (navigationStack.length > 1) {
        const prevState = navigationStack.pop();
        const stateToRestore = navigationStack[navigationStack.length - 1];

        if (stateToRestore) {
            if (stateToRestore.section === 'movie-series-list') {
                showSection('movie-series-list');
                if (stateToRestore.data && stateToRestore.data.isSearch) {
                    isSearching = true;
                    currentSearchTerm = stateToRestore.data.searchTerm;
                    currentSearchPage = stateToRestore.data.currentPage;
                    currentSearchType = stateToRestore.data.searchType || 'all';
                    renderSearchResults(stateToRestore.data.content, stateToRestore.data.searchTerm, stateToRestore.data.currentPage, stateToRestore.data.hasMore);
                    filterButtonsContainer.classList.remove('hidden');
                } else {
                    isSearching = false;
                    renderMovieSeriesGroups(allGroupsData);
                    filterButtonsContainer.classList.add('hidden');
                }
            } else if (stateToRestore.section === 'categories-section') {
                fetchAndRenderCategories();
            } else if (stateToRestore.section === 'category-content-section') {
                const { categoryId, categoryTitle, videoKind } = stateToRestore.data;
                fetchAndDisplayCategoryContent(categoryId, categoryTitle, 0, videoKind, false);
            } else if (stateToRestore.section === 'details-section') {
                fetchAndDisplayDetails(stateToRestore.data.id, stateToRestore.data.kind);
            } else if (stateToRestore.section === 'quality-options-section') {
                fetchAndDisplayQualityOptions(stateToRestore.data.id);
            } else if (stateToRestore.section === 'favorites-section') {
                showFavorites();
            }
        }
    } else if (navigationStack.length === 1) {
        goBackToHome();
        navigationStack.length = 0;
        pushToStack('movie-series-list', { isSearch: false });
    }
}

function handleGlobalBackButtonClick() {
    popFromStack();
}

function showSection(sectionId) {
    movieSeriesListDiv.classList.add('hidden');
    detailsSection.classList.add('hidden');
    qualityOptionsSection.classList.add('hidden');
    favoritesSection.classList.add('hidden');
    categoriesSection.classList.add('hidden');
    categoryContentSection.classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    filterButtonsContainer.classList.add('hidden');
    categoryFilterButtonsContainer.classList.add('hidden');
    if (sectionId === 'movie-series-list') {
        homeNav.classList.add('active');
        document.querySelector('.page-title').textContent = 'اكتشف الأفلام والمسلسلات';
    } else if (sectionId === 'favorites-section') {
        favoritesNav.classList.add('active');
        document.querySelector('.page-title').textContent = 'المفضلة';
    } else if (sectionId === 'categories-section') {
        categoriesNav.classList.add('active');
        document.querySelector('.page-title').textContent = 'الأقسام';
    } else if (sectionId === 'category-content-section') {
        categoryFilterButtonsContainer.classList.remove('hidden');
    }
}

async function fetchAndRenderGroups() {
    movieSeriesListDiv.innerHTML = '<p class="text-gray-400 text-center mt-10 text-lg flex flex-col items-center justify-center"><span class="material-icons animate-spin text-4xl text-blue-500 mb-2">sync</span> جاري تحميل المحتوى...</p>';
    showSection('movie-series-list');
    try {
        const response = await fetch(GROUPS_API);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.groups && Array.isArray(data.groups)) {
            allGroupsData = data.groups;
            isSearching = false;
            renderMovieSeriesGroups(allGroupsData);
            if (navigationStack.length === 0) {
                pushToStack('movie-series-list', { isSearch: false });
            }
        } else {
            console.error('API response did not contain expected "groups" array:', data);
            movieSeriesListDiv.innerHTML = '<p class="error-message text-red-400 text-center mt-10 text-lg">تعذر تحميل المحتوى: استجابة API غير متوقعة أو البيانات غير صحيحة.</p>';
        }
    } catch (error) {
        console.error('Error fetching initial groups:', error);
        movieSeriesListDiv.innerHTML = `<p class="error-message text-red-400 text-center mt-10 text-lg">تعذر تحميل المحتوى. الرجاء المحاولة مرة أخرى لاحقًا.<br>الخطأ: ${error.message}</p>`;
    }
}

async function fetchAndRenderCategories() {
    categoriesListDiv.innerHTML = '<p class="text-gray-400 text-center w-full mt-10 text-lg flex flex-col items-center justify-center"><span class="material-icons animate-spin text-4xl text-blue-500 mb-2">sync</span> جاري تحميل الأقسام...</p>';
    showSection('categories-section');
    try {
        const response = await fetch(CATEGORIES_API);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        if (categories && Array.isArray(categories)) {
            allCategoriesData = categories.filter(cat => cat.ar_title && cat.ar_title !== 'غير مصنف' && cat.ar_title !== 'Program');
            renderCategories(allCategoriesData);
            if (navigationStack.length === 0 || navigationStack[navigationStack.length - 1].section !== 'categories-section') {
                 pushToStack('categories-section');
            }
        } else {
            categoriesListDiv.innerHTML = '<p class="error-message text-red-400 text-center w-full mt-10 text-lg">تعذر تحميل الأقسام: استجابة API غير متوقعة أو البيانات غير صحيحة.</p>';
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        categoriesListDiv.innerHTML = `<p class="error-message text-red-400 text-center w-full mt-10 text-lg">تعذر تحميل الأقسام. الرجاء المحاولة مرة أخرى لاحقًا.<br>الخطأ: ${error.message}</p>`;
    }
}

async function fetchAndDisplayCategoryContent(categoryId, categoryTitle, page = 0, videoKind = 'movies', shouldPushToStack = true) {
    categoryContentTitle.textContent = `${categoryTitle} (${videoKind === 'movies' ? 'أفلام' : 'مسلسلات'})`;
    categoryContentListDiv.innerHTML = `<p class="text-gray-400 text-center w-full mt-10 text-lg flex flex-col items-center justify-center"><span class="material-icons animate-spin text-4xl text-blue-500 mb-2">sync</span> جاري تحميل محتوى "${categoryTitle}"...</p>`;
    showSection('category-content-section');
    setActiveCategoryFilterButton(videoKind);

    try {
        let apiUrl = '';
        const kindId = (videoKind === 'movies') ? 1 : 2;
        if (videoKind === 'movies') {
            apiUrl = `${MOVIES_BY_CATEGORY_API}${categoryId}&videoKind=${kindId}&langNb&itemsPerPage=30&pageNumber=${page}&level=0&sortParam=desc`;
        } else if (videoKind === 'series') {
            apiUrl = `${SERIES_BY_CATEGORY_API}${categoryId}&videoKind=${kindId}&langNb=&itemsPerPage=30&pageNumber=${page}&level=0&sortParam=desc`;
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.json();
        renderCategoryContent(content, categoryId, categoryTitle, page, content.length === 30, videoKind);
        if (shouldPushToStack) {
            pushToStack('category-content-section', {
                isCategory: true,
                categoryId,
                categoryTitle,
                content,
            
                currentPage: page,
                hasMore: content.length === 30,
                videoKind
            });
        }
    } catch (error) {
        console.error('Error fetching category content:', error);
        categoryContentListDiv.innerHTML = `<p class="error-message text-red-400 text-center w-full mt-10 text-lg">تعذر تحميل محتوى القسم. الرجاء المحاولة مرة أخرى.<br>الخطأ: ${error.message}</p>`;
    }
}

async function fetchAndDisplayDetails(id, kind) {
    showSection('details-section');
    document.getElementById('details-title').textContent = 'جاري التحميل...';
    document.querySelector('#details-section .back-button').onclick = handleGlobalBackButtonClick;
    detailsSection.innerHTML = `
        <button class="back-button bg-transparent border-none text-blue-400 text-lg cursor-pointer mb-5 flex items-center gap-1 transition duration-300 hover:text-blue-500" onclick="handleGlobalBackButtonClick()">
              <span class="material-icons transform rotate-180">arrow_right_alt</span> رجوع
        </button>
        <p class="text-gray-400 text-center mt-10 text-lg flex flex-col items-center justify-center">
            <span class="material-icons animate-spin text-5xl text-blue-500 mb-2">sync</span>
            جاري تحميل التفاصيل...
    
        </p>
    `;
    try {
        const response = await fetch(VIDEO_INFO_API + id);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        detailsSection.innerHTML = `
            <button class="back-button bg-transparent border-none text-blue-400 text-lg cursor-pointer mb-5 flex items-center gap-1 transition duration-300 hover:text-blue-500" onclick="handleGlobalBackButtonClick()">
                <span class="material-icons transform rotate-180">arrow_right_alt</span> رجوع
            </button>
            <h2 id="details-title" class="text-4xl text-blue-400 mb-5 text-center"></h2>
            <div class="details-poster-container text-center mb-5">
        
                <img id="details-poster" src="" alt="Poster" class="max-w-xs h-auto rounded-lg shadow-md mx-auto">
            </div>
            <p id="details-description" class="text-lg leading-relaxed mb-3 text-gray-300 text-justify"></p>
            <p id="details-year" class="text-base mb-1 text-gray-300"></p>
            <p id="details-stars" class="text-base mb-1 text-gray-300"></p>
            <p id="details-duration" class="text-base mb-1 text-gray-300"></p>
          
            <p id="details-categories" class="text-base mb-4 text-gray-300"></p>
            <div id="seasons-list" class="seasons-list hidden">
                <h3 class="text-2xl text-blue-400 mt-6 mb-3 border-r-3 border-blue-400 pr-2">المواسم والحلقات:</h3>
            </div>
            <button id="watchDownloadBtn" class="watch-download-button block w-max mx-auto mt-6 py-3 px-6 bg-blue-600 text-white border-none rounded-lg text-xl cursor-pointer transition duration-300 hover:bg-blue-700 transform hover:-translate-y-0.5 hidden">جلب معلومات التحميل</button>
       
            <button id="favoriteButton" class="block w-max mx-auto mt-4 py-3 px-6 bg-gray-600 text-white border-none rounded-lg text-xl cursor-pointer transition duration-300 hover:bg-gray-700 transform hover:-translate-y-0.5 flex items-center gap-2">
                <span class="material-icons text-base">star_border</span>
                إضافة إلى المفضلة
            </button>
        `;
        document.querySelector('#details-section .back-button').onclick = handleGlobalBackButtonClick;
        const detailsTitle = document.getElementById('details-title');
        const detailsPoster = document.getElementById('details-poster');
        const detailsDescription = document.getElementById('details-description');
        const detailsYear = document.getElementById('details-year');
        const detailsStars = document.getElementById('details-stars');
        const detailsDuration = document.getElementById('details-duration');
        const detailsCategories = document.getElementById('details-categories');
        const seasonsListSection = document.getElementById('seasons-list');
        const watchDownloadButton = document.getElementById('watchDownloadBtn');
        const favoriteButton = document.getElementById('favoriteButton');
        currentContentTitle = data.ar_title || data.en_title || 'ملف';
        if (kind === '2') {
            currentSeriesTitle = data.ar_title ||
            data.en_title || 'مسلسل';
            if (data.season && data.episodeNummer) {
                currentEpisodeSeason = ` الموسم ${data.season} الحلقة ${data.episodeNummer}`;
            } else {
                currentEpisodeSeason = '';
            }
        } else {
            currentSeriesTitle = '';
            currentEpisodeSeason = '';
        }
        detailsTitle.textContent = data.ar_title || data.en_title;
        detailsPoster.src = data.imgObjUrl ||
        'placeholder.jpg';
        detailsPoster.alt = data.ar_title || data.en_title || 'بوستر الفيلم/المسلسل';
        detailsDescription.textContent = data.ar_content || data.en_content || 'لا يوجد وصف متاح.';
        detailsYear.textContent = `السنة: ${data.year}`;
        detailsStars.textContent = `التقييم: ${data.stars || 'غير متاح'} / 10`;
        detailsDuration.textContent = `المدة: ${formatDuration(data.duration)}`;
        if (data.categories && data.categories.length > 0) {
            const categoriesText = data.categories.map(cat => cat.ar_title || cat.en_title).join(', ');
            detailsCategories.textContent = `الفئات: ${categoriesText}`;
        } else {
        detailsCategories.textContent = 'الفئات: غير محددة';
        }
    
        if (kind === '1' && data.fileFile) {
            watchDownloadButton.classList.remove('hidden');
            watchDownloadButton.textContent = 'جلب معلومات التحميل';
            watchDownloadButton.onclick = () => {
                fetchAndDisplayQualityOptions(id);
                pushToStack('quality-options-section', {id: id});
            };
        } else {
            watchDownloadButton.classList.add('hidden');
        }
        if (favoriteButton) {
            updateFavoriteButtonState(id);
            favoriteButton.onclick = () => {
                toggleFavorite(id, currentContentTitle, data.imgObjUrl || 'placeholder.jpg', kind);
            };
        }
        if (kind === '2') {
            seasonsListSection.classList.remove('hidden');
            const seasonsListDiv = document.getElementById('seasons-list');
            seasonsListDiv.innerHTML = '<h3 class="text-2xl text-blue-400 mt-6 mb-3 border-r-3 border-blue-400 pr-2">المواسم والحلقات:</h3>';
            fetch(SEASON_INFO_API + data.nb)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
         
                    return response.json();
                })
                .then(seasonData => {
                    const seasons = {};
                    seasonData.forEach(episode => {
         
                        const seasonNumber = episode.season;
        
                        if (!seasons[seasonNumber]) {
                            seasons[seasonNumber] = [];
                        }
  
                        seasons[seasonNumber].push(episode);
                    });
      
                    for (const seasonNum in seasons) {
                        const seasonItem = document.createElement('div');
      
                        seasonItem.classList.add('season-item', 'bg-gray-700', 'rounded-lg', 'mb-5', 'p-4');
                        const seasonTitle = document.createElement('h4');
                        seasonTitle.classList.add('season-title', 'text-xl', 'text-gray-100', 'mb-3', 'cursor-pointer', 'flex', 'justify-between', 'items-center');
                        seasonTitle.innerHTML = `الموسم ${seasonNum} <span class="material-icons transition-transform duration-300">chevron_left</span>`;
                        seasonItem.appendChild(seasonTitle);
                        const episodeList = document.createElement('ul');
                        episodeList.classList.add('episode-list', 'list-none', 'p-0', 'mt-3', 'hidden');
                        seasons[seasonNum].sort((a, b) => parseInt(a.episodeNummer) - parseInt(b.episodeNummer));
                        seasons[seasonNum].forEach(episode => {
                            const episodeItem = document.createElement('li');
                            episodeItem.classList.add('episode-item', 'bg-gray-600', 'p-3', 'mb-1', 'rounded-lg', 'flex', 'items-center', 'gap-3', 'cursor-pointer', 'transition', 'duration-200', 'hover:bg-gray-500');
                      
                            episodeItem.dataset.nb = episode.nb;
                            const img = document.createElement('img');
                            img.classList.add('w-20', 'h-auto', 'rounded-md', 'object-cover');
                            img.src = 
                            episode.imgObjUrl || 'placeholder.jpg';
    
                            img.alt = `الحلقة ${episode.episodeNummer}`;
                            episodeItem.appendChild(img);
                            const episodeInfo = document.createElement('div');
        
                            episodeInfo.classList.add('flex-grow');
                            const episodeTitle = document.createElement('h4');
                            episodeTitle.classList.add('m-0', 'text-lg', 'text-gray-100');
                            episodeTitle.textContent = `الحلقة ${episode.episodeNummer}: ${episode.ar_title || episode.en_title}`;
                            const episodeDuration = document.createElement('p');
                            episodeDuration.classList.add('m-0', 'text-sm', 'text-gray-400');
                            episodeDuration.textContent = `المدة: ${formatDuration(episode.duration)}`;
                            episodeInfo.appendChild(episodeTitle);
                            episodeInfo.appendChild(episodeDuration);
                            episodeItem.appendChild(episodeInfo);
                            episodeItem.addEventListener('click', () => {
                                currentContentId = episode.nb;
                                currentContentType = 'series'; // تم التعديل ليصبح 'series' بدلًا من 'episode'
                                currentContentTitle = episode.ar_title || episode.en_title || 'حلقة';
                                currentEpisodeSeason = ` الموسم ${episode.season} الحلقة ${episode.episodeNummer}`;
                                fetchAndDisplayQualityOptions(episode.nb);
          
                                pushToStack('quality-options-section', {id: episode.nb});
                            });
                            episodeList.appendChild(episodeItem);
                        });
                        seasonItem.appendChild(episodeList);
                        seasonsListDiv.appendChild(seasonItem);
                        seasonTitle.addEventListener('click', () => {
                            episodeList.classList.toggle('expanded');
                            seasonTitle.classList.toggle('expanded');
                        });
                    }
                })
                .catch(seasonError => {
                    console.error('Error fetching season info:', seasonError);
                    seasonsListDiv.innerHTML += '<p class="error-message text-red-400 text-center mt-4">تعذر تحميل معلومات المواسم.</p>';
            
                });
        }
    } catch (error) {
        console.error('Error fetching movie/series details:', error);
        detailsSection.innerHTML = `<p class="error-message text-red-400 text-center mt-10 text-lg">تعذر تحميل تفاصيل المحتوى. الرجاء المحاولة مرة أخرى لاحقًا.<br>الخطأ: ${error.message}</p>`;
    }
}

async function fetchAndDisplayQualityOptions(id) {
    showSection('quality-options-section');
    document.getElementById('quality-options-section').innerHTML = `
        <button class="back-button bg-transparent border-none text-blue-400 text-lg cursor-pointer mb-5 flex items-center gap-1 transition duration-300 hover:text-blue-500" onclick="handleGlobalBackButtonClick()">
            <span class="material-icons transform rotate-180">arrow_right_alt</span> رجوع
        </button>
        <p class="text-gray-400 text-center mt-10 text-lg flex flex-col items-center justify-center">
            <span class="material-icons animate-spin text-5xl text-blue-500 mb-2">sync</span>
           
            جاري تحميل خيارات الجودة والترجمات...
        </p>
    `;
    try {
        const [qualityResponse, videoInfoResponse] = await Promise.all([
            fetch(TRANSCODED_FILES_API + id),
            fetch(VIDEO_INFO_API + id)
        ]);
        if (!qualityResponse.ok || !videoInfoResponse.ok) {
            throw new Error(`HTTP error! status: ${qualityResponse.status || videoInfoResponse.status}`);
        }
        const qualityData = await qualityResponse.json();
        const videoInfoData = await videoInfoResponse.json();
        document.getElementById('quality-options-section').innerHTML = `
            <button class="back-button bg-transparent border-none text-blue-400 text-lg cursor-pointer mb-5 flex items-center gap-1 transition duration-300 hover:text-blue-500" onclick="handleGlobalBackButtonClick()">
                <span class="material-icons transform rotate-180">arrow_right_alt</span> رجوع
            </button>
            <h2 id="download-title" class="text-4xl text-blue-400 mb-5 text-center">الدقات المتوفرة</h2>
            
            <button id="copyTitleBtn" class="bg-gray-700 text-gray-300 py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-blue-600 hover:text-white flex items-center justify-center gap-2 w-full mb-5">
                <span class="material-icons text-xl">content_copy</span> نسخ الاسم
            </button>

            <div id="quality-list" class="quality-list flex flex-col gap-4"></div>
    
            <div id="translations-section" class="translations-info mt-6">
                <h3 class="text-2xl text-blue-400 mb-3 border-r-4 border-blue-400 pr-2">خيارات الترجمة:</h3>
                <div id="translations-list" class="flex flex-col gap-4"></div>
            </div>
        `;
        document.querySelector('#quality-options-section .back-button').onclick = handleGlobalBackButtonClick;
        
        // تعديل نص الزر ديناميكيا بناءً على نوع المحتوى
        const copyTitleBtn = document.getElementById('copyTitleBtn');
        if (copyTitleBtn) {
            if (currentContentType === 'movie') {
                copyTitleBtn.innerHTML = '<span class="material-icons text-xl">content_copy</span> نسخ اسم الفلم';
            } else if (currentContentType === 'series') {
                copyTitleBtn.innerHTML = '<span class="material-icons text-xl">content_copy</span> نسخ اسم المسلسل والحلقة';
            }
        }
        
        // ربط زر نسخ الاسم بالدالة الجديدة
        document.getElementById('copyTitleBtn').addEventListener('click', copyTitleToClipboard);
        const qualityListDiv = document.getElementById('quality-list');
        const translationsListDiv = document.getElementById('translations-list');
        if (qualityData && qualityData.length > 0) {
            qualityData.forEach(quality => {
                const qualityItem = document.createElement('div');
                qualityItem.classList.add('quality-item', 'bg-gray-700', 'p-4', 'rounded-lg', 'flex', 'justify-between', 'items-center', 'flex-wrap', 'gap-3');
                const resolutionSpan = document.createElement('span');
                resolutionSpan.classList.add('text-lg', 'text-gray-100', 
                'flex-grow');
                resolutionSpan.textContent = quality.resolution;
                qualityItem.appendChild(resolutionSpan);
                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-link-button', 'bg-green-600', 'text-white', 'rounded-md', 'py-2', 'px-3', 'text-sm', 'cursor-pointer', 'transition', 'duration-300', 'hover:bg-green-700', 'flex', 'items-center', 'gap-1', 'whitespace-nowrap');
                copyButton.innerHTML 
                = '<span class="material-icons text-base">content_copy</span> نسخ الرابط';
                copyButton.onclick = (e) => {
                    e.stopPropagation();
                    copyToClipboard(quality.videoUrl);
                };
                qualityItem.appendChild(copyButton);
                qualityListDiv.appendChild(qualityItem);
            });
        } else {
            qualityListDiv.innerHTML = '<p class="text-gray-400 text-center mt-5">عذرًا، لا تتوفر خيارات جودة لهذا المحتوى حاليًا.</p>';
        }
        renderTranslations(videoInfoData.translations, translationsListDiv);
    } catch (error) {
        console.error('Error fetching quality options or video info:', error);
        document.getElementById('quality-options-section').innerHTML = `<p class="error-message text-red-400 text-center mt-10 text-lg">تعذر تحميل خيارات الجودة أو الترجمات.<br>الخطأ: ${error.message}</p>`;
    }
}

// --- Search Functionality ---
async function performSearch(searchType = currentSearchType) {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === '') {
        currentSearchTerm = '';
        currentSearchPage = 0;
        isSearching = false;
        goBackToHome();
        return;
    }
    currentSearchTerm = searchTerm;
    currentSearchPage = 0;
    isSearching = true;
    currentSearchType = searchType;
    movieSeriesListDiv.innerHTML = `<p class="text-gray-400 text-center mt-10 text-lg flex flex-col items-center justify-center"><span class="material-icons animate-spin text-4xl text-blue-500 mb-2">sync</span> جاري البحث عن "${searchTerm}" (${searchType === 'movies' ? 'أفلام' : searchType === 'series' ? 'مسلسلات' : 'الكل'})...</p>`;
    showSection('movie-series-list');
    filterButtonsContainer.classList.remove('hidden');
    try {
        let apiUrl = `${SEARCH_API_BASE}${encodeURIComponent(searchTerm)}%20&year=1900,2025&page=${currentSearchPage}&level=0`;
        if (searchType === 'movies') {
            apiUrl += '&type=movies';
        } else if (searchType === 'series') {
            apiUrl += '&type=series';
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const searchResults = await response.json();
        renderSearchResults(searchResults, searchTerm, currentSearchPage, searchResults.length === 12);
        pushToStack('movie-series-list', { isSearch: true, searchTerm: searchTerm, currentPage: currentSearchPage, content: searchResults, hasMore: searchResults.length === 12, searchType: currentSearchType });
    } catch (error) {
        console.error('Error fetching search results:', error);
        movieSeriesListDiv.innerHTML = `<p class="error-message text-red-400 text-center mt-10 text-lg">تعذر تحميل نتائج البحث. الرجاء المحاولة مرة أخرى.<br>الخطأ: ${error.message}</p>`;
    }
}
function renderSearchResults(results, searchTerm, currentPage, hasMore) {
    movieSeriesListDiv.innerHTML = '';
    const searchSectionDiv = document.createElement('div');
    searchSectionDiv.classList.add('movie-series-section', 'mb-10');
    const title = document.createElement('h2');
    title.classList.add('section-title', 'text-2xl', 'text-gray-100', 'mb-5', 'text-right', 'pr-2', 'border-r-4', 'border-blue-400');
    title.textContent = `نتائج البحث عن: "${searchTerm}" (${currentSearchType === 'movies' ? 'أفلام' : currentSearchType === 'series' ? 'مسلسلات' : 'الكل'})`;
    searchSectionDiv.appendChild(title);
    const gridDiv = document.createElement('div');
    gridDiv.classList.add('movie-series-grid', 'grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-4', 'pb-4', 'justify-start');
    if (results && results.length > 0) {
        results.forEach(item => {
            const movieCard = createMovieCard(item);
            gridDiv.appendChild(movieCard);
        });
        if (hasMore) {
            const loadMoreCard = createLoadMoreCard(searchTerm, currentPage + 1, 'search', searchTerm, '', '', currentSearchType);
            gridDiv.appendChild(loadMoreCard);
        }
    } else {
        gridDiv.innerHTML = '<p class="text-gray-400 text-center w-full text-lg">لا توجد نتائج مطابقة لبحثك.</p>';
    }
    searchSectionDiv.appendChild(gridDiv);
    movieSeriesListDiv.appendChild(searchSectionDiv);
    setActiveFilterButton(currentSearchType);
}

function goBackToHome() {
    isSearching = false;
    currentSearchTerm = '';
    currentSearchPage = 0;
    currentSearchType = 'all';
    showSection('movie-series-list');
    renderMovieSeriesGroups(allGroupsData);
    searchInput.value = '';
    filterButtonsContainer.classList.add('hidden');
}

function showFavorites() {
    showSection('favorites-section');
    favoritesListDiv.innerHTML = '';
    const favorites = loadFavorites();
    if (favorites.length === 0) {
        favoritesListDiv.innerHTML = '<p class="text-gray-400 text-center w-full text-lg">لا توجد عناصر في قائمتك المفضلة حتى الآن.</p>';
        return;
    }
    favorites.forEach(item => {
        const movieCard = createMovieCard(item);
        favoritesListDiv.appendChild(movieCard);
    });
}

// ---------------- مستمعو الأحداث (Event Listeners) ----------------

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderGroups();
    filterButtonsContainer.classList.add('hidden');
    categoryFilterButtonsContainer.classList.add('hidden');

    // --- Search
    searchButton.addEventListener('click', () => {
        performSearch();
    });
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // --- Bottom Nav
    
    homeNav.addEventListener('click', (e) => {
        e.preventDefault();
        navigationStack.length = 0;
        goBackToHome();
    });
    searchNav.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('movie-series-list');
        searchInput.focus();
        if (searchInput.value.trim() !== '') {
            performSearch(currentSearchType);
           
            filterButtonsContainer.classList.remove('hidden');
        } else if (isSearching) {
            goBackToHome();
        }
    });
    categoriesNav.addEventListener('click', (e) => {
        e.preventDefault();
        fetchAndRenderCategories();
    });
    favoritesNav.addEventListener('click', (e) => {
        e.preventDefault();
        showFavorites();
        pushToStack('favorites-section');
    });
    // --- Search Filters
    filterMoviesBtn.addEventListener('click', () => {
        setActiveFilterButton('movies');
        if (isSearching && searchInput.value.trim() !== '') {
            performSearch('movies');
        }
    });
    filterSeriesBtn.addEventListener('click', () => {
        setActiveFilterButton('series');
        if (isSearching && searchInput.value.trim() !== '') {
            performSearch('series');
        }
    });
    // --- Category Filters
    categoryFilterMoviesBtn.addEventListener('click', () => {
        currentCategoryFilter = 'movies';
        if (currentCategoryContent.id) {
            fetchAndDisplayCategoryContent(currentCategoryContent.id, currentCategoryContent.title, 0, currentCategoryFilter);
            pushToStack('category-content-section', {
                categoryId: currentCategoryContent.id,
                categoryTitle: currentCategoryContent.title,
        
                videoKind: currentCategoryFilter
            });
        }
    });
    categoryFilterSeriesBtn.addEventListener('click', () => {
        currentCategoryFilter = 'series';
        if (currentCategoryContent.id) {
            fetchAndDisplayCategoryContent(currentCategoryContent.id, currentCategoryContent.title, 0, currentCategoryFilter);
            pushToStack('category-content-section', {
                categoryId: currentCategoryContent.id,
                categoryTitle: currentCategoryContent.title,
               
                videoKind: currentCategoryFilter
            });
        }
    });
    // --- Browser Back Button
    window.addEventListener('popstate', (event) => {
        popFromStack();
    });
});
