// Set current year in footer
const year = new Date().getFullYear();
const footerTarget = document.querySelector(".footer-bottom p");
if (footerTarget) {
  footerTarget.innerHTML = `© ${year} Akruti Developer. All Rights Reserved.`;
}

console.log('Script loaded successfully!');

// Handle contact form submission
document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Form submitted successfully!");
      this.reset();
    });
  }
});

// Handle corner navigation toggle
const cornerNav = document.getElementById('corner-nav');
const cornerNavToggle = document.getElementById('corner-nav-toggle');

cornerNavToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  cornerNav.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!cornerNav.contains(e.target)) {
    cornerNav.classList.remove('open');
  }
});

// Show/hide agent message based on user type selection
document.addEventListener('DOMContentLoaded', function () {

  const userType = document.getElementById('user-type');
  const agentBox = document.getElementById('agent-message');

  if (!userType || !agentBox) return;

  function toggleAgentBox() {
    const value = userType.value.trim().toLowerCase();

    if (value === 'agent') {
      agentBox.style.display = 'block';   // ✅ force show
    } else {
      agentBox.style.display = 'none';    // ❌ hide
    }
  }

  userType.addEventListener('change', toggleAgentBox);
  userType.addEventListener('input', toggleAgentBox); // 🔥 extra safety

  toggleAgentBox(); // run on load

});

// Reset to hero view when page is restored from back/forward cache
window.addEventListener('pageshow', function (event) {
  if (event.persisted || (window.performance && performance.getEntriesByType('navigation')[0]?.type === 'back_forward')) {
    resetToHeroView();
  }
});

function resetToHeroView() {
  const villaLocationSection = document.getElementById('villa-location-section');
  const heroSection = document.querySelector('.hero');

  if (villaLocationSection) {
    villaLocationSection.classList.remove('show');
    villaLocationSection.classList.add('hidden');
  }
  if (heroSection) {
    heroSection.classList.remove('dimmed');
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

// Handle Explore Villas button click - Hide Hero Section and Show Villa Location Section
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded: Setting up villa location handler');

  const exploreBtn = document.getElementById('explore-btn');
  const villaLocationSection = document.getElementById('villa-location-section');
  const heroSection = document.querySelector('.hero');

  console.log('Explore button found:', !!exploreBtn);
  console.log('Villa location section found:', !!villaLocationSection);
  console.log('Hero section found:', !!heroSection);

  if (exploreBtn && villaLocationSection && heroSection) {
    exploreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Explore button clicked!');

      // Show the map section as overlay sliding from bottom
      villaLocationSection.classList.remove('hidden');
      void villaLocationSection.offsetWidth;
      villaLocationSection.classList.add('show');
      console.log('Map section slide-up animation started');

      // Dim hero section underneath
      heroSection.classList.add('dimmed');
      console.log('Hero section dimmed');

      // Scroll to top for view
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    console.log('Event listener attached successfully');
  } else {
    console.error('ERROR: Could not find button or section!', {
      button: exploreBtn ? 'found' : 'NOT FOUND',
      section: villaLocationSection ? 'found' : 'NOT FOUND',
      hero: heroSection ? 'found' : 'NOT FOUND'
    });
  }
});

// scroll map in mobile responsive view to middle on load (adjust as needed for red plot focus)
document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".index-avl-map");

  if (container) {
    // Scroll to middle (or adjust for your red plot focus)
    container.scrollLeft = container.scrollWidth * 0.55;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".index-avl-map");
  const target = document.querySelector("#plot-target");

  if (container && target) {

    const containerWidth = container.offsetWidth;

    // Get target position inside scroll container
    const targetLeft = target.offsetLeft;

    // Center target in screen
    const scrollPosition = targetLeft - (containerWidth / 2) + (target.offsetWidth / 2);

    container.scrollLeft = scrollPosition;
  }
});



/* =================================================
   MASTER LAYOUT PAGE — only runs on masterlayout.html
   ================================================= */

const stage = document.getElementById('mapStage');

