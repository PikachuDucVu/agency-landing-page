/* ════════════════════════════════════════════════════════
   Roman Agency Admin — JavaScript
   Handles auth, navigation, media CRUD, FAQ, settings
   ════════════════════════════════════════════════════════ */

const API = window.location.origin;

// ── Auth guard ───────────────────────────────────────────
const token = localStorage.getItem('ra_token');
if (!token) {
  window.location.href = './login.html';
}

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ── Sidebar user ─────────────────────────────────────────
document.getElementById('sidebar-user').textContent =
  localStorage.getItem('ra_username') || 'admin';

const publishVersionBadge = document.getElementById('publish-version-badge');

const ADMIN_ASSET_PREVIEW_FILES = new Set([
  'Container.png',
  'image-removebg-preview.png',
  'meta-logo.png',
  'service-rental.png',
  'service-sales.png',
  'service-managed.png',
  'SD1.png',
  'SD2.png',
  'SD3.png',
  'SD5.png',
  'SD6.png',
  'SD7.png',
  'SD-extra.jpg',
  'BM-1.jpg',
  'BM-2.jpg',
  'BM-3.jpg',
  'gallery-large-1.jpg',
  'gallery-large-2.jpg',
  'gallery-large-3.jpg',
  'gallery-large-4.jpg',
  'gallery-large-5.jpg',
  'gallery-large-7.jpg',
  'gallery-large-8.jpg',
  'hero-bg.png',
]);

const ADMIN_ASSET_PREVIEW_2X_MAP = {
  'gallery-large-1.jpg': 'gallery-large-1.png',
  'gallery-large-2.jpg': 'gallery-large-2.png',
  'gallery-large-3.jpg': 'gallery-large-3.png',
  'gallery-large-4.jpg': 'gallery-large-4.png',
  'gallery-large-5.jpg': 'gallery-large-5.png',
  'gallery-large-6.jpg': 'gallery-large-6.png',
  'gallery-large-7.jpg': 'gallery-large-7.png',
  'gallery-large-8.jpg': 'gallery-large-8.png',
  'hero-bg.png': 'hero-bg.png',
};

const FAQ_LANG_META = {
  en: {
    label: '🇬🇧 English',
    questionLabel: 'Question *',
    answerLabel: 'Answer *',
    questionPlaceholder: 'Enter question in English…',
    answerPlaceholder: 'Enter answer in English…',
  },
  zh: {
    label: '🇨🇳 中文',
    questionLabel: 'Question',
    answerLabel: 'Answer',
    questionPlaceholder: '输入中文问题…',
    answerPlaceholder: '输入中文答案…',
  },
  ru: {
    label: '🇷🇺 Русский',
    questionLabel: 'Question',
    answerLabel: 'Answer',
    questionPlaceholder: 'Введите вопрос…',
    answerPlaceholder: 'Введите ответ…',
  },
};

let activeFaqLang = 'en';
const faqDraft = {
  en: { question: '', answer: '' },
  zh: { question: '', answer: '' },
  ru: { question: '', answer: '' },
};

// ── Logout ───────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('ra_token');
  localStorage.removeItem('ra_username');
  window.location.href = './login.html';
});

// ── Tab Navigation ───────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.tab-panel');
const pageTitle = document.getElementById('page-title');

const TAB_TITLES = {
  media: 'Media Manager',
  faq: 'FAQ Manager',
  settings: 'Site Settings',
  subscribers: 'Subscribers',
  testimonials: 'Testimonials',
  stats: 'Stats Manager',
  products: 'Products Manager',
  payments: 'Payment Methods',
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    navItems.forEach(n => n.classList.remove('is-active'));
    panels.forEach(p => p.classList.remove('is-active'));
    item.classList.add('is-active');
    document.querySelector(`[data-panel="${tab}"]`)?.classList.add('is-active');
    pageTitle.textContent = TAB_TITLES[tab] || tab;

    if (tab === 'faq') loadFaqs();
    else if (tab === 'settings') loadSettings();
    else if (tab === 'subscribers') loadSubscribers();
    else if (tab === 'testimonials') loadTestimonials();
    else if (tab === 'stats') loadStats();
    else if (tab === 'products') loadProducts();
    else if (tab === 'payments') loadPayments();
  });
});

// ── Toast ─────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── API error handler ─────────────────────────────────────
async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(`${API}${url}`, {
      ...opts,
      headers: opts.body instanceof FormData
        ? { 'Authorization': `Bearer ${token}` }
        : headers(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'API error');
    return data;
  } catch (err) {
    toast(err.message, 'error');
    throw err;
  }
}

/* ═══════════════════════════════════════════════════════
   MEDIA TAB
   ═══════════════════════════════════════════════════════ */
async function loadMedia(section = '') {
  const grid = document.getElementById('media-grid');
  grid.innerHTML = '<div class="loading">Loading media…</div>';

  const url = section ? `/api/admin/media?section=${encodeURIComponent(section)}` : '/api/admin/media';
  const data = await apiFetch(url);
  const items = data.data;

  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>No media items yet</p>
      </div>`;
    return;
  }

  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.section)) groups.set(item.section, []);
    groups.get(item.section).push(item);
  });

  groups.forEach((sectionItems, sectionName) => {
    const group = document.createElement('section');
    group.className = 'media-group';

    const visibleCount = sectionItems.filter((item) => item.is_visible).length;
    const groupHeader = document.createElement('div');
    groupHeader.className = 'media-group__header';
    groupHeader.innerHTML = `
      <div>
        <div class="media-group__title">${escHtml(sectionName)}</div>
        <div class="media-group__meta">${sectionItems.length} item(s) · ${visibleCount} visible</div>
      </div>
    `;

    const cards = document.createElement('div');
    cards.className = 'media-group__grid';

    sectionItems.forEach(item => {
      const isVideo = item.mime_type?.startsWith('video/');
      const previewSrc = getAdminMediaPreviewUrl(item);
      const previewMeta = getAdminMediaPreviewMeta(item, previewSrc);
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        ${isVideo
          ? `<div class="media-card__thumb media-card__thumb--video">🎬 Video</div>`
          : `<img class="media-card__thumb" src="${previewSrc}" alt="${item.alt_text || item.file_name}" loading="lazy" />`
        }
        <div class="media-card__body">
          <div class="media-card__section-row">
            <div class="media-card__section">${escHtml(item.section)}</div>
            <span class="media-card__visibility ${item.is_visible ? 'is-visible' : 'is-hidden'}">${item.is_visible ? 'Visible' : 'Hidden'}</span>
          </div>
          <div class="media-card__name">${escHtml(item.file_name)}</div>
          <div class="media-card__meta">Slot: ${escHtml(item.slot || 'auto')} · ${formatBytes(item.file_size)}</div>
          <div class="media-card__meta">Preview: ${escHtml(previewMeta)}</div>
          ${item.alt_text ? `<div class="media-card__meta">Alt: ${escHtml(item.alt_text)}</div>` : ''}
          ${item.caption ? `<div class="media-card__meta">Caption: ${escHtml(item.caption)}</div>` : ''}
        </div>
        <div class="media-card__actions">
          <button class="btn btn--ghost btn--sm" onclick="toggleVisible('${item.id}', ${item.is_visible})">
            ${item.is_visible ? 'Hide' : 'Show'}
          </button>
          <button class="btn btn--ghost btn--sm" onclick="replaceMedia('${item.id}', '${item.file_name.replace(/'/g, "\\'")}')">Replace</button>
          <button class="btn btn--danger btn--sm" onclick="deleteMedia('${item.id}', '${item.file_name.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      `;
      cards.appendChild(card);
    });

    group.appendChild(groupHeader);
    group.appendChild(cards);
    grid.appendChild(group);
  });
}

