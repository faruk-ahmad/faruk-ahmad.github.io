/*
 * Main JavaScript for Faruk's personal website
 *
 * This script dynamically loads content from JSON files located under
 * the `sections` directory and populates the corresponding sections on
 * the page. It also handles navigation state, fade‑in animations, the
 * scroll‑to‑top button and a simple IntersectionObserver for lazy reveal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Insert current year into footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Initialize all dynamic loaders
  loadINdMe();
  loadAbout();
  loadExperience();
  loadEducation();
  loadProjects();
  loadPublications();
  loadTalks();
  loadSkills();
  loadLanguages();
  loadContact();
  loadCollaborations();

  // Load optional floating widgets for the Me section. These widgets are
  // defined in sections/widgets/widgets.json and will only render if
  // that file exists and contains valid data.
  loadWidgets();

  // Load any announcement modal if configured. This call checks
  // sections/announcement/announcement.json for a flag and only displays
  // the modal on the first page load within the tab.
  loadAnnouncement();

  // Setup nav highlighting and scroll behaviours
  setupNavLinks();
  setupFadeInSections();
  setupScrollTopButton();
  setupNavToggle();
});

// Utility to fetch JSON with error handling
async function fetchJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} – ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Error loading ${path}:`, err);
    return null;
  }
}

// Load "Me" (formerly hero) content
async function loadINdMe() {
  const data = await fetchJSON('sections/i_nd_me/i_nd_me.json');
  if (!data) return;
  const container = document.getElementById('i_nd_me-content');
  container.innerHTML = '';
  // Profile image
  if (data.image) {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = data.name || 'Profile picture';
    // Enable lazy loading for the profile image
    img.loading = 'lazy';
    container.appendChild(img);
  }
  // Name
  if (data.name) {
    const h1 = document.createElement('h1');
    h1.textContent = data.name;
    container.appendChild(h1);
  }
  // Tagline
  if (data.tagline) {
    const h2 = document.createElement('h2');
    h2.className = 'tagline';
    h2.textContent = data.tagline;
    container.appendChild(h2);
  }
  // Subtitle / description
  if (data.subtitle) {
    const h3 = document.createElement('h3');
    h3.textContent = data.subtitle;
    container.appendChild(h3);
  }
  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    container.appendChild(p);
  }
  // Buttons for the "Me" section
  if (Array.isArray(data.buttons)) {
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'i_nd_me-buttons';
    data.buttons.forEach(btn => {
      const a = document.createElement('a');
      a.href = btn.href;
      a.textContent = btn.label;
      a.target = btn.newTab ? '_blank' : '';
      btnWrapper.appendChild(a);
    });
    container.appendChild(btnWrapper);
  }
}

// Load about section
async function loadAbout() {
  const data = await fetchJSON('sections/about/about.json');
  if (!data) return;
  const container = document.getElementById('about-content');
  container.innerHTML = '';
  // Summary paragraph with keyword highlighting
  if (data.summary) {
    const summary = document.createElement('p');
    summary.className = 'about-summary';
    let summaryHTML = data.summary;
    // If keywords are provided, wrap each occurrence in a highlight span
    if (Array.isArray(data.keywords)) {
      data.keywords.forEach(word => {
        if (!word) return;
        // Escape regex special characters in the keyword
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        summaryHTML = summaryHTML.replace(regex, '<span class="about-highlight">$1</span>');
      });
    }
    summary.innerHTML = summaryHTML;
    // Set layout styles via class, leaving room for CSS to fine‑tune typography
    summary.style.maxWidth = '800px';
    summary.style.margin = '0 auto 40px';
    // Use text‑justify alignment instead of centre
    summary.style.textAlign = 'justify';
    container.appendChild(summary);
  }
  // Stats cards (years of experience, projects, publications, talks)
  if (data.stats) {
    const statsWrapper = document.createElement('div');
    statsWrapper.className = 'about-stats';
    Object.keys(data.stats).forEach(key => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      const value = document.createElement('span');
      value.className = 'stat-value';
      // Insert the numeric value
      value.textContent = data.stats[key];
      // Append a small plus sign to indicate "and more"; the styling
      // for this plus sign is defined in CSS via the .stat-plus class.
      const plus = document.createElement('span');
      plus.className = 'stat-plus';
      plus.textContent = '+';
      value.appendChild(plus);
      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = key;
      card.appendChild(value);
      card.appendChild(label);
      statsWrapper.appendChild(card);
    });
    container.appendChild(statsWrapper);
  }
  // Keywords / tags
  if (Array.isArray(data.keywords) && data.keywords.length) {
    const keywordsWrapper = document.createElement('div');
    keywordsWrapper.className = 'about-keywords';
    data.keywords.forEach(word => {
      const span = document.createElement('span');
      span.className = 'about-keyword';
      span.textContent = word;
      keywordsWrapper.appendChild(span);
    });
    container.appendChild(keywordsWrapper);
  }
}

// Render timeline items; reuse for experience and education
function renderTimelineItems(data, containerId, options = {}) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  // Create timeline wrapper
  const timeline = document.createElement('div');
  timeline.className = 'timeline';
  container.appendChild(timeline);
  if (!Array.isArray(data)) return;
  data.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'timeline-item';
    // Marker (for experience only)
    if (!options.noMarker) {
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      itemEl.appendChild(marker);
    }
    // Card
    const card = document.createElement('div');
    card.className = 'timeline-card';
    // Logo if provided
    if (item.logo) {
      const logoImg = document.createElement('img');
      logoImg.className = 'timeline-logo';
      logoImg.src = item.logo;
      logoImg.alt = (item.company || item.institution || item.title || item.degree || '') + ' logo';
      // Lazy load timeline logos
      logoImg.loading = 'lazy';
      card.appendChild(logoImg);
    }
    // Header row: title / role and period
    const header = document.createElement('div');
    header.className = 'timeline-header';
    const title = document.createElement('h3');
    title.className = 'timeline-title';
    title.textContent = item.title || item.degree || '';
    header.appendChild(title);
    const period = document.createElement('span');
    period.className = 'timeline-period';
    period.textContent = item.period || '';
    header.appendChild(period);
    card.appendChild(header);
    // Company/institution row
    if (item.company || item.institution) {
      const comp = document.createElement('p');
      comp.className = 'timeline-company';
      comp.textContent = [item.company || item.institution, item.location].filter(Boolean).join(', ');
      card.appendChild(comp);
    }
    // If a structured sections object exists, render each section accordingly.
    if (item.sections && typeof item.sections === 'object') {
      Object.keys(item.sections).forEach(sectionKey => {
        const values = item.sections[sectionKey];
        if (!Array.isArray(values) || !values.length) return;
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'timeline-section';
        // Section title
        const heading = document.createElement('p');
        heading.className = 'timeline-section-title';
        heading.textContent = sectionKey;
        sectionWrapper.appendChild(heading);
        const lowerKey = sectionKey.toLowerCase();
        if (lowerKey.includes('description')) {
          // Render as bullet list
          const ul = document.createElement('ul');
          ul.className = 'timeline-description';
          values.forEach(val => {
            const li = document.createElement('li');
            li.textContent = val;
            ul.appendChild(li);
          });
          sectionWrapper.appendChild(ul);
        } else {
          // Render as tag pills
          const tagsWrapper = document.createElement('div');
          tagsWrapper.className = 'timeline-tags';
          values.forEach(val => {
            const span = document.createElement('span');
            let tagClass = 'timeline-tag';
            if (lowerKey.includes('contribution')) {
              tagClass += ' tag-contribution';
            } else if (lowerKey.includes('highlight')) {
              tagClass += ' tag-highlight';
            }
            span.className = tagClass;
            span.textContent = val;
            tagsWrapper.appendChild(span);
          });
          sectionWrapper.appendChild(tagsWrapper);
        }
        card.appendChild(sectionWrapper);
      });
    } else {
      // Fallback: render description list if provided
      if (Array.isArray(item.description) && item.description.length) {
        const ul = document.createElement('ul');
        ul.className = 'timeline-description';
        item.description.forEach(descItem => {
          const li = document.createElement('li');
          // Support objects with key and value for education description entries.
          if (descItem && typeof descItem === 'object' && ('key' in descItem)) {
            const strong = document.createElement('strong');
            strong.textContent = descItem.key + ':';
            li.appendChild(strong);
            const span = document.createElement('span');
            span.textContent = ' ' + (descItem.value || '');
            li.appendChild(span);
          } else {
            li.textContent = descItem;
          }
          ul.appendChild(li);
        });
        card.appendChild(ul);
      }
    }
    // Links (key-value) if provided
    if (item.links && typeof item.links === 'object') {
      const linksWrapper = document.createElement('div');
      linksWrapper.className = 'timeline-links';
      Object.keys(item.links).forEach(linkKey => {
        const linkValue = item.links[linkKey];
        if (!linkValue) return;
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = linkKey + ':';
        p.appendChild(strong);
        const space = document.createTextNode(' ');
        p.appendChild(space);
        const a = document.createElement('a');
        a.href = linkValue;
        a.textContent = linkValue;
        a.target = '_blank';
        p.appendChild(a);
        linksWrapper.appendChild(p);
      });
      card.appendChild(linksWrapper);
    }
    // Awards
    if (Array.isArray(item.awards) && item.awards.length) {
      const awardsWrapper = document.createElement('div');
      awardsWrapper.className = 'timeline-awards';
      item.awards.forEach(award => {
        const span = document.createElement('span');
        span.textContent = award;
        awardsWrapper.appendChild(span);
      });
      card.appendChild(awardsWrapper);
    }
    itemEl.appendChild(card);
    timeline.appendChild(itemEl);
  });
}

// Load experience timeline
async function loadExperience() {
  const data = await fetchJSON('sections/experience/experience.json');
  if (!data) return;
  renderTimelineItems(data, 'experience-content');
}

// Load education timeline (no markers)
async function loadEducation() {
  const data = await fetchJSON('sections/education/education.json');
  if (!data) return;
  renderTimelineItems(data, 'education-content', { noMarker: true });
}

// Helper to create a project card element; used by both industry and open source projects
function createProjectCard(item) {
  const card = document.createElement('div');
  card.className = 'project-card';
  // Assign keywords to the dataset for filtering; support both `keywords` and legacy `tags` properties
  if (Array.isArray(item.keywords)) {
    card.dataset.keywords = item.keywords.join(',');
  } else if (Array.isArray(item.tags)) {
    card.dataset.keywords = item.tags.join(',');
  }
  // Image
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    // Lazy load project images
    img.loading = 'lazy';
    card.appendChild(img);
  }
  // Content wrapper
  const content = document.createElement('div');
  content.className = 'project-content';
  const h3 = document.createElement('h3');
  h3.textContent = item.title;
  content.appendChild(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    content.appendChild(p);
  }
  // Display keywords/tags as tags below description, if available
  const tags = Array.isArray(item.keywords) ? item.keywords : Array.isArray(item.tags) ? item.tags : [];
  if (tags.length) {
    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'tags';
    tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagsWrapper.appendChild(span);
    });
    content.appendChild(tagsWrapper);
  }
  // Links
  if (item.links) {
    const linksWrapper = document.createElement('div');
    linksWrapper.className = 'project-links';
    Object.keys(item.links).forEach(key => {
      const a = document.createElement('a');
      a.href = item.links[key];
      a.textContent = formatLinkLabel(key);
      a.target = '_blank';
      linksWrapper.appendChild(a);
    });
    content.appendChild(linksWrapper);
  }
  card.appendChild(content);
  return card;
}

// Load projects split into industry and open source subsections with filtering on keywords for open source
async function loadProjects() {
  const industryData = await fetchJSON('sections/projects/industry.json');
  const osData = await fetchJSON('sections/projects/opensource.json');
  const container = document.getElementById('projects-content');
  container.innerHTML = '';
  // Industry subsection
  if (industryData && Array.isArray(industryData.items)) {
    const industrySection = document.createElement('div');
    industrySection.className = 'project-subsection';
    const industryHeader = document.createElement('h3');
    industryHeader.className = 'project-subheading';
    industryHeader.textContent = 'Industry Experience Highlights';
    industrySection.appendChild(industryHeader);
    const industryGrid = document.createElement('div');
    industryGrid.className = 'projects-grid';
    industryData.items.forEach(item => {
      // Create a card for each industry project and mark it with the
      // appropriate class. No category label is added because the
      // subsection heading already conveys the category.
      const card = createProjectCard(item);
      card.classList.add('industry');
      industryGrid.appendChild(card);
    });
    industrySection.appendChild(industryGrid);
    container.appendChild(industrySection);
  }
  // Open source subsection
  if (osData && Array.isArray(osData.items)) {
    const osSection = document.createElement('div');
    osSection.className = 'project-subsection';
    const osHeader = document.createElement('h3');
    osHeader.className = 'project-subheading';
    osHeader.textContent = 'Open Source & Public Projects';
    osSection.appendChild(osHeader);
    // Build filter controls
    const filterWrapper = document.createElement('div');
    filterWrapper.className = 'project-filter';
    // Gather unique keywords
    const keywordSet = new Set();
    osData.items.forEach(item => {
      const kws = Array.isArray(item.keywords) ? item.keywords : Array.isArray(item.tags) ? item.tags : [];
      kws.forEach(kw => keywordSet.add(kw));
    });
    const keywords = Array.from(keywordSet).sort((a, b) => a.localeCompare(b));
    // 'All' button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-button active';
    allBtn.textContent = 'All';
    allBtn.dataset.filter = '';
    filterWrapper.appendChild(allBtn);
    keywords.forEach(kw => {
      const btn = document.createElement('button');
      btn.className = 'filter-button';
      btn.textContent = kw;
      btn.dataset.filter = kw;
      filterWrapper.appendChild(btn);
    });
    osSection.appendChild(filterWrapper);
    // Grid
    const osGrid = document.createElement('div');
    osGrid.className = 'projects-grid';
    osGrid.id = 'open-projects-grid';
    osData.items.forEach(item => {
      // Create a card for each open source project and mark it with the
      // appropriate class. No category label is added because the
      // subsection heading already conveys the category.
      const card = createProjectCard(item);
      card.classList.add('opensource');
      osGrid.appendChild(card);
    });
    osSection.appendChild(osGrid);
    container.appendChild(osSection);
    // Add filter behaviour
    filterWrapper.addEventListener('click', event => {
      const target = event.target;
      if (target.tagName.toLowerCase() !== 'button') return;
      const selected = target.dataset.filter;
      // Update active class
      filterWrapper.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');
      // Filter cards
      osGrid.querySelectorAll('.project-card').forEach(card => {
        const itemKeywords = card.dataset.keywords ? card.dataset.keywords.split(',') : [];
        if (!selected || itemKeywords.includes(selected)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

// Format link keys to nicer labels
function formatLinkLabel(key) {
  const map = {
    demo: 'Demo',
    website: 'Website',
    repo: 'Code',
    github: 'GitHub',
    paper: 'Paper',
    pdf: 'PDF',
    doi: 'DOI',
    slides: 'Slides',
    video: 'Video'
  };
  return map[key] || key;
}

// Construct a publication card element following a prescribed structure:
// 1. A coloured rounded label indicating the type (e.g., Conference, Preprint, Thesis).
// 2. The title of the publication.
// 3. A DOI row, if provided, with the DOI value as a clickable link.
// 4. A row of buttons for available links (PDF, Slides, Video, Repo, Website, etc.).
// 5. A featured image representing the publication.
// 6. A short description.
// The returned card has a class of `publication-card` for styling.
function createPublicationCard(item) {
  const card = document.createElement('div');
  card.className = 'publication-card';
  // Label
  if (item.type) {
    const label = document.createElement('span');
    const typeClass = item.type.toLowerCase().replace(/\s+/g, '-');
    label.className = `item-label publication-label label-${typeClass}`;
    label.textContent = item.type;
    card.appendChild(label);
  }
  // Title
  const titleEl = document.createElement('h3');
  titleEl.className = 'publication-title';
  titleEl.textContent = item.title || '';
  card.appendChild(titleEl);
  // DOI
  if (item.links && item.links.doi) {
    const doiDiv = document.createElement('div');
    doiDiv.className = 'publication-doi';
    const doiLabel = document.createElement('span');
    doiLabel.className = 'doi-label';
    doiLabel.textContent = 'DOI: ';
    doiDiv.appendChild(doiLabel);
    const doiLink = document.createElement('a');
    doiLink.href = item.links.doi;
    doiLink.target = '_blank';
    doiLink.rel = 'noopener noreferrer';
    doiLink.textContent = item.links.doi;
    doiDiv.appendChild(doiLink);
    // card.appendChild(doiDiv); // enable this if wants to show DOI: link in this format after title
  }
  // Buttons (links). Order specific keys first, then any additional ones.
  if (item.links) {
    const linkOrder = ['pdf', 'slides', 'video', 'repo', 'website', 'paper', 'details'];
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'item-buttons';
    linkOrder.forEach(key => {
      if (item.links[key]) {
        const btn = document.createElement('a');
        btn.href = item.links[key];
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.textContent = formatLinkLabel(key);
        btn.className = `btn publication-btn btn-${key}`;
        buttonsWrapper.appendChild(btn);
      }
    });
    Object.keys(item.links).forEach(key => {
      if (!linkOrder.includes(key)) {
        const btn = document.createElement('a');
        btn.href = item.links[key];
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.textContent = formatLinkLabel(key);
        btn.className = `btn publication-btn btn-${key}`;
        buttonsWrapper.appendChild(btn);
      }
    });
    if (buttonsWrapper.children.length) {
      card.appendChild(buttonsWrapper);
    }
  }
  // Image
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.className = 'publication-image';
    // Lazy load publication images
    img.loading = 'lazy';
    card.appendChild(img);
  }
  // Description
  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'publication-description';
    desc.textContent = item.description;
    card.appendChild(desc);
  }
  return card;
}

// Construct a talk card element following a similar structure to publications:
// 1. A coloured rounded label indicating the talk type (e.g., Guest Speaker, Lecture).
// 2. The title of the talk.
// 3. A row of buttons for available links (PDF, Slides, Video, Repo, Website).
// 4. A featured image.
// 5. A description.
function createTalkCard(item) {
  const card = document.createElement('div');
  card.className = 'talk-card';
  // Label
  if (item.type) {
    const label = document.createElement('span');
    const typeClass = item.type.toLowerCase().replace(/\s+/g, '-');
    label.className = `item-label talk-label label-${typeClass}`;
    label.textContent = item.type;
    card.appendChild(label);
  }
  // Title
  const titleEl = document.createElement('h3');
  titleEl.className = 'talk-title';
  titleEl.textContent = item.title || '';
  card.appendChild(titleEl);
  // Links (buttons)
  if (item.links) {
    const linkOrder = ['pdf', 'slides', 'video', 'website', 'repo'];
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'item-buttons';
    linkOrder.forEach(key => {
      if (item.links[key]) {
        const btn = document.createElement('a');
        btn.href = item.links[key];
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.textContent = formatLinkLabel(key);
        btn.className = `btn talk-btn btn-${key}`;
        buttonsWrapper.appendChild(btn);
      }
    });
    Object.keys(item.links).forEach(key => {
      if (!linkOrder.includes(key)) {
        const btn = document.createElement('a');
        btn.href = item.links[key];
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.textContent = formatLinkLabel(key);
        btn.className = `btn talk-btn btn-${key}`;
        buttonsWrapper.appendChild(btn);
      }
    });
    if (buttonsWrapper.children.length) {
      card.appendChild(buttonsWrapper);
    }
  }
  // Image
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.className = 'talk-image';
    // Lazy load talk images
    img.loading = 'lazy';
    card.appendChild(img);
  }
  // Description
  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'talk-description';
    desc.textContent = item.description;
    card.appendChild(desc);
  }
  return card;
}

// Load publications / research
async function loadPublications() {
  const data = await fetchJSON('sections/publications/publications.json');
  if (!data || !Array.isArray(data.items)) return;
  const container = document.getElementById('publications-content');
  container.innerHTML = '';
  // Optional subtitle/description for the research section
  if (data.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = data.subtitle;
    subtitleEl.style.textAlign = 'center';
    subtitleEl.style.maxWidth = '700px';
    subtitleEl.style.margin = '0 auto 16px';
    subtitleEl.style.color = getComputedStyle(document.documentElement).getPropertyValue('--muted-color');
    container.appendChild(subtitleEl);
  }
  // Optional links (e.g. research blog) for the research section
  if (data.links && typeof data.links === 'object') {
    const linksWrapper = document.createElement('div');
    linksWrapper.className = 'research-links';
    Object.keys(data.links).forEach(key => {
      const url = data.links[key];
      if (!url) return;
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = key + ':';
      p.appendChild(strong);
      const space = document.createTextNode(' ');
      p.appendChild(space);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = url;
      p.appendChild(a);
      linksWrapper.appendChild(p);
    });
    // Center align links wrapper and add some spacing
    linksWrapper.style.textAlign = 'center';
    linksWrapper.style.marginBottom = '24px';
    container.appendChild(linksWrapper);
  }
  data.items.forEach(item => {
    const card = createPublicationCard(item);
    container.appendChild(card);
  });
}

// Load talks
async function loadTalks() {
  const data = await fetchJSON('sections/talks/talks.json');
  if (!data || !Array.isArray(data.items)) return;
  const container = document.getElementById('talks-content');
  container.innerHTML = '';
  data.items.forEach(item => {
    const card = createTalkCard(item);
    container.appendChild(card);
  });
}

// Load skills
async function loadSkills() {
  const data = await fetchJSON('sections/skills/skills.json');
  if (!data) return;
  const container = document.getElementById('skills-content');
  container.innerHTML = '';
  // If skills array provided, use card format
  if (Array.isArray(data.skills)) {
    const grid = document.createElement('div');
    grid.className = 'skills-grid';
    data.skills.forEach(skill => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      // Icon: if an icon is provided, use it; otherwise use first letter
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'skill-icon';
      if (skill.icon) {
        // If the icon property appears to be a Font Awesome class (starts with 'fa'),
        // insert an <i> element with that class. Otherwise treat it as an emoji or
        // plain text and set it directly.
        const isFA = /^fa[sbr]? /.test(skill.icon) || skill.icon.startsWith('fa-');
        if (isFA) {
          const iEl = document.createElement('i');
          iEl.className = skill.icon;
          iconWrapper.appendChild(iEl);
        } else {
          iconWrapper.textContent = skill.icon;
        }
      } else if (skill.title) {
        iconWrapper.textContent = skill.title.charAt(0);
      }
      card.appendChild(iconWrapper);
      // Title
      const title = document.createElement('div');
      title.className = 'skill-title';
      title.textContent = skill.title;
      card.appendChild(title);
      // Keywords
      if (Array.isArray(skill.keywords)) {
        const kwWrapper = document.createElement('div');
        kwWrapper.className = 'skill-keywords';
        skill.keywords.forEach(kw => {
          const span = document.createElement('span');
          span.className = 'skill-keyword';
          span.textContent = kw;
          kwWrapper.appendChild(span);
        });
        card.appendChild(kwWrapper);
      }
      // Level
      if (skill.level) {
        const level = document.createElement('div');
        // Assign base class plus a modifier based on the level value (lowercased)
        const levelSlug = skill.level.toLowerCase().replace(/\s+/g, '-');
        level.className = `skill-level level-${levelSlug}`;
        level.textContent = skill.level;
        card.appendChild(level);
      }
      // Link
      if (skill.link) {
        const link = document.createElement('div');
        link.className = 'skill-link';
        const a = document.createElement('a');
        a.href = skill.link;
        a.textContent = 'Learn more';
        a.target = '_blank';
        link.appendChild(a);
        card.appendChild(link);
      }
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }
}

// Load languages proficiency
async function loadLanguages() {
  const data = await fetchJSON('sections/languages/languages.json');
  if (!data || !Array.isArray(data.languages)) return;
  const container = document.getElementById('languages-content');
  container.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'languages-list';
  data.languages.forEach(lang => {
    const item = document.createElement('div');
    item.className = 'language-item';
    const name = document.createElement('div');
    name.className = 'language-name';
    name.textContent = lang.name;
    item.appendChild(name);
    const barWrapper = document.createElement('div');
    barWrapper.className = 'language-bar-wrapper';
    const bar = document.createElement('div');
    bar.className = 'language-bar';
    bar.style.width = `${Math.min(Math.max(lang.proficiency, 0), 1) * 100}%`;
    barWrapper.appendChild(bar);
    item.appendChild(barWrapper);
    const level = document.createElement('div');
    level.className = 'language-level';
    level.textContent = lang.level;
    item.appendChild(level);
    list.appendChild(item);
  });
  container.appendChild(list);
}

// Load collaborations
async function loadCollaborations() {
  const data = await fetchJSON('sections/collaborations/collaborations.json');
  if (!data) return;
  const container = document.getElementById('collaborations-content');
  container.innerHTML = '';
  // Subtitle / tagline
  if (data.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.textContent = data.subtitle;
    subtitle.style.textAlign = 'center';
    subtitle.style.maxWidth = '700px';
    subtitle.style.margin = '0 auto 40px';
    subtitle.style.color = getComputedStyle(document.documentElement).getPropertyValue('--muted-color');
    container.appendChild(subtitle);
  }
  if (!Array.isArray(data.items)) return;
  const grid = document.createElement('div');
  grid.className = 'collab-grid';
    data.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'collab-card';
      // Wrapper for image and details so they appear side‑by‑side
      const infoWrapper = document.createElement('div');
      infoWrapper.className = 'collab-info';
      // logo
      if (item.logo) {
        const img = document.createElement('img');
        img.src = item.logo;
        img.alt = item.name + ' logo';
        // Lazy load the collaboration logos to improve performance
        img.loading = 'lazy';
        infoWrapper.appendChild(img);
      }
      const details = document.createElement('div');
      details.className = 'collab-details';
      const name = document.createElement('h3');
      name.textContent = item.name;
      details.appendChild(name);
      if (item.location) {
        const loc = document.createElement('span');
        loc.textContent = item.location;
        details.appendChild(loc);
      }
      infoWrapper.appendChild(details);
      card.appendChild(infoWrapper);
      // Links (key-value) if provided
      if (item.links && typeof item.links === 'object') {
        const linksWrapper = document.createElement('div');
        linksWrapper.className = 'collab-links';
        Object.keys(item.links).forEach(key => {
          const url = item.links[key];
          if (!url) return;
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = key + ':';
          p.appendChild(strong);
          const space = document.createTextNode(' ');
          p.appendChild(space);
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = url;
          p.appendChild(a);
          linksWrapper.appendChild(p);
        });
        card.appendChild(linksWrapper);
      }
      grid.appendChild(card);
    });
  container.appendChild(grid);
}

/**
 * Load optional floating widgets and attach them to the About section.
 *
 * The widgets JSON defines two objects: `left` and `right`. Each widget
 * contains a `title` and an array of `items`. Each item should be an
 * object with `text` and an optional `url` so that every list entry can
 * be independently linked. Widgets will be appended directly to the
 * About section rather than the home section, and the About section
 * must be positioned relatively in CSS to anchor the absolutely
 * positioned boxes.
 */