if (stage) {  // ✅ guard — only runs if mapStage exists on this page

  // Pull live status from the CRM before anything else reads data-status.
  // Matches by data-name first, falls back to data-type (the unit serial,
  // e.g. "A1-01") so a villa booked by either name or serial in the CRM
  // updates correctly here. Fails silently to the hardcoded HTML status if
  // the CRM is unreachable, so the site still works if the API is down.
  fetch('/crm/api/villa-status.php')
    .then(r => r.json())
    .then(list => {
      const byName = {};
      list.forEach(v => { byName[v.name] = v.status; byName[v.serial] = v.status; });
      document.querySelectorAll('.villa-block[data-status]').forEach(block => {
        const live = byName[block.dataset.name] || byName[block.dataset.type];
        if (live) block.dataset.status = live;
      });
    })
    .catch(() => { /* CRM unreachable — keep whatever's in the HTML */ });

  function scaleMap() {
    const scaleX = window.innerWidth / 1920;
    const scaleY = window.innerHeight / 1080;
    const scale = Math.min(scaleX, scaleY);
    const offX = (window.innerWidth - 1920 * scale) / 2;
    const offY = (window.innerHeight - 1080 * scale) / 2;
    stage.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  }
  scaleMap();
  window.addEventListener('resize', scaleMap);

  const card = document.getElementById('infoCard');
  const dimmer = document.getElementById('mapDimmer');
  const cardClose = document.getElementById('cardClose');
  let active = null;

  document.querySelectorAll('.villa-block').forEach(block => {
    block.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFilter();
      openCard(block);
    });
  });

  card.addEventListener('click', (e) => e.stopPropagation());

  function openCard(block) {
    document.querySelectorAll('.villa-block.active').forEach(b => b.classList.remove('active'));
    active = block;
    block.classList.add('active');

    const name = block.dataset.name;
    const type = block.dataset.type;
    const beds = block.dataset.beds;
    const size = block.dataset.size;
    const status = block.dataset.status;
    const villaType = block.dataset.villaType;
    const isSold = status === 'soldout';
    const img = isSold && block.dataset.imgSold
      ? block.dataset.imgSold
      : block.dataset.img;

    document.getElementById('cardTitle').textContent = name;
    document.getElementById('cardSub').textContent = type + ' · Premium Unit';
    document.getElementById('metaType').textContent = type;
    document.getElementById('metaBeds').textContent = beds;
    document.getElementById('metaSize').textContent = size;

    const statusEl = document.getElementById('metaStatus');
    statusEl.textContent = isSold ? 'Sold Out' : 'Available';
    statusEl.classList.remove('meta-available', 'meta-sold');
    statusEl.classList.add(isSold ? 'meta-sold' : 'meta-available');

    const btnEl = document.getElementById('cardBtn');
    const isClubhouse = name.toLowerCase() === 'clubhouse';
    btnEl.style.display = (isSold || isClubhouse) ? 'none' : 'inline-block';

    btnEl.onclick = function () {
      localStorage.setItem('selectedVilla', JSON.stringify({
        name, type, beds, size, status,
        img: block.dataset.img,
        villaType
      }));

      const allAvailable = [];
      document.querySelectorAll('.villa-block[data-status="available"]').forEach(b => {
        if (b.dataset.name !== name) {
          allAvailable.push({
            name: b.dataset.name,
            type: b.dataset.type,
            beds: b.dataset.beds,
            size: b.dataset.size,
            status: b.dataset.status,
            img: b.dataset.img,
            villaType: b.dataset.villaType
          });
        }
      });
      localStorage.setItem('availableVillas', JSON.stringify(allAvailable));
      window.location.href = 'plans.html';
    };

    const imgEl = document.getElementById('cardImg');
    imgEl.classList.remove('img-standard', 'img-large');
    const isLarge = villaType === 'combo' || name.toLowerCase() === 'clubhouse';
    imgEl.classList.add(isLarge ? 'img-large' : 'img-standard');
    imgEl.innerHTML = img ? `<img src="${img}" alt="${name}" />` : name;

    const bL = parseInt(block.style.left, 10);
    const bT = parseInt(block.style.top, 10);
    const bW = parseInt(block.style.width, 10);
    const bH = parseInt(block.style.height, 10) || 100;
    const cW = isLarge ? 660 : 520;
    const cH = isLarge ? 380 : 420;
    const GAP = 8;
    const MAP_W = 1920;
    const MAP_H = 1080;
    const MAP_PAD = 10;

    let top = bT + (bH / 2) - (cH / 2);
    const forcedSide = block.dataset.cardSide;
    const roomOnRight = (bL + bW + GAP + cW) <= (MAP_W - MAP_PAD);
    let left = (forcedSide === 'left' || !roomOnRight)
      ? bL - cW - GAP : bL + bW + GAP;

    if (left < MAP_PAD) left = MAP_PAD;
    if (left + cW > MAP_W - MAP_PAD) left = MAP_W - MAP_PAD - cW;
    if (top < MAP_PAD) top = MAP_PAD;
    if (top + cH > MAP_H - MAP_PAD) top = MAP_H - MAP_PAD - cH;

    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.classList.add('visible');
    stage.classList.add('villa-active');
  }

  function closeCard() {
    card.classList.remove('visible');
    stage.classList.remove('villa-active');
    document.querySelectorAll('.villa-block.active').forEach(b => b.classList.remove('active'));
    active = null;
  }

  cardClose.addEventListener('click', (e) => { e.stopPropagation(); closeCard(); });
  dimmer.addEventListener('click', closeCard);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });

  /* ── FILTER LOGIC ── */
  let activeFilter = null;

  function toggleFilter(type) {
    if (activeFilter === type) { clearFilter(); return; }
    activeFilter = type;
    document.getElementById('btn-available').classList.remove('active-available');
    document.getElementById('btn-sold').classList.remove('active-sold');
    document.getElementById(type === 'available' ? 'btn-available' : 'btn-sold')
      .classList.add(type === 'available' ? 'active-available' : 'active-sold');
    document.querySelectorAll('.villa-block[data-status]').forEach(v => {
      const isMatch = v.getAttribute('data-status') === type;
      v.classList.remove('filter-highlight-available', 'filter-highlight-sold', 'filter-dim');
      v.classList.add(isMatch
        ? (type === 'available' ? 'filter-highlight-available' : 'filter-highlight-sold')
        : 'filter-dim'
      );
    });
  }

  function clearFilter() {
    activeFilter = null;
    document.getElementById('btn-available')?.classList.remove('active-available');
    document.getElementById('btn-sold')?.classList.remove('active-sold');
    document.querySelectorAll('.villa-block').forEach(v => {
      v.classList.remove('filter-highlight-available', 'filter-highlight-sold', 'filter-dim');
    });
  }

} // ✅ end of if(stage) guard


