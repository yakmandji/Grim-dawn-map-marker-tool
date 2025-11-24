let characterToEdit = null;

const STORAGE_KEY_V2 = 'grimSave_v2';
const STORAGE_KEY_OLD = 'grimSave'; // Ancienne clé

const characterManager = (() => {
  let data = null;
  let onCharacterChanged = null; // callback (activeCharacter) => { ... }

  function loadMultiCharData() {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse multi-character data', e);
      return null;
    }
  }

  function saveMultiCharData() {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
  }


  function migrateIfNeeded() {
    const existing = loadMultiCharData();

    // --- CAS 1 : multi-perso existe déjà (version 2 ou plus) -------------------
    if (existing && existing.version >= 2) {
      data = existing;

      //corrige le cas où les données sont restées dans gdmm_user_data
      try {
        const rawUser = localStorage.getItem('gdmm_user_data');
        if (rawUser) {
          const oldUserData = JSON.parse(rawUser) || null;

          if (oldUserData) {
            const chars = existing.characters || {};
            const activeId =
              existing.activeCharacterId || Object.keys(chars)[0];

            if (activeId && chars[activeId]) {
              const char = chars[activeId];
              char.state = char.state || {};

              // On ne touche à rien si userData existe déjà
              if (!char.state.userData) {
                char.state.userData = oldUserData;
                saveMultiCharData();
                console.log(
                  '[Migration] userData récupéré depuis gdmm_user_data pour',
                  char.name
                );
              }
            }
          }
        }
      } catch (e) {
        console.warn('Safety migration from gdmm_user_data failed', e);
      }

      return;
    }

    // --- CAS 2 : aucune save multi-perso encore → migration depuis l’ancien système ---

    // Ancienne save complète (ton ancien "grimSave")
    const oldRaw = localStorage.getItem(STORAGE_KEY_OLD);
    let oldState = {};
    if (oldRaw) {
      try {
        oldState = JSON.parse(oldRaw) || {};
      } catch (e) {
        console.error('Failed to parse old save, starting empty', e);
        oldState = {};
      }
    }

    // Ancienne sauvegarde "userData" (markers/routes/view) si elle existe
    let oldUserData = null;
    try {
      const rawUser = localStorage.getItem('gdmm_user_data');
      if (rawUser) {
        oldUserData = JSON.parse(rawUser) || null;
      }
    } catch (e) {
      console.warn('Failed to parse gdmm_user_data', e);
    }

    const mergedState = Object.assign({}, oldState);
    if (mergedState.userData == null) {
      mergedState.userData = oldUserData;
    }

    data = {
      version: 2,
      activeCharacterId: 'char-1',
      characters: {
        'char-1': {
          id: 'char-1',
          name: 'Personnage 1',
          state: mergedState,
        },
      },
    };

    saveMultiCharData();
  }


  function getActiveCharacter() {
    return data.characters[data.activeCharacterId];
  }

  function getCharactersArray() {
    return Object.values(data.characters);
  }

  function setOnCharacterChanged(cb) {
    onCharacterChanged = cb;
  }

  function setActiveCharacter(id) {
    if (!data.characters[id]) return;

    // 1) AUTO-SAVE du perso courant avant de changer
    if (window.GDMMCore && typeof GDMMCore.saveUserDataToLocal === 'function') {
      try {
        GDMMCore.saveUserDataToLocal();
      } catch (e) {
        console.warn('Autosave perso avant changement a échoué :', e);
      }
    }

    // 2) On change réellement de perso
    data.activeCharacterId = id;
    saveMultiCharData();

    // 3) On notifie le callback (qui recharge la map / UI pour le nouveau perso)
    if (onCharacterChanged) {
      onCharacterChanged(getActiveCharacter());
    }
  }

  const defaultState = {
    userData: null,
  };

  function createCharacter(name) {
      const count = Object.keys(data.characters || {}).length;
      if (count >= 10) {
        alert('Vous ne pouvez pas avoir plus de 10 personnages (limite actuelle).');
        return;
      }

      const id = `char-${Date.now()}`;
      const trimmedName = name?.trim() || `Personnage ${count + 1}`;

      // ---- AJOUT AVATAR ICI ----
      // Exemple simple : avatar basé sur l'index du perso
      const avatarIndex = (count % 4) + 1; // 1 → 4
      const avatarFile = `img/profile${avatarIndex}.png`;

      data.characters[id] = {
        id,
        name: trimmedName,
        avatar: avatarFile, // 👈 on stocke l'avatar
        state: JSON.parse(JSON.stringify(defaultState)),
      };

      setActiveCharacter(id);
      saveMultiCharData();
  }


  function renameCharacter(id, newName) {
    const char = data.characters[id];
    if (!char) return;
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    char.name = trimmedName;
    saveMultiCharData();
    if (onCharacterChanged) {
      onCharacterChanged(getActiveCharacter());
    }
  }

  function deleteCharacter(id) {
    const charIds = Object.keys(data.characters);
    if (charIds.length === 1) {
      alert('Vous devez garder au moins un personnage.');
      return;
    }

    delete data.characters[id];

    if (data.activeCharacterId === id) {
      // Choisir un autre perso : le premier de la liste
      const remainingIds = Object.keys(data.characters);
      data.activeCharacterId = remainingIds[0];
    }

    saveMultiCharData();
    if (onCharacterChanged) {
      onCharacterChanged(getActiveCharacter());
    }
  }

  function getActiveState() {
    return getActiveCharacter().state;
  }

  function updateActiveState(updater) {
    const char = getActiveCharacter();
    const newState = updater(char.state) || char.state;
    char.state = newState;
    saveMultiCharData();
  }

  function init(options = {}) {
    migrateIfNeeded();
    if (options.onCharacterChanged) {
      setOnCharacterChanged(options.onCharacterChanged);
      onCharacterChanged(getActiveCharacter());
    }
  }

  return {
    init,
    getActiveCharacter,
    getActiveState,
    updateActiveState,
    setActiveCharacter,
    createCharacter,
    renameCharacter,
    deleteCharacter,
    getCharactersArray,
  };
})();

