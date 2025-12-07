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

// Helper i18n local pour ce module
const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
  ? GDMMLang.t.bind(GDMMLang)
  : (s) => s;

  // Perso actif pour les notes (fallback global si multi-char pas dispo)
  function getActiveCharacterIdOrFallback() {
    try {
      if (window.characterManager && typeof characterManager.getActiveCharacter === 'function') {
        const c = characterManager.getActiveCharacter();
        if (c && c.id) return c.id;
      }
    } catch (e) {
      console.warn('[GDMM] Failed to read active character for search notes', e);
    }
    return '_global';
  }


  // Chaque entrée de l'index = un lieu unique (toutes maps confondues)
  // { profile, type, tag, xp, yp }
  let rawIndex = [];

  let inputEl = null;
  let resultsEl = null;

  const TYPE_ICON_PATHS = {
    region:  'img/region.svg',
    rift:    'img/rift.png',
    dungeon: 'img/donjon-yellow.svg',
    note:    'img/info-icon.svg',
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


  function searchMarkers(term) {
    const q = normalize(term);
    if (!q) return [];

    const core = window.GDMMCore || {};
    const getCurrentProfile = core.currentProfile || function () { return null; };
    const state = core.state || {};

    const p = getCurrentProfile();
    if (!p || !Array.isArray(p.markers)) return [];

    const profileName = state.active || '';

    const results = [];

    p.markers.forEach((m) => {
      const label = m.label || '';
      const nLabel = normalize(label);

      if (!nLabel.includes(q)) return;

      results.push({
        profile: profileName,
        type: 'marker', 
        id: m.id,
        xp: m.xp,
        yp: m.yp,
        label,
        cat: m.cat || 'General',
        done: m.done || false,
      });
    });

    // On limite un peu quand même
    return results.slice(0, 50);
  }


function searchRegionNotes(term) {
  const q = normalize(term);
  if (!q) return [];

  const core  = window.GDMMCore || {};
  const state = core.state || {};
  const activeProfile = state.active || null;
  if (!activeProfile) return [];

  const REGION_NOTES_KEY = 'gdmm_region_notes_v1';
  let store = {};
  try {
    const raw = localStorage.getItem(REGION_NOTES_KEY);
    store = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[GDMM] Failed to parse region notes store in search', e);
    return [];
  }

    const charKey = getActiveCharacterIdOrFallback();

    const byProfile =
      (store.byCharacter &&
        store.byCharacter[charKey] &&
        store.byCharacter[charKey][activeProfile]) ||
      (store.global && store.global[activeProfile]) ||
      {};

    const results = [];

  Object.keys(byProfile).forEach(regionId => {
    const rawNote = byProfile[regionId];

    // --- compatibilité ancien / nouveau format ---
    let noteText = "";
    if (typeof rawNote === "string") {
      noteText = rawNote;
    } else if (rawNote && typeof rawNote === "object") {
      noteText = rawNote.text || "";
    }

    const nNote = normalize(noteText);

    // Chercher aussi dans le nom de la région
    const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
    if (!regionEl) return;

    const labelEl = regionEl.querySelector('.region-label');
    const regionName = (labelEl && labelEl.textContent.trim()) || regionId;
    const nRegionName = normalize(regionName);

    // Match note OU nom de région
    if (!nNote.includes(q) && !nRegionName.includes(q)) return;

    const xp = parseFloat(regionEl.dataset.xp);
    const yp = parseFloat(regionEl.dataset.yp);
    if (isNaN(xp) || isNaN(yp)) return;

    results.push({
      profile: activeProfile,
      type: 'note',
      regionId,
      xp,
      yp,
      label: regionName,
      note: noteText
    });
  });

  return results.slice(0, 50);
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

        if (item.type === 'marker' && item.cat) {
          row.classList.add(`cat-${item.cat.toLowerCase()}`);
        }

        if (item.type === 'marker' && item.done) {
          row.classList.add('completed');
        }

        // Icône SVG
        const icon = document.createElement('img');
        icon.className = 'search-type-icon';
        icon.src = TYPE_ICON_PATHS[item.type] || TYPE_ICON_PATHS.region;
        icon.draggable = false;

        const span = document.createElement('span');
        span.className = 'search-label';

        const t = window.GDMMLang?.t;
        let typeLabel;

        // MARKER USER → utiliser la catégorie réelle
        if (item.type === 'marker') {
          const cat = item.cat || 'General';
          typeLabel = t ? t(`ui.${cat}Marker`) : cat;
        }
        // ADMIN TYPES → Rift / Region / Dungeon
        else if (item.type !== 'note') {
          typeLabel = t ? t(`ui.${item.type}`) : item.type;
        }

        // --- Texte affiché ---
        if (item.type === 'note') {
          // Note de région : "Nom de région - début de la note…"
          let preview = '';
          if (item.note) {
            const trimmed = item.note.trim();
            preview = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
          }

          span.textContent = preview
            ? `${item.label} - ${preview}`
            : item.label; // fallback si jamais la note est vide
        } else {
          // Comportement classique pour les autres types
          span.textContent = `${typeLabel} - ${item.label} (${item.profile})`;
        }

        // --- Icône personnalisée pour les markers utilisateurs ---
        if (item.type === 'marker') {
          // On récupère l’icône du marker utilisateur (déjà utilisée en map)
          if (window.GDMMCore && typeof GDMMCore.iconFor === 'function') {
            icon.src = GDMMCore.iconFor(item.cat) || 'img/pin-general.svg';
          } else {
            icon.src = 'img/pin-general.svg';
          }
        } else {
          // Icônes admin / notes (region / rift / dungeon / note)
          icon.src = TYPE_ICON_PATHS[item.type] || TYPE_ICON_PATHS.region;
        }

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



function clearResultsLater(delay = 150) {
  if (!resultsEl) return;

  // On évite plusieurs timers en parallèle
  if (clearResultsLater._timer) {
    clearTimeout(clearResultsLater._timer);
  }

  clearResultsLater._timer = setTimeout(() => {
    resultsEl.style.display = 'none';
    resultsEl.innerHTML = '';
  }, delay);
}



  function highlightAtCenter(item) {
    // Cas spécial : marker utilisateur (on le connaît par son id)
    if (item && item.type === 'marker' && item.id) {
      const markerEl = document.querySelector(`.marker[data-mid="${item.id}"]`);
      if (markerEl) {
        markerEl.classList.add('marker-highlight');
        setTimeout(() => markerEl.classList.remove('marker-highlight'), 1500);
      }
      return;
    }

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
      // Only dungeon / region
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
    if (inputEl) {
    inputEl.value = '';
    inputEl.blur();
  }

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

    const onSearchInput = debounce((rawTerm) => {
      const term = rawTerm || '';
      const trimmed = term.trim();

      // Mode "perso" si le terme commence par "/"
      // Markers perso + notes de région
      if (trimmed.startsWith('/')) {
        const markerTerm = trimmed.slice(1).trim();

        const markerResults = searchMarkers(markerTerm);
        const noteResults   = searchRegionNotes(markerTerm);

        const results = [...markerResults, ...noteResults];

        // On rend d'abord les résultats
        renderResults(results);

        // Puis on injecte le petit message d'info en haut de la liste
        if (resultsEl) {
          const info = document.createElement('div');
          info.className = 'search-info';
          info.textContent = t('search.CustomLocalOnly');

          if (resultsEl.firstChild) {
            resultsEl.insertBefore(info, resultsEl.firstChild);
          } else {
            resultsEl.appendChild(info);
          }
        }

        return;
      }

      // Mode normal : lieux (régions / donjons / rifts)
      const results = search(term);
      renderResults(results);
    }, 180);



    inputEl.addEventListener('input', (e) => {
      onSearchInput(e.target.value);
    });

    // Quand on clique ailleurs que sur la zone de recherche,
    // on cache les résultats

    inputEl.addEventListener('blur', () => {
      clearResultsLater(1500); // petit délai pour laisser passer un éventuel clic sur un résultat
    });

    // Échap dans l’input
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