function getAdminMediaPreviewUrl(item) {
  if (item.mime_type?.startsWith('video/')) return item.r2_url;

  const retinaFile = ADMIN_ASSET_PREVIEW_2X_MAP[item.file_name];
  if (retinaFile) {
    return `./public/asset-preview-2x/${encodeURIComponent(retinaFile)}`;
  }

  if (ADMIN_ASSET_PREVIEW_FILES.has(item.file_name)) {
    return `./public/asset-preview/${encodeURIComponent(item.file_name)}`;
  }

  // Fallback: try asset-preview by file_name anyway (covers seed data)
  return item.r2_url || `./public/asset-preview/${encodeURIComponent(item.file_name)}`;
}

function getAdminMediaPreviewMeta(item, previewSrc) {
  if (previewSrc === item.r2_url) {
    return item.r2_url ? 'R2 / published file' : 'No preview source';
  }

  const retinaFile = ADMIN_ASSET_PREVIEW_2X_MAP[item.file_name];
  if (retinaFile) {
    return `frontend asset 2x: ${retinaFile}`;
  }

  return `frontend asset: ${item.file_name}`;
}

// Initial load
loadMedia();
loadPublishHistory();

// Media grid: mouse wheel → horizontal scroll
document.getElementById('media-grid').addEventListener('wheel', (e) => {
  if (e.deltaY !== 0) {
    e.preventDefault();
    e.currentTarget.scrollLeft += e.deltaY;
  }
}, { passive: false });

// Publish history dropdown toggle
const phToggle = document.getElementById('publish-history-toggle');
const phPanel = document.getElementById('publish-history-panel');
phToggle.addEventListener('click', () => {
  phPanel.hidden = !phPanel.hidden;
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#publish-history-dropdown')) phPanel.hidden = true;
});

// Section filter — horizontal tabs
let activeMediaSection = '';
document.getElementById('media-section-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.media-section-tab');
  if (!tab) return;
  document.querySelectorAll('.media-section-tab').forEach(t => t.classList.remove('is-active'));
  tab.classList.add('is-active');
  activeMediaSection = tab.dataset.section;
  loadMedia(activeMediaSection);
});

function getActiveMediaSection() { return activeMediaSection; }

async function toggleVisible(id, currentVisible) {
  await apiFetch(`/api/admin/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_visible: currentVisible ? 0 : 1 }),
  });
  toast(currentVisible ? 'Hidden from site' : 'Now visible on site');
  loadMedia(getActiveMediaSection());
}

async function deleteMedia(id, name) {
  if (!confirm(`Delete "${name}"? This will remove it from R2 as well.`)) return;
  await apiFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
  toast('Media deleted');
  loadMedia(getActiveMediaSection());
}

async function replaceMedia(id, name) {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*,video/mp4,video/webm';
  picker.onchange = async () => {
    const file = picker.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${API}/api/admin/media/${id}/replace`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();
    if (!data.success) {
      toast(data.error?.message || 'Replace failed', 'error');
      return;
    }

    toast(`Replaced ${name}`);
    loadMedia(getActiveMediaSection());
  };
  picker.click();
}

// ── Upload Modal ──────────────────────────────────────────
const uploadModal = document.getElementById('upload-modal');
document.getElementById('upload-btn').addEventListener('click', () => { uploadModal.hidden = false; });
document.getElementById('upload-modal-close').addEventListener('click', () => { uploadModal.hidden = true; });
document.getElementById('upload-cancel').addEventListener('click', () => { uploadModal.hidden = true; });

