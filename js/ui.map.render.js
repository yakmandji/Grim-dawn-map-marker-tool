// ui.map.render.js
// Module de rendu des éléments sur la carte (routes, markers, admin...)
//21.51 28/11

(function () {

  const core  = window.GDMMCore || {};
  const state = core.state || {};

  const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
    ? GDMMLang.t.bind(GDMMLang)
    : (s) => s;


  const currentProfile = core.currentProfile || function(){ return null; };
  const iconFor = core.iconFor || function () { return ''; };
  const getPathMode = window.UiRoutes?.getPathMode || function(){ return { active:false, current:null }; };

  // Helpers venant de UiCore / GDMMCore
  const uiCore = window.UiCore || {};
  const pctToPx   = uiCore.pctToPx   || function(){ return { x:0, y:0 }; };
  const viewToPct = uiCore.viewToPct || function(){ return { xp:0, yp:0 }; };
  const resolveSizeKey = uiCore.resolveSizeKey || function(){ return null; };
  const updateMarkerFromUI = uiCore.updateMarkerFromUI || function () {};
  const clamp     = core.clamp || ((v,min,max) => Math.max(min, Math.min(max, v)));

  // --- RENDER ROUTES (extrait de ui.core.js) ---
  function renderRoutes(svgLayer, inner) {
    const p = currentProfile();
    if (!p || !state.mapReady) return;

    const paths = p.paths || [];
    const pm = getPathMode ? getPathMode() : { active:false, current:null };

    paths.forEach(path => {
      if (path.visible === false) return;
      if (!path.points || !path.points.length) return;

      const isEditing =
        state.editingPathId === path.id ||
        (pm.current && pm.current.id === path.id);
      const isCurrentPath = pm.current && pm.current.id === path.id;

      // --- MAIN LINE ---
      if (path.points.length >= 2) {
        const d = path.points
          .map((pt, idx) => {
            const px = (pt.xp / 100) * (state.mapNatural.w || 1);
            const py = (pt.yp / 100) * (state.mapNatural.h || 1);
            return (idx === 0 ? 'M' : 'L') + px + ' ' + py;
          })
          .join(' ');

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', path.color || '#ffcc00');
        el.setAttribute('stroke-width', path.width || 4);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('opacity', path.opacity ?? 0.85);
        el.setAttribute('vector-effect', 'non-scaling-stroke');

        svgLayer.appendChild(el);
      }

      // --- ROUTE POINTS ---
      path.points.forEach(pt => {
        const px = (pt.xp / 100) * (state.mapNatural.w || 1);
        const py = (pt.yp / 100) * (state.mapNatural.h || 1);

        const dot = document.createElement('div');
        dot.className = 'path-point';
        dot.style.left = px + 'px';
        dot.style.top  = py + 'px';

        if (isEditing) dot.classList.add('active-glow');
        inner.appendChild(dot);
      });

      // --- START / END bubbles ---
      if (path.points.length) {
        const first = path.points[0];
        const last  = path.points[path.points.length - 1];

        const makeEndpoint = (pt, type) => {
          const ex = (pt.xp / 100) * (state.mapNatural.w || 1);
          const ey = (pt.yp / 100) * (state.mapNatural.h || 1);

          const tag = document.createElement('div');
          tag.className = 'path-endpoint ' +
            (type === 'start' ? 'path-start' : 'path-end');

          if (type === 'start') {
            tag.innerHTML = `
              <img src="img/foot-icon.svg" class="route-icon" width="14" height="14" alt="">
              <span>${path.name || '(route)'}</span>
            `;
          } else {
            tag.innerHTML = `
              <img src="img/flag-icon.svg" class="route-icon" width="14" height="14" alt="">
            `;
          }

          tag.style.left = ex + 'px';
          tag.style.top  = ey + 'px';

          if (path.color) {
            tag.style.background  = path.color;;
            tag.style.borderColor = path.color;

            const c = path.color.replace('#', '');
            const r = parseInt(c.substring(0, 2), 16);
            const g = parseInt(c.substring(2, 4), 16);
            const b = parseInt(c.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            tag.style.color = luminance > 0.6 ? '#000' : '#fff';
          }

          if (type === 'start') {
            tag.addEventListener('pointerdown', e => {
              e.stopPropagation();
              const row = document.querySelector(
                `#routesList .listItem[data-pid="${path.id}"]`
              );
              if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight');
                setTimeout(() => row.classList.remove('highlight'), 2200);
              }
            });
          }
          inner.appendChild(tag);
        };

        makeEndpoint(first, 'start');
        if (path.points.length > 1 && !isCurrentPath) {
          makeEndpoint(last, 'end');
        }
      }
    });
  }

  // Helper interne
  function hexToRgba(hex, alpha = 1) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }


    // --- RENDER USER MARKERS (pins normaux) ---
    function renderUserMarkers(inner) {
      const p = currentProfile();
      if (!(p && state.mapReady)) return;

      const markers = Array.isArray(p.markers) ? p.markers : [];
      if (!markers.length) return;

        // 3) draw markers
            markers.forEach(m => {
              //Hide done collapesd
              if (window.hideDoneOnMap && m.done) return;

              const el = document.createElement('div');
              el.classList.add('marker');
              if (m.done) {
                el.classList.add('completed');
                el.dataset.done = '1';
              } else {
                el.dataset.done = '0';
              }
              if (m.cat) el.classList.add(m.cat.toLowerCase());
              if (m.shared) el.classList.add('shared');
              el.dataset.mid = m.id;

              // --- PIN ---
              const pin = document.createElement('div');
              pin.className = 'pin';

              const bg = document.createElement('img');
              bg.className = 'pin-bg';

              // on prend directement l'icône de la catégorie
              const iconSrc = iconFor(m.cat) || 'img/pin-general.svg';
              bg.src = iconSrc;
              bg.alt = '';

              pin.appendChild(bg);
              el.appendChild(pin);

              // Shared Badge
              if (m.shared) {
                const sharedBadge = document.createElement('img');
                sharedBadge.className = 'shared-badge';
                sharedBadge.src = 'img/share-icon.svg';
                sharedBadge.alt = (window.GDMMLang && GDMMLang.t)
                  ? GDMMLang.t('ui.SharedMarker')
                  : 'Shared';
                pin.appendChild(sharedBadge);
              }

              // --- LABEL ---
              const lab = document.createElement('div');
              lab.className = 'label';

              const p = document.createElement('p');
              p.textContent = m.label || '(no name)'; 
              lab.appendChild(p);

              el.appendChild(lab);
              // position initiale
              const pt = pctToPx(m.xp, m.yp);
              el.style.left = pt.x + 'px';
              el.style.top  = pt.y + 'px';
              // ========== INTERACTIONS ==========
              let dragging = false;
              let startPct = null;
              let startClient = null;
              const dragThreshold = 6;

              el.addEventListener('pointerdown', (e) => {
                startClient = { x: e.clientX, y: e.clientY };

                if (state.locked) {
                  el.setPointerCapture(e.pointerId);
                  return;
                }

                dragging = true;
                el.setPointerCapture(e.pointerId);
                const p1 = viewToPct(e.clientX, e.clientY);
                startPct = {
                  dx: p1.xp - m.xp,
                  dy: p1.yp - m.yp
                };
              });

              el.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                if (!startPct) return;

                const p1 = viewToPct(e.clientX, e.clientY);
                let nx = clamp(p1.xp - startPct.dx, 0, 100);
                let ny = clamp(p1.yp - startPct.dy, 0, 100);

                const pt2 = pctToPx(nx, ny);
                el.style.left = pt2.x + 'px';
                el.style.top  = pt2.y + 'px';
              });

              el.addEventListener('pointerup', (e) => {
                const dx = e.clientX - (startClient?.x ?? e.clientX);
                const dy = e.clientY - (startClient?.y ?? e.clientY);
                const moved = Math.sqrt(dx*dx + dy*dy) > dragThreshold;
                const justCreated = state.lastCreatedMarkerId === m.id; // test

                try { el.releasePointerCapture(e.pointerId); } catch(_) {}

                // --- Mode LOCK : no drag
                  if (state.locked) {
                    if (!moved && !justCreated) {   // Scroll only if not just created
                      const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
                      if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.classList.add('highlight');
                        setTimeout(() => row.classList.remove('highlight'), 2200);
                      }
                    }
                    state.lastCreatedMarkerId = null; 
                    return;
                  }

                if (!dragging) {
                  if (!moved && !justCreated) {     
                    const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
                    if (row) {
                      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      row.classList.add('highlight');
                      setTimeout(() => row.classList.remove('highlight'), 800);
                    }
                  }
                  state.lastCreatedMarkerId = null; 
                  return;
                }

                // --- End drag ---
                dragging = false;
                if (!moved) {
                  const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
                  if (row) {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    row.classList.add('highlight');
                    setTimeout(() => row.classList.remove('highlight'), 800);
                  }
                  return;
                }

                const p1 = viewToPct(e.clientX, e.clientY);
                let nx = clamp(p1.xp - startPct.dx, 0, 100);
                let ny = clamp(p1.yp - startPct.dy, 0, 100);

                updateMarkerFromUI(m.id, { xp: nx, yp: ny }, false);
                renderMarkers({ skipRoutesPanel: true });
              });

              inner.appendChild(el);   
           });

      }