if (typeof window !== 'undefined') {
  window.characterManager = characterManager;
}


function initCharacterUI() {
  const dropdownEl = document.querySelector('.js-character-dropdown');
  if (!dropdownEl) return;

  const menuEl = dropdownEl.querySelector('.custom-dropdown-inner');
  const selectedLabelEl = dropdownEl.querySelector('.dropdown-selected-label');

  const modalEdit = document.querySelector('.js-modal-edit-character');
  const modalNew  = document.querySelector('.js-modal-new-character');

  const inputEdit = modalEdit ? modalEdit.querySelector('.js-edit-character-name') : null;
  const inputNew  = modalNew  ? modalNew.querySelector('.js-new-character-name')  : null;

  const btnEditSave   = modalEdit ? modalEdit.querySelector('.js-save-character-edit')   : null;
  const btnEditCancel = modalEdit ? modalEdit.querySelector('.js-cancel-character-edit') : null;

  const btnNewSave    = modalNew ? modalNew.querySelector('.js-save-character-new')      : null;
  const btnNewCancel  = modalNew ? modalNew.querySelector('.js-cancel-character-new')    : null;

  function openModal(modal) {
    modal?.classList.remove('hidden');
    modal?.classList.add('is-active');
    modal?.setAttribute('aria-hidden', 'false');
    modal.style.display = 'block';
  }

  function closeModal(modal) {
    modal?.classList.remove('is-active');
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
  }

  // -------------------------------------------------------------------
  // RENDU DU MENU PERSONNAGES
  // -------------------------------------------------------------------
  function renderDropdown() {
    const chars = characterManager.getCharactersArray();
    const active = characterManager.getActiveCharacter();
    menuEl.innerHTML = '';

    // --- Chaque personnage ---
    chars.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'character-line' + (c.id === active.id ? ' is-active' : '');
      row.dataset.id = c.id;

      // Avatar
      const avatar = document.createElement('img');
      avatar.className = 'char-avatar';
      avatar.src = c.avatar || 'img/profile1.png';
      avatar.alt = '';
      row.appendChild(avatar);

      // Zone sélection (clic sur toute la zone)
      const selectZone = document.createElement('div');
      selectZone.className = 'character-select-zone';

      const nameLabel = document.createElement('span');
      nameLabel.className = 'character-name';
      nameLabel.textContent = c.name;
      selectZone.appendChild(nameLabel);

      selectZone.addEventListener('click', () => {
        characterManager.setActiveCharacter(c.id);
        renderDropdown();
        dropdownEl.classList.remove('open');
      });

      row.appendChild(selectZone);

      // Bouton Éditer
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'character-action edit';
      editBtn.textContent = '✎';
      editBtn.title = 'Renommer';

      editBtn.addEventListener('click', () => {
        if (!modalEdit || !inputEdit) return;
        characterToEdit = c.id;
        inputEdit.value = c.name;
        openModal(modalEdit);
        dropdownEl.classList.remove('open');
      });

      row.appendChild(editBtn);

      // Bouton Supprimer
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'character-action delete danger ';
      const binIcon = document.createElement('img');
      binIcon.src = 'img/bin-icon.svg';
      binIcon.alt = 'Supprimer';
      binIcon.className = 'char-icon delete-icon';

      delBtn.appendChild(binIcon);
      delBtn.title = 'Supprimer';

      delBtn.addEventListener('click', () => {
        dropdownEl.classList.remove('open');
        if (confirm(`Supprimer "${c.name}" ?`)) {
          characterManager.deleteCharacter(c.id);
          renderDropdown();
        }
      });

      row.appendChild(delBtn);

      menuEl.appendChild(row);
    });

    // --- Bouton créer un nouveau personnage ---
    const newRow = document.createElement('div');
    newRow.className = 'character-line add-new';

    const addZone = document.createElement('div');
    addZone.className = 'character-select-zone';

    const plus = document.createElement('span');
    plus.className = 'add-icon';
    plus.textContent = '＋';

    const addLabel = document.createElement('span');
    addLabel.className = 'character-name';
    addLabel.setAttribute('data-i18n', 'character.NewCharacter');
    addLabel.textContent = GDMMLang.t('character.NewCharacter') || 'Créer un nouveau personnage';

    addZone.appendChild(plus);
    addZone.appendChild(addLabel);

    newRow.appendChild(addZone);

    newRow.addEventListener('click', () => {
      inputNew.value = '';
      openModal(modalNew);
      dropdownEl.classList.remove('open');

      btnNewSave.onclick = () => {
        characterManager.createCharacter(inputNew.value.trim());
        closeModal(modalNew);
        renderDropdown();
      };
    });

    menuEl.appendChild(newRow);

    // --- Avatar + nom du bouton principal ---
    selectedLabelEl.textContent = active.name;

    const currentBtn = dropdownEl.querySelector('.select-current');
    if (currentBtn) {
      let avatarCurrent = currentBtn.querySelector('.char-avatar-current');
      if (!avatarCurrent) {
        avatarCurrent = document.createElement('img');
        avatarCurrent.className = 'char-avatar-current';
        currentBtn.insertBefore(avatarCurrent, currentBtn.firstChild);
      }
      avatarCurrent.src = active.avatar || 'img/profile1.png';
    }
  }

  // -------------------------------------------------------------------
  // CALLBACK du manager (changement de personnage)
  // -------------------------------------------------------------------
  characterManager.init({
    onCharacterChanged: (activeCharacter) => {
      // Met à jour le menu des personnages
      renderDropdown();

      // 1) Recharger les données du perso actif dans GDMMCore
      if (window.GDMMCore && typeof GDMMCore.loadUserDataFromLocal === 'function') {
        GDMMCore.loadUserDataFromLocal();
      }

      try {
        const core = window.GDMMCore || {};
        const st = core.state || {};
        const allProfiles = st.profiles || {};
        const lastProfile =
          (activeCharacter &&
           activeCharacter.state &&
           activeCharacter.state.lastProfile) || null;

        let targetProfile = null;

        if (lastProfile && allProfiles[lastProfile]) {
          targetProfile = lastProfile;
        } else if (st.active && allProfiles[st.active]) {
          targetProfile = st.active;
        } else {
          const names = Object.keys(allProfiles);
          targetProfile = names[0] || null;
        }

        const sel = document.getElementById('profileSelect');
        const shouldChangeProfile =
          sel && targetProfile && sel.value !== targetProfile;

        if (shouldChangeProfile) {
          // 🔹 Cas 1 : on change de profil de map (Cairn -> Malmouth, etc.)
          // => l'event 'change' va appeler ensureMapLoadedForProfile + setMapSrc
          // => et donc ton mapImg.addEventListener('load', ...) restaurera la vue.
          sel.value = targetProfile;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // 🔹 Cas 2 : même profil de map, perso différent
          // Ici l'image ne se recharge pas, donc l'event 'load' ne se déclenche pas.
          // On doit donc restaurer la vue à la main.

          // Récupérer le profil courant (Cairn, etc.)
          const currentProfileFn = core.currentProfile || function () { return null; };
          const p = currentProfileFn();

          if (p && p.view && typeof p.view.scale === 'number') {
            // On replace la vue globale sur celle du perso
            st.view = st.view || {};
            st.view.scale = p.view.scale;
            st.view.x     = p.view.x ?? 0;
            st.view.y     = p.view.y ?? 0;

            if (window.UiCore && typeof window.UiCore.applyView === 'function') {
              window.UiCore.applyView();
            }
          }

          // Et on rerend l'UI (liste / markers / routes) pour ce perso
          if (typeof renderList === 'function') {
            renderList();
          }
          if (typeof renderMarkers === 'function') {
            renderMarkers();
          }
          if (typeof renderRoutesPanel === 'function') {
            renderRoutesPanel();
          }
        }
      } catch (e) {
        console.warn('Erreur changement map :', e);
      }

      // Vue globale (UI annexe si tu en as une)
      if (window.UiMapBase?.renderView) {
        UiMapBase.renderView();
      }
    },
  });



  // -------------------------------------------------------------------
  // Dropdown open/close
  // -------------------------------------------------------------------
  const currentBtn = dropdownEl.querySelector('.select-current');
  if (currentBtn) {
    currentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownEl.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      dropdownEl.classList.remove('open');
    });
  }

  // -------------------------------------------------------------------
  // Modal buttons
  // -------------------------------------------------------------------
  btnEditCancel?.addEventListener('click', () => closeModal(modalEdit));
  btnNewCancel?.addEventListener('click', () => closeModal(modalNew));

  btnEditSave?.addEventListener('click', () => {
    if (!characterToEdit) return;
    characterManager.renameCharacter(characterToEdit, inputEdit.value.trim());
    closeModal(modalEdit);
    renderDropdown();
    characterToEdit = null;
  });

  // Premier rendu
  renderDropdown();
}


document.addEventListener('DOMContentLoaded', () => {
  initCharacterUI();
});