// Drag & drop
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload-file');
let selectedFile = null;

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('is-drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('is-drag-over');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

dropZone.addEventListener('click', (e) => {
  if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

function setFile(file) {
  selectedFile = file;
  const preview = document.getElementById('drop-preview');
  preview.hidden = false;
  preview.textContent = `📎 ${file.name} (${formatBytes(file.size)})`;
}

document.getElementById('upload-submit').addEventListener('click', async () => {
  if (!selectedFile) return toast('Please select a file', 'error');

  const section = document.getElementById('upload-section').value;
  const slot = document.getElementById('upload-slot').value.trim();
  const alt = document.getElementById('upload-alt').value.trim();
  const caption = document.getElementById('upload-caption').value.trim();
  const captionSub = document.getElementById('upload-caption-sub').value.trim();

  const form = new FormData();
  form.append('file', selectedFile);
  form.append('section', section);
  if (slot) form.append('slot', slot);
  if (alt) form.append('alt_text', alt);
  if (caption) form.append('caption', caption);
  if (captionSub) form.append('caption_sub', captionSub);

  const btn = document.getElementById('upload-submit');
  const btnText = document.getElementById('upload-submit-text');
  const spinner = document.getElementById('upload-spinner');

  btn.disabled = true;
  btnText.textContent = 'Uploading…';
  spinner.hidden = false;

  try {
    await fetch(`${API}/api/admin/media/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    }).then(r => r.json()).then(d => {
      if (!d.success) throw new Error(d.error?.message || 'Upload failed');
    });

    toast('Media uploaded successfully');
    uploadModal.hidden = true;
    selectedFile = null;
    document.getElementById('drop-preview').hidden = true;
    loadMedia();
  } catch (err) {
    document.getElementById('upload-error').textContent = err.message;
    document.getElementById('upload-error').hidden = false;
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Upload';
    spinner.hidden = true;
  }
});

/* ═══════════════════════════════════════════════════════
   FAQ TAB
   ═══════════════════════════════════════════════════════ */
async function loadFaqs() {
  const list = document.getElementById('faq-list');
  list.innerHTML = '<div class="loading">Loading FAQs…</div>';

  const [enData, zhData, ruData] = await Promise.all([
    apiFetch('/api/admin/faqs?lang=en'),
    apiFetch('/api/admin/faqs?lang=zh'),
    apiFetch('/api/admin/faqs?lang=ru'),
  ]);

  const enFaqs = enData.data || [];
  const zhFaqs = zhData.data || [];
  const ruFaqs = ruData.data || [];
  const zhByOrder = new Map(zhFaqs.map(faq => [faq.sort_order, faq]));
  const ruByOrder = new Map(ruFaqs.map(faq => [faq.sort_order, faq]));

  document.getElementById('faq-count').textContent = `${enFaqs.length} FAQs`;

  list.innerHTML = '';

  if (!enFaqs.length) {
    list.innerHTML = '<div class="empty-state"><p>No FAQs yet. Add your first one!</p></div>';
    return;
  }

  enFaqs.forEach((faq) => {
    const zh = zhByOrder.get(faq.sort_order) || {};
    const ru = ruByOrder.get(faq.sort_order) || {};
    const translationCount = [zh.question ? 1 : 0, ru.question ? 1 : 0].reduce((sum, count) => sum + count, 0);

    const card = document.createElement('div');
    card.className = 'faq-card';
    card.innerHTML = `
      <div class="faq-card__body">
        <div class="faq-card__q">${escHtml(faq.question)}</div>
        <div class="faq-card__a">${escHtml(faq.answer)}</div>
        <div class="faq-card__meta">${translationCount ? `${translationCount} optional translation(s)` : 'Original content'}</div>
      </div>
      <div class="faq-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openFaqEdit(${faq.id}, ${zh.id || 'null'}, ${ru.id || 'null'}, ${faq.sort_order || 'null'})">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deleteFaqGroup(${faq.id}, ${zh.id || 'null'}, ${ru.id || 'null'})">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

const faqLangTabs = document.querySelectorAll('.faq-lang-switcher__tab');
const faqActiveLangLabel = document.getElementById('faq-active-lang-label');
const faqActiveQuestionLabel = document.getElementById('faq-active-question-label');
const faqActiveAnswerLabel = document.getElementById('faq-active-answer-label');
const faqQuestionInput = document.getElementById('faq-edit-question');
const faqAnswerInput = document.getElementById('faq-edit-answer');

function resetFaqDraft() {
  Object.keys(faqDraft).forEach((lang) => {
    faqDraft[lang].question = '';
    faqDraft[lang].answer = '';
  });
}

function syncActiveFaqDraft() {
  faqDraft[activeFaqLang].question = faqQuestionInput.value;
  faqDraft[activeFaqLang].answer = faqAnswerInput.value;
}

function renderActiveFaqLang() {
  const meta = FAQ_LANG_META[activeFaqLang];
  const draft = faqDraft[activeFaqLang];

  faqActiveLangLabel.textContent = meta.label;
  faqActiveQuestionLabel.textContent = meta.questionLabel;
  faqActiveAnswerLabel.textContent = meta.answerLabel;
  faqQuestionInput.placeholder = meta.questionPlaceholder;
  faqAnswerInput.placeholder = meta.answerPlaceholder;
  faqQuestionInput.value = draft.question;
  faqAnswerInput.value = draft.answer;

  faqLangTabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.lang === activeFaqLang);
  });
}

function setActiveFaqLang(lang) {
  syncActiveFaqDraft();
  activeFaqLang = lang;
  renderActiveFaqLang();
}

faqLangTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveFaqLang(tab.dataset.lang));
});

faqQuestionInput.addEventListener('input', syncActiveFaqDraft);
faqAnswerInput.addEventListener('input', syncActiveFaqDraft);

// Add FAQ btn
document.getElementById('add-faq-btn').addEventListener('click', () => {
  document.getElementById('faq-modal-title').textContent = 'Add FAQ';
  document.getElementById('faq-edit-id').value = '';
  document.getElementById('faq-edit-id-zh').value = '';
  document.getElementById('faq-edit-id-ru').value = '';
  document.getElementById('faq-edit-sort-order').value = '';
  document.getElementById('faq-error').hidden = true;
  resetFaqDraft();
  activeFaqLang = 'en';
  renderActiveFaqLang();
  document.getElementById('faq-modal').hidden = false;
});

document.getElementById('faq-modal-close').addEventListener('click', () => {
  document.getElementById('faq-modal').hidden = true;
});

document.getElementById('faq-cancel').addEventListener('click', () => {
  document.getElementById('faq-modal').hidden = true;
});

async function openFaqEdit(enId, zhId, ruId, sortOrder) {
  document.getElementById('faq-modal-title').textContent = 'Edit FAQ';
  document.getElementById('faq-edit-id').value = enId || '';
  document.getElementById('faq-edit-id-zh').value = zhId || '';
  document.getElementById('faq-edit-id-ru').value = ruId || '';
  document.getElementById('faq-edit-sort-order').value = sortOrder || '';

  resetFaqDraft();

  const [enData, zhData, ruData] = await Promise.all([
    enId ? apiFetch(`/api/admin/faqs/${enId}`) : Promise.resolve(null),
    zhId ? apiFetch(`/api/admin/faqs/${zhId}`) : Promise.resolve(null),
    ruId ? apiFetch(`/api/admin/faqs/${ruId}`) : Promise.resolve(null),
  ]);

  faqDraft.en.question = enData?.data?.question || '';
  faqDraft.en.answer = enData?.data?.answer || '';
  faqDraft.zh.question = zhData?.data?.question || '';
  faqDraft.zh.answer = zhData?.data?.answer || '';
  faqDraft.ru.question = ruData?.data?.question || '';
  faqDraft.ru.answer = ruData?.data?.answer || '';

  if (!sortOrder && enData?.data?.sort_order) {
    document.getElementById('faq-edit-sort-order').value = enData.data.sort_order;
  }

  document.getElementById('faq-error').hidden = true;
  activeFaqLang = 'en';
  renderActiveFaqLang();
  document.getElementById('faq-modal').hidden = false;
}

document.getElementById('faq-save').addEventListener('click', async () => {
  syncActiveFaqDraft();

  const enId = document.getElementById('faq-edit-id').value;
  const zhId = document.getElementById('faq-edit-id-zh').value;
  const ruId = document.getElementById('faq-edit-id-ru').value;
  const sortOrder = document.getElementById('faq-edit-sort-order').value;

  const enQ = faqDraft.en.question.trim();
  const enA = faqDraft.en.answer.trim();
  const zhQ = faqDraft.zh.question.trim();
  const zhA = faqDraft.zh.answer.trim();
  const ruQ = faqDraft.ru.question.trim();
  const ruA = faqDraft.ru.answer.trim();

  const errEl = document.getElementById('faq-error');

  if (!enQ || !enA) {
    errEl.textContent = 'English question and answer are required';
    errEl.hidden = false;
    if (activeFaqLang !== 'en') {
      activeFaqLang = 'en';
      renderActiveFaqLang();
    }
    return;
  }

  try {
    let finalSortOrder = sortOrder;

    if (enId) {
      await apiFetch(`/api/admin/faqs/${enId}`, { method: 'PATCH', body: JSON.stringify({ question: enQ, answer: enA }) });
    } else {
      const created = await apiFetch('/api/admin/faqs', { method: 'POST', body: JSON.stringify({ question: enQ, answer: enA, lang: 'en' }) });
      finalSortOrder = created.data?.sort_order || '';
    }

    const translationPayload = (question, answer) => {
      const payload = { question, answer };
      if (finalSortOrder) payload.sort_order = Number(finalSortOrder);
      return payload;
    };

    if (zhQ && zhA) {
      if (zhId) {
        await apiFetch(`/api/admin/faqs/${zhId}`, { method: 'PATCH', body: JSON.stringify({ question: zhQ, answer: zhA }) });
      } else {
        await apiFetch('/api/admin/faqs', { method: 'POST', body: JSON.stringify({ ...translationPayload(zhQ, zhA), lang: 'zh' }) });
      }
    }

    if (ruQ && ruA) {
      if (ruId) {
        await apiFetch(`/api/admin/faqs/${ruId}`, { method: 'PATCH', body: JSON.stringify({ question: ruQ, answer: ruA }) });
      } else {
        await apiFetch('/api/admin/faqs', { method: 'POST', body: JSON.stringify({ ...translationPayload(ruQ, ruA), lang: 'ru' }) });
      }
    }

    toast('FAQ saved');
    document.getElementById('faq-modal').hidden = true;
    loadFaqs();
  } catch {
    errEl.textContent = 'Failed to save FAQ';
    errEl.hidden = false;
  }
});

renderActiveFaqLang();

async function deleteFaqGroup(enId, zhId, ruId) {
  if (!confirm('Delete this FAQ in all languages?')) return;
  if (enId) await apiFetch(`/api/admin/faqs/${enId}`, { method: 'DELETE' });
  if (zhId) await apiFetch(`/api/admin/faqs/${zhId}`, { method: 'DELETE' });
  if (ruId) await apiFetch(`/api/admin/faqs/${ruId}`, { method: 'DELETE' });
  toast('FAQ deleted');
  loadFaqs();
}

/* ═══════════════════════════════════════════════════════
   SETTINGS TAB
   ═══════════════════════════════════════════════════════ */
async function loadSettings() {
  const form = document.getElementById('settings-form');
  const saveBtn = document.getElementById('save-settings-btn');
  form.innerHTML = '<div class="loading">Loading settings…</div>';
  saveBtn.disabled = true;

  const data = await apiFetch('/api/admin/settings?lang=en');
  const settings = {};
  data.data.forEach(s => { settings[s.key] = s.value; });

  const pricingFee = (settings.pricing_fee || '8').replace(/[^0-9.]/g, '');
  const pricingDeposit = (settings.pricing_deposit || '100').replace(/[^0-9]/g, '');

  form.innerHTML = `
    <div class="settings-group">
      <div class="settings-group__title">Contact</div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" class="input" id="s-contact_email" value="${settings.contact_email || ''}" placeholder="romanagency888@gmail.com" />
      </div>
      <div class="form-group">
        <label>Telegram (personal)</label>
        <input type="url" class="input" id="s-contact_telegram" value="${settings.contact_telegram || ''}" placeholder="https://t.me/romanwarior" />
      </div>
      <div class="form-group">
        <label>Telegram Channel</label>
        <input type="url" class="input" id="s-contact_channel" value="${settings.contact_channel || ''}" placeholder="https://t.me/romanagency" />
      </div>
      <div class="form-group">
        <label>Website</label>
        <input type="url" class="input" id="s-contact_website" value="${settings.contact_website || ''}" placeholder="https://romanagency.net/" />
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group__title">Pricing</div>
      <div class="form-group">
        <label>Service Fee</label>
        <div class="input-inline">
          <input type="number" class="input" id="s-pricing_fee" value="${pricingFee}" min="0" max="100" step="0.1" placeholder="8" />
          <span class="input-suffix">(%)</span>
        </div>
        <small class="form-hint">Numbers only.</small>
      </div>
      <div class="form-group">
        <label>Minimum Deposit</label>
        <div class="input-inline">
          <input type="number" class="input" id="s-pricing_deposit" value="${pricingDeposit}" min="0" step="1" placeholder="100" />
          <span class="input-suffix">(USD)</span>
        </div>
        <small class="form-hint">Numbers only.</small>
      </div>
    </div>
  `;

  saveBtn.disabled = false;
  saveBtn.onclick = saveSettings;
}

function formatStatNumber(val) {
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (isNaN(n)) return val;
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

async function saveSettings() {
  const keys = ['contact_email', 'contact_telegram', 'contact_channel', 'contact_website',
    'pricing_fee', 'pricing_deposit'];

  const settings = {};
  keys.forEach(key => {
    const el = document.getElementById(`s-${key}`);
    if (!el) return;
    let val = el.value.trim();
    // Strip non-numeric for pricing fields
    if (key === 'pricing_fee' || key === 'pricing_deposit') {
      val = val.replace(/[^0-9.]/g, '');
    }
    // Strip non-numeric for stat fields
    if (key.startsWith('stat_')) {
      val = val.replace(/[^0-9]/g, '');
    }
    settings[key] = val;
  });

  await apiFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ lang: 'en', settings }),
  });

  toast('Settings saved successfully!');
  loadSettings(); // Reload to show updated previews
}