async function loadWidgets() {
  const data = await fetchJSON('sections/widgets/widgets.json');
  if (!data) return;
  // Attach widgets to the About section
  const aboutSection = document.querySelector('#about');
  if (!aboutSection) return;
  // Helper to create a widget box on a given side
  const createBox = (side, widget) => {
    if (!widget || !Array.isArray(widget.items)) return;
    // Respect the show flag: if explicitly false, do not render this widget
    if (typeof widget.show !== 'undefined' && !widget.show) return;
    const box = document.createElement('div');
    box.className = `widget-box widget-${side}`;
    // Title
    if (widget.title) {
      const h4 = document.createElement('h4');
      h4.textContent = widget.title;
      box.appendChild(h4);
    }
    // Items list: each item may include a text and a url property. If a
    // URL is provided, wrap the text in an anchor; otherwise insert
    // plain text. Strings are supported for backwards compatibility.
    const ul = document.createElement('ul');
    widget.items.forEach(item => {
      const li = document.createElement('li');
      if (item && typeof item === 'object' && item.text) {
        if (item.url) {
          const a = document.createElement('a');
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = item.text;
          li.appendChild(a);
        } else {
          li.textContent = item.text;
        }
      } else if (typeof item === 'string') {
        li.textContent = item;
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    aboutSection.appendChild(box);
  };
  // Create left and right widgets if provided
  createBox('left', data.left);
  createBox('right', data.right);
}

/**
 * Load an announcement modal on first page load. The content is defined
 * in `sections/announcement/announcement.json`. The file should
 * contain a `show` boolean to control whether the modal appears, a
 * `title`, optional `logo` and `image` paths, a `description`, an
 * optional `link` (URL), and an array of `keywords`. The modal will
 * only display once per browsing session using sessionStorage to
 * remember that it has been shown. Users can close the modal via
 * a cross button or by clicking outside the modal.
 */
async function loadAnnouncement() {
  const data = await fetchJSON('sections/announcement/announcement.json');
  if (!data || !data.show) return;
  // Only show once per session (per tab). If already shown, exit.
  if (sessionStorage.getItem('announcementShown')) return;
  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'announcement-overlay';
  overlay.className = 'modal-overlay';
  // Build modal container
  const modal = document.createElement('div');
  modal.className = 'announcement-modal';
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', hideModal);
  modal.appendChild(closeBtn);
  // Logo
  if (data.logo) {
    const imgLogo = document.createElement('img');
    imgLogo.src = data.logo;
    imgLogo.alt = 'Logo';
    imgLogo.className = 'announcement-logo';
    imgLogo.loading = 'lazy';
    modal.appendChild(imgLogo);
  }
  // Title
  if (data.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'announcement-title';
    titleEl.textContent = data.title;
    modal.appendChild(titleEl);
  }
  // Featured image
  if (data.image) {
    const imgFeat = document.createElement('img');
    imgFeat.src = data.image;
    imgFeat.alt = data.title || 'Announcement image';
    imgFeat.className = 'announcement-image';
    imgFeat.loading = 'lazy';
    modal.appendChild(imgFeat);
  }
  // Description
  if (data.description) {
    const descEl = document.createElement('p');
    descEl.className = 'announcement-description';
    descEl.textContent = data.description;
    modal.appendChild(descEl);
  }
  // Details link
  if (data.link) {
    const linkEl = document.createElement('a');
    linkEl.href = data.link;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    linkEl.className = 'announcement-link';
    linkEl.textContent = 'Learn more';
    modal.appendChild(linkEl);
  }
  // Keywords as pill tags
  if (Array.isArray(data.keywords) && data.keywords.length) {
    const keywordsWrapper = document.createElement('div');
    keywordsWrapper.className = 'announcement-keywords';
    data.keywords.forEach(word => {
      const span = document.createElement('span');
      span.className = 'keyword-pill';
      span.textContent = word;
      keywordsWrapper.appendChild(span);
    });
    modal.appendChild(keywordsWrapper);
  }
  // Append modal to overlay and overlay to body
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  // Set session flag
  sessionStorage.setItem('announcementShown', 'true');
  // Hide modal function
  function hideModal() {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    // Remove keydown listener when modal is closed
    document.removeEventListener('keydown', onKeyDown);
  }
  // Close by clicking outside modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideModal();
    }
  });

  // Close on Escape key
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      hideModal();
    }
  }
  document.addEventListener('keydown', onKeyDown);
}

