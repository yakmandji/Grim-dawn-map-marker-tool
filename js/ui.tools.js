  const {
    DEV_MODE,
    state,
    currentProfile,
    setActiveProfile,
    ensureProfile,
    createProfile,
    renameProfile,
    listProfiles,
    deleteProfile,
    getUserDataOnly,
    clearMarkers: coreClearMarkers,
    saveUserDataToLocal,
    markAsChanged,
    mergeUserMarkers,
  } = window.GDMMCore;


  const {
  	$,
  	mapImg,
  	ensurePathsArray,
  	refreshProfilesUI,
  	renderList,
  	renderMarkers,
  	renderRoutesPanel,
  	updateSaveIndicator,
  	setMapSrc,
  	showToast,
  } = window.UiCore;

//--------------------------------------------------


  // Convert image (sessionSrc / embedData) in base64 for admin export
  async function srcToDataURL(src, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL(mime, quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = src;
    });
  }

//USER TOOLS

  // IMPORT funtion
    $('#importInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);

        const values = Object.values(imported);

        const isFullExport = values.some(p => p && (p.map || p.embedData));
        const isPathsOnly  = values.some(p => p && p.paths && !p.markers);

        if (isFullExport && !isPathsOnly) {
          state.profiles = imported;
          const first = Object.keys(state.profiles)[0] || null;
          state.active = first;
          refreshProfilesUI();
          renderList();
          renderMarkers();
          renderRoutesPanel();
          updateSaveIndicator(true);
          showToast(GDMMLang.t('toast.FullMapDataImported'));
          return;
        }

        if (isPathsOnly) {
          for (const [name, incoming] of Object.entries(imported)) {
            const prof = state.profiles[name];
            if (!prof) continue;
            if (!incoming.paths) continue;

            if (!prof.paths) prof.paths = [];
            prof.paths = prof.paths.concat(incoming.paths);
          }

          renderMarkers();
          updateSaveIndicator(false);
          showToast(GDMMLang.t('toast.PathImported'));
          return;
        }

        mergeUserMarkers(imported);

        // check if path
        const profiles = state.profiles || {};
        for (const [name, incoming] of Object.entries(imported)) {
          if (!incoming) continue;
          if (!incoming.paths) continue;
          if (!profiles[name]) continue;

          const target = profiles[name];
          if (!target.paths) target.paths = [];
          target.paths = incoming.paths;
        }

        refreshProfilesUI();
        renderList();
        renderMarkers();
        renderRoutesPanel();
        saveUserDataToLocal();
        updateSaveIndicator(true);
        showToast(GDMMLang.t('toast.MarkerImported'));

      } catch (err) {
        console.error('[GDMM] import failed:', err);
        showToast('Import failed (invalid JSON) ❌', 'error');
      }
    });


