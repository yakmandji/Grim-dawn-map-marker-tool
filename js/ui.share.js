// ui.share.js
// Gestion des cartes partagées via ?s=... (Cloudflare Worker) ou ?share=... (legacy)

(function () {
  const core   = window.GDMMCore || {};
  const state  = core.state || {};
  const ensureProfile    = core.ensureProfile    || function () {};
  const setActiveProfile = core.setActiveProfile || function () {};

  let sharedFocus = null;

  const ensureMapLoadedForProfile =
    (window.UiCore && window.UiCore.ensureMapLoadedForProfile) ||
    (async () => {}); // no-op si jamais non dispo

    const SHARE_WORKER_BASE =
      window.GDMM_SHARE_WORKER_URL ||
      'https://share2.grimcustommarker.org';

    // Public base URL used for share links when running locally (file:// or localhost)
    function getShareBaseUrl() {
      const PUBLIC = 'https://www.grimcustommarker.org';

      const isFile = location.protocol === 'file:' || location.origin === 'null';
      const isLocalhost =
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';

      // In local usage, always generate a public clickable URL for sharing/catalog
      if (isFile || isLocalhost) return PUBLIC;

      // In prod/custom domain, keep current origin
      return location.origin;
    }


    // --- Decode legacy share payload from URL (GZIP + Base64) ---
    function decodeSharePayload(str) {
      if (!str) return null;

      // 1) GZIP (pako) + base64 + encodeURIComponent
      if (window.pako && typeof pako.inflate === 'function') {
        try {
          const b64 = decodeURIComponent(str);
          const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
          const out = pako.inflate(bin, { to: 'string' });
          if (out) return JSON.parse(out);
        } catch (e) {
          console.warn('[GDMM] GZIP decode failed, fallback to base64 JSON', e);
        }
      }

      // 2) Base64 JSON brut (Latin1 only)
      try {
        const decoded = atob(str);
        return JSON.parse(decoded);
      } catch (e) {
        // 3) Base64 JSON avec encodeURIComponent autour
        try {
          const decoded = atob(decodeURIComponent(str));
          return JSON.parse(decoded);
        } catch (e2) {
          // 4) Base64 JSON UTF-8 (unicode-safe)
          try {
            const decoded = decodeURIComponent(escape(atob(str)));
            return JSON.parse(decoded);
          } catch (e3) {
            // 5) Base64 JSON UTF-8 + encodeURIComponent autour
            try {
              const decoded = decodeURIComponent(escape(atob(decodeURIComponent(str))));
              return JSON.parse(decoded);
            } catch (e4) {
              console.error('[GDMM] All decode methods failed', e4);
            }
          }
        }
      }

      return null;
    }



  // --- Charge la carte partagée depuis l'URL (?s=... ou ?share=...) ---
  async function loadSharedFromUrl() {
    const params = new URLSearchParams(location.search);
    const shortId = params.get('s');
    const rawLegacy = params.get('share');

    let data = null;

    // 1) Nouveau système : ?s=ID → Cloudflare Worker
    if (shortId) {
      if (!SHARE_WORKER_BASE) {
        console.warn('[GDMM] SHARE_WORKER_BASE not configured');
        return;
      }

      try {
        const res = await fetch(
          `${SHARE_WORKER_BASE}/load/${encodeURIComponent(shortId)}`
        );
        const json = await res.json();

        if (!res.ok || !json || !json.ok || !json.data) {
          console.warn('[GDMM] failed to load shared map from worker', json);
          if (window.showToast) {
            showToast('Failed to load shared map ❌', 'error', 6000);
          }
          return;
        }

        data = json.data;
      } catch (e) {
        console.error('[GDMM] worker /load failed', e);
        if (window.showToast) {
          showToast('Failed to load shared map ❌', 'error', 6000);
        }
        return;
      }
    }
    // 2) Ancien système : ?share=... (tout en URL)
    else if (rawLegacy) {
      try {
        data = decodeSharePayload(rawLegacy);
      } catch (e) {
        console.warn('[GDMM] invalid share payload', e);
        return;
      }
    } else {
      // Aucun paramètre de partage
      return;
    }

    if (!data) return;

        // ==========================================
        // NEW: multi-map character share format (v4)
        // payload: { v:'4', active:'Cairn', maps:{ MapName:{r,m,notes} } }
        // ==========================================
        if (data && String(data.v) === '4' && data.maps && typeof data.maps === 'object') {


          // CLEANUP previous shared profiles (flag OR name-based)
          try {
            for (const [name, profile] of Object.entries(state.profiles || {})) {
              if (!profile) continue;
              if (profile.isShared || String(name).startsWith('[Shared]')) {
                delete state.profiles[name];
              }
            }
          } catch (e) {
            console.warn('[GDMM] shared cleanup failed', e);
          }

          window._gdmmSharedNotesByProfile = {};
          window._gdmmLastSharedNotesPayload = {};
          state.sharedNotes = {};
          window.__gdmmSharedNotesSwapInit = false;



          const mapsObj = data.maps || {};
          const desiredActive = data.active || null;

          // Crée un profil shared par map
          for (const [mapName, pack] of Object.entries(mapsObj)) {
            if (!mapName || !pack) continue;

            const compactRoutes  = Array.isArray(pack.r) ? pack.r : [];
            const compactMarkers = Array.isArray(pack.m) ? pack.m : [];
            const sharedNotes    = (pack.notes && typeof pack.notes === 'object') ? pack.notes : null;

            const routes = compactRoutes.map(r => ({
              id: r.i,
              name: r.n || '',
              color: r.c || '#ffcc00',
              width: r.w || 4,
              opacity: typeof r.o === 'number' ? r.o : 0.85,
              points: (r.pts || []).map(([xp, yp]) => ({ xp, yp })),
            }));

            const markers = compactMarkers.map(m => ({
              id: m.i,
              xp: m.x,
              yp: m.y,
              label: m.l || '',
              cat: m.k || 'General',
              color: m.c || '#78f1c2',
            }));

            // Nom unique du profil shared
            const baseName = `[Shared] ${mapName}`;
            let name = baseName;
            let i = 2;
            while (state.profiles && state.profiles[name]) {
              name = `${baseName} #${i++}`;
            }

            const p = ensureProfile(name);
            if (!p) continue;

            p.markers = markers;
            p.paths   = routes;
            p.isShared = true;
            p.sharedSourceMap = mapName;

            // Réutilise la map originale si elle existe déjà
            const src = state.profiles && state.profiles[mapName];
            if (src && src.map) p.map = src.map;

            // Associe les notes à ce profil shared
            window._gdmmSharedNotesByProfile[name] = sharedNotes || {};
            window._gdmmLastSharedNotesPayload = window._gdmmSharedNotesByProfile[name];

          }

          // Si possible, préload la map active
          if (desiredActive && typeof ensureMapLoadedForProfile === 'function') {
            try { await ensureMapLoadedForProfile(desiredActive); } catch(_) {}
          }

        // Re-sync shared profile map after preload (embedData/sessionSrc becomes available)
        for (const [n, p] of Object.entries(state.profiles || {})) {
          if (!p?.isShared) continue;
          const srcName = p.sharedSourceMap;
          const src = srcName && state.profiles?.[srcName];
          if (src?.map) p.map = src.map;
        }


          // Trouve le profil shared correspondant à data.active
          let activeSharedProfile = null;
          if (desiredActive) {
            const entries = Object.entries(state.profiles || {});
            const match = entries.find(([n, p]) => p?.isShared && p?.sharedSourceMap === desiredActive);
            if (match) activeSharedProfile = match[0];
          }

          // fallback: premier profil shared trouvé
          if (!activeSharedProfile) {
            const entries = Object.entries(state.profiles || {});
            const match = entries.find(([n, p]) => p?.isShared);
            if (match) activeSharedProfile = match[0];
          }

           if (activeSharedProfile) {

            // profil actif une fois
            const p = state.profiles[activeSharedProfile];

            // garantir que la map du profil shared actif est chargée
            const srcName = p?.sharedSourceMap;
            if (srcName && typeof ensureMapLoadedForProfile === 'function') {
              try { await ensureMapLoadedForProfile(srcName); } catch(_) {}
              const src = state.profiles?.[srcName];
              if (src?.map) p.map = src.map;
            }

              setActiveProfile(activeSharedProfile);

              state.sharedView = true; // indispensable pour ui.map.notes.js
              window._gdmmLastSharedNotesPayload = window._gdmmSharedNotesByProfile?.[activeSharedProfile] || {};
              state.sharedNotes = window._gdmmSharedNotesByProfile?.[activeSharedProfile] || {};

              // refresh du panel Notes (compteur + liste)
              window.buildNoteList?.();


            // Affiche la map (maintenant p.map doit être OK)
            if (p?.map?.embedData && window.UiCore?.setMapSrc) {
              window.UiCore.showLoader?.(GDMMLang.t('toast.LoadingMap'));
              window.UiCore.setMapSrc(p.map.embedData);
            } else if (p?.map?.sessionSrc && window.UiCore?.setMapSrc) {
              window.UiCore.showLoader?.(GDMMLang.t('toast.LoadingMap'));
              window.UiCore.setMapSrc(p.map.sessionSrc);
            }

            document.body.classList.add('shared-only-view');
            window.refreshProfilesUI?.();
            window.UiCore?.renderList?.();
            window.UiCore?.renderMarkers?.({ skipRoutesPanel: true });
            window.UiRoutes?.renderRoutesPanel?.();
          }


          // Listener pour swap les notes quand on change de profil shared
          const sel = document.getElementById('profileSelect');
          if (sel && !window.__gdmmSharedNotesSwapInit) {
            window.__gdmmSharedNotesSwapInit = true;
            sel.addEventListener('change', () => {
              const name = sel.value;
              if (!name) return;

              if (state.profiles?.[name]?.isShared) {
                state.sharedView = true;
                state.sharedNotes = window._gdmmSharedNotesByProfile?.[name] || {};

                //mettre à jour APRÈS avoir changé state.sharedNotes
                window._gdmmLastSharedNotesPayload = state.sharedNotes;
                 window.buildNoteList?.();
              }
            });

          }

          return; // important: on stoppe ici, on ne passe pas dans l'ancien flux v3
        }



      let routes  = [];
      let markers = [];
      const mapName = data.map || null;

      // --- Notes partagées ---
      const sharedNotes =
        data && data.notes && typeof data.notes === 'object'
          ? data.notes
          : null;

      // Stockage global pour le bouton "Add shared to my map"
      window._gdmmLastSharedNotesPayload = sharedNotes;

      // Active le mode vue partagée pour que getAllRegionNotes() lise les notes du lien
      state.sharedView  = true;
      state.sharedNotes = sharedNotes || {};


    // --- Format compact v2 ({ v, map, r: [...], m: [...] }) ---
    if (Array.isArray(data.r) || Array.isArray(data.m)) {
      const compactRoutes = Array.isArray(data.r) ? data.r : [];

      routes = compactRoutes.map(r => ({
        id: r.i,
        name: r.n || '',
        color: r.c || '#ffcc00',
        width: r.w || 4,
        opacity: typeof r.o === 'number' ? r.o : 0.85,
        points: (r.pts || []).map(([xp, yp]) => ({
          xp: xp,
          yp: yp,
        })),
      }));

      const compactMarkers = Array.isArray(data.m) ? data.m : [];
      markers = compactMarkers.map(m => ({
        id: m.i,
        xp: m.x,
        yp: m.y,
        label: m.l || '',
        cat: m.k || 'General',
        color: m.c || '#78f1c2',
      }));

    }
    // --- Ancien format (routes / markers en clair) ---
    else if (Array.isArray(data.routes) || Array.isArray(data.markers)) {
      const incomingRoutes = Array.isArray(data.routes) ? data.routes : [];
        routes = incomingRoutes.map(r => r);

      const incomingMarkers = Array.isArray(data.markers) ? data.markers : [];
        markers = incomingMarkers.map(m => m);
      } else {
      // rien d'exploitable
      return;
    }

    const hasSharedNotes =
      sharedNotes && typeof sharedNotes === 'object' &&
      Object.keys(sharedNotes).length > 0;

        // --- Masquer les panels si aucune donnée partagée ---
      if (!routes.length) {
        document.getElementById('routesPanel').classList.add('hide');
      } else {
        document.getElementById('routesPanel').classList.remove('hide');
      }

      if (!markers.length) {
        document.getElementById('marker-container').classList.add('hide');
      } else {
        document.getElementById('marker-container').classList.remove('hide');
      }

      if (!hasSharedNotes) {
        document.getElementById('notePanel').classList.add('hide');
      } else {
        document.getElementById('notePanel').classList.remove('hide');
      }


    if (!routes.length && !markers.length && !hasSharedNotes) {
      return;
    }

    if (mapName && typeof ensureMapLoadedForProfile === 'function') {
      try {
        await ensureMapLoadedForProfile(mapName);
      } catch (e) {
        console.warn('[GDMM] Failed to preload map for shared view', mapName, e);
      }
    }


    // --- Centrage auto pour la carte partagée ---
    (function () {
      let focus = null;

      // 1) Priorité : première route avec au moins un point
      const firstRoute = routes.find(r => Array.isArray(r.points) && r.points.length > 0);
      if (firstRoute) {
        const pt = firstRoute.points[0];
        focus = { xp: pt.xp, yp: pt.yp };
      }

      // 2) Sinon : premier marker partagé
      if (!focus && markers.length) {
        const m0 = markers[0];
        if (typeof m0.xp === 'number' && typeof m0.yp === 'number') {
          focus = { xp: m0.xp, yp: m0.yp };
        }
      }

      if (focus) {
        // On mémorise le focus pour un fallback ultérieur
        sharedFocus = {
          xp: focus.xp,
          yp: focus.yp,
          scale: 1.1,
        };

        // Ne pas restaurer l'ancienne vue
        state.skipViewRestoreOnce = true;

        // Le core consommera ça au mapImg.onload (ui.map.base.js)
        window._gdmmPendingNavCenter = {
          xp: sharedFocus.xp,
          yp: sharedFocus.yp,
          scale: sharedFocus.scale,
        };
      }
    })();


    // Prefer using the existing normal profile name (no [Shared] duplication)
    let name = mapName;

    // If the normal profile doesn't exist, fallback to [Shared] <mapName>
    if (!state.profiles || !state.profiles[name]) {
      const baseName = `[Shared] ${mapName}`;
      name = baseName;
      let i = 2;
      while (state.profiles && state.profiles[name]) {
        name = `${baseName} #${i++}`;
      }
    }

    const p = ensureProfile(name);


    if (!p) return;

    p.markers = markers;
    p.paths   = routes;
    p.isShared = true;
    p.sharedSourceMap = mapName;

    // Essaie de réutiliser la map originale si elle existe
    const src = mapName && state.profiles && state.profiles[mapName];
    if (src && src.map) {
      p.map = src.map;
    }

    setActiveProfile(name);

    // Si la map (originale ou pas) a déjà un embed / sessionSrc, on le réutilise
    if (p.map && p.map.embedData) {
        const ui = window.UiCore || {};
        if (typeof ui.showLoader === 'function') {
          ui.showLoader(GDMMLang.t('toast.LoadingMap'));
        }
        if (typeof ui.setMapSrc === 'function') {
          ui.setMapSrc(p.map.embedData);
        } else if (typeof ui.hideLoader === 'function') {
          ui.hideLoader();
        }

    } else if (p.map && p.map.sessionSrc) {
        const ui = window.UiCore || {};
        if (typeof ui.showLoader === 'function') {
          ui.showLoader(GDMMLang.t('toast.LoadingMap'));
        }
        if (typeof ui.setMapSrc === 'function') {
          ui.setMapSrc(p.map.sessionSrc);
        } else if (typeof ui.hideLoader === 'function') {
          ui.hideLoader();
        }
        
    }

    // --- Fallback de centrage au cas où _gdmmPendingNavCenter ne serait pas consommé ---
    if (sharedFocus && typeof window.centerOn === 'function') {
      let tries = 0;
      const maxTries = 15; // ~3s max si 200ms d'intervalle

      const timer = setInterval(() => {
        tries += 1;

        // On attend que la map soit prête
        if (!state.mapReady) {
          if (tries >= maxTries) {
            clearInterval(timer);
          }
          return;
        }

        // Une fois prête, on force un centrage unique
        window.centerOn(sharedFocus.xp, sharedFocus.yp, sharedFocus.scale || 1.1);
        clearInterval(timer);
      }, 200);
    }



    // Rafraîchit l’UI
    if (typeof window.refreshProfilesUI === 'function') {
      refreshProfilesUI();
    }

    const ui = window.UiCore;
    if (ui) {
      if (typeof ui.renderList === 'function') ui.renderList();
      if (typeof ui.renderMarkers === 'function') ui.renderMarkers();
      if (typeof ui.renderRoutesPanel === 'function') ui.renderRoutesPanel();
    }

    // Mode "carte partagée en lecture seule"
    document.body.classList.add('shared-only-view');
  }

window.UiShare = {
  loadSharedFromUrl,
  createLink, // ✅ IMPORTANT
};


  // Anti-spam "per-item link" (marker/route share links)
  const LINK_COOLDOWN_MS = window.GDMM_LINK_COOLDOWN_MS ?? 5500;
  let lastLinkClickTs = 0;


  // ============================================================
  // Share helper (used by "Share map" and per-item "Link" buttons)
  // ============================================================
  async function createLink(payload, opts = {}){

    const now = Date.now();
    if (now - lastLinkClickTs < LINK_COOLDOWN_MS) {
      const wait = Math.ceil((LINK_COOLDOWN_MS - (now - lastLinkClickTs)) / 1000);

      if (typeof window.showToast === 'function') {
        const msg =
          (window.GDMMLang?.t && GDMMLang.t('toast.ShareCooldown', { wait })) ||
          `Please wait ${wait}s before sharing again.`;
        showToast(msg, 'warning', 4000);
      }
      return null;

    }
    lastLinkClickTs = now;


    const ADVANCED_COMPRESSION = !!window.ADVANCED_COMPRESSION;

    const round = (v) => Math.round((v || 0) * 10) / 10;

    // Normalise un peu (au cas où)
    let safePayload;

    // multi-map character share (on NE DOIT PAS l'écraser)
    if (payload && String(payload.v) === '4' && payload.maps && typeof payload.maps === 'object') {
      safePayload = {
        v: '4',
        active: payload.active || state.active,
        maps: payload.maps
      };
    } else {
      // v3 legacy (single map)
      safePayload = {
        v: payload?.v || '3',
        map: payload?.map || state.active,
        r: Array.isArray(payload?.r) ? payload.r : [],
        m: Array.isArray(payload?.m) ? payload.m : [],
        notes: payload?.notes ?? null,
      };
    }


    // --- Compression fallback ?share= ---
    let compressed;
    try {
      const json = JSON.stringify(safePayload);

      if (ADVANCED_COMPRESSION && window.pako) {
        const gzipped = pako.deflate(json, { level: 9 });
        const b64 = btoa(String.fromCharCode.apply(null, gzipped));
        compressed = encodeURIComponent(b64);
      } else if (window.LZString && LZString.compressToEncodedURIComponent) {
        compressed = LZString.compressToEncodedURIComponent(json);
      } else {
        compressed = btoa(unescape(encodeURIComponent(json)));
      }
    } catch (e) {
      console.error('[GDMM] compression failed', e);
      if (window.showToast) showToast('Compression error ❌', 'error');
      return null;
    }

    // --- 1) Worker short link ---
    let finalUrl = null;
    try {
      if (SHARE_WORKER_BASE) {

        // Build request body without null fields
        const payloadBody = { data: safePayload };
        if (opts?.id) payloadBody.id = opts.id;
        if (opts?.editKey) payloadBody.editKey = opts.editKey;

        const res = await fetch(`${SHARE_WORKER_BASE}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
        });

        const out = await res.json();

        // Retry once as fresh create if stored gist id is invalid (404)
        if (out && out.error && out.ghStatus === 404 && opts && opts.id) {

          const payloadBody2 = { data: safePayload };
          if (opts?.editKey) payloadBody2.editKey = opts.editKey;

          const res2 = await fetch(`${SHARE_WORKER_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadBody2),
          });

          let out2;
          try { out2 = await res2.json(); } catch { return null; }

          if (res2.ok && out2 && out2.ok && out2.id) {
            return `${getShareBaseUrl()}/?s=${encodeURIComponent(out2.id)}`;
          }

          return null;
        }

        if (out && out.ok && out.id) {
          finalUrl = `${getShareBaseUrl()}/?s=${encodeURIComponent(out.id)}`;
        }
      }

    } catch (e) {
      console.warn('[GDMM] share via Worker failed, falling back to ?share=', e);
    }

    // --- 2) Legacy fallback ---
    if (!finalUrl) {
      finalUrl = `${getShareBaseUrl()}/?share=${compressed}`;
    }


    // --- Copy only (UI feedback handled by caller) ---
    try {
      await navigator.clipboard.writeText(finalUrl);
    } catch (e) {
      console.warn('[GDMM] Clipboard API failed, using prompt fallback', e);
      window.prompt('Share this link:', finalUrl);
    }

    return finalUrl;
  }

  window.GDMMShare = window.GDMMShare || {};
  window.GDMMShare.createLink = createLink;



})();