/* ═══════════════════════════════════════════════════════
   SUBSCRIBERS TAB
   ═══════════════════════════════════════════════════════ */
async function loadSubscribers(page = 1) {
  const tbody = document.getElementById('subscribers-body');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading…</td></tr>';

  const data = await apiFetch(`/api/admin/subscribers?page=${page}&limit=50`);
  const { data: subs, meta } = data;

  document.getElementById('sub-count').textContent = `${meta.total} subscribers`;

  tbody.innerHTML = '';

  if (!subs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:24px">No subscribers yet</td></tr>';
    return;
  }

  subs.forEach(sub => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(sub.email)}</td>
      <td>${new Date(sub.created_at).toLocaleDateString()}</td>
      <td style="color:var(--text-dim)">${sub.origin || '—'}</td>
      <td><button class="btn btn--danger btn--sm" onclick="deleteSubscriber(${sub.id}, '${escHtml(sub.email)}')">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteSubscriber(id, email) {
  if (!confirm(`Remove ${email} from subscribers?`)) return;
  await apiFetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
  toast('Subscriber removed');
  loadSubscribers();
}

// Export CSV
document.getElementById('export-csv-btn').addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(`${API}/api/admin/subscribers/export`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || 'Export failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('CSV exported');
  } catch (err) {
    toast(err.message || 'Export failed', 'error');
  }
});

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS TAB
   ═══════════════════════════════════════════════════════ */