// Load contact information
async function loadContact() {
  const data = await fetchJSON('sections/contact/contact.json');
  if (!data) return;
  const container = document.getElementById('contact-content');
  container.innerHTML = '';
  // Create outer card to hold all categories
  const card = document.createElement('div');
  card.className = 'contact-card';
  // Wrapper for the columns
  const categoriesWrapper = document.createElement('div');
  categoriesWrapper.className = 'contact-categories';
  // Human‑friendly headings for the three categories
  const headings = {
    personal: 'Personal/ Social Media',
    professional: 'Professional Networks',
    others: 'Others'
  };
  // For each category key in order
  Object.keys(headings).forEach(catKey => {
    const items = data[catKey];
    if (!Array.isArray(items) || items.length === 0) return;
    const col = document.createElement('div');
    col.className = 'contact-category';
    const h4 = document.createElement('h4');
    h4.textContent = headings[catKey];
    col.appendChild(h4);
    items.forEach(item => {
      const mini = document.createElement('div');
      mini.className = 'contact-mini-card';
      // icon
      const iconEl = document.createElement('div');
      iconEl.className = 'contact-mini-icon';
      iconEl.textContent = item.icon || '';
      mini.appendChild(iconEl);
      // details wrapper
      const details = document.createElement('div');
      details.className = 'contact-mini-details';
      const titleEl = document.createElement('div');
      titleEl.className = 'contact-mini-title';
      titleEl.textContent = item.title || '';
      details.appendChild(titleEl);
      const valueEl = document.createElement('div');
      valueEl.className = 'contact-mini-value';
      if (item.url) {
        const a = document.createElement('a');
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = item.value || '';
        a.style.color = 'inherit';
        a.style.textDecoration = 'none';
        valueEl.appendChild(a);
      } else {
        valueEl.textContent = item.value || '';
      }
      details.appendChild(valueEl);
      mini.appendChild(details);
      col.appendChild(mini);
    });
    categoriesWrapper.appendChild(col);
  });
  card.appendChild(categoriesWrapper);
  container.appendChild(card);
}


