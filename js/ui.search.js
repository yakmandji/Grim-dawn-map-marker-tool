// ui.search.js — multi-map global search (regions / dungeons / rifts)
(function () {

  // --- Utils ---------------------------------------

  function normalize(str) {
    return (str || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove accents
  }

  // Chaque entrée de l'index = un lieu unique (toutes maps confondues)
  // { profile, type, tag, xp, yp }
  let rawIndex = [];

  let inputEl = null;
  let resultsEl = null;

  const TYPE_ICON_PATHS = {
    region:  'img/region.svg',
    rift:    'img/rift.png',
    dungeon: 'img/donjon-yellow.svg'
  };


  // --- Global index --------------------------------------

  function buildGlobalIndex() {
    rawIndex = [];

    const maps = [
      { profile: 'Cairn',        regionsKey: 'REGION_MARKERS_CAIRN',    riftsKey: 'RIFT_MARKERS_CAIRN' },
      { profile: 'Malmouth',     regionsKey: 'REGION_MARKERS_MALMOUTH', riftsKey: 'RIFT_MARKERS_MALMOUTH' },
      { profile: 'Korvan Basin', regionsKey: 'REGION_MARKERS_KORVAN',   riftsKey: 'RIFT_MARKERS_KORVAN' },
    ];

    maps.forEach(cfg => {
      const regions = window[cfg.regionsKey] || [];
      const rifts   = window[cfg.riftsKey]   || [];

      regions.forEach(m => {
        rawIndex.push({
          profile: cfg.profile,
          type: m.isDungeon ? 'dungeon' : 'region',
          tag: m.tag,
          xp: m.xp,
          yp: m.yp,
        });
      });

      rifts.forEach(m => {
        rawIndex.push({
          profile: cfg.profile,
          type: 'rift',
          tag: m.tag,
          xp: m.xp,
          yp: m.yp,
        });
      });
    });
  }

  // Called form ui.core.js 
  function refresh() {
    buildGlobalIndex();
  }

  // --- Search -----------------------------------------------------------

  function search(term) {
    const q = normalize(term);
    if (!q) return [];

    const lang = (window.GDMMLang && GDMMLang.getLang && GDMMLang.getLang()) || 'en';

    const results = [];

    rawIndex.forEach(item => {
      let label = item.tag || '';

      if (item.type === 'rift') {
        if (window.getRiftLabel) {
          label = getRiftLabel(item.tag, label);
        }
      } else {
        if (window.getRegionLabel) {
          label = getRegionLabel(item.tag, label);
        }
      }

      const nLabel = normalize(label);
      if (!nLabel.includes(q)) return;

      // Label type adapted to language
      let typeLabel;
      if (lang === 'fr') {
        typeLabel =
          item.type === 'rift'    ? 'Faille'  :
          item.type === 'dungeon' ? 'Donjon'  :
                                    'Région';
      } else {
        typeLabel =
          item.type === 'rift'    ? 'Rift'    :
          item.type === 'dungeon' ? 'Dungeon' :
                                    'Region';
      }

      results.push({
        ...item,
        label,
        typeLabel,
      });
    });

    return results.slice(0, 30);
  }

  // --- UI ------------------------------------

  function renderResults(list) {
    if (!resultsEl) return;

    resultsEl.innerHTML = '';
    if (!list.length) {
      resultsEl.style.display = 'none';
      return;
    }

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'search-result';
      row.classList.add(`type-${item.type}`);

      // Icône SVG
      const icon = document.createElement('img');
      icon.className = 'search-type-icon';
      icon.src = TYPE_ICON_PATHS[item.type] || TYPE_ICON_PATHS.region;
      icon.draggable = false;

      const span = document.createElement('span');
      span.className = 'search-label';

      const t = window.GDMMLang?.t;
      const typeLabel = t ? t(`ui.${item.type}`) : item.type;

      // Exemple : "Région - Collines Brisées (Cairn)"
      span.textContent = `${typeLabel} - ${item.label} (${item.profile})`;

      row.appendChild(icon);
      row.appendChild(span);

      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        goTo(item);
      });

      resultsEl.appendChild(row);
    });

    resultsEl.style.display = 'block';
  }

  function clearResultsLater() {
    if (!resultsEl) return;
    setTimeout(() => {
      resultsEl.style.display = 'none';
      resultsEl.innerHTML = '';
    }, 150);
  }