async function loadTestimonials() {
  const list = document.getElementById('testimonial-list');
  list.innerHTML = '<div class="loading">Loading testimonials…</div>';

  const data = await apiFetch('/api/admin/testimonials?lang=en');
  const items = data.data || [];

  document.getElementById('testimonial-count').textContent = `${items.length} testimonials`;

  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><p>No testimonials yet. Add your first one!</p></div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'faq-card';
    card.innerHTML = `
      <div class="faq-card__body">
        <div class="faq-card__q">${escHtml(item.author_name)}${item.author_role ? ` — <span style="color:var(--text-dim);font-weight:400">${escHtml(item.author_role)}</span>` : ''}</div>
        <div class="faq-card__a">"${escHtml(item.content)}"</div>
      </div>
      <div class="faq-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openTestimonialEdit(${item.id})">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deleteTestimonial(${item.id})">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

document.getElementById('add-testimonial-btn').addEventListener('click', () => {
  document.getElementById('testimonial-modal-title').textContent = 'Add Testimonial';
  document.getElementById('testimonial-edit-id').value = '';
  document.getElementById('testimonial-name-en').value = '';
  document.getElementById('testimonial-role-en').value = '';
  document.getElementById('testimonial-content-en').value = '';
  document.getElementById('testimonial-error').hidden = true;
  document.getElementById('testimonial-modal').hidden = false;
});

document.getElementById('testimonial-modal-close').addEventListener('click', () => {
  document.getElementById('testimonial-modal').hidden = true;
});
document.getElementById('testimonial-cancel').addEventListener('click', () => {
  document.getElementById('testimonial-modal').hidden = true;
});

async function openTestimonialEdit(id) {
  document.getElementById('testimonial-modal-title').textContent = 'Edit Testimonial';
  document.getElementById('testimonial-edit-id').value = id || '';

  if (id) {
    const d = await apiFetch(`/api/admin/testimonials/${id}`);
    document.getElementById('testimonial-name-en').value = d.data?.author_name || '';
    document.getElementById('testimonial-role-en').value = d.data?.author_role || '';
    document.getElementById('testimonial-content-en').value = d.data?.content || '';
  } else {
    document.getElementById('testimonial-name-en').value = '';
    document.getElementById('testimonial-role-en').value = '';
    document.getElementById('testimonial-content-en').value = '';
  }

  document.getElementById('testimonial-error').hidden = true;
  document.getElementById('testimonial-modal').hidden = false;
}

document.getElementById('testimonial-save').addEventListener('click', async () => {
  const id = document.getElementById('testimonial-edit-id').value;
  const errEl = document.getElementById('testimonial-error');

  const name = document.getElementById('testimonial-name-en').value.trim();
  const role = document.getElementById('testimonial-role-en').value.trim();
  const content = document.getElementById('testimonial-content-en').value.trim();

  if (!name || !content) {
    errEl.textContent = 'Author name and content are required';
    errEl.hidden = false;
    return;
  }

  try {
    if (id) {
      await apiFetch(`/api/admin/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ author_name: name, author_role: role, content }) });
    } else {
      await apiFetch('/api/admin/testimonials', { method: 'POST', body: JSON.stringify({ author_name: name, author_role: role, content, lang: 'en' }) });
    }

    toast('Testimonial saved');
    document.getElementById('testimonial-modal').hidden = true;
    loadTestimonials();
  } catch {
    errEl.textContent = 'Failed to save testimonial';
    errEl.hidden = false;
  }
});

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  await apiFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
  toast('Testimonial deleted');
  loadTestimonials();
}

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function loadPublishHistory() {
  const box = document.getElementById('publish-history-box');
  box.textContent = 'Loading history…';

  const data = await apiFetch('/api/admin/publish/history');
  const releases = data.data || [];
  const currentVersion = data.meta?.currentVersion;

  publishVersionBadge.textContent = currentVersion ? `Live: v${currentVersion}` : 'Live: not published';

  if (!releases.length) {
    box.textContent = 'No publish history yet.';
    return;
  }

  box.innerHTML = releases.map((release) => `
    <div class="publish-history-item">
      <div class="publish-history-item__top">
        <div><strong>v${release.version}</strong>${release.version === currentVersion ? ' · live' : ''}</div>
        ${release.version === currentVersion ? '' : `<button class="btn btn--ghost btn--sm" onclick="rollbackRelease(${release.id}, ${release.version})">Rollback</button>`}
      </div>
      <div class="publish-history-item__meta">${new Date(release.created_at).toLocaleString()}</div>
      <div class="publish-history-item__meta">${release.notes || 'No notes'}</div>
    </div>
  `).join('');
}

async function rollbackRelease(id, version) {
  if (!confirm(`Rollback live site to v${version}?`)) return;
  await apiFetch(`/api/admin/publish/${id}/rollback`, { method: 'POST' });
  toast(`Rolled back to v${version}`);
  await loadPublishHistory();
}

