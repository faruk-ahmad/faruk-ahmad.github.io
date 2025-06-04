// Sidebar & Main Content
const sidebar = document.getElementById('sidebar');
const eventsContainer = document.getElementById('events-container');
const loader = document.getElementById('loader');
const breadcrumb = document.getElementById('breadcrumb');
const fullLoader = document.getElementById('full-loader');

// Modal
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalDescription = document.getElementById('modal-description');
const modalTags = document.getElementById('modal-tags');
const modalSource = document.getElementById('modal-source');
const closeModalButton = document.getElementById('close-modal');

// Navigation
const navMenu = document.getElementById('nav-menu');
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelectorAll('.nav-link');

// GitHub Repo Settings
const repoOwner = "faruk-ahmad"; 
const repoName = "ttm";          
const listingsPath = "data/listings";
const githubApiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

const cache = {};
const timelineData = {};

// Track Selected Date
let currentYear = '';
let currentMonth = '';
let currentDay = '';

// Initialize Timeline
async function initTimeline() {
    showFullLoader();
    try {
        const listings = await fetchListings();
        organizeTimelineData(listings);
        await renderSidebar();
        autoLoadLatest(); // Important change
    } catch (error) {
        console.error('Initialization failed:', error);
    }
    hideFullLoader();
}

// Fetch Listings from GitHub
async function fetchListings() {
    const response = await fetch(`${githubApiBase}${listingsPath}`);
    if (!response.ok) {
        throw new Error(`GitHub API error! status: ${response.status}`);
    }
    const files = await response.json();
    const listingFiles = files.filter(f => f.name.endsWith('.json'));
    const listings = [];

    for (const file of listingFiles) {
        const url = file.download_url;
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`Failed to fetch listing ${url}`);
            continue;
        }
        const data = await res.json();
        listings.push({ name: file.name.replace('.json', ''), data });
    }

    return listings;
}

// Organize Timeline Data
function organizeTimelineData(listings) {
    for (const listing of listings) {
        const [year, month] = listing.name.split('-');
        if (!timelineData[year]) timelineData[year] = {};
        if (!timelineData[year][month]) timelineData[year][month] = {};

        for (const dayInfo of listing.data) {
            const day = dayInfo.date.split('-')[2];
            timelineData[year][month][day] = dayInfo.url;
        }
    }
}

// Render Sidebar
async function renderSidebar() {
    sidebar.innerHTML = '';
    const ul = document.createElement('ul');

    for (const year of Object.keys(timelineData).sort((a, b) => b.localeCompare(a))) {
        const yearLi = createListItem(year, true);
        yearLi.classList.add('year-item');
        yearLi.addEventListener('click', (e) => handleYearClick(e, yearLi, year));
        ul.appendChild(yearLi);
    }

    sidebar.appendChild(ul);
}

// Auto-load latest content
function autoLoadLatest() {
    const years = Object.keys(timelineData).sort((a, b) => b - a);
    if (years.length === 0) return;
    const latestYear = years[0];

    const months = Object.keys(timelineData[latestYear]).sort((a, b) => b - a);
    if (months.length === 0) return;
    const latestMonth = months[0];

    const days = Object.keys(timelineData[latestYear][latestMonth]).sort((a, b) => b - a);
    if (days.length === 0) return;
    const latestDay = days[0];

    // Open Year
    const yearLi = [...sidebar.querySelectorAll('li')].find(li => li.textContent.trim().startsWith(latestYear));
    if (!yearLi) return;
    yearLi.click();

    // Wait a little for Month <ul> to render
    setTimeout(() => {
        const monthLi = [...yearLi.querySelectorAll('li')].find(li => li.textContent.trim().startsWith(latestMonth));
        if (!monthLi) return;
        monthLi.click();

        // Wait a little for Day <ul> to render
        setTimeout(() => {
            const dayLi = [...monthLi.querySelectorAll('li')].find(li => li.textContent.trim().startsWith(latestDay));
            if (dayLi) {
                dayLi.click(); // Click to load the latest day's events
            }
        }, 300);
    }, 300);
}

