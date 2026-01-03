
// catalog.js
// V1 – Static demo data rendered dynamically


function showError(msg) {
  const el = document.getElementById('submitError');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  const el = document.getElementById('submitError');
  if (!el) return;
  el.classList.add('hidden');
  el.textContent = '';
}

function showSuccess(msg) {
  const el = document.getElementById('submitSuccess');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideSuccess() {
  const el = document.getElementById('submitSuccess');
  if (!el) return;
  el.classList.add('hidden');
  el.textContent = '';
}





document.addEventListener('DOMContentLoaded', () => {
  const catalogList = document.getElementById('catalogList');
  if (!catalogList) return;

  // Temporary demo data (will be replaced by JSON / API later)
  const demoCatalog = [
    {
      title: 'Normal – Beginner Playthrough (Act 1–4)',
      author: 'Yakmandji',
      map: 'Cairn',
      lang: 'FR',
      description: 'A beginner-friendly route covering main quests, rifts and key side areas.',
      shareUrl: '?s=EXAMPLE'
    },
    {
      title: 'Elite Leveling Route',
      author: 'PlayerX',
      map: 'Cairn',
      lang: 'EN',
      description: 'Map en Français avec lemplacement des quêtes . Map en Français avec lemplacement des quêtes. Map en Français avec lemplacement des quêtes. Map en Français avec lemplacement des quêtes. Map en Français avec lemplacement des quêtes. Map ',
      shareUrl: '?s=EXAMPLE2'
    }
  ];

  renderCatalog(demoCatalog);

  function renderCatalog(items) {
    catalogList.innerHTML = '';

    if (!items.length) {
      catalogList.innerHTML = `
        <div class="empty-state">
          No community maps available yet.
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'catalog-card';

      card.innerHTML = `
        <h3 class="title">${escapeHtml(item.title)}</h3>
        <div class="catalog-name">by ${escapeHtml(item.author)}</div>
        <div class="badge-container d-flex">
          <div class="catalog-map marker-cat-badge d-flex">${escapeHtml(item.map)}</div>
          <div class="catalog-lang marker-cat-badge d-flex">${escapeHtml(item.lang)}</div>
        </div>
        <div class="catalog-desc">
          <span>  
            ${escapeHtml(item.description)}
          </span>
        </div>
                <hr class="gd-hr">
        <div class="catalog-card-actions">
          <a href="${item.shareUrl}" class="button">Open Map</a>
        </div>
      `;

      catalogList.appendChild(card);
    });
  }

  // Basic XSS-safe helper (important once data is external)
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});


/*SUBMIT CATALOG*/
async function submitToCatalog(payload) {
  const err = validatePayload(payload);
  if (err) throw new Error(err);

  // Simulation : pas d'appel réseau
  console.log('📡 Simulated submit payload:', payload);

  // Optionnel: stocker pour vérifier facilement
  localStorage.setItem('catalog_last_submit', JSON.stringify(payload, null, 2));

  // Simule une latence réseau (optionnel)
  await new Promise(r => setTimeout(r, 300));

  // Retour "comme si" le serveur avait répondu
  return { ok: true, id: 'cat_simulated_' + Date.now() };
}



function validatePayload(p) {
  const author = (p.author || '').trim();
  const title  = (p.title || '').trim();
  const desc   = (p.description || '').trim();
  const map    = (p.map || '').trim();
  const lang   = (p.lang || '').trim();
  const url    = (p.shareUrl || '').trim();

  if (author.length < 2) return 'Please enter your name (min 2 chars).';
  if (author.length > 24) return 'Name is too long (max 24).';
  if (title.length < 6) return 'Please enter a title (min 6 chars).';
  if (title.length > 70) return 'Title is too long (max 70).';
  if (desc.length < 20) return 'Please add a short description (min 20 chars).';
  if (desc.length > 240) return 'Description is too long (max 240).';

  const allowedMaps = ['Cairn', 'Malmouth', 'Korvan Basin'];
  if (!allowedMaps.includes(map)) return 'Invalid campaign/map.';

  const allowedLangs = ['EN','FR','ES','PT','RU','IT','ZH','JA','DE','PL','KO'];
  if (!allowedLangs.includes(lang)) return 'Invalid language.';

  if (!url) return 'Please paste a share link.';
  if (!url.includes('?s=')) return 'Share link must contain "?s=".';
  if (!url.includes('grimcustommarker.org')) return 'Share link must be on grimcustommarker.org.';

  return '';
}
/*END SUBMIT CATALOG*/






/*POPUP*/

// --- Minimal modal helper ---
let activeModalHandler = null;

function openModal(modalEl, backdropEl) {
  if (!modalEl) return;

  modalEl.classList?.remove('hidden');
  modalEl.classList?.add('is-active');
  modalEl.style.display = 'block';

  if (backdropEl) backdropEl.style.display = 'block';

  if (activeModalHandler) {
    document.removeEventListener('click', activeModalHandler);
    activeModalHandler = null;
  }

  setTimeout(() => {
    activeModalHandler = (e) => {
      if (!modalEl.contains(e.target)) {
        closeModal(modalEl, backdropEl);
      }
    };
    document.addEventListener('click', activeModalHandler);
  });
}

function closeModal(modalEl, backdropEl) {
  if (!modalEl) return;

  modalEl.classList?.remove('is-active');
  modalEl.classList?.add('hidden');
  modalEl.style.display = 'none';

  if (backdropEl) backdropEl.style.display = 'none';

  if (activeModalHandler) {
    document.removeEventListener('click', activeModalHandler);
    activeModalHandler = null;
  }
}


const modal = document.getElementById('catalogSubmitModal');
const backdrop = document.getElementById('catalogBackdrop');

document.getElementById('openSubmit')?.addEventListener('click', (e) => {
  e.preventDefault();
  openModal(modal, backdrop);
});

modal?.querySelectorAll('.closeModal')?.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(modal, backdrop);
  });
});

modal?.querySelectorAll('.cancelbutton')?.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(modal, backdrop);
  });
});

/*END POPUP*/

const submitAuthor = document.getElementById('submitAuthor');
const submitTitle  = document.getElementById('submitTitleInput'); // <-- IMPORTANT: l'id exact
const submitMap    = document.getElementById('submitMap');
const submitLang   = document.getElementById('submitLang');
const submitDesc   = document.getElementById('submitDesc');
const submitUrl    = document.getElementById('submitUrl');


const submitBtn = document.getElementById('catalogSubmitConfirm');

submitBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  const payload = {
    author: submitAuthor.value.trim(),
    title: submitTitle.value.trim(),
    map: submitMap.value,
    lang: submitLang.value,
    description: submitDesc.value.trim(),
    shareUrl: submitUrl.value.trim(),
  };

  // Reset messages
  hideError();
  hideSuccess();

  try {
    const result = await submitToCatalog(payload);

    showSuccess(
      'Submission sent for review. Thank you!'
    );

    console.log('Submit result:', result);

    // Optionnel : désactiver le bouton après succès
    submitBtn.disabled = true;

  } catch (err) {
    showError(err.message || 'Submission failed.');
  }
});