// Navigation active link highlighting and smooth scrolling
function setupNavLinks() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section');
  function onScroll() {
    const scrollPos = window.scrollY + 100;
    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          // remove aria-current attribute on previously active links
          link.removeAttribute('aria-current');
        });
        const id = sec.getAttribute('id');
        const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          // indicate the current page for screen reader users
          activeLink.setAttribute('aria-current', 'page');
        }
      }
    });
  }
  document.addEventListener('scroll', onScroll);
  // Also highlight initial state
  onScroll();
}

// Mobile navigation toggle
function setupNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;
  toggle.addEventListener('click', () => {
    // Toggle menu state
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('active');
    document.body.classList.toggle('nav-open');
    // Update the aria-expanded attribute to reflect the current state
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  // Close drawer when a link is clicked (for mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
      document.body.classList.remove('nav-open');
      // Reset aria-expanded when menu is closed
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Fade in sections when they come into view
function setupFadeInSections() {
  const faders = document.querySelectorAll('.fade-in-section');
  // Use a lower threshold so sections start appearing sooner, improving perceived load
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  faders.forEach(sec => observer.observe(sec));
}

// Scroll to top button
function setupScrollTopButton() {
  const btn = document.getElementById('scrollTopBtn');
  const showAt = 600;
  window.addEventListener('scroll', () => {
    if (window.scrollY > showAt) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}