document.getElementById('publish-btn').addEventListener('click', async () => {
  const notes = prompt('Publish notes (optional):', '') || '';
  const data = await apiFetch('/api/admin/publish', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

  toast(`Published v${data.data.version}`);
  await loadPublishHistory();
});

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════════════
   STATS TAB
   ═══════════════════════════════════════════════════════ */
async function loadStats() {
  const list = document.getElementById('stats-list');
  list.innerHTML = '<div class="loading">Loading stats…</div>';

  const data = await apiFetch('/api/admin/stats');
  const items = data.data || [];

  document.getElementById('stats-count').textContent = `${items.length} stats`;
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><p>No stats yet.</p></div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'faq-card';
    card.innerHTML = `
      <div class="faq-card__body">
        <div class="faq-card__q">${item.prefix || ''}${escHtml(String(item.value))}${item.suffix || ''} — ${escHtml(item.label)}</div>
        <div class="faq-card__a">${escHtml(item.description || '')}</div>
        <div class="faq-card__meta">Style: ${escHtml(item.card_style)} · Icon: ${escHtml(item.icon_key)} · ${item.is_visible ? 'Visible' : 'Hidden'}</div>
      </div>
      <div class="faq-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openStatEdit(${item.id})">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deleteStat(${item.id})">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

document.getElementById('add-stat-btn').addEventListener('click', () => {
  document.getElementById('stat-modal-title').textContent = 'Add Stat';
  document.getElementById('stat-edit-id').value = '';
  document.getElementById('stat-label').value = '';
  document.getElementById('stat-value').value = '';
  document.getElementById('stat-prefix').value = '';
  document.getElementById('stat-suffix').value = '';
  document.getElementById('stat-description').value = '';
  document.getElementById('stat-icon').value = 'dollar';
  document.getElementById('stat-style').value = 'dark';
  document.getElementById('stat-visible').value = '1';
  document.getElementById('stat-error').hidden = true;
  document.getElementById('stat-modal').hidden = false;
});

document.getElementById('stat-modal-close').addEventListener('click', () => { document.getElementById('stat-modal').hidden = true; });
document.getElementById('stat-cancel').addEventListener('click', () => { document.getElementById('stat-modal').hidden = true; });

async function openStatEdit(id) {
  const d = await apiFetch(`/api/admin/stats/${id}`);
  const item = d.data;
  document.getElementById('stat-modal-title').textContent = 'Edit Stat';
  document.getElementById('stat-edit-id').value = id;
  document.getElementById('stat-label').value = item.label || '';
  document.getElementById('stat-value').value = item.value ?? '';
  document.getElementById('stat-prefix').value = item.prefix || '';
  document.getElementById('stat-suffix').value = item.suffix || '';
  document.getElementById('stat-description').value = item.description || '';
  document.getElementById('stat-icon').value = item.icon_key || 'dollar';
  document.getElementById('stat-style').value = item.card_style || 'dark';
  document.getElementById('stat-visible').value = item.is_visible ? '1' : '0';
  document.getElementById('stat-error').hidden = true;
  document.getElementById('stat-modal').hidden = false;
}

document.getElementById('stat-save').addEventListener('click', async () => {
  const id = document.getElementById('stat-edit-id').value;
  const errEl = document.getElementById('stat-error');

  const label = document.getElementById('stat-label').value.trim();
  const value = parseInt(document.getElementById('stat-value').value);

  if (!label || isNaN(value)) {
    errEl.textContent = 'Label and numeric value are required';
    errEl.hidden = false;
    return;
  }

  const payload = {
    label,
    value,
    prefix: document.getElementById('stat-prefix').value,
    suffix: document.getElementById('stat-suffix').value,
    description: document.getElementById('stat-description').value,
    icon_key: document.getElementById('stat-icon').value,
    card_style: document.getElementById('stat-style').value,
    is_visible: parseInt(document.getElementById('stat-visible').value),
  };

  try {
    if (id) {
      await apiFetch(`/api/admin/stats/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/admin/stats', { method: 'POST', body: JSON.stringify(payload) });
    }
    toast('Stat saved');
    document.getElementById('stat-modal').hidden = true;
    loadStats();
  } catch {
    errEl.textContent = 'Failed to save stat';
    errEl.hidden = false;
  }
});

async function deleteStat(id) {
  if (!confirm('Delete this stat card?')) return;
  await apiFetch(`/api/admin/stats/${id}`, { method: 'DELETE' });
  toast('Stat deleted');
  loadStats();
}

/* ═══════════════════════════════════════════════════════
   PRODUCTS TAB
   ═══════════════════════════════════════════════════════ */