// Import fichier JSON
  $('#importReplaceBtn')?.addEventListener('click', () => {
    const input = $('#importInput');
    input.value = '';
    input.click();
  });

    $('#exportFileBtn')?.addEventListener('click', () => {
      const raw = localStorage.getItem('grimSave_v2');
      const data = raw ? JSON.parse(raw) : null;
      if (!data) {
        alert('No save data found.');
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gdmm_save_multi.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    });


      // --- Clear all paths for active profile ---
    $('#clearPaths')?.addEventListener('click', () => {
      const prof = currentProfile();
      if (!prof) return;

      if (!prof.paths || prof.paths.length === 0) {
        showToast(GDMMLang.t('toast.NoPathToDelete'));
        return;
      }

      if (!confirm(GDMMLang.t('toast.WarnDeleteAllPath'))) return;

      prof.paths = [];
      saveUserDataToLocal();
      renderMarkers();
      renderRoutesPanel();
      markAsChanged();
      showToast(GDMMLang.t('toast.AllPathDeleted'));
    });


//ADMIN TOOLS
  if (DEV_MODE) {

    $('#exportMapsOnlyBtn')?.addEventListener('click', async () => {
      const profiles = state.profiles || {};

      for (const [name, prof] of Object.entries(profiles)) {
        if (!prof) continue;

        const out = { map: {} };

        // récupère la source de la map (sessionSrc ou embedData déjà présent)
        const liveMap = prof.map || {};
        let src = liveMap.sessionSrc || liveMap.embedData || null;

        try {
          // si c'est un File / Blob ou une URL classique, on la convertit en data URL
          if (src && typeof src !== 'string') {
            src = await srcToDataURL(src, 'image/jpeg', 0.85);
          } else if (src && typeof src === 'string' && !src.startsWith('data:')) {
            src = await srcToDataURL(src, 'image/jpeg', 0.85);
          }
        } catch (e) {
          console.warn('[GDMM] export map failed for', name, e);
        }

        if (src) {
          out.map.embedData = src;
        }
        if (typeof liveMap.w === 'number') out.map.w = liveMap.w;
        if (typeof liveMap.h === 'number') out.map.h = liveMap.h;

        // nom de fichier propre : cairn_profile.json, malmouth_profile.json, etc.
        const safeName = (name || 'map')
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        const fileName = `${safeName}_profile.json`;

        const blob = new Blob([JSON.stringify(out, null, 2)], {
          type: 'application/json',
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      }

      if (typeof showToast === 'function') {
        showToast('Maps exported separately (without markers) ✅');
      }
    });


    $('#clearSession')?.addEventListener('click', () => {
      if (!confirm('Delete all session ?')) return;
      state.profiles = {}; state.active = null;
      mapImg.removeAttribute('src'); state.mapReady = false; state.mapNatural = { w:0, h:0 };
      refreshProfilesUI();
    });

    $('#newProfile')?.addEventListener('click', () => {
      const n = prompt('Name of new map ?'); if (!n) return;
      if (state.profiles[n]) { alert('this name already exist'); return; }
      createProfile(n);
      setActiveProfile(n);
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
    });

    $('#renProfile')?.addEventListener('click', () => {
      if (!state.active) return;
      const n = prompt('New name ?', state.active); if (!n || n === state.active) return;
      if (state.profiles[n]) { alert('Name already exist'); return; }
      renameProfile(state.active, n);
      refreshProfilesUI();
    });

    $('#delProfile')?.addEventListener('click', () => {
      if (!state.active) return;
      const victim = state.active;
      if (!confirm('You will delete « '+victim+' » map and all associated markers')) return;
      deleteProfile(victim);
      mapImg.removeAttribute('src'); state.mapReady=false; state.mapNatural={w:0,h:0};
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
    });

    $('#mapFile')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      setMapSrc(f);
      showToast('🗺️ Map image updated successfully');
      markAsChanged();
    });
  } else {
    document.getElementById('admin-section')?.remove();
  }


    // --- Clear markers actif profil ---
  $('#clearProfile')?.addEventListener('click', () => {
    const prof = currentProfile(); if (!prof) return;
    if (!confirm(GDMMLang.t('toast.WarnDeleteAllMarkers'))) return;
    coreClearMarkers();
    saveUserDataToLocal();
    renderList();
    renderMarkers();
    markAsChanged();
    renderRoutesPanel();
    showToast(GDMMLang.t('toast.MarkerMapCleared'));
  });

// --- Advanced compression toggle ---
const ADVANCED_COMPRESSION = true;

// Share current routes as URL
const shareBtn = document.getElementById('shareRoutesBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const prof = currentProfile();
    if (!prof) return;

    const allMarkers = Array.isArray(prof.markers) ? prof.markers : [];
    const sharedMarkers = allMarkers.filter(m => m && m.shared);
    const hasRoutes = Array.isArray(prof.paths) && prof.paths.length > 0;

    // ✅ Check for both shared markers OR routes
    if (!hasRoutes && sharedMarkers.length === 0) {
      showToast(GDMMLang.t('toast.NothingToShare') || 'Nothing to share','warning', 7000);
      return;
    }

    const round = v => Math.round((v || 0) * 10) / 10;

    const compactRoutes = (prof.paths || []).map(p => ({
      i: p.id,
      n: p.name || '',
      c: p.color || '#ffcc00',
      w: p.width || 4,
      o: typeof p.opacity === 'number' ? p.opacity : 0.85,
      pts: (p.points || []).map(pt => [round(pt.xp), round(pt.yp)]),
    }));

    const compactMarkers = sharedMarkers.map(m => ({
      i: m.id,
      x: round(m.xp),
      y: round(m.yp),
      l: m.label || '',
      k: m.cat || 'General',
      c: m.color || '#78f1c2',
    }));

    const payload = {
      v: '2.8',
      map: state.active,
      r: compactRoutes,
      m: compactMarkers,
    };

    // --- Compression phase ---
    let compressed;
    try {
      const json = JSON.stringify(payload);

      if (ADVANCED_COMPRESSION && window.pako) {
        const gzipped = pako.deflate(json, { level: 9 });
        const b64 = btoa(String.fromCharCode.apply(null, gzipped));
        compressed = encodeURIComponent(b64);
      } else {
        compressed = LZString.compressToEncodedURIComponent(json);
      }
    } catch (e) {
      console.error('[GDMM] compression failed', e);
      showToast('Compression error ❌', 'error');
      return;
    }

    const url = `${location.origin}${location.pathname}?share=${compressed}`;

    try {
      await navigator.clipboard.writeText(url);
      showToast(GDMMLang.t('toast.ShareUrlCopied'),'success', 3800);
    } catch (e) {
      window.prompt('Share this link:', url);
    }
  });
}


//------------------------------------------------------------------------------------

  // --- Help ---
  
