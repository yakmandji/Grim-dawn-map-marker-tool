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


window.getNotesForProfile = function getNotesForProfile(profileName, charId) {
  try {
    const raw = localStorage.getItem('gdmm_region_notes_v1');
    if (!raw) return null;

    const store = JSON.parse(raw) || {};
    const out = {};

    if (store.global && store.global[profileName]) {
      Object.assign(out, store.global[profileName]);
    }

    if (store.byCharacter && store.byCharacter[charId] && store.byCharacter[charId][profileName]) {
      Object.assign(out, store.byCharacter[charId][profileName]);
    }

    return Object.keys(out).length ? out : null;
  } catch (e) {
    console.warn('[GDMM] notes read failed', e);
    return null;
  }
};


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

          // Restaurer la clé d'édition si présente (ownership catalogue/share)
          try {
            const k = imported?.meta?.share?.editKey;
            if (typeof k === 'string' && k.length > 20) {
              localStorage.setItem('gdmm_share_edit_key_v1', k);
            }
          } catch (e) {
            console.warn('[GDMM] Failed to restore share edit key from import', e);
          }

          // Restaurer la save perso
          localStorage.setItem('grimSave_v2', JSON.stringify(imported.save));

          // Restaurer les notes
          localStorage.setItem('gdmm_region_notes_v1', JSON.stringify(imported.regionNotes));

          // restaurer les shrines si le champ existe
          if (imported.shrineProgress && typeof imported.shrineProgress === 'object') {
            localStorage.setItem('gdmm_shrine_progress_v1', JSON.stringify(imported.shrineProgress));
          }

          localStorage.setItem('gdmm_show_toast_after_reload', 'SaveImported');

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

    // Charger la clé d'édition (ownership catalogue/share)
    let shareEditKey = '';
    try {
      shareEditKey = localStorage.getItem('gdmm_share_edit_key_v1') || '';
    } catch (e) {
      console.warn('[GDMM] Failed to read share edit key for export', e);
      shareEditKey = '';
    }

    // Construire un seul objet exporté
    const exportObj = {
      v: 2,
      save: saveData,
      regionNotes: regionNotes,
      shrineProgress: shrineProgress,
      meta: {
        share: {
          editKey: shareEditKey || null
        }
      }
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

      const notesCount =
        (typeof window.countAllRegionNotesForActiveProfile === 'function')
          ? (window.countAllRegionNotesForActiveProfile() || 0)
          : 0;

      // 0 notes => pas de confirm, pas de reload
      if (notesCount === 0) {
        showToast?.(
          t ? t('toast.NothingToDeleteNotes') : 'No region notes to delete',
          'warning',
          2200
        );
        return;
      }

      const msg = t
        ? t('ui.DeleteNoteConfirm')
        : 'Delete all region notes? This cannot be undone.';

      if (!confirm(msg)) return;

      // Supprime uniquement les notes du personnage + profil (map) actifs
      if (typeof window.clearAllRegionNotesForActiveProfile === 'function') {
        window.clearAllRegionNotesForActiveProfile();
      } else {
        localStorage.removeItem('gdmm_region_notes_v1');
      }

      // Toast APRÈS reload
      localStorage.setItem('gdmm_show_toast_after_reload', 'NotesCleared');
      location.reload();
    });


    // --- Delete ALL archived markers (done = true) ---
    $('#clearArchive')?.addEventListener('click', () => {
      const p = currentProfile();
      if (!p || !Array.isArray(p.markers)) return;

      const archived = p.markers.filter(m => m.done);
      if (!archived.length) {
        showToast?.(
          GDMMLang.t?.('toast.NothingToDeleteArchive') || 'No archived markers',
          'warning',
          2200
        );
        return;
      }

      if (!confirm(
        GDMMLang.t?.('ui.ConfirmDeleteArchive') ||
        'Delete all archived markers?'
      )) return;

      // Keep only active markers
      p.markers = p.markers.filter(m => !m.done);

      markAsChanged?.();
      saveUserDataToLocal?.();

      renderList?.();
      renderMarkers?.();
      renderRoutesPanel?.();

      showToast?.(
        GDMMLang.t?.('toast.ArchiveCleared') || 'Archive cleared',
        'success',
        2600
      );
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


  // --- Archive ALL active markers (active profile) ---
  $('#addToArchive')?.addEventListener('click', () => {
    const p = currentProfile();
    if (!p) return;

    const markers = Array.isArray(p.markers) ? p.markers : [];
    const active = markers.filter(m => !m.done);

    if (!active.length) {
      showToast?.(GDMMLang.t('toast.NothingToArchive') || 'Nothing to archive', 'warning', 2200);
      return;
    }

    const msg =
      (GDMMLang.t && (GDMMLang.t('ui.ConfirmAddToArchive') || GDMMLang.t('toast.ConfirmAddToArchive'))) ||
      `Archive ${active.length} active marker(s)?`;

    if (!confirm(msg)) return;

    // Si l’historique est masqué, on le force visible (même logique que quand on coche "done")
    window.UiFilters?.ensureHistoryVisible?.();

    const now = Date.now();

    // Batch update (pas de rerender ici)
    active.forEach(m => {
      window.GDMMCore.updateMarker(m.id, { done: true, doneAt: now });
    });

    // 1 seul rerender + save
    markAsChanged?.();
    saveUserDataToLocal?.();

    renderList?.();
    renderMarkers?.();
    renderRoutesPanel?.();

    showToast?.(
      (GDMMLang.t && (GDMMLang.t('toast.AllArchived') || GDMMLang.t('toast.MarkersArchived'))) ||
        `Archived ${active.length} marker(s) ✅`,
      'success',
      2600
    );
  });



    // --- Clear markers actif profil ---
    $('#clearProfile')?.addEventListener('click', () => {
      const prof = currentProfile();
      if (!prof || !Array.isArray(prof.markers)) return;

      // Check active markers
      const hasActiveMarkers = prof.markers.some(m => !m.done);

      if (!hasActiveMarkers) {
        showToast?.(
          GDMMLang.t?.('toast.NothingToDeleteMarkers') ||
            'No active markers to delete',
          'warning',
          2200
        );
        return;
      }

      if (!confirm(GDMMLang.t?.('toast.WarnDeleteAllMarkers'))) return;

      coreClearMarkers();
      saveUserDataToLocal();
      renderList();
      renderMarkers();
      markAsChanged();
      renderRoutesPanel();

      showToast?.(
        GDMMLang.t?.('toast.MarkerMapCleared') ||
          'Active markers deleted',
        'success',
        2600
      );
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

// Anti-spam share : délai minimum entre deux partages
const SHARE_COOLDOWN_MS = 10_000; 
let lastShareClickTs = 0;


// Share current routes via Cloudflare Worker (with legacy fallback)
const shareBtn = document.getElementById('shareRoutesBtn');
  if (shareBtn) {

  function getActiveCharacterIdForShare() {
    try {
      return window.characterManager?.getActiveCharacter?.()?.id || '_global';
    } catch (_) {
      return '_global';
    }
  }


    function getOrCreateEditKey() {
      const K = 'gdmm_share_edit_key_v1';
      try {
        let v = localStorage.getItem(K);
        if (v && v.length > 20) return v;

        if (crypto?.getRandomValues) {
          const buf = new Uint8Array(32);
          crypto.getRandomValues(buf);
          v = Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('');
        } else {
          v = 'ek_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        }
        localStorage.setItem(K, v);
        return v;
      } catch {
        return 'ek_' + Math.random().toString(36).slice(2);
      }
    }

    function getShareIdForChar(charId) {
      try { return localStorage.getItem(`gdmm_share_id_v1::${charId}`) || ''; }
      catch { return ''; }
    }
    function setShareIdForChar(charId, id) {
      try { localStorage.setItem(`gdmm_share_id_v1::${charId}`, id); }
      catch {}
    }


  shareBtn.addEventListener('click', async () => {

    // Purge shared profiles before generating a new share
    try {
      for (const [name, profile] of Object.entries(state.profiles || {})) {
        if (!profile) continue;
        if (profile.isShared || String(name).startsWith('[Shared]')) {
          delete state.profiles[name];
        }
      }
      window.refreshProfilesUI?.();
      window.UiCore?.renderList?.();
    } catch (e) {
      console.warn('[GDMM] purge shared profiles failed', e);
    }


    const now = Date.now();
    if (now - lastShareClickTs < SHARE_COOLDOWN_MS) {
      const wait = Math.ceil((SHARE_COOLDOWN_MS - (now - lastShareClickTs)) / 1000);
      showToast(
        GDMMLang.t('toast.ShareCooldown', { wait }) || `Please wait ${wait}s before sharing again.`,
        'warning',
        4000
      );
      return;
    }
    lastShareClickTs = now;

    // --- Build v4 payload: all maps of current character ---
    const round = v => Math.round((v || 0) * 10) / 10;

    const userData = (typeof getUserDataOnly === 'function') ? getUserDataOnly() : {};
    const charId = getActiveCharacterIdForShare(); 
    const maps = {};

    const KNOWN_MAPS = ['Cairn', 'Malmouth', 'Korvan Basin', 'Asterkarn'];

    for (const profileName of KNOWN_MAPS) {
      const u = userData?.[profileName] || {};
      const paths   = Array.isArray(u.paths) ? u.paths : [];
      const markers = Array.isArray(u.markers) ? u.markers : [];

      const compactRoutes = paths.map(p => ({
        i: p.id,
        n: p.name || '',
        c: p.color || '#ffcc00',
        w: p.width || 4,
        o: typeof p.opacity === 'number' ? p.opacity : 0.85,
        pts: (p.points || []).map(pt => [round(pt.xp), round(pt.yp)]),
      }));

      const compactMarkers = markers.filter(Boolean).map(m => ({
        i: m.id,
        x: round(m.xp),
        y: round(m.yp),
        l: m.label || '',
        k: m.cat || 'General',
        c: m.color || '#78f1c2',
      }));

      const notes = window.getNotesForProfile
        ? window.getNotesForProfile(profileName, charId)
        : null;

      // on inclut même si vide
      maps[profileName] = { r: compactRoutes, m: compactMarkers, notes };
    }


    // rien à partager
    if (!Object.keys(maps).length) {
      showToast(GDMMLang.t('toast.NothingToShare') || 'Nothing to share', 'warning', 7000);
      return;
    }

    const payload = {
      v: '4',
      active: state.active,
      maps,
    };

    const isFile = location.protocol === 'file:' || location.origin === 'null';

    const editKey = isFile ? null : getOrCreateEditKey();
    const existingId = isFile ? null : getShareIdForChar(charId);

    const url = await window.GDMMShare?.createLink?.(payload, {
      id: existingId || null,
      editKey,
    });

      // Store returned short share id (if any)
      let stored = false;

      try {
        if (!isFile && url) {
          const u = new URL(url, location.origin);
          const newId = u.searchParams.get('s');
          if (newId) {
            setShareIdForChar(charId, newId);
            stored = true;
          }
        }
      } catch (e) {
        console.warn('[GDMM share] failed to store share id', e);
      }


      // Toast succès = UNIQUEMENT si tout s’est bien passé
      if (url) {
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
  mergeBtn.addEventListener('click', async () => {

    const profiles = state.profiles || {};
    const entries  = Object.entries(profiles);

    const sharedEntries = entries.filter(([name, p]) => p && p.isShared);
    if (!sharedEntries.length) {
      showToast('No shared map loaded ❌', 'error');
      return;
    }

    // Map locale sur laquelle on revient après merge
    const fallbackTarget = (state.active && !profiles[state.active]?.isShared)
      ? state.active
      : 'Cairn';

    let mergedSomething = false;
    let mergedMapsCount = 0;

    for (const [sharedName, sharedProf] of sharedEntries) {
      const targetName = sharedProf.sharedSourceMap;

      if (!targetName || !profiles[targetName] || profiles[targetName].isShared) {
        console.warn('[GDMM] shared target missing for', sharedName, '=>', targetName);
        continue;
      }

      const target = profiles[targetName];

      const incomingMarkers = Array.isArray(sharedProf.markers) ? sharedProf.markers : [];
      const incomingPaths   = Array.isArray(sharedProf.paths)   ? sharedProf.paths   : [];

      const existingMarkerIds = new Set((target.markers || []).map(m => m?.id).filter(Boolean));
      const existingPathIds   = new Set((target.paths   || []).map(p => p?.id).filter(Boolean));

      const newMarkers = incomingMarkers.filter(m => m && m.id && !existingMarkerIds.has(m.id));
      const newPaths   = incomingPaths.filter(p => p && p.id && !existingPathIds.has(p.id));

      const notesPayload =
        (window._gdmmSharedNotesByProfile && window._gdmmSharedNotesByProfile[sharedName]) || {};

      const hasSharedNotes =
        notesPayload &&
        typeof notesPayload === 'object' &&
        Object.keys(notesPayload).length > 0;

      if (!newMarkers.length && !newPaths.length && !hasSharedNotes) {
        continue;
      }

      if (newMarkers.length) target.markers = (target.markers || []).concat(newMarkers);
      if (newPaths.length)   target.paths   = (target.paths   || []).concat(newPaths);

      if (hasSharedNotes && typeof window.mergeSharedNotesIntoLocal === 'function') {
        try {
          window.mergeSharedNotesIntoLocal(notesPayload, targetName);
        } catch (e) {
          console.warn('[GDMM] Failed to merge shared region notes for', targetName, e);
        }
      }

      mergedSomething = true;
      mergedMapsCount++;
    }

    if (!mergedSomething) {
      showToast(GDMMLang.t('toast.SharedNoNewData'), 'warning', 4200);
      return;
    }

    // Sauvegarde
    saveUserDataToLocal();

    showToast(
      (GDMMLang.t && GDMMLang.t('toast.SharedMerged')) || `Shared merged (${mergedMapsCount} maps) ✅`,
      'success',
      4500
    );

    // =========================
    // Exit shared mode (CLEAN + SAFE)
    // =========================

    // 1) Quitter le mode shared AVANT toute reconstruction UI
    document.body.classList.remove('shared-only-view');

    // 2) Reset des flags runtime shared
    state.sharedView = false;
    state.sharedNotes = {};
    window._gdmmLastSharedNotesPayload = null;
    window._gdmmSharedNotesByProfile = null;

    // 3) Supprimer TOUS les profils shared
    for (const n of Object.keys(profiles)) {
      if (profiles[n]?.isShared || String(n).startsWith('[Shared]')) {
        delete profiles[n];
      }
    }

    // 4) Rebuild la liste des profils MAINTENANT qu’on est sorti du shared mode
    refreshProfilesUI();


    // 5) Forcer un vrai switch via le pipeline officiel
    const targetProfile = fallbackTarget;
    const sel = document.getElementById('profileSelect');

    if (sel) {
      sel.value = targetProfile;
      if (!sel.value) sel.selectedIndex = 0;

      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Safety: close dropdown if still open
    document.getElementById('profileDropdown')?.classList.remove('open');



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
