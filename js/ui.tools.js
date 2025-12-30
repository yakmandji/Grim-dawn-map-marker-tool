  const {
    state,
    currentProfile,
    setActiveProfile,
    ensureProfile,
    listProfiles,
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
    $('#importInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function() {
        let imported;
        try {
          imported = JSON.parse(reader.result);
        } catch (e) {
          alert('Invalid JSON');
          return;
        }

        // --- FORMAT NOUVEAU ---
        // { v: 2, save: { ... }, regionNotes: { ... } }
        if (imported.save && typeof imported.regionNotes === 'object') {

          // Restaurer la save perso
          localStorage.setItem('grimSave_v2', JSON.stringify(imported.save));

          // Restaurer les notes
          localStorage.setItem('gdmm_region_notes_v1', JSON.stringify(imported.regionNotes));

          // restaurer les shrines si le champ existe
          if (imported.shrineProgress && typeof imported.shrineProgress === 'object') {
            localStorage.setItem('gdmm_shrine_progress_v1', JSON.stringify(imported.shrineProgress));
          }

          alert('Save (characters + region notes) imported successfully!');
          location.reload();
          return;
        }

        // --- FORMAT ANCIEN ---
        // Uniquement grimSave_v2
        if (imported.characters) {
          localStorage.setItem('grimSave_v2', JSON.stringify(imported));
          alert('Legacy save imported successfully!\n(Region notes were not included in this file)');
          location.reload();
          return;
        }

        alert('File format not recognized.');
      };

      reader.readAsText(file);
    });



  // Import fichier JSON
    $('#importReplaceBtn')?.addEventListener('click', () => {
      const input = $('#importInput');
      input.value = '';
      input.click();
    });

  $('#exportFileBtn')?.addEventListener('click', () => {
    // Charger la sauvegarde des personnages
    const rawSave = localStorage.getItem('grimSave_v2');
    const saveData = rawSave ? JSON.parse(rawSave) : null;

    if (!saveData) {
      alert('No save data found.');
      return;
    }

    // Charger les notes globales
    let regionNotes = {};
    try {
      const rnRaw = localStorage.getItem('gdmm_region_notes_v1');
      regionNotes = rnRaw ? JSON.parse(rnRaw) : {};
    } catch (e) {
      console.warn('[GDMM] Failed to read region notes for export', e);
    }


    // Charger la progression des shrines (multi-char)
    let shrineProgress = null;
    try {
      const spRaw = localStorage.getItem('gdmm_shrine_progress_v1');
      shrineProgress = spRaw ? JSON.parse(spRaw) : null;
    } catch (e) {
      console.warn('[GDMM] Failed to read shrine progress for export', e);
      shrineProgress = null;
    }

    // Construire un seul objet exporté
    const exportObj = {
      v: 2,
      save: saveData,
      regionNotes: regionNotes,
      shrineProgress: shrineProgress
    };

    // Exporter fichier JSON
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
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


    // --- Clear all region notes ---
    $('#clearNotes')?.addEventListener('click', () => {

      const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
        ? GDMMLang.t.bind(GDMMLang)
        : null;

      const msg = t
        ? t('ui.DeleteNoteConfirm')
        : 'Delete all region notes? This cannot be undone.';

      if (!confirm(msg)) {
        return;
      }

      // Supprime uniquement les notes du personnage + profil (map) actifs
      if (typeof window.clearAllRegionNotesForActiveProfile === 'function') {
        window.clearAllRegionNotesForActiveProfile();
      } else {
        // Fallback de sécurité si jamais le helper n'existe pas
        localStorage.removeItem('gdmm_region_notes_v1');
      }

      // Recharge pour enlever les "i" et tooltips
      location.reload();
    });




//ADMIN TOOLS

  const isDev = (typeof window.GDMMCore?.isDevUnlocked === 'function')
    ? window.GDMMCore.isDevUnlocked()
    : false;

  if (isDev) {

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

        // nom de fichier
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

    $('#mapFile')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      setMapSrc(f);
      showToast('🗺Map image updated successfully');
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

    $('#clearShrine')?.addEventListener('click', () => {
    if (typeof window.clearAllShrinesForActiveChar !== 'function') return;

    const msg = (window.GDMMLang && typeof GDMMLang.t === 'function')
      ? (GDMMLang.t('ui.ConfirmResetShrines') || 'Reset all shrines for this character?')
      : 'Reset all shrines for this character?';

    if (!confirm(msg)) return;

    window.clearAllShrinesForActiveChar();

    if (typeof showToast === 'function' && window.GDMMLang && GDMMLang.t) {
      showToast(GDMMLang.t('toast.ShrinesReset') || 'Shrines reset for this character');
    }
  });


// --- Advanced compression toggle ---
const ADVANCED_COMPRESSION = true;

// Cloudflare Worker pour les liens de partage
const SHARE_WORKER_BASE =
  window.GDMM_SHARE_WORKER_URL ||
  'https://share.grimcustommarker.org';

// Anti-spam share : délai minimum entre deux partages
const SHARE_COOLDOWN_MS = 10_000; 
let lastShareClickTs = 0;



// Share current routes via Cloudflare Worker (with legacy fallback)
const shareBtn = document.getElementById('shareRoutesBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {

    const now = Date.now();
    if (now - lastShareClickTs < SHARE_COOLDOWN_MS) {
      const wait = Math.ceil((SHARE_COOLDOWN_MS - (now - lastShareClickTs)) / 1000);

      showToast(
        GDMMLang.t('toast.ShareCooldown', { wait }) ||
          `Please wait ${wait}s before sharing again.`,
        'warning',
        4000
      );

      return;
    }

    lastShareClickTs = now;
    
    const prof = currentProfile();
    if (!prof) return;

    const allMarkers = Array.isArray(prof.markers) ? prof.markers : [];
    const markersToShare = allMarkers.filter(Boolean);
    const hasRoutes = Array.isArray(prof.paths) && prof.paths.length > 0;


    // --- Notes de région pour cette map (si helper dispo) ---
    let sharedNotes = null;
    let hasSharedNotes = false;

    if (typeof window.getAllRegionNotes === 'function') {
      sharedNotes = window.getAllRegionNotes(state.active);
      if (sharedNotes && typeof sharedNotes === 'object') {
        hasSharedNotes = Object.keys(sharedNotes).length > 0;
      }
    }

    // Rien à partager : ni routes, ni markers partagés, ni notes
    if (!hasRoutes && markersToShare.length === 0 && !hasSharedNotes) {
      showToast(
        GDMMLang.t('toast.NothingToShare') || 'Nothing to share',
        'warning',
        7000
      );
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

    const compactMarkers = markersToShare.map(m => ({
      i: m.id,
      x: round(m.xp),
      y: round(m.yp),
      l: m.label || '',
      k: m.cat || 'General',
      c: m.color || '#78f1c2',
    }));

    // --- Notes de région pour cette map (si helper dispo) ---
    const payload = {
       v: '3',
       map: state.active,
       r: compactRoutes,
       m: compactMarkers,
       notes: sharedNotes,
    };

    // --- Compression (pour compatibilité avec les vieux liens ?share=) ---
    let compressed;
    try {
      const json = JSON.stringify(payload);

      if (ADVANCED_COMPRESSION && window.pako) {
        const gzipped = pako.deflate(json, { level: 9 });
        const b64 = btoa(String.fromCharCode.apply(null, gzipped));
        compressed = encodeURIComponent(b64);
      } else if (window.LZString && LZString.compressToEncodedURIComponent) {
        compressed = LZString.compressToEncodedURIComponent(json);
      } else {
        // Pas de lib → on stocke en base64 brut
        compressed = btoa(json);
      }
    } catch (e) {
      console.error('[GDMM] compression failed', e);
      showToast('Compression error ❌', 'error');
      return;
    }

    // --- 1) Tentative moderne : Cloudflare Worker + Gist ---
    let finalUrl = null;

    try {
      if (SHARE_WORKER_BASE) {
        const res = await fetch(`${SHARE_WORKER_BASE}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload }),
        });

        const out = await res.json();

        if (out && out.ok && out.id) {
          // On construit TOUJOURS l'URL à partir de l'origine courante
          finalUrl = `${location.origin}${location.pathname}?s=${encodeURIComponent(
            out.id
          )}`;
        }

      }
    } catch (e) {
      console.warn('[GDMM] share via Worker failed, falling back to ?share=', e);
    }

    // --- 2) Fallback : ancien système ?share=... ---
    if (!finalUrl) {
      finalUrl = `${location.origin}${location.pathname}?share=${compressed}`;
    }

    // --- Copie dans le presse-papier + feedback utilisateur ---
    try {
      await navigator.clipboard.writeText(finalUrl);
      showToast(GDMMLang.t('toast.ShareUrlCopied'), 'success', 3800);
    } catch (e) {
      console.warn('[GDMM] Clipboard API failed, using prompt fallback', e);
      window.prompt('Share this link:', finalUrl);
      showToast(GDMMLang.t('toast.ShareUrlCopied'), 'success', 3800);
    }
  });
}

//------------------------------------------------------------------------------------

  // Stock pour pouvoir supprimer le handler plus tard
  let activeModalHandler = null;

  // Fonction générique popup
  function openModal(modalEl, backdropEl) {
    if (!modalEl) return;

    // Afficher la popup
    modalEl.classList?.remove('hidden');
    modalEl.classList?.add('is-active');
    modalEl.style.display = 'block';

    // Afficher le backdrop
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

// Gestion globale de toutes les croix
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

    // 4) Sets of existing IDs
    const existingMarkerIds = new Set(
      (target.markers || []).map(m => m.id).filter(Boolean)
    );
    const existingPathIds = new Set(
      (target.paths || []).map(p => p.id).filter(Boolean)
    );

    const newMarkers = incomingMarkers.filter(
      m => m && m.id && !existingMarkerIds.has(m.id)
    );

    const newPaths   = incomingPaths.filter(
      p => p.id && !existingPathIds.has(p.id)
    );

    // Est-ce qu'on a des notes partagées à merger
    const hasSharedNotes =
      window._gdmmLastSharedNotesPayload &&
      typeof window._gdmmLastSharedNotesPayload === 'object' &&
      Object.keys(window._gdmmLastSharedNotesPayload).length > 0;

    // Si aucun nouveau marker, aucune nouvelle route ET pas de notes → vraiment rien à faire
    if (!newMarkers.length && !newPaths.length && !hasSharedNotes) {
      showToast(GDMMLang.t('toast.SharedNoNewData'), 'warning', 4200);
    } else {
      // 6) Merge markers & routes (même si l'un des deux est vide)
      target.markers = (target.markers || []).concat(newMarkers);
      target.paths   = (target.paths   || []).concat(newPaths);

      // 7) Merge des notes de région (si présentes dans le partage)
      if (
        hasSharedNotes &&
        typeof window.mergeSharedNotesIntoLocal === 'function'
      ) {
        try {
          window.mergeSharedNotesIntoLocal(
            window._gdmmLastSharedNotesPayload,
            targetName
          );
        } catch (e) {
          console.warn('[GDMM] Failed to merge shared region notes', e);
        }
      }


      saveUserDataToLocal();
      setActiveProfile(targetName);
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
      markAsChanged();

      showToast(GDMMLang.t('toast.SharedMerged'), 'success', 4500);
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
