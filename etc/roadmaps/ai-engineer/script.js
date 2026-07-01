// ===== AI Roadmap — script.js =====
// Interactivity: theme toggle, print, drawer, anchors, collapse per stage,
// localStorage progress, KPI totals, active nav highlighting.

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // THEME TOGGLE (persist)
  const body = document.body;
  const themeBtn = $('#themeBtn');
  const savedTheme = localStorage.getItem('theme');
  if(savedTheme) body.setAttribute('data-theme', savedTheme);
  themeBtn?.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    if(isDark){ body.removeAttribute('data-theme'); localStorage.removeItem('theme'); }
    else { body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
  });

  // PRINT
  $('#printBtn')?.addEventListener('click', () => window.print());

  // MOBILE DRAWER
  const drawerBtn = $('#drawerBtn');
  drawerBtn?.addEventListener('click', () => { document.body.classList.toggle('drawer-open'); });
  // Close drawer when clicking a sidebar link (mobile UX)
  $$('#sidebar a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('drawer-open');
  }));

  // CARDS + HOURS + PROGRESS
  const cards = $$('.card[id]');
  const totalHours = cards.reduce((sum, c) => sum + (+c.dataset.hours || 0), 0);
  const doneSet = new Set(JSON.parse(localStorage.getItem('doneTopics') || '[]'));

  const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setText('hoursTotal', totalHours);
  setText('hoursTotalHero', totalHours);
  setText('kTotalTopics', cards.length);

  // Mark card UI state
  function markDone(id, init){
    const card = document.getElementById(id);
    if(!card) return;
    card.style.opacity = .88;
    card.style.outline = '2px solid var(--accent)';
    $$('.done-btn', card).forEach(b => b.textContent = '✅ Done');
    if(!init){ card.animate([{filter:'brightness(1)'},{filter:'brightness(1.18)'},{filter:'brightness(1)'}], {duration:420}); }
  }
  function unmarkDone(id){
    const card = document.getElementById(id);
    if(!card) return;
    card.style.opacity = 1;
    card.style.outline = 'none';
    $$('.done-btn', card).forEach(b => b.textContent = '✔ Done');
  }

  // Attach Done buttons
  $$('.done-btn').forEach(btn => {
    const id = btn.getAttribute('data-id');
    if(doneSet.has(id)) markDone(id, true);
    btn.addEventListener('click', () => {
      if(doneSet.has(id)) { doneSet.delete(id); unmarkDone(id); }
      else { doneSet.add(id); markDone(id); }
      localStorage.setItem('doneTopics', JSON.stringify([...doneSet]));
      updateProgress();
    });
  });

  function updateProgress(){
    let doneCount = 0, hoursDone = 0;
    cards.forEach(c => {
      if(doneSet.has(c.id)) { doneCount++; hoursDone += (+c.dataset.hours || 0); }
    });
    setText('progressCount', `${doneCount}/${cards.length}`);
    setText('kDone', doneCount);
    setText('hoursDone', hoursDone);
    const pct = cards.length ? (doneCount/cards.length*100) : 0;
    const bar = $('#progressBar'); if(bar) bar.style.width = pct + '%';
  }
  updateProgress();

  // COPYABLE ANCHORS (topic & section)
  function copyLink(target){
    try {
      const url = new URL(window.location.href);
      url.hash = target.replace('#','');
      navigator.clipboard.writeText(url.toString());
      // UI feedback
      $$(`[data-target="${target}"]`).forEach(b => {
        const orig = b.textContent; b.textContent = '✅ Copied';
        setTimeout(() => b.textContent = orig.includes('Copy') ? '📎 Copy link' : '📎 Link', 1200);
      });
    } catch(e){ console.warn('Copy failed', e); }
  }
  $$('.anchor-btn,.share').forEach(btn => btn.addEventListener('click', () => copyLink(btn.getAttribute('data-target'))));

  // STAGE COLLAPSE
  $$('.collapse').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-target');
      const stage = $(sel);
      const grid = stage?.querySelector('.grid');
      if(!grid) return;
      const hidden = grid.style.display === 'none';
      grid.style.display = hidden ? 'grid' : 'none';
      btn.textContent = hidden ? '▾ Collapse' : '▸ Expand';
    });
  });

  // ACTIVE NAV HIGHLIGHT while scrolling
  const links = $$('#sidebar a');
  const ids = links.map(a => a.getAttribute('href')).filter(Boolean);
  const sections = ids.map(id => document.querySelector(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    const best = entries.filter(e => e.isIntersecting).sort((a,b)=> b.intersectionRatio - a.intersectionRatio)[0];
    if(!best) return;
    const id = '#' + best.target.id;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
  }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, .25, .5, .75, 1] });
  sections.forEach(sec => io.observe(sec));

  // If page loads with a hash, ensure the corresponding sidebar item is active
  if(location.hash){
    const active = $(`#sidebar a[href="${location.hash}"]`);
    active?.classList.add('active');
    // minor scroll adjust to respect fixed header
    setTimeout(()=>{ document.querySelector(location.hash)?.scrollIntoView({behavior:'smooth', block:'start'}); }, 60);
  }
})();