/*      END Render marker ---------------------------------------------------------*/

      // --- RENDER ADMIN MARKERS (rifts, regions, dungeon entries, nav links) ---
      function renderAdminMarkers(inner) {
        if (!state.mapNatural) return;

        // 1) RIFTS ---------------------------------------------------
        let riftData = [];
        if (window.RIFT_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.RIFT_MARKERS_BY_SIZE);
          if (key && window.RIFT_MARKERS_BY_SIZE[key]) {
            riftData = window.RIFT_MARKERS_BY_SIZE[key];
          }
        }

        riftData.forEach(m => {
          const el = document.createElement('div');
          el.classList.add('marker', 'marker-rift', 'locked');

          const labelText = window.getRiftLabel
            ? getRiftLabel(m.tag, m.label || m.tag || 'Rift')
            : (m.label || m.tag || 'Rift');

          const lab = document.createElement('div');
          lab.className = 'label rift-label';
          lab.textContent = labelText;
          el.appendChild(lab);

          const iconImg = document.createElement('img');
          iconImg.className = 'rift-icon';
          iconImg.src = 'img/rift.png';
          iconImg.alt = 'Rift';
          el.appendChild(iconImg);

          const pt = pctToPx(m.xp, m.yp);
          el.style.left = pt.x + 'px';
          el.style.top  = pt.y + 'px';

          el.classList.add('is-static');
          inner.appendChild(el);
        });

        // 2) REGIONS -------------------------------------------------
        let regionData = [];
        if (window.REGION_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.REGION_MARKERS_BY_SIZE);
          if (key && window.REGION_MARKERS_BY_SIZE[key]) {
            regionData = window.REGION_MARKERS_BY_SIZE[key];
          }
        }

        regionData.forEach(m => {
          const el = document.createElement('div');
          el.classList.add('marker-region', 'locked');
          el.dataset.regionId = m.id;
          el.dataset.xp = m.xp;
          el.dataset.yp = m.yp;

          if (m.isDungeon) {
            el.classList.add('marker-region-dungeon');
          }

          const labelText = (window.getRegionLabel)
            ? getRegionLabel(m.tag, m.tag)
            : (m.tag || 'Region');

          const lab = document.createElement('div');
          lab.className = 'region-label';
          lab.textContent = labelText;
          el.appendChild(lab);

          // --- Tooltip lecture seule sur tout le label ---
          lab.addEventListener('mouseenter', (ev) => {
              const txt = getRegionNote(m.id);
              if (!txt) return;

              const tooltip = document.createElement('div');
              tooltip.className = 'region-note-tooltip';
              tooltip.textContent = txt;

              document.body.appendChild(tooltip);

              const r = ev.target.getBoundingClientRect();
              tooltip.style.left = `${r.left + (r.width / 2)}px`;
              tooltip.style.transform = "translateX(-50%)";
              tooltip.style.top  = `${r.bottom + 10}px`;

              ev.target._noteTooltip = tooltip;
          });

          lab.addEventListener('mouseleave', (ev) => {
              const tip = ev.target._noteTooltip;
              if (tip) tip.remove();
              ev.target._noteTooltip = null;
          });

          // Bloquer le pan SI une note existe pour cette région
          lab.addEventListener('pointerdown', (e) => {
            const note = getRegionNote(m.id);
            if (note && note.trim()) {
              // il y a une note → on ne laisse pas le viewport capter le pointer
              e.stopPropagation();
            }
          });

          // --- Indicateur si une note existe déjà pour cette région ---

          try {
            refreshRegionNoteIndicator(el, m.id);
          } catch (e) {
            console.warn('[GDMM] Failed to refresh region note for', m.id, e);
          }


          // --- Icône crayon pour futur système de notes ---
          const editIcon = document.createElement('button');
          editIcon.className = 'region-note-edit';
          editIcon.type = 'button';

          const editImg = document.createElement('img');
          editImg.src = 'img/edit-icon.svg';
          editImg.alt = (window.GDMMLang && GDMMLang.t)
            ? GDMMLang.t('ui.EditRegionNote')
            : 'Edit note';

          editIcon.appendChild(editImg);

          editIcon.addEventListener('pointerdown', (e) => {
            // On bloque le pan quand on clique sur l'icône
            e.stopPropagation();
          });

          editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const regionId = m.id;
            openRegionNotePanel(regionId, labelText, el);
          });

          el.appendChild(editIcon);

          const pt = pctToPx(m.xp, m.yp);
          el.style.left = pt.x + 'px';
          el.style.top  = pt.y + 'px';

          el.classList.add('is-static');
          inner.appendChild(el);

          lab.addEventListener('click', (e) => {
            // on évite de marcher sur le clic du crayon
            if (e.target.closest('.region-note-edit')) return;

            const noteList = document.getElementById('noteList');
            if (!noteList) return;

            const row = noteList.querySelector(`.listItem[data-region-id="${m.id}"]`);
            if (!row) return;

            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 2200);
          });

        });

        // 2c) SHRINES -------------------------------------------------
        if (window.SHRINE_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.SHRINE_MARKERS_BY_SIZE);
          const shrineData = (key && window.SHRINE_MARKERS_BY_SIZE[key])
            ? window.SHRINE_MARKERS_BY_SIZE[key]
            : [];

          shrineData.forEach(m => {
            const el = document.createElement('div');
            el.classList.add('marker', 'marker-shrine', 'locked');
            el.dataset.shrineId = m.id;
            el.dataset.xp = m.xp;
            el.dataset.yp = m.yp;
            el.dataset.difficulty = m.difficulty || 'normal';

            if (isShrineDoneForActiveChar(m.id, m.difficulty)) {
              el.classList.add('shrine-done');

              // --- AJOUT BADGE ---
              const badge = document.createElement('div');
              badge.className = 'shrine-done-badge';
              el.appendChild(badge);
            }

            // Classe CSS selon la difficulté
            if (m.difficulty === 'elite') {
              el.classList.add('shrine-elite');
            } else if (m.difficulty === 'ultimate') {
              el.classList.add('shrine-ultimate');
            } else {
              el.classList.add('shrine-normal');
            }

            // Icône
            const iconImg = document.createElement('img');
            iconImg.className = 'shrine-icon';

            let iconPath = 'img/icon-shrine.png'; // normal
            if (m.difficulty === 'elite') {
              iconPath = 'img/icon-shrine-e.png';
            } else if (m.difficulty === 'ultimate') {
              iconPath = 'img/icon-shrine-u.png';
            }
            iconImg.src = iconPath;

            // LABEL (avec 2ᵉ ligne difficulté)
            const lab = document.createElement('div');
            lab.className = 'label shrine-label';

            // Nom de région via helper existant
            const regionName =
              (window.getRegionLabel && m.regionTag)
                ? getRegionLabel(m.regionTag, m.regionTag)
                : (m.label || m.tag || m.regionTag || '');

            const shrineWord = t('ui.shrine') || 'Shrine';

            // Texte de difficulté (i18n)
            let difficultyKey = 'ui.shrineTierNormal';
            if (m.difficulty === 'elite') {
              difficultyKey = 'ui.shrineTierElite';
            } else if (m.difficulty === 'ultimate') {
              difficultyKey = 'ui.shrineTierUltimate';
            }
            const difficultyText = t(difficultyKey) || '';

            const mainText = `${shrineWord} – ${regionName}`;
            const tooltipText = difficultyText
              ? `${mainText} - ${difficultyText}`
              : mainText;

            // 1ere ligne = texte principal, 2eme = difficulté en petit
            if (difficultyText) {
              lab.innerHTML = `${mainText}<br><span class="shrine-difficulty">${difficultyText}</span>`;
            } else {
              lab.textContent = mainText;
            }

            // Tooltip natif
            iconImg.alt = tooltipText;

            el.appendChild(iconImg);
            el.appendChild(lab);

            // Position
            const pt = pctToPx(m.xp, m.yp);
            el.style.left = pt.x + 'px';
            el.style.top  = pt.y + 'px';

            el.classList.add('is-static');

            // Empêcher le pan quand on clique sur le shrine
            el.addEventListener('pointerdown', (e) => {
              e.stopPropagation();
            });

            // Clic = ouvrir un petit panneau "Terminé"
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof openShrinePanel === 'function') {
                openShrinePanel(m, el);
              }
            });

            el.classList.add('is-static');
            inner.appendChild(el);
          });

          if (typeof updateShrineCounterUI === 'function') {
            updateShrineCounterUI();
          }

        }



        // 2b) Search index (regions + rifts)
        if (window.GDMMSearch && typeof GDMMSearch.refresh === 'function') {
          GDMMSearch.refresh(regionData, riftData);
        }

        // 3) DUNGEON ENTRIES (eyes) ---------------------------------
        let entryMarkers = [];
        if (window.DUNGEON_ENTRY_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.DUNGEON_ENTRY_MARKERS_BY_SIZE);
          if (key && window.DUNGEON_ENTRY_MARKERS_BY_SIZE[key]) {
            entryMarkers = window.DUNGEON_ENTRY_MARKERS_BY_SIZE[key];
          }
        }

        state.dungeonEntries = {};

        entryMarkers.forEach(m => {
          const el = document.createElement('div');
          el.classList.add('marker-entry-dungeon');
          el.dataset.entryId = m.id;

          const img = document.createElement('img');
          img.src = m.icon || 'img/eye-icon.png';
          img.className = 'entry-icon';

          const color = (m.eyeColor || 'yellow').toLowerCase();
          img.classList.add('eye-' + color);

          el.appendChild(img);


          const pt = pctToPx(m.xp, m.yp);
          el.style.left = pt.x + 'px';
          el.style.top  = pt.y + 'px';

          el.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return; 
            // On ne clear plus ici : le donjon reste allumé
          });


          // Tap mobile : affiche l’overlay du donjon
          el.addEventListener('pointerup', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Pour que le tap ailleurs ne s’active pas

            if (window.showDungeonLinksForEntry) {
              window.showDungeonLinksForEntry(m.id);
            }
          });


          inner.appendChild(el);
          state.dungeonEntries[m.id] = { cfg: m, el };
        });

        // 4) NAV LINKS -----------------------------------------------
        function resolveCompositeTag(tag) {
          if (!tag) return '';
          const parts = tag.split('+').map(s => s.trim());
          let finalText = '';
          parts.forEach(part => {
            if (window.getRegionLabel) {
              finalText += getRegionLabel(part, part);
            } else {
              finalText += part;
            }
          });
          return finalText;
        }

        if (window.NAV_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.NAV_MARKERS_BY_SIZE);
          const navData = (key && window.NAV_MARKERS_BY_SIZE[key])
            ? window.NAV_MARKERS_BY_SIZE[key]
            : [];

          navData.forEach(m => {
            const el = document.createElement('div');
            el.classList.add('marker-link', 'locked');
            if (m.id) {
              el.dataset.navId = m.id;
            }

            const iconImg = document.createElement('img');
            iconImg.className = 'link-icon';
            iconImg.src = m.icon || 'img/icon-eye.png';
            iconImg.alt = m.alt || 'Go to';
            el.appendChild(iconImg);

            let titleText = '';
            if (m.tag) {
              titleText = resolveCompositeTag(m.tag);
            } else if (m.title) {
              titleText = m.title;
            }

            if (titleText) {
              el.title = titleText;
              iconImg.title = titleText;
            }

            const pt = pctToPx(m.xp, m.yp);
            el.style.left = pt.x + 'px';
            el.style.top  = pt.y + 'px';

            el.addEventListener('pointerdown', e => {
              e.stopPropagation();
            });

            el.addEventListener('click', async e => {
              e.stopPropagation();


              // 1) Nav dans la même map
              if (!m.targetProfile) {
                if (typeof m.targetXp === 'number' && typeof m.targetYp === 'number') {
                  centerOn(m.targetXp, m.targetYp, m.targetScale || 1.2);

                  const navId = m.targetId || m.id;

                  if (navId) {
                    const destNav = document.querySelector(`.marker-link[data-nav-id="${navId}"]`);
                    if (destNav) {
                      destNav.classList.add('marker-highlight');
                      setTimeout(() => destNav.classList.remove('marker-highlight'), 1500);
                    }
                  }
                }
                return;
              }

                // 2) Nav vers un autre profil
                const targetProfile = m.targetProfile;
                const sel = document.getElementById('profileSelect');
                if (!sel || !targetProfile) return;

                sel.value = targetProfile;

                const hasCoords = (typeof m.targetXp === 'number' && typeof m.targetYp === 'number');

                if (hasCoords) {
                  state.skipViewRestoreOnce = true;

                  // On mémorise ce qu'on veut faire une fois la nouvelle map chargée
                  window._gdmmPendingNavCenter = {
                    xp: m.targetXp,
                    yp: m.targetYp,
                    scale: m.targetScale || 1.2,
                    targetId: m.targetId || null,
                  };
                }

                sel.dispatchEvent(new Event('change', { bubbles: true }));
                    
                if (hasCoords && m.targetId) {
                  // Délai pour laisser les navlinks se rendre sur la nouvelle map
                  setTimeout(() => {
                    const destNav = document.querySelector(`.marker-link[data-nav-id="${m.targetId}"]`);
                    if (destNav) {
                      destNav.classList.add('marker-highlight');
                      setTimeout(() => destNav.classList.remove('marker-highlight'), 1500);
                    }
                  }, 450);
                }

            });

            inner.appendChild(el);
          });
        }

        if (window.buildNoteList) {
          window.buildNoteList();
        }
      }



  // Export public
  window.UiMapRender = {
    renderRoutes,
    renderUserMarkers,
    renderAdminMarkers,
  };


})();
