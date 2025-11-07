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
          showToast('Full map data imported ✅');
          return;
        }

        if (isPathsOnly) {
          // User choice
          const mode = confirm('Import paths: OK = merge, Cancel = replace paths on matching maps ?')
            ? 'merge'
            : 'replace';

          for (const [name, incoming] of Object.entries(imported)) {
            const prof = state.profiles[name];
            if (!prof) continue;
            if (!incoming.paths) continue;

            if (!prof.paths) prof.paths = [];

            if (mode === 'replace') {
              prof.paths = incoming.paths;
            } else {
              prof.paths = prof.paths.concat(incoming.paths);
            }
          }

          renderMarkers();
          updateSaveIndicator(false);
          showToast('Paths imported ✅');
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
        showToast('Markers imported ✅');

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

  // Export fichier JSON (markers only)
  $('#exportFileBtn')?.addEventListener('click', async () => {
    const data = getUserDataOnly();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gdmm_user_markers.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  });

// Export path only
  const exportPathsBtn = document.getElementById('exportPathsBtn');
	if (exportPathsBtn) {
	  exportPathsBtn.addEventListener('click', () => {
	    const out = {};
	    const profiles = state.profiles || {};
	    for (const [name, prof] of Object.entries(profiles)) {
	      if (!prof?.paths || !prof.paths.length) continue;
	      out[name] = { paths: prof.paths };
	    }

	    if (Object.keys(out).length === 0) {
	      showToast('No paths to export ❌', 'error');
	      return;
	    }
	    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
	    const a = document.createElement('a');
	    a.href = URL.createObjectURL(blob);
	    a.download = 'gdmm_paths_only.json';
	    a.click();
	    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
	    showToast('Routes exported ✅');
	  });
	}

      // --- Clear all paths for active profile ---
    $('#clearPaths')?.addEventListener('click', () => {
      const prof = currentProfile();
      if (!prof) return;

      if (!prof.paths || prof.paths.length === 0) {
        showToast('No paths to delete ❌', 'error');
        return;
      }

      if (!confirm('Do you really want to delete all paths from this map?')) return;

      prof.paths = [];
      saveUserDataToLocal();
      renderMarkers();
      renderRoutesPanel();
      markAsChanged();
      showToast('All paths cleared for this map 🧹');
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
    showToast('Markers cleared for this map 🧹');
  });


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

  // --- Save marker ---
  $('#exportAllBtn')?.addEventListener('click', () => {
    saveUserDataToLocal();
    updateSaveIndicator(true);
    showToast('Markers & routes saved locally 💾');
  });