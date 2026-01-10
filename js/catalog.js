
// catalog.js
// V1 – Static demo data rendered dynamically

const CATALOG_API_BASE = 'https://share2.grimcustommarker.org'; 


function showError(msg) {
  const el = document.getElementById('submitError');
  if (!el) return;
  const text = el.querySelector('.alert-text') || el;
  text.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  const el = document.getElementById('submitError');
  if (!el) return;
  el.classList.add('hidden');
  const text = el.querySelector('.alert-text') || el;
  text.textContent = '';
}

function showSuccess(msg) {
  const el = document.getElementById('submitSuccess');
  if (!el) return;
  const text = el.querySelector('.alert-text') || el;
  text.textContent = msg;
  el.classList.remove('hidden');
}

function hideSuccess() {
  const el = document.getElementById('submitSuccess');
  if (!el) return;
  el.classList.add('hidden');
  const text = el.querySelector('.alert-text') || el;
  text.textContent = '';
}



document.addEventListener('DOMContentLoaded', async () =>  {
  const catalogList = document.getElementById('catalogList');
  if (!catalogList) return;

  async function sha256Hex(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const editKey = localStorage.getItem('gdmm_share_edit_key_v1') || '';
  const myOwnerHash = editKey ? await sha256Hex(editKey) : '';


  try {
    const res = await fetch(`${CATALOG_API_BASE}/catalog`, { method: 'GET' });
    const out = await res.json();
    renderCatalog(Array.isArray(out.items) ? out.items : [], myOwnerHash);
  } catch (e) {
    console.warn('[catalog] load failed', e);
    renderCatalog([], myOwnerHash); // empty state
  }


  function renderCatalog(items, myOwnerHash) {
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

      const baseApp =
        (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
          ? location.origin
          : 'https://www.grimcustommarker.org';

      const openUrl = `${baseApp}/?s=${encodeURIComponent(item.shareId)}`;
      const isOwner = myOwnerHash && item.ownerHash === myOwnerHash;


      card.innerHTML = `
        <h3 class="title">${escapeHtml(item.title)}</h3>
        <div class="catalog-name">by ${escapeHtml(item.author)}</div>
        <div class="badge-container d-flex">

          <div class="catalog-lang marker-cat-badge d-flex">${escapeHtml(item.lang)}</div>
        </div>
        <div class="catalog-desc">
          <span>  
            ${escapeHtml(item.description)}
          </span>
        </div>
        <hr class="gd-hr">
        <div class="catalog-card-actions">
          <a href="${openUrl}" class="button" target="_blank" data-i18n="catalog.openMapButton">Open Map</a>
          ${isOwner ? `<button class="button danger catalog-delete-btn" data-shareid="${escapeHtml(item.shareId)}">Delete</button>` : ''}
        </div>
      `;

      catalogList.appendChild(card);

    });
    // IMPORTANT: les cards sont rendues après le applyLang initial
    if (window.GDMMLang && typeof window.GDMMLang.applyLang === 'function') {
      window.GDMMLang.applyLang(window.GDMMLang.getLang());
    }

  }

  window.reloadCatalog = async function reloadCatalog() {
    try {
      const res = await fetch(`${CATALOG_API_BASE}/catalog`, { method: 'GET' });
      const out = await res.json();
      renderCatalog(Array.isArray(out.items) ? out.items : [], myOwnerHash);
    } catch (e) {
      console.warn('[catalog] reload failed', e);
    }
  };


  catalogList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.catalog-delete-btn');
    if (!btn) return;

    const shareId = btn.getAttribute('data-shareid');
    if (!shareId) return;

    if (!confirm('Delete this catalog entry?')) return;

    try {
      const editKey = localStorage.getItem('gdmm_share_edit_key_v1');
      if (!editKey) throw new Error('Missing edit key. Please use Share at least once.');

      btn.disabled = true;

      const res = await fetch(`${CATALOG_API_BASE}/catalog/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, editKey }),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        throw new Error(out.error || 'Delete failed');
      }

      // Reload list after delete
      const r2 = await fetch(`${CATALOG_API_BASE}/catalog`, { method: 'GET' });
      const o2 = await r2.json();
      renderCatalog(Array.isArray(o2.items) ? o2.items : [], myOwnerHash);

    } catch (err) {
      console.warn('[catalog] delete failed', err);
      alert(err.message || 'Delete failed');
    } finally {
      btn.disabled = false;
    }
  });


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

    const editKey = localStorage.getItem('gdmm_share_edit_key_v1');
    if (!editKey) {
      throw new Error('Missing edit key. Please use Share at least once.');
    }

    const shareId = extractShareId(payload.shareUrl);
    if (!shareId) {
      throw new Error('Invalid share link (missing ?s=...)');
    }

    const body = {
      shareId,
      title: payload.title,
      author: payload.author,
      description: payload.description,
      lang: payload.lang,
      editKey
    };

    const res = await fetch(`${CATALOG_API_BASE}/catalog/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) {
      throw new Error(out.error || 'Submit failed');
    }

    return out;
  }

  function extractShareId(url) {
    try {
      const u = new URL(url, location.origin);
      return u.searchParams.get('s');
    } catch {
      return null;
    }
  }


function validatePayload(p) {
  const author = (p.author || '').trim();
  const title  = (p.title || '').trim();
  const desc   = (p.description || '').trim();
  const lang   = (p.lang || '').trim();
  const url    = (p.shareUrl || '').trim();

  if (author.length < 2) return 'Please enter your name (min 2 chars).';
  if (author.length > 24) return 'Name is too long (max 24).';
  if (title.length < 6) return 'Please enter a title (min 6 chars).';
  if (title.length > 70) return 'Title is too long (max 70).';
  if (desc.length < 10) return 'Please add a short description (min 10 chars).';
  if (desc.length > 230) return 'Description is too long (max 230).';

  const allowedLangs = ['EN','FR','ES','PT','RU','IT','ZH','JA','DE','PL','KO'];
  if (!allowedLangs.includes(lang)) return 'Invalid language.';

  if (!url) return 'Please paste a share link.';

  let u;
  try {
    u = new URL(url, location.origin);
  } catch {
    return 'Invalid share link URL.';
  }

  const shareId = u.searchParams.get('s');
  if (!shareId) return 'Share link must contain "?s=".';

  const host = (u.hostname || '').toLowerCase();
  const allowedHost =
    host === 'grimcustommarker.org' ||
    host === 'www.grimcustommarker.org' ||
    host === 'localhost' ||
    host === '127.0.0.1';

  if (!allowedHost) return 'Share link must be on grimcustommarker.org (or localhost for tests).';


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
const submitBtn = document.getElementById('catalogSubmitConfirm');


document.getElementById('openSubmit')?.addEventListener('click', (e) => {
  e.preventDefault();
  openModal(modal, backdrop);

  // Reset modal state when opening
  submitBtn.disabled = false;
  hideError();
  hideSuccess();

  // show form, hide success screen
  formState?.classList.remove('hidden');
  successState?.classList.add('hidden');

  // show footer again
  footerState?.classList.remove('hidden');

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
const submitLang   = document.getElementById('submitLang');
const submitDesc   = document.getElementById('submitDesc');
const submitUrl    = document.getElementById('submitUrl');

const formState    = document.getElementById('submitFormState');
const successState = document.getElementById('submitSuccessState');
const footerState  = document.getElementById('submitFooter');

const viewCatalogBtn = document.getElementById('viewCatalogBtn');
const closeSubmitBtn = document.getElementById('closeSubmitBtn');


submitBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  const payload = {
    author: submitAuthor.value.trim(),
    title: submitTitle.value.trim(),
    lang: submitLang.value,
    description: submitDesc.value.trim(),
    shareUrl: submitUrl.value.trim(),
  };

  // Reset messages
  hideError();
  hideSuccess();

  try {
    const result = await submitToCatalog(payload);

    showSuccess('Your map is posted. Thank you!');

    // Switch to success screen
    if (formState) formState.classList.add('hidden');
    if (successState) successState.classList.remove('hidden');
    if (footerState) footerState.classList.add('hidden');


    // Refresh the catalog behind
    if (typeof window.reloadCatalog === 'function') {
      window.reloadCatalog();
    }

    // Disable submit (optional, since form is hidden)
    submitBtn.disabled = true;


  } catch (err) {
    showError(err.message || 'Submission failed.');
  }

});

viewCatalogBtn?.addEventListener('click', () => {
  closeModal(modal, backdrop);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

closeSubmitBtn?.addEventListener('click', () => {
  closeModal(modal, backdrop);
});