function highlightAtCenter(item) {
  const viewport = document.getElementById('mapViewport');
  if (!viewport) return;

  const vb = viewport.getBoundingClientRect();
  const cx = vb.left + vb.width / 2;
  const cy = vb.top + vb.height / 2;

  let selector;
  if (item && item.type === 'rift') {
    // Only Rift
    selector = '.marker-rift';
  } else {
    // Only dongeon
    selector = '.marker-region .region-label, .marker-region-dungeon .region-label';
  }

  const candidates = document.querySelectorAll(selector);
  if (!candidates.length) return;

  let bestEl = null;
  let bestDist = Infinity;

  candidates.forEach(el => {
    const r = el.getBoundingClientRect();
    const mx = r.left + r.width / 2;
    const my = r.top + r.height / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const d2 = dx * dx + dy * dy;

    if (d2 < bestDist) {
      bestDist = d2;
      bestEl = el;
    }
  });

  if (!bestEl) return;

  const markerEl =
    bestEl.closest('.marker-rift, .marker-region, .marker-region-dungeon') || bestEl;

  markerEl.classList.add('marker-highlight');
  setTimeout(() => markerEl.classList.remove('marker-highlight'), 1500);
}

async function goTo(item) {
  clearResultsLater();
  if (inputEl) inputEl.blur();

  const zoom =
    item.type === 'region' ? 0.8 :
    item.type === 'dungeon' ? 1.2 :
                              1.3;

  const core  = window.GDMMCore || {};
  const state = core.state || {};
  const targetProfile = item.profile;

  // 1) Même profil → on ne touche pas au select, on centre + pulse
  if (state.active === targetProfile) {
    if (typeof window.centerOn === 'function') {
      window.centerOn(item.xp, item.yp, zoom);
      highlightAtCenter(item);
    }
    return;
  }

  // 2) Profil différent → on passe par le <select id="profileSelect">
  const sel = document.getElementById('profileSelect');
  if (!sel) return;

  sel.value = targetProfile;

  if (typeof item.xp === 'number' && typeof item.yp === 'number') {
    state.skipViewRestoreOnce = true;
  }

  // Profil change simulation
  sel.dispatchEvent(new Event('change', { bubbles: true }));

  // After delay -> Pulse
  if (typeof window.centerOn === 'function') {
    setTimeout(() => {
      window.centerOn(item.xp, item.yp, zoom);
      highlightAtCenter(item);
    }, 400);
  }
}

  function init() {
    inputEl   = document.getElementById('locationSearch');
    resultsEl = document.getElementById('locationSearchResults');
    if (!inputEl || !resultsEl) return;

    buildGlobalIndex();

    function debounce(fn, delay = 150) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), delay);
      };
    }

    const onSearchInput = debounce((term) => {
      const results = search(term);
      renderResults(results);
    }, 180);

    inputEl.addEventListener('input', (e) => {
      onSearchInput(e.target.value);
    });


    inputEl.addEventListener('blur', () => {
      clearResultsLater();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        inputEl.blur();
        clearResultsLater();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  // FORCE CTRL + F
    window.addEventListener("keydown", (e) => {
      const isFind = (e.key === "f" || e.key === "F") && (e.ctrlKey || e.metaKey);
      if (!isFind) return;

      // si on est déjà en train d'écrire dans un champ, on laisse le navigateur faire
      const active = document.activeElement;
      if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) {
        return;
      }

      e.preventDefault();

      const searchInput = document.getElementById("locationSearch"); // <-- IMPORTANT : bon ID
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    });



  window.GDMMSearch = {
    refresh,
  };

})();