async function loadProducts(category = '') {
  const list = document.getElementById('products-list');
  list.innerHTML = '<div class="loading">Loading products…</div>';

  const data = await Promise.all([
    apiFetch(category ? `/api/admin/products?category=${encodeURIComponent(category)}&lang=en` : '/api/admin/products?lang=en'),
    apiFetch(category ? `/api/admin/products?category=${encodeURIComponent(category)}&lang=zh` : '/api/admin/products?lang=zh'),
    apiFetch(category ? `/api/admin/products?category=${encodeURIComponent(category)}&lang=ru` : '/api/admin/products?lang=ru'),
  ]);
  const enItems = data[0].data || [];
  const zhItems = data[1].data || [];
  const ruItems = data[2].data || [];

  document.getElementById('products-count').textContent = `${enItems.length} products (EN)`;
  list.innerHTML = '';

  if (!enItems.length) {
    list.innerHTML = '<div class="empty-state"><p>No products yet.</p></div>';
    return;
  }

  // Group by category → sub_group
  const groups = new Map();
  enItems.forEach(item => {
    const key = item.category + (item.sub_group ? ` / ${item.sub_group}` : '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  // Build zh/ru lookup by sort_order + category
  const zhMap = new Map(); zhItems.forEach(i => zhMap.set(`${i.category}-${i.sub_group}-${i.sort_order}`, i));
  const ruMap = new Map(); ruItems.forEach(i => ruMap.set(`${i.category}-${i.sub_group}-${i.sort_order}`, i));

  groups.forEach((groupItems, groupName) => {
    const header = document.createElement('div');
    header.className = 'faq-card';
    header.style.background = 'var(--surface-2)';
    header.innerHTML = `<div class="faq-card__body"><div class="faq-card__q" style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.6">${escHtml(groupName)}</div></div>`;
    list.appendChild(header);

    groupItems.forEach(item => {
      const lookupKey = `${item.category}-${item.sub_group}-${item.sort_order}`;
      const zhItem = zhMap.get(lookupKey);
      const ruItem = ruMap.get(lookupKey);
      const langs = [zhItem ? 'ZH' : '', ruItem ? 'RU' : ''].filter(Boolean).join(' ');

      const card = document.createElement('div');
      card.className = 'faq-card';
      card.innerHTML = `
        <div class="faq-card__body">
          <div class="faq-card__q">${item.is_gold ? '&#11088; ' : ''}${escHtml(item.name)} — <span style="color:var(--gold)">${escHtml(item.limit_text)}</span></div>
          <div class="faq-card__a">${escHtml(item.description)}</div>
          <div class="faq-card__meta">icon: ${escHtml(item.icon_key)} · ${item.is_visible ? 'Visible' : 'Hidden'} ${langs ? '· <span style="color:var(--green)">' + langs + '</span>' : ''}</div>
        </div>
        <div class="faq-card__actions">
          <button class="btn btn--ghost btn--sm" onclick="openProductEdit(${item.id}, ${zhItem ? zhItem.id : 'null'}, ${ruItem ? ruItem.id : 'null'}, ${item.sort_order})">Edit</button>
          <button class="btn btn--danger btn--sm" onclick="deleteProduct(${item.id}, ${zhItem ? zhItem.id : 'null'}, ${ruItem ? ruItem.id : 'null'})">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });
  });
}

document.getElementById('products-category-filter').addEventListener('change', e => loadProducts(e.target.value));

// ── Product multi-lang draft ──
let activeProductLang = 'en';
const productDraft = {
  en: { name: '', limit_text: '', description: '' },
  zh: { name: '', limit_text: '', description: '' },
  ru: { name: '', limit_text: '', description: '' },
};

function syncActiveProductDraft() {
  productDraft[activeProductLang].name = document.getElementById('product-edit-name').value;
  productDraft[activeProductLang].limit_text = document.getElementById('product-edit-limit').value;
  productDraft[activeProductLang].description = document.getElementById('product-edit-desc').value;
}

function renderActiveProductLang() {
  const langLabels = { en: 'EN', zh: 'ZH', ru: 'RU' };
  document.getElementById('product-active-lang-label').textContent = langLabels[activeProductLang];
  document.getElementById('product-edit-name').value = productDraft[activeProductLang].name;
  document.getElementById('product-edit-limit').value = productDraft[activeProductLang].limit_text;
  document.getElementById('product-edit-desc').value = productDraft[activeProductLang].description;

  document.querySelectorAll('#product-lang-switcher .faq-lang-switcher__tab').forEach(t => {
    t.classList.toggle('is-active', t.dataset.lang === activeProductLang);
  });
}

document.querySelectorAll('#product-lang-switcher .faq-lang-switcher__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    syncActiveProductDraft();
    activeProductLang = tab.dataset.lang;
    renderActiveProductLang();
  });
});

document.getElementById('add-product-btn').addEventListener('click', () => {
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-edit-id').value = '';
  document.getElementById('product-edit-id-zh').value = '';
  document.getElementById('product-edit-id-ru').value = '';
  document.getElementById('product-edit-sort-order').value = '';
  document.getElementById('product-category').value = 'personal';
  document.getElementById('product-subgroup').value = '';
  document.getElementById('product-icon').value = 'fb';
  document.getElementById('product-gold').value = '0';
  document.getElementById('product-visible').value = '1';
  productDraft.en = { name: '', limit_text: '', description: '' };
  productDraft.zh = { name: '', limit_text: '', description: '' };
  productDraft.ru = { name: '', limit_text: '', description: '' };
  activeProductLang = 'en';
  renderActiveProductLang();
  document.getElementById('product-error').hidden = true;
  document.getElementById('product-modal').hidden = false;
});

document.getElementById('product-modal-close').addEventListener('click', () => { document.getElementById('product-modal').hidden = true; });
document.getElementById('product-cancel').addEventListener('click', () => { document.getElementById('product-modal').hidden = true; });

async function openProductEdit(enId, zhId, ruId, sortOrder) {
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('product-edit-id').value = enId || '';
  document.getElementById('product-edit-id-zh').value = zhId || '';
  document.getElementById('product-edit-id-ru').value = ruId || '';
  document.getElementById('product-edit-sort-order').value = sortOrder || '';

  productDraft.en = { name: '', limit_text: '', description: '' };
  productDraft.zh = { name: '', limit_text: '', description: '' };
  productDraft.ru = { name: '', limit_text: '', description: '' };

  const [enData, zhData, ruData] = await Promise.all([
    enId ? apiFetch(`/api/admin/products/${enId}`) : Promise.resolve(null),
    zhId ? apiFetch(`/api/admin/products/${zhId}`) : Promise.resolve(null),
    ruId ? apiFetch(`/api/admin/products/${ruId}`) : Promise.resolve(null),
  ]);

  const en = enData?.data;
  if (en) {
    document.getElementById('product-category').value = en.category || 'personal';
    document.getElementById('product-subgroup').value = en.sub_group || '';
    document.getElementById('product-icon').value = en.icon_key || 'fb';
    document.getElementById('product-gold').value = en.is_gold ? '1' : '0';
    document.getElementById('product-visible').value = en.is_visible ? '1' : '0';
    productDraft.en = { name: en.name || '', limit_text: en.limit_text || '', description: en.description || '' };
  }
  if (zhData?.data) {
    const zh = zhData.data;
    productDraft.zh = { name: zh.name || '', limit_text: zh.limit_text || '', description: zh.description || '' };
  }
  if (ruData?.data) {
    const ru = ruData.data;
    productDraft.ru = { name: ru.name || '', limit_text: ru.limit_text || '', description: ru.description || '' };
  }

  activeProductLang = 'en';
  renderActiveProductLang();
  document.getElementById('product-error').hidden = true;
  document.getElementById('product-modal').hidden = false;
}

document.getElementById('product-save').addEventListener('click', async () => {
  syncActiveProductDraft();
  const enId = document.getElementById('product-edit-id').value;
  const zhId = document.getElementById('product-edit-id-zh').value;
  const ruId = document.getElementById('product-edit-id-ru').value;
  const errEl = document.getElementById('product-error');

  const enName = productDraft.en.name.trim();
  const enLimit = productDraft.en.limit_text.trim();
  const enDesc = productDraft.en.description.trim();

  if (!enName || !enLimit || !enDesc) {
    errEl.textContent = 'English name, limit text, and description are required';
    errEl.hidden = false;
    return;
  }

  const shared = {
    category: document.getElementById('product-category').value,
    sub_group: document.getElementById('product-subgroup').value,
    icon_key: document.getElementById('product-icon').value,
    is_gold: parseInt(document.getElementById('product-gold').value),
    is_visible: parseInt(document.getElementById('product-visible').value),
  };

  try {
    // EN
    if (enId) {
      await apiFetch(`/api/admin/products/${enId}`, { method: 'PATCH', body: JSON.stringify({ ...shared, name: enName, limit_text: enLimit, description: enDesc }) });
    } else {
      const created = await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify({ ...shared, name: enName, limit_text: enLimit, description: enDesc, lang: 'en' }) });
      if (!document.getElementById('product-edit-sort-order').value && created?.data?.sort_order) {
        document.getElementById('product-edit-sort-order').value = created.data.sort_order;
      }
    }

    const sortOrder = parseInt(document.getElementById('product-edit-sort-order').value) || 0;

    // ZH
    const zhName = productDraft.zh.name.trim();
    const zhLimit = productDraft.zh.limit_text.trim();
    const zhDesc = productDraft.zh.description.trim();
    if (zhName && zhLimit && zhDesc) {
      if (zhId) {
        await apiFetch(`/api/admin/products/${zhId}`, { method: 'PATCH', body: JSON.stringify({ ...shared, name: zhName, limit_text: zhLimit, description: zhDesc }) });
      } else {
        await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify({ ...shared, name: zhName, limit_text: zhLimit, description: zhDesc, lang: 'zh', sort_order: sortOrder }) });
      }
    }

    // RU
    const ruName = productDraft.ru.name.trim();
    const ruLimit = productDraft.ru.limit_text.trim();
    const ruDesc = productDraft.ru.description.trim();
    if (ruName && ruLimit && ruDesc) {
      if (ruId) {
        await apiFetch(`/api/admin/products/${ruId}`, { method: 'PATCH', body: JSON.stringify({ ...shared, name: ruName, limit_text: ruLimit, description: ruDesc }) });
      } else {
        await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify({ ...shared, name: ruName, limit_text: ruLimit, description: ruDesc, lang: 'ru', sort_order: sortOrder }) });
      }
    }

    toast('Product saved');
    document.getElementById('product-modal').hidden = true;
    loadProducts(document.getElementById('products-category-filter').value);
  } catch {
    errEl.textContent = 'Failed to save product';
    errEl.hidden = false;
  }
});

async function deleteProduct(enId, zhId, ruId) {
  if (!confirm('Delete this product (all languages)?')) return;
  if (enId) await apiFetch(`/api/admin/products/${enId}`, { method: 'DELETE' });
  if (zhId) await apiFetch(`/api/admin/products/${zhId}`, { method: 'DELETE' });
  if (ruId) await apiFetch(`/api/admin/products/${ruId}`, { method: 'DELETE' });
  toast('Product deleted');
  loadProducts(document.getElementById('products-category-filter').value);
}

/* ═══════════════════════════════════════════════════════
   PAYMENTS TAB
   ═══════════════════════════════════════════════════════ */
let currentPaymentId = null;
let currentWallets = [];

async function loadPayments() {
  const list = document.getElementById('payments-list');
  list.innerHTML = '<div class="loading">Loading payment methods…</div>';

  const data = await apiFetch('/api/admin/payments');
  const items = data.data || [];

  document.getElementById('payments-count').textContent = `${items.length} payment methods`;
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><p>No payment methods yet.</p></div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'faq-card';
    const walletLines = (item.wallets || []).map(w =>
      `<div class="faq-card__meta"><strong>${escHtml(w.network)}</strong>: <code style="font-size:11px">${escHtml(w.address)}</code></div>`
    ).join('');
    card.innerHTML = `
      <div class="faq-card__body">
        <div class="faq-card__q">${escHtml(item.name)} — <span style="color:var(--text-dim)">${escHtml(item.label)}</span></div>
        <div class="faq-card__meta">icon: ${escHtml(item.icon_key)} · ${item.is_visible ? 'Visible' : 'Hidden'}</div>
        ${walletLines}
      </div>
      <div class="faq-card__actions">
        <button class="btn btn--ghost btn--sm" onclick="openPaymentEdit(${item.id})">Edit</button>
        <button class="btn btn--danger btn--sm" onclick="deletePayment(${item.id})">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

document.getElementById('add-payment-btn').addEventListener('click', () => {
  currentPaymentId = null;
  currentWallets = [];
  document.getElementById('payment-modal-title').textContent = 'Add Payment Method';
  document.getElementById('payment-edit-id').value = '';
  document.getElementById('payment-name').value = '';
  document.getElementById('payment-label').value = '';
  document.getElementById('payment-icon').value = '';
  document.getElementById('payment-error').hidden = true;
  renderWalletsList();
  document.getElementById('payment-modal').hidden = false;
});

document.getElementById('payment-modal-close').addEventListener('click', () => { document.getElementById('payment-modal').hidden = true; });
document.getElementById('payment-cancel').addEventListener('click', () => { document.getElementById('payment-modal').hidden = true; });

async function openPaymentEdit(id) {
  const d = await apiFetch(`/api/admin/payments/${id}`);
  const item = d.data;
  currentPaymentId = id;
  currentWallets = [...(item.wallets || [])];
  document.getElementById('payment-modal-title').textContent = 'Edit Payment Method';
  document.getElementById('payment-edit-id').value = id;
  document.getElementById('payment-name').value = item.name || '';
  document.getElementById('payment-label').value = item.label || '';
  document.getElementById('payment-icon').value = item.icon_key || '';
  document.getElementById('payment-error').hidden = true;
  renderWalletsList();
  document.getElementById('payment-modal').hidden = false;
}

function renderWalletsList() {
  const container = document.getElementById('payment-wallets-list');
  container.innerHTML = '';
  if (!currentWallets.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;margin-bottom:8px;">No wallet addresses yet.</div>';
    return;
  }
  currentWallets.forEach((w, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-bottom:6px;';
    row.innerHTML = `
      <span class="count-badge">${escHtml(w.network)}</span>
      <code style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(w.address)}</code>
      <button class="btn btn--danger btn--sm" onclick="removeWalletFromList(${idx})">✕</button>
    `;
    container.appendChild(row);
  });
}

window.removeWalletFromList = async function(idx) {
  const w = currentWallets[idx];
  if (w.id && currentPaymentId) {
    // Already saved in DB — delete via API
    try {
      await apiFetch(`/api/admin/payments/${currentPaymentId}/wallets/${w.id}`, { method: 'DELETE' });
    } catch {}
  }
  currentWallets.splice(idx, 1);
  renderWalletsList();
};

document.getElementById('wallet-add-btn').addEventListener('click', async () => {
  const network = document.getElementById('wallet-new-network').value.trim();
  const address = document.getElementById('wallet-new-address').value.trim();
  if (!network || !address) {
    toast('Network and address are required', 'error');
    return;
  }

  if (currentPaymentId) {
    // Save immediately to DB
    try {
      const d = await apiFetch(`/api/admin/payments/${currentPaymentId}/wallets`, {
        method: 'POST',
        body: JSON.stringify({ network, address }),
      });
      currentWallets.push(d.data);
    } catch { return; }
  } else {
    // Buffered — will be added after method is created
    currentWallets.push({ network, address });
  }

  document.getElementById('wallet-new-network').value = '';
  document.getElementById('wallet-new-address').value = '';
  renderWalletsList();
  toast('Wallet added');
});

document.getElementById('payment-save').addEventListener('click', async () => {
  const id = document.getElementById('payment-edit-id').value;
  const errEl = document.getElementById('payment-error');

  const name = document.getElementById('payment-name').value.trim();
  const label = document.getElementById('payment-label').value.trim();
  const icon_key = document.getElementById('payment-icon').value.trim();

  if (!name || !label || !icon_key) {
    errEl.textContent = 'Name, label, and icon key are required';
    errEl.hidden = false;
    return;
  }

  try {
    let methodId = id;
    if (id) {
      await apiFetch(`/api/admin/payments/${id}`, { method: 'PATCH', body: JSON.stringify({ name, label, icon_key }) });
    } else {
      const created = await apiFetch('/api/admin/payments', { method: 'POST', body: JSON.stringify({ name, label, icon_key }) });
      methodId = created.data?.id;
      // Add buffered wallets
      for (const w of currentWallets) {
        if (!w.id) {
          await apiFetch(`/api/admin/payments/${methodId}/wallets`, {
            method: 'POST',
            body: JSON.stringify({ network: w.network, address: w.address }),
          });
        }
      }
    }
    toast('Payment method saved');
    document.getElementById('payment-modal').hidden = true;
    loadPayments();
  } catch {
    errEl.textContent = 'Failed to save payment method';
    errEl.hidden = false;
  }
});

async function deletePayment(id) {
  if (!confirm('Delete this payment method and all its wallet addresses?')) return;
  await apiFetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
  toast('Payment method deleted');
  loadPayments();
}