function createListItem(text, withIcon = true) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        ${withIcon ? `<span class="material-icons">chevron_right</span>` : ''}
    `;
    return li;
}

function handleYearClick(event, yearLi, year) {
    event.stopPropagation();
    collapseAll(yearLi);

    if (yearLi.classList.contains('expanded')) {
        yearLi.classList.remove('expanded');
        const existingUl = yearLi.querySelector('ul');
        if (existingUl) existingUl.remove();
        return;
    }

    yearLi.classList.add('expanded');
    const monthsUl = document.createElement('ul');

    for (const month of Object.keys(timelineData[year]).sort()) {
        const monthLi = createListItem(month, true);
        monthLi.addEventListener('click', (e) => handleMonthClick(e, monthLi, year, month));
        monthsUl.appendChild(monthLi);
    }

    yearLi.appendChild(monthsUl);
}

function handleMonthClick(event, monthLi, year, month) {
    event.stopPropagation();
    collapseSiblings(monthLi);

    if (monthLi.classList.contains('expanded')) {
        monthLi.classList.remove('expanded');
        const existingUl = monthLi.querySelector('ul');
        if (existingUl) existingUl.remove();
        return;
    }

    monthLi.classList.add('expanded');
    const daysUl = document.createElement('ul');

    for (const day of Object.keys(timelineData[year][month]).sort()) {
        const dayLi = createListItem(day, false);
        dayLi.addEventListener('click', (e) => handleDayClick(e, year, month, day));
        daysUl.appendChild(dayLi);
    }

    monthLi.appendChild(daysUl);
}

function collapseAll(current) {
    document.querySelectorAll('.year-item.expanded').forEach(item => {
        if (item !== current) {
            item.classList.remove('expanded');
            const ul = item.querySelector('ul');
            if (ul) ul.remove();
        }
    });
}

function collapseSiblings(current) {
    const siblings = Array.from(current.parentNode.children).filter(child => child !== current);
    siblings.forEach(sib => {
        sib.classList.remove('expanded');
        const ul = sib.querySelector('ul');
        if (ul) ul.remove();
    });
}

// Handle Day Click
async function handleDayClick(event, year, month, day) {
    event.stopPropagation();
    document.querySelectorAll('.sidebar li.active').forEach(li => li.classList.remove('active'));

    const targetLi = event.currentTarget;
    if (targetLi.tagName === 'LI') {
        targetLi.classList.add('active');
    }

    currentYear = year;
    currentMonth = month;
    currentDay = day;

    const url = timelineData[year][month][day];

    showLoader();
    try {
        const events = await fetchEventsFromUrl(url);
        updateBreadcrumb(year, month, day);
        renderEvents(events);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Failed to load events:', error);
    }
    hideLoader();
}

function updateBreadcrumb(year, month, day) {
    breadcrumb.textContent = `${year} / ${month} / ${day}`;
}

async function fetchEventsFromUrl(url) {
    if (cache[url]) {
        return cache[url];
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    cache[url] = data.events;
    return data.events;
}

function renderEvents(events) {
    eventsContainer.innerHTML = events.map((event, index) => {
        const shortDescription = truncateText(event.description, 20);
        return `
            <div class="event-card">
                <div class="event-title">${event.title}</div>
                <div class="event-description">
                    ${shortDescription}
                    <button class="more-button" data-index="${index}">More</button>
                </div>
                <div class="event-tags">
                    ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.more-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            openModal(events[index], currentYear, currentMonth, currentDay);
        });
    });
}

function truncateText(text, wordLimit) {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
}

// Open Modal
function openModal(event, year, month, day) {
    modalTitle.textContent = event.title;
    const fullDate = `${year}-${month}-${day}`;
    modalDate.innerHTML = `🕒 ${event.time || 'Unknown Time'} | 📅 ${fullDate}`;

    modalDescription.textContent = event.description;

    modalTags.innerHTML = '';
    if (event.tags && event.tags.length > 0) {
        event.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'modal-tag';
            tagSpan.textContent = tag;
            modalTags.appendChild(tagSpan);
        });
    }

    if (event.source) {
        modalSource.href = event.source;
        modalSource.textContent = '🔗 Source';
        modalSource.style.display = 'inline-block';
    } else {
        modalSource.style.display = 'none';
    }

    modal.style.display = 'block';
}

closeModalButton.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function showLoader() {
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showFullLoader() {
    fullLoader.style.display = 'flex';
}

function hideFullLoader() {
    fullLoader.style.display = 'none';
}

// Hamburger Menu Toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
});

// Active Link Highlight (Detect Current Page)
function highlightActiveLink() {
    const path = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');
        navMenu.classList.remove('open');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    initTimeline();
    highlightActiveLink();
});
