// ui.share.js
// Gestion des cartes partagées via ?s=... (Cloudflare Worker) ou ?share=... (legacy)

(function () {
  const core   = window.GDMMCore || {};
  const state  = core.state || {};
  const ensureProfile    = core.ensureProfile    || function () {};
  const setActiveProfile = core.setActiveProfile || function () {};

  const SHARE_WORKER_BASE =
    window.GDMM_SHARE_WORKER_URL ||
    'https://share.grimcustommarker.org';

  // --- Decode share payload from URL (GZIP + Base64 + LZString) ---
  function decodeSharePayload(str) {
    if (!str) return null;

    // 1) Nouveau format : GZIP (pako) + base64 + encodeURIComponent
    if (window.pako) {
      try {
        const b64 = decodeURIComponent(str);
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const out = pako.inflate(bin, { to: 'string' });
        if (out) {
          return JSON.parse(out);
        }
      } catch (e) {
        console.warn('[GDMM] GZIP decode failed, fallback to LZString/base64', e);
      }
    }

    // 3) Base64 JSON brut
    try {
      const decoded = atob(str);
      return JSON.parse(decoded);
    } catch (e) {
      // 4) Base64 JSON mais avec encodeURIComponent autour
      try {
        const decoded = atob(decodeURIComponent(str));
        return JSON.parse(decoded);
      } catch (e2) {
        console.error('[GDMM] All decode methods failed', e2);
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

    let routes  = [];
    let markers = [];
    const mapName = data.map || null;

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
        shared: true,
      }));
    }
    // --- Ancien format (routes / markers en clair) ---
    else if (Array.isArray(data.routes) || Array.isArray(data.markers)) {
      const incomingRoutes = Array.isArray(data.routes) ? data.routes : [];
      routes = incomingRoutes.map(r => {
        if (!r || typeof r !== 'object') return r;
        return { ...r, shared: true };
      });

      const incomingMarkers = Array.isArray(data.markers) ? data.markers : [];
      markers = incomingMarkers.map(m => {
        if (!m || typeof m !== 'object') return m;
        return { ...m, shared: true };
      });
    } else {
      // rien d'exploitable
      return;
    }

    if (!routes.length && !markers.length) return;

    // --- Crée un profil [Shared] xxx unique ---
    const baseName = `[Shared] ${mapName || 'Route'}`;
    let name = baseName;
    let i = 2;
    while (state.profiles && state.profiles[name]) {
      name = `${baseName} #${i++}`;
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
      if (window.showLoader) {
        showLoader(GDMMLang.t('toast.LoadingMap'));
      }
      if (typeof window.setMapSrc === 'function') {
        setMapSrc(p.map.embedData);
      }
    } else if (p.map && p.map.sessionSrc) {
      if (window.showLoader) {
        showLoader(GDMMLang.t('toast.LoadingMap'));
      }
      if (typeof window.setMapSrc === 'function') {
        setMapSrc(p.map.sessionSrc);
      }
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
  };
})();
