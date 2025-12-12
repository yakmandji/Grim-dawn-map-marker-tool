// ui.shrine.js
(function () {

  //LISTES PAR MAP -------------------------------------------------
  window.SHRINE_MARKERS_CAIRN = [
    { id: 'shrine_Burial_Hill', regionTag: 'tagMapBurialHill', xp: 70.09, yp: 83.85, difficulty: 'normal' },
    { id: 'shrine_MapFoggy_Bank', regionTag: 'tagMapFoggyBank', xp: 64.77, yp: 74.89, difficulty: 'normal' },
    { id: 'shrine_Devils_Crossing_Aquifer', regionTag: 'tagUGDevilsCrossingAquifer', xp: 71.19, yp: 90.63, difficulty: 'normal' },
    { id: 'shrineMapFloodedPassage01', regionTag: 'tagMapFloodedPassage01', xp: 63.82, yp: 69.77, difficulty: 'normal' },
    { id: 'shrineUGBurialCave', regionTag: 'tagUGBurialCave', xp: 63.37, yp: 67.00, difficulty: 'normal' },
    { id: 'shirneMapBurrwitchEstates', regionTag: 'tagMapBurrwitchEstates', xp: 68.52, yp: 60.07, difficulty: 'normal' },
    { id: 'shrineMapOminousLair', regionTag: 'tagMapOminousLair', xp: 62.00, yp: 50.66, difficulty: 'normal' },
    { id: 'shrinetagMapEastMarsh03', regionTag: 'tagMapEastMarsh03', xp: 80.67, yp: 65.27, difficulty: 'normal' },
    { id: 'shrinetagWorldMapWitchGodTemple', regionTag: 'tagWorldMapWitchGodTemple', xp: 86.88, yp: 64.84, difficulty: 'normal' },
    { id: 'shrinetagUGArkovianFoothills02', regionTag: 'tagUGArkovianFoothills02', xp: 60.83, yp: 84.68, difficulty: 'normal' },
    { id: 'shrinetagMapRockyCoast', regionTag: 'tagMapRockyCoast', xp: 53.81, yp: 80.69, difficulty: 'normal' },
    { id: 'shrinetagMapCronleysHideout', regionTag: 'tagMapCronleysHideout', xp: 55.46, yp: 69.97, difficulty: 'normal' },
    { id: 'shrinetagMapOldArkovia', regionTag: 'tagMapOldArkovia', xp: 49.95, yp: 79.05, difficulty: 'normal' },
    { id: 'shrinetagUGOldArkovia02', regionTag: 'tagUGOldArkovia02', xp: 49.09, yp: 67.30, difficulty: 'normal' },
    { id: 'shrinetagMapBarrenHighlands', regionTag: 'tagMapBarrenHighlands', xp: 43.05, yp: 81.97, difficulty: 'normal' },
    { id: 'shrinetagUGBrokenHills02B', regionTag: 'tagUGBrokenHills02B', xp: 50.91, yp: 94.66, difficulty: 'normal' },
    { id: 'shrinetagMapMountainDeeps', regionTag: 'tagMapMountainDeeps', xp: 21.98, yp: 75.46, difficulty: 'normal' },
    { id: 'shrinetagUGJaggedWasteCave02', regionTag: 'tagUGJaggedWasteCave02', xp: 35.71, yp: 82.72, difficulty: 'normal' },
    { id: 'shrinetagMapJaggedWasteFort', regionTag: 'tagMapJaggedWasteFort', xp: 44.12, yp: 72.87, difficulty: 'normal' },
    { id: 'shrinetagMapInfestedFarms', regionTag: 'tagMapInfestedFarms', xp: 32.53, yp: 65.68, difficulty: 'normal' },
    { id: 'shrinetagUGHomesteadCave01', regionTag: 'tagUGHomesteadCave01', xp: 14.63, yp: 64.63, difficulty: 'normal' },
    { id: 'shrinetagMapConflagration01', regionTag: 'tagMapConflagration01', xp: 40.08, yp: 58.55, difficulty: 'normal' },
    { id: 'shrinetagMapPortValbury', regionTag: 'tagMapPortValbury', xp: 43.73, yp: 30.88, difficulty: 'normal' },
    { id: 'shrinetagMapBloodGrove', regionTag: 'tagMapBloodGrove', xp: 31.37, yp: 53.93, difficulty: 'normal' },
    { id: 'shrinetagMapDarkvale', regionTag: 'tagMapDarkvale', xp: 23.62, yp: 45.43, difficulty: 'normal' },
    { id: 'shrinetagMapAlpineValley', regionTag: 'tagMapAlpineValley', xp: 6.72, yp: 30.12, difficulty: 'normal' },
    { id: 'shrinetagMapAlpineValleyWest', regionTag: 'tagMapAlpineValley', xp: 12.00, yp: 30.93, difficulty: 'normal' },
    { id: 'shrinetagGDX1MapDarkWood', regionTag: 'tagGDX1MapDarkWood', xp: 77.96, yp: 51.51, difficulty: 'normal' },
    { id: 'shrineUgdenbogCave04', regionTag: 'tagGDX1UGUgdenbogCave04', xp: 91.99, yp: 33.29, difficulty: 'normal' },
    { id: 'shrineGDX1UGAncientGrove01', regionTag: 'tagGDX1UGAncientGrove01', xp: 94.42, yp: 52.13, difficulty: 'normal' },
    { id: 'shrineUGCryptFactionBattle02', regionTag: 'tagUGCryptFactionBattle02', xp: 4.20, yp: 21.35, difficulty: 'normal' },
    { id: 'shrineMapBloodGroveAetherMine', regionTag: 'tagMapBloodGroveAetherMine', xp: 34.18, yp: 46.64, difficulty: 'elite' },
    { id: 'shrinetagUGCryptNecropolis01', regionTag: 'tagUGCryptNecropolis01', xp: 33.48, yp: 9.95, difficulty: 'normal' },
    { id: 'shrinetagUGCryptFinal01', regionTag: 'tagUGCryptFinal01', xp: 14.86, yp: 7.61, difficulty: 'normal' },
    { id: 'shrinetagUGVoidlands01', regionTag: 'tagUGVoidlands01', xp: 31.86, yp: 0.56, difficulty: 'normal' },
    { id: 'shrinetagMapHallowedHill', regionTag: 'tagMapHallowedHill', xp: 71.10, yp: 64.58, difficulty: 'elite' },
    { id: 'shrinetagMapNecropolis', regionTag: 'tagMapNecropolis', xp: 24.31, yp: 7.53, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGUgdenbogVoidRift01', regionTag: 'tagGDX1UGUgdenbogVoidRift01', xp: 78.79, yp: 21.41, difficulty: 'elite' },
    { id: 'shrinetagMapHiddenPath01', regionTag: 'tagMapHiddenPath01', xp: 67.36, yp: 84.30, difficulty: 'ultimate' },
    { id: 'shrinetagUGSecret02', regionTag: 'tagUGSecret02', xp: 28.57, yp: 21.00, difficulty: 'ultimate' },
    { id: 'shrinetagGDX1MapUgdenbogAncient', regionTag: 'tagGDX1MapUgdenbogAncient', xp: 90.31, yp: 40.50, difficulty: 'ultimate' },
    { id: 'shrinetagGDX1UGUgdenbogMine01', regionTag: 'tagGDX1UGUgdenbogMine01', xp: 98.86, yp: 27.29, difficulty: 'ultimate' },
  ];

  window.SHRINE_MARKERS_MALMOUTH = [
    { id: 'shrineGDX1MapMalmouthOutskirtsRuins', regionTag: 'tagGDX1MapMalmouthOutskirtsRuins', xp: 69.60, yp: 47.57, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGMalmouthLighthouse01', regionTag: 'tagGDX1UGMalmouthLighthouse01', xp: 12.79, yp: 57.81, difficulty: 'normal' },
    { id: 'shrinetagGDX1MapMalmouthInner', regionTag: 'tagGDX1MapMalmouthInner', xp: 47.75, yp: 14.22, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGMalmouthAetherialFactory01', regionTag: 'tagGDX1UGMalmouthAetherialFactory01', xp: 24.48, yp: 14.76, difficulty: 'ultimate' },
    { id: 'shrinetagGDX2RuinedDC', regionTag: 'tagGDX2RuinedDC', xp: 83.50, yp: 53.86, difficulty: 'ultimate' },
  ];

  window.SHRINE_MARKERS_KORVAN = [
    { id: 'shrinetagGDX2CairanRuins01', regionTag: 'tagGDX2CairanRuins01', xp: 11.74, yp: 50.72, difficulty: 'normal' },
    { id: 'shrinetagSplendorOfShatteredRealm', regionTag: 'tagSplendorOfShatteredRealm', xp: 27.44, yp: 93.95, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedTemple01', regionTag: 'tagGDX2MapRuinedTemple01', xp: 55.74, yp: 89.23, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapHiddenOasis', regionTag: 'tagGDX2MapHiddenOasis', xp: 33.76, yp: 71.72, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedCity01', regionTag: 'tagGDX2MapRuinedCity01', xp: 30.53, yp: 45.04, difficulty: 'normal' },
    { id: 'shrinetagGDX2SanctuaryOfHorran', regionTag: 'tagGDX2SanctuaryOfHorran', xp: 45.56, yp: 42.08, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedCity02', regionTag: 'tagGDX2MapRuinedCity02', xp: 74.37, yp: 43.74, difficulty: 'normal' },
    { id: 'shrinetagGDX2VOTC02', regionTag: 'tagGDX2VOTC02', xp: 71.11, yp: 35.37, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRaisedTemple', regionTag: 'tagGDX2MapRaisedTemple', xp: 51.95, yp: 15.22, difficulty: 'normal' },
    { id: 'shrinetagGDX2KorvaakTomb01', regionTag: 'tagGDX2KorvaakTomb01', xp: 60.73, yp: -4.00, difficulty: 'normal' },
    { id: 'shrinetagGDX2Roguelike_01', regionTag: 'tagGDX2Roguelike_01', xp: 82.94, yp: 20.85, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGSecret01Korvan', regionTag: 'tagGDX1UGSecret01', xp: 17.87, yp: 23.93, difficulty: 'ultimate' },
  ];

  // MAPPING PAR TAILLE D’IMAGE
  window.SHRINE_MARKERS_BY_SIZE = {
    '8948x9133': window.SHRINE_MARKERS_CAIRN,
    '5142x3574': window.SHRINE_MARKERS_MALMOUTH,
    '5427x5553': window.SHRINE_MARKERS_KORVAN,
  };

  /* SHRINE HELPER ------------------------------------------------------*/
  const SHRINE_STORE_KEY = 'gdmm_shrine_progress_v1';
  let shrineStoreCache = null;

  function loadShrineStore() {
    if (shrineStoreCache) return shrineStoreCache;
    let store = null;
    try {
      const raw = localStorage.getItem(SHRINE_STORE_KEY);
      store = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[GDMM] Failed to parse shrine store', e);
      store = null;
    }

    if (!store || typeof store !== 'object') {
      store = { __schema: 1, byCharacter: {} };
    } else {
      store.__schema = store.__schema || 1;
      store.byCharacter = store.byCharacter || {};
    }

    shrineStoreCache = store;
    return store;
  }

  function saveShrineStore(store) {
    shrineStoreCache = store;
    try {
      localStorage.setItem(SHRINE_STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('[GDMM] Failed to save shrine store', e);
    }
  }

  function getActiveCharShrineData(createIfMissing = false) {
    const store = loadShrineStore();
    const charKey = getActiveCharacterKeyForShrines();

    if (!store.byCharacter[charKey] && createIfMissing) {
      store.byCharacter[charKey] = { completed: {} };
    }
    return { store, charKey, charData: store.byCharacter[charKey] || { completed: {} } };
  }


  /* CLEAR ALL SHRINE ------------------------------------------------------*/

  function clearAllShrinesForActiveChar() {
    const { store, charKey } = getActiveCharShrineData(false);
    if (!store.byCharacter[charKey]) {
      return; // rien à faire pour ce perso
    }

    // 1) Reset des données pour ce personnage
    store.byCharacter[charKey].completed = {};
    saveShrineStore(store);

    // 2) Reset visuel sur la map (classe + badge)
    document.querySelectorAll('.marker-shrine').forEach(el => {
      el.classList.remove('shrine-done');
      const badge = el.querySelector('.shrine-done-badge');
      if (badge) badge.remove();
    });

    // 3) MAJ du compteur
    if (typeof updateShrineCounterUI === 'function') {
      updateShrineCounterUI();
    }

    // 4) Fermer la popup si ouverte
    if (typeof closeShrinePanel === 'function') {
      closeShrinePanel();
    }
  }
  /* END CLEAR ALL SHRINE ------------------------------------------------------*/

  function isShrineDoneForActiveChar(shrineId, difficulty) {
    const { charData } = getActiveCharShrineData(false);
    const completed = charData.completed || {};
    const entry = completed[shrineId];
    if (!entry) return false;
    const d = difficulty || 'normal';
    return !!entry[d];
  }

  function setShrineDoneForActiveChar(shrineId, difficulty, isDone) {
    const { store, charKey } = getActiveCharShrineData(true);
    const charData = store.byCharacter[charKey];
    charData.completed = charData.completed || {};
    const entry = charData.completed[shrineId] || { normal: false, elite: false, ultimate: false };

    const d = difficulty || 'normal';
    entry[d] = !!isDone;
    charData.completed[shrineId] = entry;

    saveShrineStore(store);

    // MAJ visuelle des icônes sur la map
    refreshShrineDoneClasses(shrineId, d);
    // MAJ du compteur global
    updateShrineCounterUI();
  }


  function refreshShrineDoneClasses(shrineId, difficulty) {
    const d = difficulty || 'normal';
    const done = isShrineDoneForActiveChar(shrineId, d);

    document
      .querySelectorAll(`.marker-shrine[data-shrine-id="${shrineId}"][data-difficulty="${d}"]`)
      .forEach(el => {
        el.classList.toggle('shrine-done', done);

        // --- AJOUT OU SUPPRESSION DU BADGE ---
        if (done) {
          if (!el.querySelector('.shrine-done-badge')) {
            const badge = document.createElement('div');
            badge.className = 'shrine-done-badge';
            el.appendChild(badge);
          }
        } else {
          const b = el.querySelector('.shrine-done-badge');
          if (b) b.remove();
        }
      });
  }


/*------SHRINE COUNT----------------------------------------------------------------*/
  let shrineBaseCounts = null;

  function getShrineBaseCounts() {
    if (shrineBaseCounts) return shrineBaseCounts;

    const src = window.SHRINE_MARKERS_BY_SIZE || {};
    const byId = {};

    // On déduplique par id (au cas où un même shrine existe sur plusieurs tailles de map)
    Object.keys(src).forEach(key => {
      const arr = src[key];
      if (!Array.isArray(arr)) return;
      arr.forEach(m => {
        if (!m || !m.id) return;
        if (!byId[m.id]) {
          byId[m.id] = m;
        }
      });
    });

    const res = { normal: 0, elite: 0, ultimate: 0 };

    Object.values(byId).forEach(m => {
      const d = m.difficulty || 'normal';
      if (d === 'elite') res.elite++;
      else if (d === 'ultimate') res.ultimate++;
      else res.normal++;
    });

    shrineBaseCounts = res;
    return res;
  }
/*------END SHRINE COUNT----------------------------------------------------------------*/


/*------SHRINE COUNT ACTIVE CHARACTER------------------------------------------------------*/
  function computeShrineCountersForActiveChar() {
    const base = getShrineBaseCounts(); // { normal, elite, ultimate }
    const { charData } = getActiveCharShrineData(false);
    const completed = (charData && charData.completed) || {};

    let hasElite = false;
    let hasUltimate = false;

    // Est-ce que ce perso a coché au moins 1 shrine elite / ultimate
    Object.values(completed).forEach(entry => {
      if (!entry) return;
      if (entry.elite) hasElite = true;
      if (entry.ultimate) hasUltimate = true;
    });

    // Détermine jusqu’à quel palier on compte
    let tier = 'normal';
    if (hasUltimate) tier = 'ultimate';
    else if (hasElite) tier = 'elite';

    // Max (dénominateur)
    let max = base.normal;
    if (tier === 'elite') {
      max += base.elite;
    } else if (tier === 'ultimate') {
      max += base.elite + base.ultimate;
    }

    // Done (numérateur)
    let done = 0;
    Object.values(completed).forEach(entry => {
      if (!entry) return;

      if (entry.normal) done++;
      if (tier !== 'normal' && entry.elite) done++;
      if (tier === 'ultimate' && entry.ultimate) done++;
    });

    return { done, max, tier, base };
  }
/*------END SHRINE COUNT ACTIVE CHARACTER----------------------------------------------------------------*/


  function updateShrineCounterUI() {
  const doneEl = document.getElementById('shrineCountDone');
  const maxEl = document.getElementById('shrineCountMax');
  if (!doneEl || !maxEl) return;

  const { done, max } = computeShrineCountersForActiveChar();

  doneEl.textContent = done;
  maxEl.textContent = max;
  }


  // Retourne une clé stable pour le perso actif
  function getActiveCharacterKeyForShrines() {
    try {
      if (window.characterManager && typeof characterManager.getActiveCharacter === 'function') {
        const c = characterManager.getActiveCharacter();
        if (c && c.id) return c.id;
      }
    } catch (e) {
      console.warn('[GDMM] Failed to read active character for shrines', e);
    }
    return '_global';
  }



// === SHRINE CLICK POPUP (minimal) ======================================
  let shrinePanel = null;
  let currentShrineId = null;

  function closeShrinePanel() {
    if (!shrinePanel) return;
    shrinePanel.style.display = 'none';
  }

  function openShrinePanel(shrineCfg, anchorEl) {

    // 1) Si on reclique sur le même shrine alors que le panel est ouvert on le ferme
    if (shrinePanel && shrinePanel.style.display !== 'none' && currentShrineId === shrineCfg.id) {
      closeShrinePanel();
      return;
    }

    currentShrineId = shrineCfg.id;

    const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
      ? GDMMLang.t.bind(GDMMLang)
      : (k) => k;

    // 2) S'il y avait déjà un panel, on le supprime
    if (shrinePanel) {
      shrinePanel.remove();
      shrinePanel = null;
    }

    // 3) On recrée un panel tout neuf
    shrinePanel = document.createElement('div');
    shrinePanel.className = 'marker-popup shrine-popup';
    shrinePanel.id = 'shrinePanel';

    // Contenu uniquement checkbox + "Terminé"
    const row = document.createElement('label');
    row.className = 'shrine-done-row';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'shrine-done-input checkbox-green';

    const span = document.createElement('span');
    span.className = 'shrine-done-label';
    span.textContent = t('ui.Done') || 'Done';

    row.appendChild(input);
    row.appendChild(span);

    shrinePanel.appendChild(row);
    document.body.appendChild(shrinePanel);

    // 4) On synchronise la checkbox avec la save
    const inputEl = shrinePanel.querySelector('.shrine-done-input');
    if (inputEl) {
      const isDone = isShrineDoneForActiveChar(
        shrineCfg.id,
        shrineCfg.difficulty
      );
      inputEl.checked = isDone;

        inputEl.onchange = () => {
          setShrineDoneForActiveChar(
            shrineCfg.id,
            shrineCfg.difficulty,
            inputEl.checked
          );

          inputEl.blur();

          setTimeout(() => {
            closeShrinePanel();
          }, 800);
        };
    }

    // 5) Position en haut à gauche du marker
    const rect = anchorEl.getBoundingClientRect();
    shrinePanel.style.position = 'fixed';
    shrinePanel.style.left = `${rect.left - 5}px`;
    shrinePanel.style.top  = `${rect.top - 5}px`;
    shrinePanel.style.display = 'block';
  }


  // Fermer la popup shrine dès qu'on commence à panner la carte
  (function setupShrinePanelPanClose() {
    const mapInner = document.querySelector('.mapInner') || document.querySelector('.mapWrap');
    if (!mapInner) return;

    mapInner.addEventListener('pointerdown', (e) => {
      // si on clique dans la popup, on ne ferme pas
      if (shrinePanel && shrinePanel.contains(e.target)) return;
      closeShrinePanel();
    });
  })();


  window.openShrinePanel = openShrinePanel;

/* ----------------------------------------------------------------END NOTE PANEL*/

  window.isShrineDoneForActiveChar = isShrineDoneForActiveChar;
  window.setShrineDoneForActiveChar = setShrineDoneForActiveChar;
  window.clearAllShrinesForActiveChar = clearAllShrinesForActiveChar;
  window.updateShrineCounterUI = updateShrineCounterUI;
  window.openShrinePanel = openShrinePanel;

})();
