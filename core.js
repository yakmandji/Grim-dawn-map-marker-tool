/*!
 * Grim Dawn Map Marker Tool
 * © 2025 [Yakmandji] — Licensed under CC BY-NC-ND 4.0
 * Original: [https://yakmandji.github.io/Grim-dawn-map-marker-tool/]
 * Unauthorized redistribution or modification is prohibited.
 */

(function(){
  const DEV_MODE = false;

  // --- State  ---
  const state = {
    profiles: {},
    active: null,
    view: { scale: 1, x: 0, y: 0 },
    tool: 'pan',
    locked: true,
    mapNatural: { w: 0, h: 0 },
    mapReady: false,
    lastCreatedMarkerId: null,
    sharedView: false,
    sharedProfileName: null,
    skipViewRestoreOnce: false,
  };

  // --- Utils ---
  const now   = () => new Date().toISOString();
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const uid   = () => Math.random().toString(36).slice(2, 10);

  // --- Icons by catégorie for UI ---
  const defaultIcons = {
    General:  '', 
    Quest:    'img/quest.svg',
    Boss:     'img/boss.svg',
    Loot:     'img/loot.svg',
    Waypoint: 'img/waypoint.svg',
    Donjon:   'img/donjon.svg',
    NPC:      'img/npc.svg'
  };

  // --- Save indicator ---
  function updateSaveIndicator(saved) {
    const el = document.querySelector('#saveStatus');
    if (!el) return;

    if (saved) {
      el.setAttribute('data-i18n', 'toast.SaveState');
      el.textContent = GDMMLang.t('toast.SaveState');
      el.style.color = '#8be38b';
    } else {
      el.setAttribute('data-i18n', 'toast.UnsaveState');
      el.textContent = GDMMLang.t('toast.UnsaveState');
      el.style.color = '#ff6b7a';
    }
  }

  updateSaveIndicator(true);

  function markAsChanged(){
    updateSaveIndicator(false);
  }
  //------------------------


  const iconFor = (cat) => {
    if (!cat) return '';
    const lower = String(cat).toLowerCase();
    const key = Object.keys(defaultIcons).find(
      k => k.toLowerCase() === lower
    );
    return key ? defaultIcons[key] : '';
  };
  const isColorAllowed = () => true;


  // --- Profils ---
  function currentProfile(){
    return state.active ? state.profiles[state.active] : null;
  }

  function ensureProfile(name){
    if (!state.profiles[name]) {
      state.profiles[name] = { markers: [], map: {}, created: now(), updated: now() };
    }
    return state.profiles[name];
  }

  function setActiveProfile(name){
    if (!name) return null;
    const p = ensureProfile(name);
    state.active = name;
    return p;
  }

  function createProfile(name){
    if (!name) return null;
    if (state.profiles[name]) return null;
    state.profiles[name] = { markers: [], map: {}, created: now(), updated: now() };
    state.active = name;
    return state.profiles[name];
  }

  function renameProfile(oldName, newName){
    if (!oldName || !newName) return false;
    if (!state.profiles[oldName]) return false;
    if (state.profiles[newName]) return false;
    state.profiles[newName] = JSON.parse(JSON.stringify(state.profiles[oldName]));
    delete state.profiles[oldName];
    if (state.active === oldName) state.active = newName;
    return true;
  }

  function deleteProfile(name){
    if (!state.profiles[name]) return false;
    delete state.profiles[name];
    if (state.active === name) {
      const next = Object.keys(state.profiles)[0] || null;
      state.active = next;
    }
    return true;
  }

  function listProfiles(){
    return Object.keys(state.profiles);
  }

  // --- Markers  ---
  function addMarker(raw){
    const p = currentProfile();
    if (!p) return null;
    const marker = {
      id: uid(),
      xp: raw.xp,
      yp: raw.yp,
      label: raw.label || '',
      cat: raw.cat || 'General',
      color: raw.color || '#78f1c2',
      done: !!raw.done,
      shared: !!raw.shared,
    };
    p.markers.push(marker);
    p.updated = now();
    return marker;
  }

  function updateMarker(id, patch){
    const p = currentProfile();
    if (!p) return false;
    const m = p.markers.find(m => m.id === id);
    if (!m) return false;
    Object.assign(m, patch);
    p.updated = now();
    return true;
  }

  function deleteMarker(id){
    const p = currentProfile();
    if (!p) return false;
    const before = p.markers.length;
    p.markers = p.markers.filter(m => m.id !== id);
    if (p.markers.length !== before) {
      p.updated = now();
      showToast(GDMMLang.t('toast.MarkerDeleted') || 'Marker deleted', 'warning', 2500);      
      return true;
    }
    return false;
  }

  function clearMarkers(){
    const p = currentProfile();
    if (!p) return false;
    p.markers = [];
    p.updated = now();
    return true;
  }

  // --- User-data only  ---
function getUserDataOnly() {
  const out = {};
  const src = state.profiles || {};
  for (const [name, profile] of Object.entries(src)) {
    if (!profile) continue;
    if (profile.isShared) continue;
    out[name] = {
      markers: profile.markers || [],
      paths: profile.paths || [],
      view: profile.view || null
    };
  }
  return out;
}

  function saveUserDataToLocal(){
    try {
      const data = getUserDataOnly();
      localStorage.setItem('gdmm_user_data', JSON.stringify(data));
    } catch (e) {
      console.warn(GDMMLang.t('toast.CantSaveData'), e);
    }
  }

  function loadUserDataFromLocal(){
    try {
      const raw = localStorage.getItem('gdmm_user_data');
      if (!raw) return;
      const userData = JSON.parse(raw);
      for (const [name, uProfile] of Object.entries(userData)) {
        if (!state.profiles[name]) continue;
        state.profiles[name].markers = uProfile.markers || [];
        if (uProfile.view) state.profiles[name].view = uProfile.view;
        if (uProfile.paths) state.profiles[name].paths = uProfile.paths;
      }
    } catch (e) {
      console.warn(GDMMLang.t('toast.CantLoadData'), e);
    }
  }

  // --- Import helpers ---
  function normalizeName(name){
    return name
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function mergeUserMarkers(userData){
    if (!userData) return;
    const profiles = state.profiles || {};
    const normalizedIndex = {};
    for (const key of Object.keys(profiles)) {
      normalizedIndex[normalizeName(key)] = key;
    }
    for (const [importName, u] of Object.entries(userData)) {
      const norm = normalizeName(importName);
      const realKey = normalizedIndex[norm];
      if (!realKey) continue;
      const p = profiles[realKey];
      p.markers = Array.isArray(u.markers) ? u.markers : [];
      if (u.view) p.view = u.view;
    }
  }


  // --- Expose global ---
  window.GDMMCore = {
    DEV_MODE,
    state,
    updateSaveIndicator,
    now,
    clamp,
    markAsChanged,
    uid,
    defaultIcons,
    iconFor,
    isColorAllowed,
    currentProfile,
    setActiveProfile,
    ensureProfile,
    createProfile,
    renameProfile,
    deleteProfile,
    listProfiles,
    addMarker,
    updateMarker,
    deleteMarker,
    clearMarkers,
    getUserDataOnly,
    saveUserDataToLocal,
    loadUserDataFromLocal,
    mergeUserMarkers,
  };

// marker-signature: gdmmtool_2025_[Yakmandji]

  const host = location.hostname || '';
  if (
    host &&
    !host.includes('github.io') &&
    !host.includes('localhost')
  ) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;">
        <div>
          <h2>Unauthorized domain</h2>
          <p>This project is protected and cannot be hosted here.</p>
          <p>Original version: <a href="https://yakmandji.github.io/Grim-dawn-map-marker-tool/" target="_blank">GitHub Pages</a></p>
        </div>
      </div>`;
    throw new Error('Unauthorized domain detected.');
  }


})();