/*  document.getElementById('helpToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = document.getElementById('helpSection');
    const backdrop = document.getElementById('helpBackdrop');
    if (!sec) return;
    const show = sec.style.display === 'none' || sec.style.display === '';
    sec.style.display = show ? 'block' : 'none';
    if (backdrop) {
      backdrop.style.display = show ? 'block' : 'none';
    }
    if (show) {
      const handler = (e2) => {
        // Clic en dehors de la popup ET du lien qui l'a ouverte
        if (!sec.contains(e2.target) && e2.target !== e.target) {
          sec.style.display = 'none';
          if (backdrop) backdrop.style.display = 'none';
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }
  });
*/

  // Stock pour pouvoir supprimer le handler plus tard
  let activeModalHandler = null;

  // Fonction générique popup
  function openModal(modalEl, backdropEl) {
    if (!modalEl) return;

    // Afficher la popup
    modalEl.classList?.remove('hidden');
    modalEl.classList?.add('is-active');
    modalEl.setAttribute?.('aria-hidden', 'false');
    modalEl.style.display = 'block';

    // Afficher le backdrop (flou)
    if (backdropEl) {
      backdropEl.style.display = 'block';
    }

    // Important: si un ancien handler existe encore → on le retire
    if (activeModalHandler) {
      document.removeEventListener('click', activeModalHandler);
      activeModalHandler = null;
    }

    // Timeout pour éviter que le clic qui ouvre ne ferme immédiatement
    setTimeout(() => {
      activeModalHandler = (e) => {
        if (!modalEl.contains(e.target)) {
          closeModal(modalEl, backdropEl);
        }
      };
      document.addEventListener('click', activeModalHandler);
    });
  }

  // Fonction générique pour fermer une popup
  function closeModal(modalEl, backdropEl) {
    if (!modalEl) return;

    modalEl.classList?.remove('is-active');
    modalEl.classList?.add('hidden');
    modalEl.setAttribute?.('aria-hidden', 'true');
    modalEl.style.display = 'none';

    if (backdropEl) {
      backdropEl.style.display = 'none';
    }

    // Nettoyage du listener d'outside-click
    if (activeModalHandler) {
      document.removeEventListener('click', activeModalHandler);
      activeModalHandler = null;
    }
  }

// Gestion globale de toutes les croix "X"
document.querySelectorAll('.closeModal').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const modal = btn.closest('.modal');
    const backdrop = document.getElementById('helpBackdrop');
    if (modal) {
      closeModal(modal, backdrop);
    }
  });
});


document.getElementById('helpToggle')?.addEventListener('click', (e) => {
  e.preventDefault();
  const sec = document.getElementById('helpSection');
  const backdrop = document.getElementById('helpBackdrop');
  openModal(sec, backdrop);
});

document.getElementById('helpCloseBtn')?.addEventListener('click', () => {
  closeModal(
    document.getElementById('helpSection'),
    document.getElementById('helpBackdrop')
  );
});

// Merge function

const mergeBtn = document.getElementById('mergeSharedBtn');
if (mergeBtn) {
  mergeBtn.addEventListener('click', () => {
    const profiles = state.profiles || {};
    const entries  = Object.entries(profiles);

    // 1) Shared profile
    const sharedEntry = entries.find(([name, p]) => p && p.isShared);
    if (!sharedEntry) {
      showToast('No shared map loaded ❌', 'error');
      return;
    }
    const [sharedName, sharedProf] = sharedEntry;

    // 2) Target map
    const targetName = sharedProf.sharedSourceMap;
    if (!targetName || !profiles[targetName] || profiles[targetName].isShared) {
      showToast(
        (GDMMLang.t && GDMMLang.t('toast.SharedTargetMissing')) ||
        'Original map not found ❌',
        'error'
      );
      return;
    }

    const target = profiles[targetName];

    // 3) Incoming data
    const incomingMarkers = Array.isArray(sharedProf.markers) ? sharedProf.markers : [];
    const incomingPaths   = Array.isArray(sharedProf.paths)   ? sharedProf.paths   : [];

     // Only shared marker
    const sharedIncomingMarkers = incomingMarkers.filter(m => m && m.shared);

    // 4) Sets of existing IDs
    const existingMarkerIds = new Set(
      (target.markers || []).map(m => m.id).filter(Boolean)
    );
    const existingPathIds = new Set(
      (target.paths || []).map(p => p.id).filter(Boolean)
    );

    const newMarkers = sharedIncomingMarkers.filter(
      m => m.id && !existingMarkerIds.has(m.id)
    );

    const newPaths   = incomingPaths.filter(
      p => p.id && !existingPathIds.has(p.id)
    );

    if (!newMarkers.length && !newPaths.length) {
        showToast(GDMMLang.t('toast.SharedNoNewData'),'warning', 4200);
    } else {
      // 6) Real merge
      target.markers = (target.markers || []).concat(newMarkers);
      target.paths   = (target.paths   || []).concat(newPaths);

      saveUserDataToLocal();
      setActiveProfile(targetName);
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
      markAsChanged();

      showToast(GDMMLang.t('toast.SharedMerged'),'success', 4500);
    }

    // Remove shared profile & exit shared mode
    delete profiles[sharedName];
    refreshProfilesUI(); 
    document.body.classList.remove('shared-only-view');

    mergeBtn.disabled = true;
    mergeBtn.style.display = 'none';

    // Clean URL
    if (window.history && window.history.replaceState) {
      const cleanUrl = location.origin + location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  });
}


  // --- Save marker ---
  $('#exportAllBtn')?.addEventListener('click', () => {
    saveUserDataToLocal();
    updateSaveIndicator(true);
    showToast(GDMMLang.t('toast.SaveMarkerAndRoute'));
  });
