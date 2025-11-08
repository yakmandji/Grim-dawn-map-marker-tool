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

  // Export fichier JSON
  $('#exportFileBtn')?.addEventListener('click', async () => {
    const data = getUserDataOnly();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gdmm_user_markers.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    showToast(GDMMLang.t('toast.ExportAll'));
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
	    const snapshot = JSON.parse(JSON.stringify(state.profiles || {}));

	    for (const [name, p] of Object.entries(snapshot)) {
	      // Remove marker
	      p.markers = [];

	      try {
	        const live = state.profiles[name];
	        const src = live?.map?.sessionSrc || live?.map?.embedData;

	        if (src) {
	          const data = await srcToDataURL(src, 'image/jpeg', 0.85);
	          p.map = p.map || {};
	          p.map.embedData = data;
	        }
	      } catch (e) {
	        console.warn('[GDMM] export map failed for', name, e);
	      }

	      if (p.map) {
	        delete p.map.sessionSrc;
	      }
	    }

	    // Download final JSON
	    const data = JSON.stringify(snapshot, null, 2);
	    const blob = new Blob([data], { type: 'application/json' });
	    const a = document.createElement('a');
	    a.href = URL.createObjectURL(blob);
	    a.download = 'gdmm_all_profiles.json';
	    a.click();
	    setTimeout(() => URL.revokeObjectURL(a.href), 3000);

	    // feedback
	    if (typeof showToast === 'function') {
	      showToast('Maps exported (without markers) ✅');
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
    if (!confirm('Do you really want to delete all markers from this map?')) return;
    coreClearMarkers();
    saveUserDataToLocal();
    renderList();
    renderMarkers();
    markAsChanged();
    renderRoutesPanel();
    showToast(GDMMLang.t('toast.MarkerMapCleared'));
  });

  // Encode payload for share link -----------------------------------

  function encodeSharePayload(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
  }

  // Share current routes as URL
  const shareBtn = document.getElementById('shareRoutesBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const prof = currentProfile();
      if (!prof || !prof.paths || !prof.paths.length) {
        showToast(GDMMLang.t('toast.NoPathToExport'));
        return;
      }

      const payload = {
        v: '2.5',
        map: state.active,
        routes: prof.paths
      };

      let share;
      try {
        share = encodeSharePayload(payload);
      } catch (e) {
        console.error('[GDMM] share encoding failed', e);
        return;
      }

      const url = `${location.origin}${location.pathname}?share=${encodeURIComponent(share)}`;

      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch (e) {
          copied = false;
        }
      }

      if (!copied) {
        window.prompt('Share this link:', url);
      }

      showToast(GDMMLang.t('toast.ShareUrlCopied'));
    });
  }

//------------------------------------------------------------------------------------


  // --- Help ---
  document.querySelector('.closeHelp')?.addEventListener('click', () => {
    const sec = document.getElementById('helpSection');
    if (!sec) return;
    sec.style.display = 'none';
  });
  
  document.getElementById('helpToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = document.getElementById('helpSection');
    if (!sec) return;
    const show = sec.style.display === 'none' || sec.style.display === '';
    sec.style.display = show ? 'block' : 'none';
    if (show) {
      const handler = (e2) => {
        if (!sec.contains(e2.target) && e2.target !== e.target) {
          sec.style.display = 'none';
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }
  });


  // Merge function

const mergeBtn = document.getElementById('mergeSharedBtn');
if (mergeBtn) {
  mergeBtn.addEventListener('click', () => {
    const profiles = state.profiles || {};
    const entries  = Object.entries(profiles);

    const sharedEntry = entries.find(([name, p]) => p && p.isShared);
    if (!sharedEntry) {
      showToast('No shared map loaded ❌', 'error');
      return;
    }
    const [sharedName, sharedProf] = sharedEntry;

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

    // Merge markers + paths
    target.markers = (target.markers || []).concat(sharedProf.markers || []);
    target.paths   = (target.paths   || []).concat(sharedProf.paths   || []);

    // Sauvegarde et switch sur la map cible
    saveUserDataToLocal();
    setActiveProfile(targetName);
    refreshProfilesUI();
    renderList();
    renderMarkers();
    renderRoutesPanel();
    markAsChanged();

    delete profiles[sharedName];
    document.body.classList.remove('shared-only-view');
    mergeBtn.disabled = true;
    mergeBtn.style.display = 'none';

    // Clean URL
    if (window.history && window.history.replaceState) {
      const cleanUrl = location.origin + location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    showToast(
      (GDMMLang.t && GDMMLang.t('toast.SharedMerged')) ||
      'Shared data added to your map ✅'
    );
  });
}



  // --- Save marker ---
  $('#exportAllBtn')?.addEventListener('click', () => {
    saveUserDataToLocal();
    updateSaveIndicator(true);
    showToast(GDMMLang.t('toast.SaveMarkerAndRoute'));
  });
