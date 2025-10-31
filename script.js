(()=>{
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));

  const DEV_MODE = false;

  // --- State (RAM only) ---
  const state = {
    profiles: {},
    active: null,
    undo: [],
    redo: [],
    view: { scale: 1, x: 0, y: 0 },
    tool: 'pan',
    locked: true,               // <— NEW: global lock for markers
    mapNatural: { w: 0, h: 0 },
    mapReady: false
  };

    // --- Save system flags
    let hasUnsavedChanges = false;   // pass to true when modifie
    let fileHandle = null;


// --- USER DATA (markers only) ---

function getUserDataOnly() {
  const out = {};
  const src = state.profiles || {};
  for (const [name, profile] of Object.entries(src)) {
    if (!profile) continue;
    out[name] = {
      markers: profile.markers || [],
      view: profile.view || null
    };
  }
  return out;
}

// local save
function saveUserDataToLocal() {
  try {
    const data = getUserDataOnly();
    localStorage.setItem('gdmm_user_data', JSON.stringify(data));
  } catch (e) {
    console.warn('[GDMM] could not save user data locally:', e);
  }
}

// load users marker
function loadUserDataFromLocal() {
  try {
    const raw = localStorage.getItem('gdmm_user_data');
    if (!raw) return;
    const userData = JSON.parse(raw);
    // on fusionne dans les profils existants
    for (const [name, uProfile] of Object.entries(userData)) {
      if (!state.profiles[name]) continue; // si la map n'existe pas côté site, on ignore
      state.profiles[name].markers = uProfile.markers || [];
      if (uProfile.view) state.profiles[name].view = uProfile.view;
    }
    updateSaveIndicator(true);
  } catch (e) {
    console.warn('[GDMM] could not load user data:', e);
  }
}

  // Refs
  const viewport = $('#mapViewport'), inner = $('#mapInner'), mapImg = $('#mapImg');

  // Utils
  const now = () => new Date().toISOString();
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const uid = () => Math.random().toString(36).slice(2, 10);

    // --- Icons by category ---
  const defaultIcons = {
    'General': '',
    'Quest': '⭐',
    'Boss': '💀',
    'Loot': '🗝️',
    'Waypoint': '📍',
    'Donjon' : '🏰',
    'NPC': '💬'
  };
  const iconFor = (cat) => defaultIcons[cat] || '';
  const isColorAllowed = (cat) => !iconFor(cat);


  // --- Profiles & helpers ---
  function currentProfile(){ return state.active ? state.profiles[state.active] : null; }
  function deepClone(obj){ return obj ? JSON.parse(JSON.stringify(obj)) : obj; }

  function setActiveProfile(name){
    if(!name) return;
    if(!state.profiles[name]) state.profiles[name] = { markers:[], map:{}, created:now(), updated:now() };

    state.active = name;
    state.undo = [];
    state.redo = [];

    const p = currentProfile();

    if (p.map && p.map.embedData) {
      setMapSrc(p.map.embedData);
    } else if (p.map && p.map.sessionSrc) {
      mapImg.src = p.map.sessionSrc;
      state.mapNatural = { w: p.map.width || 0, h: p.map.height || 0 };
      state.mapReady = !!(p.map.width && p.map.height);
    } else {
      mapImg.removeAttribute('src'); state.mapReady=false; state.mapNatural={w:0,h:0};
    }

    refreshProfilesUI();
    renderList();
    renderMarkers();
    setTool(state.tool); // update cursor
    applyLockUI();       // sync lock checkbox + class
  }

  function act(_d, mut, rerender=true){
    if(!state.active) return;
    const snap = JSON.stringify(state.profiles[state.active]);
    mut();
    state.undo.push(snap);
    state.redo.length = 0;
    state.profiles[state.active].updated = now();
    if (rerender){ renderList(); renderMarkers(); }
  }

  // --- Map load (session only) ---
  let loadToken = 0;
  function setMapSrc(src){
    if (!state.active) { alert("You need first to create profile"); return; }
    const token = ++loadToken;
    mapImg.dataset.token = String(token);
    if (src instanceof File) src = URL.createObjectURL(src);
    mapImg.src = src;
    const p = currentProfile();
    if (p && p.map) p.map.sessionSrc = mapImg.src;
  }

  mapImg.addEventListener('load', () => {
    if (Number(mapImg.dataset.token || 0) !== loadToken) return;
    state.mapNatural = { w: mapImg.naturalWidth, h: mapImg.naturalHeight };
    state.mapReady = state.mapNatural.w > 0 && state.mapNatural.h > 0;
    const p = currentProfile();
    if (p && p.map) {
      p.map.width = state.mapNatural.w;
      p.map.height = state.mapNatural.h;
      p.map.sessionSrc = mapImg.src;
    }
    fitToScreen();
    renderMarkers();
  });
  mapImg.addEventListener('error', () => { state.mapReady = false; alert("Échec du chargement de l'image"); });

  // --- View helpers ---
  function fitToScreen(){
    const vb = viewport.getBoundingClientRect();
    const iw = state.mapNatural.w || 1, ih = state.mapNatural.h || 1;
    const s = Math.min(vb.width/iw, vb.height/ih);
    state.view.scale = 0.17;
    state.view.x = (vb.width - iw*state.view.scale)/2;
    state.view.y = (vb.height - ih*state.view.scale)/2;
    applyView();
  }
  function applyView(){
    const {x,y,scale} = state.view;
    inner.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const MIN_RATIO = 0.8;
    const mk = (scale < MIN_RATIO) ? (MIN_RATIO / scale) : 1;
    inner.style.setProperty('--mk', mk);
    $('#zoomReadout').textContent = Math.round(scale*100)+"%";
  }
  function viewToPct(cx,cy){
    const vb = viewport.getBoundingClientRect();
    const {x,y,scale} = state.view;
    const mx = (cx - vb.left - x)/scale, my = (cy - vb.top - y)/scale;
    return {xp:(mx/(state.mapNatural.w||1))*100, yp:(my/(state.mapNatural.h||1))*100};
  }
  function pctToPx(xp,yp){ return {x:(xp/100)*(state.mapNatural.w||1), y:(yp/100)*(state.mapNatural.h||1)}; }

  // --- Markers ---
  function addMarker(xp,yp){
    if(!state.mapReady){ alert("You need first to load a map"); return; }
    const label = $('#newLabel').value.trim();
    const cat = $('#newCategory').value;
    const color = $('#newColor').value;
    const done = $('#newCompleted').checked;
    act('add',()=>{ currentProfile().markers.push({id:uid(), xp, yp, label, cat, color, done}); });
    $('#newLabel').value='';
    setTool('pan'); // auto back to pan after add
    markAsChanged();
    saveUserDataToLocal();
  }


  function updateMarker(id, patch, rerender = true) {
    act('upd', () => {
      const m = currentProfile().markers.find(m => m.id === id);
      if (m) Object.assign(m, patch);
    }, rerender);

    // on met le flag
    markAsChanged();

    // on autosave léger (pas d'images)
    saveUserDataToLocal();

    if (patch.label !== undefined) {
      showToast('Marker name updated 💾');
    }
  }




  function deleteMarker(id){ 
    act('del',()=>{ currentProfile().markers = currentProfile().markers.filter(m=>m.id!==id);
    markAsChanged();
   }); }

  // --- Renderers ---
  function refreshProfilesUI(){
    const sel = $('#profileSelect');
    const active = state.active;
    sel.innerHTML = Object.keys(state.profiles).map(n=>`<option ${n===active?'selected':''}>${n}</option>`).join('');
    if (active) sel.value = active;
  }

  function listFiltered(){ // (filtrage retiré de l'UI — cette fonction garde compat)
    const p = currentProfile(); if (!p) return [];
    return [...(p.markers || [])];
  }

  function renderList(){
    const list = listFiltered();
    $('#count').textContent = list.length;
    const host = $('#list'); host.innerHTML = '';
    const tpl = $('#tplItem');
    list.forEach(m=>{
      const el = tpl.content.firstElementChild.cloneNode(true);
      el.querySelector('[data-pin]').style.background = m.color || '#78f1c2';
      const label = el.querySelector('[data-label]'); label.value = m.label||''; label.addEventListener('blur', e=>updateMarker(m.id,{label:e.target.value}, true));
      const cat = el.querySelector('[data-cat]'); cat.value = m.cat||'General'; cat.onchange = e=>updateMarker(m.id,{cat:e.target.value});
      const color = el.querySelector('[data-color]'); color.value = m.color||'#78f1c2'; color.oninput = e=>{ el.querySelector('[data-pin]').style.background = e.target.value; updateMarker(m.id,{color:e.target.value}, false); };
      const done = el.querySelector('[data-done]'); done.checked = !!m.done; done.onchange = e=>updateMarker(m.id,{done:e.target.checked});

      // Affiche/masque le color picker selon la catégorie
      const syncColorVis = (c)=>{ const allow = isColorAllowed(c); color.style.display = allow ? '' : 'none'; };
      syncColorVis(cat.value);

      cat.onchange = e=>{ const v=e.target.value; updateMarker(m.id,{cat:v}); syncColorVis(v); };
      color.oninput = e=>{updateMarker(m.id,{color:e.target.value}, /*rerender*/ true);};


      el.querySelector('[data-center]').onclick = ()=>centerOn(m.xp, m.yp, 1.5);
      el.querySelector('[data-delete]').onclick = ()=>deleteMarker(m.id);
      host.appendChild(el);
    });
  }

  function renderMarkers(){
    $$('#mapInner .marker').forEach(n=>n.remove());
    const p = currentProfile(); if(!(p && state.mapReady)) return;
    const list = p.markers || [];
    list.forEach(m=>{
      const el = document.createElement('div'); el.className='marker'+(m.done?' completed':'');
      const pin = document.createElement('div'); pin.className='pin';
      const ic = iconFor(m.cat);
      if (ic) {
        const span = document.createElement('span'); span.className='icon'; span.textContent = ic;
        pin.appendChild(span);
      } else {
        pin.style.background = m.color||'#78f1c2';
      }
      el.appendChild(pin);

      const lab = document.createElement('div'); lab.className='label'; lab.textContent=m.label||'(sans titre)'; el.appendChild(lab);

      const pt = pctToPx(m.xp,m.yp); el.style.left=pt.x+'px'; el.style.top=pt.y+'px';
      let dragging=false, startPct=null;
      el.addEventListener('pointerdown',e=>{ if(state.tool==='add' || state.locked) return; dragging=true; el.setPointerCapture(e.pointerId); startPct=viewToPct(e.clientX,e.clientY); });
      el.addEventListener('pointermove',e=>{ if(!dragging) return; const p1=viewToPct(e.clientX,e.clientY); const nx=clamp(p1.xp-(startPct.xp-m.xp),0,100); const ny=clamp(p1.yp-(startPct.yp-m.yp),0,100); const pp=pctToPx(nx,ny); el.style.left=pp.x+'px'; el.style.top=pp.y+'px'; });
      el.addEventListener('pointerup',e=>{ if(!dragging) return; dragging=false; const p1=viewToPct(e.clientX,e.clientY); const nx=clamp(p1.xp-(startPct.xp-m.xp),0,100); const ny=clamp(p1.yp-(startPct.yp-m.yp),0,100); updateMarker(m.id,{xp:nx,yp:ny}); });
      inner.appendChild(el);
    });
  }


  function centerOn(xp,yp,targetScale){
    if(!(state.mapNatural.w>0&&state.mapNatural.h>0)) return;
    const vb = viewport.getBoundingClientRect();
    const imgx = (xp/100)*(state.mapNatural.w||1);
    const imgy = (yp/100)*(state.mapNatural.h||1);
    const s = targetScale || state.view.scale;
    state.view.scale = s;
    state.view.x = vb.width/2 - imgx*s;
    state.view.y = vb.height/2 - imgy*s;
    applyView();
  }

  // --- Pan & Zoom ---
  let panning=false, panId=null, panStart={x:0,y:0}, viewStart={x:0,y:0};
  function setTool(t){
    state.tool=t;
    viewport.classList.toggle('pan', t==='pan');
    viewport.classList.toggle('add', t==='add');
    const panBtn = document.getElementById('toolPan');
    const addBtn = document.getElementById('toolAdd');
    if (panBtn) panBtn.classList.toggle('active', t==='pan');
    if (addBtn) addBtn.classList.toggle('active', t==='add');
  }

  function applyLockUI(){
    const lockEl = document.getElementById('lockAll');
    if (lockEl) lockEl.checked = !!state.locked;
    viewport.classList.toggle('locked', !!state.locked);
  }

  $('#toolPan').addEventListener('click', ()=>setTool('pan'));
  $('#toolAdd')?.addEventListener('click', ()=>setTool('add'));
  setTool('pan');

  // Pan start
  viewport.addEventListener('pointerdown', e=>{
    if(state.tool==='add'){
      const {xp,yp} = viewToPct(e.clientX, e.clientY);
      if(xp>=0&&xp<=100&&yp>=0&&yp<=100&&state.mapReady) addMarker(xp,yp);
      return;
    }
    e.preventDefault();
    // If click on marker and NOT locked, don't start panning (marker handles drag).
    if(e.target.closest && e.target.closest('.marker') && !state.locked) return;
    if(e.pointerType==='mouse' && e.button!==0) return;
    panning = true; panId = e.pointerId; if(viewport.setPointerCapture) viewport.setPointerCapture(panId);
    panStart = {x:e.clientX, y:e.clientY}; viewStart = {...state.view};
  });

  viewport.addEventListener('pointermove', e=>{
    if(!panning){
      const {xp,yp} = viewToPct(e.clientX, e.clientY);
      if(isFinite(xp)&&isFinite(yp)) $('#cursorReadout').textContent = `x: ${clamp(xp,0,100).toFixed(1)}%, y: ${clamp(yp,0,100).toFixed(1)}%`;
      return;
    }
    e.preventDefault();
    const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
    state.view.x = viewStart.x + dx; state.view.y = viewStart.y + dy; 
    clampViewToMap();
    applyView();
  });

  function stopPan(){ panning=false; panId=null; }
  viewport.addEventListener('pointerup', ()=>stopPan());
  viewport.addEventListener('pointerleave', ()=>stopPan());
  window.addEventListener('pointerup', ()=>stopPan());
  window.addEventListener('pointercancel', ()=>stopPan());
  viewport.addEventListener('lostpointercapture', ()=>stopPan());

  viewport.addEventListener('wheel', e=>{
    e.preventDefault();
    const delta = -Math.sign(e.deltaY)*0.12;
    const old = state.view.scale;
    const ns = clamp(old*(1+delta), 0.17, 5);
    if(ns===old) return;
    const vb = viewport.getBoundingClientRect();
    const ox=e.clientX-vb.left, oy=e.clientY-vb.top;
    const ix=(ox-state.view.x)/old, iy=(oy-state.view.y)/old;
    state.view.x = ox - ix*ns;
    state.view.y = oy - iy*ns;
    state.view.scale = ns;
    applyView();
  }, {passive:false});

  // Drag & drop map
  ;['dragenter','dragover'].forEach(ev=>viewport.addEventListener(ev,e=>{e.preventDefault();viewport.style.outline='2px dashed #78f1c2'}));
  ;['dragleave','drop'].forEach(ev=>viewport.addEventListener(ev,e=>{e.preventDefault();viewport.style.outline='none'}));
  viewport.addEventListener('drop', e=>{ const f=e.dataTransfer.files?.[0]; if(!f) return; setMapSrc(f); });

  // Export embed helper (src -> dataURL)
  async function srcToDataURL(src, mime = 'image/jpeg', quality = 1){
    return new Promise((resolve,reject)=>{
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = ()=>{
        try{
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0);
          resolve(canvas.toDataURL(mime, quality));
        }catch(e){ reject(e); }
      };
      img.onerror = reject; img.src = src;
    });
  }


