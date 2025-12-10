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
    shrine:  'img/icon-shrine.png',
  };


  // --- Global index --------------------------------------

function buildGlobalIndex() {
  rawIndex = [];

  const maps = [
    {
      profile: 'Cairn',
      regionsKey: 'REGION_MARKERS_CAIRN',
      riftsKey:   'RIFT_MARKERS_CAIRN',
      shrinesKey: 'SHRINE_MARKERS_CAIRN',
    },
    {
      profile: 'Malmouth',
      regionsKey: 'REGION_MARKERS_MALMOUTH',
      riftsKey:   'RIFT_MARKERS_MALMOUTH',
      shrinesKey: 'SHRINE_MARKERS_MALMOUTH',
    },
    {
      profile: 'Korvan Basin',
      regionsKey: 'REGION_MARKERS_KORVAN',
      riftsKey:   'RIFT_MARKERS_KORVAN',
      shrinesKey: 'SHRINE_MARKERS_KORVAN',
    },
  ];

    maps.forEach(cfg => {
      const regions = window[cfg.regionsKey] || [];
      const rifts   = window[cfg.riftsKey]   || [];
      const shrines = window[cfg.shrinesKey] || [];


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

      shrines.forEach(m => {
        rawIndex.push({
          profile: cfg.profile,
          type: 'shrine',
          id: m.id,
          tag: m.regionTag || m.tag || null,  // pour getRegionLabel + recherche
          xp: m.xp,
          yp: m.yp,
          difficulty: m.difficulty || 'normal',
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
    const q = normalize(term || "").trim();
    if (!q) return [];

    // On découpe en mots, on garde seulement ceux qui contiennent des lettres/chiffres
    const tokens = q.split(/\s+/).filter(tok => tok && /[0-9a-z\u00c0-\u024f]/i.test(tok));
    if (!tokens.length) return [];

    const results = [];

    rawIndex.forEach(item => {
      // 1) Label de base = nom de région (comme avant)
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

      const baseLabel   = label || '';
      const nBaseLabel  = normalize(baseLabel);

      // 2) Libellé de type (i18n)
      let typeLabel = '';

        if (item.type === 'rift') {
          typeLabel = t('ui.rift');
        } 
        else if (item.type === 'dungeon') {
          typeLabel = t('ui.dungeon'); 
        } 
        else if (item.type === 'shrine') {
          typeLabel = t('ui.shrine');
        } 
        else {
          typeLabel = t('ui.region');
        }

      // 3) Texte utilisé pour le match
      //  région + type + éventuellement mot "Sanctuaire" + difficulté
      let searchText = nBaseLabel;

      if (item.type === 'shrine') {
        // Mot "Sanctuaire"/"Shrine" dans la langue actuelle
        let shrineWord = t('ui.shrine');
        if (!shrineWord || shrineWord === 'ui.shrine') {
          shrineWord = t('ui.shrine') || 'Shrine';
        }
        searchText += ' ' + normalize(shrineWord);

        // Difficulté
        let diffKey = 'ui.shrineTierNormal';
        if (item.difficulty === 'elite') diffKey = 'ui.shrineTierElite';
        else if (item.difficulty === 'ultimate') diffKey = 'ui.shrineTierUltimate';

        const diffText = t(diffKey) || item.difficulty || '';
        if (diffText) {
          searchText += ' ' + normalize(diffText);
        }
      } else {
        if (typeLabel) {
          searchText += ' ' + normalize(typeLabel);
        }
      }

      // 4) Filtre : tous les tokens doivent être présents, ordre libre
      const haystack = searchText;
      const matchesAll = tokens.every(tok => haystack.includes(tok));
      if (!matchesAll) return;

      // 5) On garde le résultat
      results.push({
        ...item,
        label: baseLabel,
        typeLabel,
      });
    });

    return results.slice(0, 100);
  }



/*----------------MARKER SEARCH--------------------------------------------------*/

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
/*----------------END MARKER SEARCH--------------------------------------------------*/



/*----------------NOTE SEARCH--------------------------------------------------*/

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
/*----------------END NOTE SEARCH--------------------------------------------------*/


function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Surbrillance des mots tapés dans la recherche
  function highlightLabel(label, tokens) {
    if (!label) return '';
    if (!tokens || !tokens.length) return escapeHtml(label);

    // On ne surligne que les mots "significatifs" ( 2 lettres)
    let uniq = Array.from(new Set(
      tokens
        .map(t => (t || '').trim())
        .filter(t => t.length >= 2)
    ));

    if (!uniq.length) {
      return escapeHtml(label);
    }

    uniq.sort((a, b) => b.length - a.length);

    const pattern = new RegExp(
      '(' + uniq.map(escapeRegex).join('|') + ')',
      'gi'
    );

    const html = escapeHtml(label);

    return html.replace(pattern, match => {
      return `<span class="search-match">${match}</span>`;
    });
  }



/*----------------RENDER RESULT--------------------------------------------------*/

function renderResults(list) {
  if (!resultsEl) return;

  resultsEl.innerHTML = '';
  if (!list.length) {
    resultsEl.style.display = 'none';
    return;
  }

  const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
    ? GDMMLang.t.bind(GDMMLang)
    : (k) => k;

  // Récupère ce que l'utilisateur a tapé pour le highlight
  let rawTerm = (inputEl && inputEl.value) || '';
  rawTerm = rawTerm.trim();

  // Mode "/": on retire le slash pour matcher les mots
  if (rawTerm.startsWith('/')) {
    rawTerm = rawTerm.slice(1).trim();
  }

  const tokens = rawTerm ? rawTerm.split(/\s+/).filter(Boolean) : [];

  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'search-result';
    row.classList.add(`type-${item.type}`);

    if (item.type === 'shrine') {
      const diff = item.difficulty || 'normal';
      row.classList.add(`shrine-${diff}`);
    }

    if (item.type === 'marker' && item.cat) {
      row.classList.add(`cat-${item.cat.toLowerCase()}`);
    }
    if (item.type === 'marker' && item.done) {
      row.classList.add('completed');
    }

    // Icône principale
    const icon = document.createElement('img');
    icon.className = 'search-type-icon';
    icon.draggable = false;

    // Label principal
    const span = document.createElement('span');
    span.className = 'search-label';

    // --- Texte + icône selon le type ------------------------

    if (item.type === 'note') {
      // Note de région : "Nom de région - début de la note…"
      let preview = '';
      if (item.note) {
        const trimmed = item.note.trim();
        preview = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
      }

      const labelText = preview
        ? `${item.label} - ${preview}`
        : item.label;

      span.innerHTML = highlightLabel(labelText, tokens);

      icon.src = TYPE_ICON_PATHS.note;
    }

    else if (item.type === 'shrine') {
      const shrineWord = t('ui.shrine') || 'Shrine';

      // Texte de difficulté i18n
      let diffKey = 'ui.shrineTierNormal';
      if (item.difficulty === 'elite') diffKey = 'ui.shrineTierElite';
      else if (item.difficulty === 'ultimate') diffKey = 'ui.shrineTierUltimate';

      const diffText = t(diffKey) || (item.difficulty || '');

      let labelText;
      if (diffText) {
        labelText = `${shrineWord} - ${item.label} - ${diffText} (${item.profile})`;
      } else {
        labelText = `${shrineWord} - ${item.label} (${item.profile})`;
      }

      span.innerHTML = highlightLabel(labelText, tokens);

      // Icône selon la difficulté (comme sur la map)
      let iconPath = 'img/icon-shrine.png';
      if (item.difficulty === 'elite') {
        iconPath = 'img/icon-shrine-e.png';
      } else if (item.difficulty === 'ultimate') {
        iconPath = 'img/icon-shrine-u.png';
      }
      icon.src = iconPath;
    }

    else {
        let labelText;

        if (item.type === 'rift') {
          // Pas de catégorie pour les failles
          labelText = `${item.label} (${item.profile})`;
        } else {
          // Types classiques : region / dungeon / marker
          labelText =
            item.typeLabel && item.label
              ? `${item.typeLabel} - ${item.label} (${item.profile})`
              : item.label || '';
        }

        span.innerHTML = highlightLabel(labelText, tokens);


      span.innerHTML = highlightLabel(labelText, tokens);

      // Icône personnalisée pour les markers utilisateurs
      if (item.type === 'marker') {
        if (window.GDMMCore && typeof GDMMCore.iconFor === 'function') {
          icon.src = GDMMCore.iconFor(item.cat) || 'img/pin-general.svg';
        } else {
          icon.src = 'img/pin-general.svg';
        }
      } else {
        // Icônes admin / notes (region / rift / dungeon)
        icon.src = TYPE_ICON_PATHS[item.type] || TYPE_ICON_PATHS.region;
      }
    }

    row.appendChild(icon);
    row.appendChild(span);

    // Ajouter la coche verte à la fin (pour les shrines done)
    if (item.type === 'shrine') {
      if (typeof window.isShrineDoneForActiveChar === 'function' && item.id) {
        const done = isShrineDoneForActiveChar(item.id, item.difficulty);
        if (done) {
          const doneIcon = document.createElement('img');
          doneIcon.className = 'search-shrine-done-icon';
          doneIcon.alt = t('ui.Done') || 'Done';
          doneIcon.src = 'img/check.svg';

          row.appendChild(doneIcon);
        }
      }
    }

    row.addEventListener('mousedown', (e) => {
      e.preventDefault();
      goTo(item);
    });

    resultsEl.appendChild(row);
  });

  resultsEl.style.display = 'block';
}


/*----------------END RENDER RESULT--------------------------------------------------*/



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



/*----------------HIGHLIGHT CENTER--------------------------------------------------*/

  function highlightAtCenter(item) {
    // 1) Cas spécial : marker utilisateur (déjà géré)
    if (item && item.type === 'marker' && item.id) {
      const markerEl = document.querySelector(`.marker[data-mid="${item.id}"]`);
      if (markerEl) {
        markerEl.classList.add('marker-highlight');
        setTimeout(() => markerEl.classList.remove('marker-highlight'), 1500);
      }
      return;
    }

    // 2) Cas spécial : shrine → on cible directement le bon marker
    if (item && item.type === 'shrine' && item.id) {
      const diff = item.difficulty || 'normal';
      const shrineEl = document.querySelector(
        `.marker-shrine[data-shrine-id="${item.id}"][data-difficulty="${diff}"]`
      );

      if (shrineEl) {
        shrineEl.classList.add('marker-highlight');
        setTimeout(() => shrineEl.classList.remove('marker-highlight'), 1500);
        return;
      }
    }

    // 3) Cas classique : rifts / régions (comportement existant)
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

/*----------------END HIGHLIGHT CENTER--------------------------------------------------*/



/*----------------GO TO ITEM--------------------------------------------------*/

async function goTo(item) {
  clearResultsLater();
    if (inputEl) {
    inputEl.value = '';
    inputEl.blur();
  }

 // Assurer que la couche admin est visible pour ce type de résultat
  if (typeof window.ensureAdminLayerVisible === 'function') {
    if (item.type === 'rift') {
      window.ensureAdminLayerVisible('rift');
    } else if (item.type === 'shrine') {
      window.ensureAdminLayerVisible('shrine');
    } else if (item.type === 'region' || item.type === 'dungeon') {
      window.ensureAdminLayerVisible('region');
    }
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

  // 2) Profil différent → on passe par le select
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
/*----------------END GO TO ITEM--------------------------------------------------*/



/*----------------INIT--------------------------------------------------*/
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

        // On injecte le message d'info en haut de la liste
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


    // Quand on clique ailleurs que sur la zone de recherche,on cache les résultats
    inputEl.addEventListener('blur', () => {
      clearResultsLater(1500); // Délai
    });

    // Échap dans l’input
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        inputEl.blur();
        clearResultsLater();
      }
    });

  }
/*----------------END INIT--------------------------------------------------*/



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