/* =================================================
   PLANS PAGE — only runs on plans.html
   ================================================= */

document.addEventListener('DOMContentLoaded', function () {

  if (!document.querySelector('.villa-card.left')) return;

  const selected = JSON.parse(localStorage.getItem('selectedVilla'));
  const allVillas = JSON.parse(localStorage.getItem('availableVillas')) || [];

  if (!selected) { console.warn('No selectedVilla in localStorage'); return; }

  const highlightMap = { 'rhs': 'right', 'lhs': 'left', 'combo': 'center' };

  /* ── Reverse map: card position → villaType it accepts ── */
  const sideTypeMap = {
    'left': 'lhs',
    'center': 'combo',
    'right': 'rhs'
  };

  const initialSide = highlightMap[selected.villaType] || 'left';

  /* ── Filter available villas by villaType for each card position ── */
  function getRandomForSide(side) {
    const requiredType = sideTypeMap[side];

    // get all available villas matching this card's type, excluding selected villa
    const pool = allVillas.filter(v =>
      v.villaType === requiredType &&
      v.name !== selected.name
    );

    if (pool.length === 0) return null; // no match found

    // pick random one from matching pool
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Build data map — each card gets correct type villa ── */
  const dataMap = {};

  ['left', 'center', 'right'].forEach(side => {
    if (side === initialSide) {
      dataMap[side] = selected; // selected villa goes to its matched card
    } else {
      dataMap[side] = getRandomForSide(side) || null; // correct type for this position
    }
  });

  /* ── Fill all cards with their data ── */
  ['left', 'center', 'right'].forEach(side => {
    const cardEl = document.querySelector(`.villa-card.${side}`);
    if (!cardEl) return;

    const data = dataMap[side];

    if (!data) {
      // no matching villa found for this position — hide the card
      cardEl.style.visibility = 'hidden';
      return;
    }

    cardEl.style.visibility = 'visible';

    const nameEl = cardEl.querySelector('.villa-name');
    const typeEl = cardEl.querySelector('.villa-type');
    const bedsEl = cardEl.querySelector('.villa-beds');
    const sizeEl = cardEl.querySelector('.villa-size');
    const statusEl = cardEl.querySelector('.villa-status');

    if (nameEl) nameEl.textContent = data.name;
    if (typeEl) typeEl.textContent = data.type;
    if (bedsEl) bedsEl.textContent = data.beds;
    if (sizeEl) sizeEl.textContent = data.size;
    if (statusEl) statusEl.textContent = data.status;
  });

  /* ── Activate a card — highlight it, dim others ── */
  function activateCard(activeSide) {
    ['left', 'center', 'right'].forEach(side => {
      const cardEl = document.querySelector(`.villa-card.${side}`);
      if (!cardEl) return;

      const isActive = side === activeSide;
      const btnEl = cardEl.querySelector('.villa-btn');

      if (btnEl) btnEl.style.display = isActive ? 'block' : 'none';

      if (isActive) {
        cardEl.classList.add('villa-card--active');
        cardEl.classList.remove('villa-card--inactive');
      } else {
        cardEl.classList.add('villa-card--inactive');
        cardEl.classList.remove('villa-card--active');
      }
    });
  }

  /* ── Set initial highlight ── */
  activateCard(initialSide);

  /* ── Click any card to switch active ── */
  ['left', 'center', 'right'].forEach(side => {
    const cardEl = document.querySelector(`.villa-card.${side}`);
    if (!cardEl || !dataMap[side]) return; // skip hidden cards

    cardEl.addEventListener('click', function () {
      localStorage.setItem('selectedVilla', JSON.stringify(dataMap[side]));
      activateCard(side);
    });
  });

});