// === Save engine ===
async function saveWithPicker(data) {
  const json = JSON.stringify(data, null, 2);

  // ompatible browser
  if ("showSaveFilePicker" in window) {

    // 1️⃣ si on a déjà choisi un fichier dans cette session → on réécrit dedans
    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      hasUnsavedChanges = false;
      updateSaveIndicator(true);
      return true;
    }

    fileHandle = await window.showSaveFilePicker({
      suggestedName: "gdmm_all_profiles.json",
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
    hasUnsavedChanges = false;
    updateSaveIndicator(true);
    return true;
  }

  return false;
}



$('#exportAllBtn').addEventListener('click', () => {
  // on sauvegarde seulement les marqueurs/profils de l'utilisateur
  saveUserDataToLocal();

  hasUnsavedChanges = false;
  updateSaveIndicator(true);
  showToast('Markers saved locally 💾');
});


$('#exportFileBtn').addEventListener('click', async () => {
  const data = getUserDataOnly();
  const saved = await saveWithPicker(data);
  if (saved) return;

  // fallback
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gdmm_user_markers.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
});


    // bouton "Open"
  // -------------------------
  // IMPORT (markers only OR full)
  // -------------------------
  $('#importReplaceBtn').addEventListener('click', () => {
    const input = $('#importInput');
    input.value = "";        // pour pouvoir ré-importer le même fichier
    input.click();
  });

  $('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      // est-ce que c'est un export complet (ancienne version) ?
      const isFullExport = Object.values(imported).some(p => p && (p.map || p.embedData));

      if (isFullExport) {
        state.profiles = imported;
        const first = Object.keys(state.profiles)[0] || null;
        state.active = first;
        refreshProfilesUI();
        renderList();
        renderMarkers();
        updateSaveIndicator(true);
        showToast('Full map data imported ✅');
        return;
      }

      // markers only → on fusionne
      mergeUserMarkers(imported);

      refreshProfilesUI();
      renderList();
      renderMarkers();
      updateSaveIndicator(true);
      showToast('Markers imported ✅');


    } catch (err) {
      console.error('[GDMM] import failed:', err);
      showToast('Import failed (invalid JSON) ❌', 'error');
    }
  });


    // normalise profile name
    function normalizeName(name) {
      return name
        .toLowerCase()
        .replace(/\(.*?\)/g, '') 
        .replace(/\s+/g, '')    
        .trim();
    }

    function mergeUserMarkers(userData) {
      if (!userData) return;
      const profiles = state.profiles || {};

      // on indexe les profils existants par nom "normalisé"
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

  $('#profileSelect').addEventListener('change', e=>setActiveProfile(e.target.value));


if (DEV_MODE) {

  $('#clearSession').addEventListener('click', ()=>{
    if(!confirm('Delete all session ?')) return;
    state.profiles = {}; state.active=null;
    mapImg.removeAttribute('src'); state.mapReady=false; state.mapNatural={w:0,h:0};
    refreshProfilesUI();
  });

  // Profiles controls
  $('#newProfile').addEventListener('click', ()=>{
    const n = prompt('Name of new map ?'); if(!n) return;
    if(state.profiles[n]){ alert('this name already exist'); return; }
    state.profiles[n] = deepClone({ markers:[], map:{}, created:now(), updated:now() }); setActiveProfile(n);
  });

  document.getElementById('renProfile').addEventListener('click', function () {
    if (!state.active) return;
    const n = prompt('New name ?', state.active); if (!n || n === state.active) return;
    if (state.profiles[n]) { alert('Name already exist'); return; }
    state.profiles[n] = deepClone(state.profiles[state.active]); delete state.profiles[state.active];
    state.active = n; refreshProfilesUI();
  });

    $('#delProfile').addEventListener('click', ()=>{
    if(!state.active) return;
    const victim = state.active; if(!confirm('You will delete « '+victim+' » map and all associated markers')) return;
    const names = Object.keys(state.profiles); delete state.profiles[victim];
    const next = names.find(n=>n!==victim) || null; state.active = null;
    mapImg.removeAttribute('src'); state.mapReady=false; state.mapNatural={w:0,h:0};
    if (next && state.profiles[next]) setActiveProfile(next); else refreshProfilesUI();
  });

     // File input
  $('#mapFile').addEventListener('change', e => { 
    const f = e.target.files?.[0]; 
    if (f) {
      setMapSrc(f);

      // ✅ User Feedback + state
      showToast('🗺️ Map image updated successfully');
      markAsChanged();
    }
  }); 

} else{
  document.getElementById('admin-section')?.remove();
}


$('#clearProfile').addEventListener('click', () => {
  const prof = currentProfile();
  if (!prof) return;

  if (!confirm('Do you really want to delete all markers from this map?')) return;

  prof.markers = [];
  saveUserDataToLocal();
  renderList();
  renderMarkers();
  markAsChanged();
  showToast('Markers cleared for this map 🧹');
});


  // --- Init (auto-load from GitHub if available) ---
  (async () => {
    const REMOTE_JSON_URL = 'https://yakmandji.github.io/Grim-dawn-map-marker-tool/gdmm_all_profiles.json';

    // 1) on crée quand même un profil vide, au cas où
    state.profiles['Profil 1'] = { markers:[], map:{}, created:now(), updated:now() };
    setActiveProfile('Profil 1');

    // 2) on essaie de charger le JSON distant
    try {
      const resp = await fetch(REMOTE_JSON_URL, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const txt = await resp.text();
      const obj = JSON.parse(txt);

      // si c’est un “gros” objet de profils (format de ton export)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        state.profiles = obj;
        const first = Object.keys(state.profiles)[0] || 'Profil 1';
        setActiveProfile(first);

        // si la map du profil chargé est embarquée → on l’affiche
        const p = currentProfile();
        if (p && p.map && p.map.embedData) {
          setMapSrc(p.map.embedData);
        }
      }
    } catch (err) {
      console.warn('[GDMM] remote JSON not loaded, using local empty profile', err);
      // on reste sur Profil 1
    }

    loadUserDataFromLocal();
    renderList();
    renderMarkers();

    // lock par défaut
    state.locked = true;
    applyLockUI();

    // re-sync color picker for “New marker”
    const newCatEl = document.getElementById('newCategory');
    const newColorEl = document.getElementById('newColor');
    if (newCatEl && newColorEl) {
      const syncNewColor = ()=>{ newColorEl.style.display = isColorAllowed(newCatEl.value) ? '' : 'none'; };
      newCatEl.addEventListener('change', syncNewColor);
      syncNewColor();
    }
  })();

  // Lock checkbox binding (now centralized here)
  const lockEl = document.getElementById('lockAll');
  if (lockEl) lockEl.addEventListener('change', (e) => {
    state.locked = !!e.target.checked;
    applyLockUI();
  });

  // New marker category → toggle color visibility
  const newCatEl = document.getElementById('newCategory');
  const newColorEl = document.getElementById('newColor');
  if (newCatEl && newColorEl) {
    const syncNewColor = ()=>{ newColorEl.style.display = isColorAllowed(newCatEl.value) ? '' : 'none'; };
    newCatEl.addEventListener('change', syncNewColor);
    syncNewColor(); // au chargement
  }

//Download map pack

  const REMOTE_MAPS_JSON = 'https://yakmandji.github.io/Grim-dawn-map-marker-tool/maps.json';

  async function downloadMapsZip() {
    try {
      const resp = await fetch(REMOTE_MAPS_JSON, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();

      if (!data.zip) {
        alert("There is actualy no map");
        return;
      }

      // Création d’un lien de téléchargement
      const a = document.createElement('a');
      a.href = data.zip;
      const filename = data.zip.split('/').pop() || 'grim-dawn-maps.zip';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (err) {
      console.error(err);
      alert("Error when trying to download");
    }
  }

  // Branchement du bouton
  document.getElementById('downloadMaps')?.addEventListener('click', downloadMapsZip);

// fermer via la croix
document.querySelector('.closeHelp')?.addEventListener('click', () => {
  const sec = document.getElementById('helpSection');
  if (!sec) return;
  sec.style.display = 'none';
});

// fonction qui gère le clic en dehors
const toggleOutsideClose = (enable) => {
  // on crée le handler dans la fonction pour pouvoir le remove
  const handler = (e) => {
    const sec = document.getElementById('helpSection');
    const toggle = document.getElementById('helpToggle');
    if (!sec || sec.style.display === 'none') return;
    const clickedInside = sec.contains(e.target) || e.target === toggle;
    if (!clickedInside) {
      sec.style.display = 'none';
      document.removeEventListener('click', handler);
    }
  };

  if (enable) {
    document.addEventListener('click', handler);
  }
};

// toggle via le lien
document.getElementById('helpToggle')?.addEventListener('click', (e) => {
  e.preventDefault(); // évite le scroll en haut si c’est un <a>
  const sec = document.getElementById('helpSection');
  if (!sec) return;

  const show = sec.style.display === 'none' || sec.style.display === '';
  sec.style.display = show ? 'block' : 'none';

  // si on ouvre → on active le clic en dehors
  if (show) {
    toggleOutsideClose(true);
  }
});

// SAVE FONCTION

function saveMap() {
  try {
    // ton objet global, selon ton code (remplace "appState" si besoin)
    const data = appState || markers || {}; 
    const json = JSON.stringify(data, null, 2);

    // création du fichier et téléchargement
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grim_dawn_map.json";
    a.click();

    // indicateur vert
    hasUnsavedChanges = false;
    updateSaveIndicator(true);

    // petite sauvegarde locale (optionnelle)
    localStorage.setItem("gdmap_autosave", json);

    console.log("Map saved successfully!");
  } catch (err) {
    console.error("Save failed:", err);
  }
}




// SAVE UTILS

function clampViewToMap() {
  if (!state.mapReady) return;

  const vb = viewport.getBoundingClientRect();
  const iw = state.mapNatural.w * state.view.scale;
  const ih = state.mapNatural.h * state.view.scale;

  // If map is too small
/*  if (iw <= vb.width && ih <= vb.height) return;*/

  const margin = 320;

  const minX = vb.width - iw - margin;
  const maxX = margin;
  const minY = vb.height - ih - margin;
  const maxY = margin;

  state.view.x = clamp(state.view.x, minX, maxX);
  state.view.y = clamp(state.view.y, minY, maxY);
}



function updateSaveIndicator(saved) {
  const el = document.querySelector("#saveStatus");
  if (!el) return;

  if (saved) {
    el.textContent = "● Saved";
    el.style.color = "#8be38b";           // vert
  } else {
    el.textContent = "● Unsaved";
    el.style.color = "#ff6b7a";           // rouge
  }
}
updateSaveIndicator(true);

function markAsChanged() {
  hasUnsavedChanges = true;
  updateSaveIndicator(false);
}

//Tolltips

function showToast(message, type = 'success', duration = 2200) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;

  container.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.add('show');
  });

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => {
      el.remove();
    }, 250);
  }, duration);
}

//Flash button

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.marker-save');
  if (!btn) return;

  // effet flash 💾
  btn.classList.add('flash');
  setTimeout(() => btn.classList.remove('flash'), 400);

  // ici, tu peux aussi forcer le blur du champ à côté si besoin
  const input = btn.closest('.listItem')?.querySelector('.marker-name');
  if (input) input.blur();

});

// === ADMIN: export only maps (no markers) ===
$('#exportMapsOnlyBtn')?.addEventListener('click', async () => {
  const snapshot = JSON.parse(JSON.stringify(state.profiles || {}));

  // On nettoie les marqueurs et on embarque les images
  const entries = Object.entries(snapshot);
  for (const [name, p] of entries) {
    // Supprimer tous les marqueurs
    p.markers = [];

    try {
      const src = state.profiles[name]?.map?.sessionSrc;
      if (src) {
        const data = await srcToDataURL(src, 'image/jpeg', 0.85);
        p.map = p.map || {};
        p.map.embedData = data;
      }
    } catch (_e) {}
    if (p.map) delete p.map.sessionSrc;
  }

  const data = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gdmm_all_profiles.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);

  showToast('Maps exported (without markers) ✅');
});



})();
