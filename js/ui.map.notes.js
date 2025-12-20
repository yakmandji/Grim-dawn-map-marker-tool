// ui.map.notes.js
// Gestion des notes (liste, stockage, panel)

(function() {

    const core  = window.GDMMCore || {};
    const state = core.state || {};

    const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
      ? GDMMLang.t.bind(GDMMLang)
      : (s) => s;

    let currentRegionIdForPanel = null;


    /* NOTE LIST ------------------------------------------------------*/
      function getAllRegionNotes() {

      // Mode vue partagée : on lit les notes du lien uniquement
      if (state.sharedView && state.sharedNotes && typeof state.sharedNotes === 'object') {
        return state.sharedNotes;
      }

        const store   = loadRegionNotesStore();   // utilise le nouveau format v2
        const profile = getActiveProfileName();
        if (!profile) return {};

        const charKey = typeof getActiveCharacterKey === 'function'
          ? getActiveCharacterKey()
          : '_global';

        const result = {};

        // 1) Anciennes notes globales (v1 migrées dans store.global)
        if (store.global && store.global[profile]) {
          Object.assign(result, store.global[profile]);
        }

        // 2) Notes du personnage actif → priment sur les globales
        if (
          store.byCharacter &&
          store.byCharacter[charKey] &&
          store.byCharacter[charKey][profile]
        ) {
          Object.assign(result, store.byCharacter[charKey][profile]);
        }

        return result;
      }


    function buildNoteList() {
      const listEl  = document.getElementById('noteList');
      const countEl = document.getElementById('noteCount');
      if (!listEl || !countEl) return;

      const notes     = getAllRegionNotes();
      const regionIds = Object.keys(notes);

      regionIds.sort((a, b) => {
        const na = notes[a];
        const nb = notes[b];
        const ta = na && typeof na === "object" ? na.ts : 0;
        const tb = nb && typeof nb === "object" ? nb.ts : 0;
        return tb - ta; // plus récent en premier
      });

      countEl.textContent = regionIds.length;

      if (regionIds.length === 0) {
        listEl.innerHTML = `<div class="empty-list"></div>`;
        return;
      }

      listEl.innerHTML = '';

      function truncate(text, max = 40) {
        if (!text) return '';
        return text.length > max ? text.slice(0, max) + '…' : text;
      }

      // Choix dynamique selon l’état de la sidebar
      const isCollapsed = document.body.classList.contains("sidebar-collapsed");
      const maxLen = isCollapsed ? 22 : 85;

      regionIds.forEach(regionId => {

        const raw = notes[regionId];
        const noteText = raw && typeof raw === "object" ? raw.text : raw || "";

        const preview = truncate(noteText.trim(), maxLen);

        // Nom localisé depuis le DOM
        let regionName = regionId;
        const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
        if (regionEl) {
          const labelEl = regionEl.querySelector('.region-label');
          if (labelEl && labelEl.textContent.trim()) {
            regionName = labelEl.textContent.trim();
          }
        }

        const row = document.createElement('div');
        row.className = 'listItem';
        row.dataset.regionId = regionId;

        row.innerHTML = `
          <img src="img/info-icon.svg" class="icon-16" width="20" />

          <span class="note-region-name"></span>

          <button type="button"
                  class="marker-center small"
                  title="${GDMMLang.t('ui.CenterOnMap')}">
            <img src="img/center-icon.svg" width="12">
          </button>

          <button type="button"
                  class="danger small note-delete-btn"
                  title="${GDMMLang.t('ui.DeleteButton')}">
            <img src="img/bin-icon.svg" width="12">
          </button>
        `;

        const labelSpan = row.querySelector('.note-region-name');
        if (labelSpan) {
          labelSpan.textContent = preview || regionName;
        }

        // --- Tooltip body-level sur l’icône info ---
        const infoIcon = row.querySelector('.icon-16');
        if (infoIcon) {
          infoIcon.addEventListener('mouseenter', (ev) => {
            const fullText = (noteText || '').trim();
            if (!fullText) return;

            // si une ancienne tooltip traîne, on la vire
            if (infoIcon._noteTooltip) {
              infoIcon._noteTooltip.remove();
              infoIcon._noteTooltip = null;
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'region-note-tooltip';
            tooltip.textContent = fullText;

            document.body.appendChild(tooltip);

            const r = ev.target.getBoundingClientRect();
            tooltip.style.left = `${r.left + r.width / 2}px`;
            tooltip.style.top  = `${r.bottom + 8}px`;

            infoIcon._noteTooltip = tooltip;
          });

          infoIcon.addEventListener('mouseleave', () => {
            if (infoIcon._noteTooltip) {
              infoIcon._noteTooltip.remove();
              infoIcon._noteTooltip = null;
            }
          });
        }

        // --- Bouton center ---
        const centerBtn = row.querySelector('.marker-center');
        if (centerBtn) {

          function handler() {
              if (typeof window.ensureAdminLayerVisible === 'function') {
                window.ensureAdminLayerVisible('region');
              }
              
              const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
              if (!regionEl) return;

              const xp = parseFloat(regionEl.dataset.xp);
              const yp = parseFloat(regionEl.dataset.yp);
              if (isNaN(xp) || isNaN(yp)) return;

              window.centerOn(xp, yp, 1.0);

              // Pulse animation
              regionEl.classList.add('marker-highlight');
              setTimeout(() => regionEl.classList.remove('marker-highlight'), 1500);
          }

          centerBtn.addEventListener('click', handler);
          infoIcon.addEventListener('click', handler);
        }

        // --- Bouton delete  ---
        const deleteBtn = row.querySelector('.note-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            // 1) Efface du store (perso + global)
            clearRegionNote(regionId);

            // 2) Met à jour l’icône info sur la map
            const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
            if (regionEl) {
              refreshRegionNoteIndicator(regionEl, regionId);
            }

            // 3) Rafraîchir la liste
            buildNoteList();

            // 4) Toast
            if (typeof showToast === 'function') {
              showToast(GDMMLang.t('toast.NoteDeleted'));
            }
          });
        }


        listEl.appendChild(row);
      });
    }

    // Rebuild note list automatically when sidebar size changes
    (function() {
      const body = document.body;

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.attributeName === "class") {
            if (typeof buildNoteList === "function") {
              buildNoteList();
            }
          }
        }
      });

      observer.observe(body, { attributes: true });
    })();


    /*END -Note list-----------------------------------------------------------------*/


     // --- NOTES DE REGION : stockage par personnages ---

      const REGION_NOTES_KEY = 'gdmm_region_notes_v1';
      let regionNotesStore = null;

      function getActiveProfileName() {
        return state && state.active ? state.active : null;
      }

      // Helper perso actif
      function getActiveCharacterKey() {
        try {
          if (window.characterManager && typeof characterManager.getActiveCharacter === 'function') {
            const c = characterManager.getActiveCharacter();
            if (c && c.id) return c.id;
          }
        } catch (e) {
          console.warn('[GDMM] Failed to read active character for notes', e);
        }
        return '_global';
      }

      function loadRegionNotesStore() {
        let store = null;
        try {
          const raw = localStorage.getItem(REGION_NOTES_KEY);
          store = raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.warn('[GDMM] Failed to parse region notes store', e);
          store = null;
        }

        if (!store || typeof store !== 'object') {
          // Rien en storage → on crée un store v2 vide
          store = {
            __schema: 2,
            global: {},
            byCharacter: {},
          };
        }

        // Migration v1 → v2 si __schema absent
        if (!store.__schema) {
          // Ancien format = tout l'objet => on le considère comme global
          store = {
            __schema: 2,
            global: store,
            byCharacter: {},
          };
        } else {
          // Par sécurité, on s'assure que les clés existent
          store.global      = store.global      || {};
          store.byCharacter = store.byCharacter || {};
        }

        return store;
      }


      function saveRegionNotesStore(store) {
        if (!store) return;
        try {
          localStorage.setItem(REGION_NOTES_KEY, JSON.stringify(store));
        } catch (e) {
          console.warn('[GDMM] Failed to save region notes store', e);
        }
      }



      function clearRegionNote(regionId) {
        const store   = loadRegionNotesStore();
        const profile = getActiveProfileName();
        if (!profile || !regionId) return;

        const charKey = typeof getActiveCharacterKey === 'function'
          ? getActiveCharacterKey()
          : '_global';

        // 1) Supprime la note "par personnage"
        if (
          store.byCharacter &&
          store.byCharacter[charKey] &&
          store.byCharacter[charKey][profile] &&
          store.byCharacter[charKey][profile][regionId] !== undefined
        ) {
          delete store.byCharacter[charKey][profile][regionId];
        }

        // 2) Supprime aussi la note globale héritée de l'ancien système
        if (
          store.global &&
          store.global[profile] &&
          store.global[profile][regionId] !== undefined
        ) {
          delete store.global[profile][regionId];
        }

        saveRegionNotesStore(store);
      }


        function clearAllRegionNotesForActiveProfile() {
          const store   = loadRegionNotesStore();
          const profile = getActiveProfileName();
          if (!profile) return;

          const charKey = typeof getActiveCharacterKey === 'function'
            ? getActiveCharacterKey()
            : '_global';

          // 1) Supprime toutes les notes "par personnage" pour ce profil
          if (
            store.byCharacter &&
            store.byCharacter[charKey] &&
            store.byCharacter[charKey][profile]
          ) {
            delete store.byCharacter[charKey][profile];

            // Si plus aucune map pour ce perso, on nettoie aussi le niveau du perso
            if (Object.keys(store.byCharacter[charKey]).length === 0) {
              delete store.byCharacter[charKey];
            }
          }

          // 2) Supprime aussi les anciennes notes globales pour ce profil (legacy v1)
          if (store.global && store.global[profile]) {
            delete store.global[profile];
          }

          saveRegionNotesStore(store);
        }



      // Lecture : perso -> fallback global
      function getRegionNote(regionId) {
        if (!regionId) return '';

        // --- Mode vue partagée : on lit directement dans state.sharedNotes ---
        if (state.sharedView && state.sharedNotes && typeof state.sharedNotes === 'object') {
          const raw = state.sharedNotes[regionId];
          if (!raw) return '';

          // Supporte à la fois { text: "...", ts: ... } et les anciens formats string
          return (raw && typeof raw === 'object') ? (raw.text || '') : (raw || '');
        }

        // --- Mode normal : lecture dans le store local ---
        const store   = loadRegionNotesStore();
        const profile = getActiveProfileName();
        if (!profile) return '';

        const charKey = getActiveCharacterKey();

        // 1) Notes par personnage
        const byChar      = store.byCharacter && store.byCharacter[charKey];
        const byProfileCh = byChar && byChar[profile];
        const vCh         = byProfileCh && byProfileCh[regionId];

        if (vCh !== undefined) {
          return (vCh && typeof vCh === 'object') ? (vCh.text || '') : (vCh || '');
        }

        // 2) Fallback sur les anciennes notes globales
        const byProfile = store.global && store.global[profile];
        const v         = byProfile && byProfile[regionId];

        return (v && typeof v === 'object') ? (v.text || '') : (v || '');
      }


      // Écriture : toujours en "par personnage"
      function setRegionNote(regionId, text) {
        const store   = loadRegionNotesStore();
        const profile = getActiveProfileName();
        if (!profile || !regionId) return;

        const charKey = getActiveCharacterKey();

        if (!store.byCharacter) store.byCharacter = {};
        if (!store.byCharacter[charKey]) store.byCharacter[charKey] = {};
        if (!store.byCharacter[charKey][profile]) {
          store.byCharacter[charKey][profile] = {};
        }

        const byProfile = store.byCharacter[charKey][profile];
        const existing  = byProfile[regionId];

        const trimmed = (text || '').trim();

        if (trimmed) {
          if (!existing || typeof existing === 'string') {
            byProfile[regionId] = {
              text: trimmed,
              ts: Date.now(),
            };
          } else {
            existing.text = trimmed;
            existing.ts   = Date.now();
          }
        } else {
          if (existing !== undefined) {
            delete byProfile[regionId];
          }
        }

        saveRegionNotesStore(store);
      }


        function mergeSharedNotesIntoLocal(sharedNotes, targetProfileName) {
          if (!sharedNotes || typeof sharedNotes !== 'object') return;

          const store   = loadRegionNotesStore();

          // Si on te donne un profil cible, on l’utilise, sinon on garde l’ancienne logique
          const profile = targetProfileName || getActiveProfileName();
          if (!profile) return;

          const charKey = getActiveCharacterKey();

          if (!store.byCharacter) store.byCharacter = {};
          if (!store.byCharacter[charKey]) store.byCharacter[charKey] = {};
          if (!store.byCharacter[charKey][profile]) {
            store.byCharacter[charKey][profile] = {};
          }

          const notesForChar = store.byCharacter[charKey][profile];

          Object.entries(sharedNotes).forEach(([regionId, raw]) => {
            if (!regionId) return;

            // Ne jamais écraser une note déjà existante
            if (notesForChar[regionId] !== undefined) return;

            const text = raw && typeof raw === 'object' ? raw.text : raw;
            if (!text || !String(text).trim()) return;

            const ts = raw && typeof raw === 'object' && typeof raw.ts === 'number'
              ? raw.ts
              : Date.now();

            notesForChar[regionId] = { text: String(text), ts };
          });

          saveRegionNotesStore(store);

          // Rafraîchir la liste des notes si elle existe
          if (typeof buildNoteList === 'function') {
            buildNoteList();
          }
        }


        function refreshRegionNoteIndicator(regionEl, regionId) {
          if (!regionEl || !regionId) return;

          // nettoyer l'ancien éventuel indicateur
          const oldIcon = regionEl.querySelector('.region-note-indicator');
          if (oldIcon) oldIcon.remove();

          const note = getRegionNote(regionId);
          const trimmed = note ? note.trim() : '';

          if (!trimmed) {
            regionEl.classList.remove('has-region-note');
            return;
          }

          regionEl.classList.add('has-region-note');

          const infoIcon = document.createElement('img');
          infoIcon.className = 'region-note-indicator';
          infoIcon.src = 'img/info2-icon.svg';
          infoIcon.alt = 'Note';

          // éviter de démarrer un pan quand on clique sur le i
          infoIcon.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
          });

          // Tooltip lecture seule
          infoIcon.addEventListener('mouseenter', (ev) => {
            const txt = getRegionNote(regionId);
            if (!txt) return;

            const tooltip = document.createElement('div');
            tooltip.className = 'region-note-tooltip';
            tooltip.textContent = txt;

            document.body.appendChild(tooltip);

            const r = ev.target.getBoundingClientRect();
            tooltip.style.left = `${r.left}px`;
            tooltip.style.top  = `${r.bottom + 6}px`;

            ev.target._noteTooltip = tooltip;
          });

          infoIcon.addEventListener('mouseleave', (ev) => {
            const tip = ev.target._noteTooltip;
            if (tip) tip.remove();
            ev.target._noteTooltip = null;
          });

          regionEl.appendChild(infoIcon);
        }
    // ---END NOTES DE REGION : stockage par personnages ---



        /* ---------------------------------------------------------------NOTE PANNEL*/

        function openRegionNotePanel(regionId, labelText, anchorEl) {
          // Traduction actuelle pour le bouton Save

          const saveLabel = t ? t('ui.SaveTitle') : 'Save';

          // créer le panel s’il n’existe pas
          let panel = document.getElementById('regionNotePanel');
          if (!panel) {
            panel = document.createElement('div');
            panel.id = 'regionNotePanel';
            panel.className = 'region-note-panel';

            panel.innerHTML = `
              <div class="region-note-header">
                <span class="region-note-title"></span>
                <button type="button" class="region-note-close">✕</button>
              </div>
              <textarea class="region-note-text markers-scroll" rows="5" spellcheck="false"></textarea>
              <div class="region-note-actions">
                <button type="button" class="mt-1 region-note-save">${saveLabel}</button>
              </div>
            `;

            document.body.appendChild(panel);

            // close on X
            panel.querySelector('.region-note-close').addEventListener('click', () => {
              panel.style.display = 'none';
            });

            // FERMETURE EN CLIQUANT DEHORS
            document.addEventListener(
              'pointerdown',
              function handleOutsideClick(e) {
                const p = document.getElementById('regionNotePanel');
                if (!p || p.style.display === 'none') return;

                if (p.contains(e.target)) return;

                if (e.target.closest('.region-note-edit')) return;

                // si on clique sur une région ne pas fermer
                if (e.target.closest('.marker-region')) return;
                p.style.display = 'none';
              },
              true
            );

            // SAVE → enregistre dans le store global + met à jour l’icône
            panel.querySelector('.region-note-save').addEventListener('click', () => {
              const txt = panel.querySelector('.region-note-text').value || '';
              const trimmed = txt.trim();

              if (currentRegionIdForPanel) {
                // 1) Sauvegarde globale
                setRegionNote(currentRegionIdForPanel, txt);

                // 2) Rebuild la liste
                buildNoteList();

                // 3) Mise à jour visuelle via le helper
                const regionEl = document.querySelector(
                  `.marker-region[data-region-id="${currentRegionIdForPanel}"]`
                );
                if (regionEl && typeof refreshRegionNoteIndicator === 'function') {
                  refreshRegionNoteIndicator(regionEl, currentRegionIdForPanel);
                }
              }

              // 4) Fermer le panel
              panel.style.display = 'none';

              // 5) Toast "Note enregistrée"
              if (typeof showToast === 'function' && window.GDMMLang && typeof GDMMLang.t === 'function') {
                showToast(GDMMLang.t('toast.NoteSaved'));
              }
            });

          } else {
            // Panel déjà créé : mettre à jour le texte du bouton avec la langue actuelle
            const btn = panel.querySelector('.region-note-save');
            if (btn) btn.textContent = saveLabel;
          }

          // ==== À partir d’ici, c’est exécuté à CHAQUE ouverture du panel ====

          // garder l’ID courant en mémoire
          currentRegionIdForPanel = regionId;
          window.currentRegionIdForPanel = regionId; // debug optionnel

          // set du titre (le label de région est déjà localisé)
          const titleEl = panel.querySelector('.region-note-title');
          if (titleEl) {
            titleEl.textContent = labelText || 'Region note';
          }

          // set du contenu existant (lecture dans le store global)
          const txtEl = panel.querySelector('.region-note-text');
          if (txtEl) {
            txtEl.value = getRegionNote(regionId) || '';
            txtEl.maxLength = 500;
          }

          // positionner le panel par rapport au marker
          const rect = anchorEl.getBoundingClientRect();
          panel.style.position = 'fixed';
          panel.style.left = `${rect.left + 10}px`;
          panel.style.top  = `${rect.bottom + 8}px`;
          panel.style.display = 'block';

          if (txtEl) {
            txtEl.focus();
          }
        }

        // --- Exports publics pour le reste de l'application ---
        window.buildNoteList = buildNoteList;
        window.getAllRegionNotes = getAllRegionNotes;

        window.getRegionNote = getRegionNote;
        window.setRegionNote = setRegionNote;
        window.clearRegionNote = clearRegionNote;

        window.clearAllRegionNotesForActiveProfile = clearAllRegionNotesForActiveProfile;

        window.refreshRegionNoteIndicator = refreshRegionNoteIndicator;
        window.openRegionNotePanel = openRegionNotePanel;

        window.mergeSharedNotesIntoLocal = mergeSharedNotesIntoLocal;

  })();