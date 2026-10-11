/* Baker's & Coffee — script.js */
'use strict';

(async function () {

  /* ── 1. Load menu data ─────────────────────────────────── */
  let data;
  try {
    const res = await fetch('./menu.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (e) {
    console.error('Failed to load menu.json:', e);
    document.getElementById('main-content').innerHTML =
      '<p style="padding:40px 20px;text-align:center;color:#c00">Menu could not be loaded. Please check that menu.json is in the same folder as index.html.</p>';
    return;
  }

  const { restaurant, categories } = data;

  /* ── 2. Populate header meta ───────────────────────────── */
  document.title = restaurant.name + ' — Menu';
  document.getElementById('meta-description').content =
    'Full menu for ' + restaurant.name + '. ' + restaurant.tagline + '. ' + restaurant.address;

  /* ── 3. Build category navigation ─────────────────────── */
  const nav = document.getElementById('category-nav');

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (i === 0 ? ' active' : '');
    btn.dataset.target = cat.id;
    btn.setAttribute('aria-label', 'Scroll to ' + cat.name);
    btn.textContent = cat.emoji + ' ' + cat.name;
    if (i === 0) btn.setAttribute('aria-current', 'true');
    btn.addEventListener('click', () => scrollToSection(cat.id, btn));
    nav.appendChild(btn);
  });

  /* ── 4. Build menu sections ────────────────────────────── */
  const main = document.getElementById('main-content');
  const noResults = document.getElementById('no-results');

  categories.forEach(cat => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    section.id = cat.id;
    section.setAttribute('aria-labelledby', 'heading-' + cat.id);

    const header = document.createElement('header');
    header.className = 'section-header';
    header.innerHTML = `
      <span class="section-emoji" aria-hidden="true">${cat.emoji}</span>
      <h2 class="section-title" id="heading-${cat.id}">${cat.name}</h2>
      <div class="section-divider-ornament" aria-hidden="true"></div>
    `;

    const ul = document.createElement('ul');
    ul.className = 'items-list';

    cat.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'menu-item';
      li.dataset.name = item.name.toLowerCase();
      li.innerHTML = `
        <span class="item-name">${item.name}</span>
        <span class="item-price">₹${item.price.toFixed(2)}</span>
      `;
      ul.appendChild(li);
    });

    section.appendChild(header);
    section.appendChild(ul);
    main.insertBefore(section, noResults);
  });

  /* ── 5. Scroll-spy (IntersectionObserver) ──────────────── */
  const sectionEls = main.querySelectorAll('.menu-section');
  const navBtns = nav.querySelectorAll('.nav-btn');
  const navWrapper = document.getElementById('category-nav-wrapper');

  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, observerOptions);

  sectionEls.forEach(sec => observer.observe(sec));

  function setActiveNav(sectionId) {
    navBtns.forEach(btn => {
      const isActive = btn.dataset.target === sectionId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    // Scroll active button into view within nav
    const activeBtn = nav.querySelector('.nav-btn.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function scrollToSection(id, clickedBtn) {
    const section = document.getElementById(id);
    if (!section) return;
    const navH = navWrapper.getBoundingClientRect().height;
    const top = section.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* ── 6. Search ──────────────────────────────────────────── */
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const resultsInfo = document.getElementById('search-results-info');

  searchInput.addEventListener('input', handleSearch);
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
    searchInput.focus();
  });

  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchClear.classList.toggle('visible', query.length > 0);

    if (!query) {
      // Reset: show all sections, restore plain item names
      sectionEls.forEach(sec => sec.classList.remove('hidden'));
      main.querySelectorAll('.item-name').forEach(el => {
        el.innerHTML = el.dataset.plain || el.textContent;
      });
      resultsInfo.classList.remove('visible');
      return;
    }

    let totalMatches = 0;

    sectionEls.forEach(sec => {
      const items = sec.querySelectorAll('.menu-item');
      let sectionMatches = 0;

      items.forEach(item => {
        const nameEl = item.querySelector('.item-name');
        // Store plain text once
        if (!nameEl.dataset.plain) nameEl.dataset.plain = nameEl.textContent;
        const plain = nameEl.dataset.plain;
        const matches = plain.toLowerCase().includes(query);
        item.style.display = matches ? '' : 'none';
        if (matches) {
          sectionMatches++;
          // Highlight match
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          nameEl.innerHTML = plain.replace(
            new RegExp(escaped, 'gi'),
            m => `<mark>${m}</mark>`
          );
        }
      });

      sec.classList.toggle('hidden', sectionMatches === 0);
      totalMatches += sectionMatches;
    });

    if (totalMatches === 0) {
      noResults.classList.add('visible');
      resultsInfo.classList.remove('visible');
    } else {
      noResults.classList.remove('visible');
      resultsInfo.textContent = `${totalMatches} item${totalMatches !== 1 ? 's' : ''} found for "${searchInput.value.trim()}"`;
      resultsInfo.classList.add('visible');
    }
  }

  /* ── 7. Back-to-top button ──────────────────────────────── */
  const backTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── 8. Populate footer ─────────────────────────────────── */
  document.getElementById('footer-name').textContent    = restaurant.name;
  document.getElementById('footer-tagline').textContent = restaurant.tagline;
  document.getElementById('footer-address').textContent = restaurant.address;
  document.getElementById('footer-hours').textContent   = restaurant.hours;

  const phoneLink = document.getElementById('footer-phone');
  phoneLink.href        = 'tel:' + restaurant.phone;
  phoneLink.textContent = restaurant.phone;

  const mapLink = document.getElementById('footer-map');
  mapLink.href = restaurant.mapUrl;

  const igLink = document.getElementById('social-instagram');
  const fbLink = document.getElementById('social-facebook');
  igLink.href = restaurant.instagram;
  fbLink.href = restaurant.facebook;

})();
