/* ============================================================
   Studio Neralu — Admin JS
   Uses local Express REST API (/api/works) via server.js
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Track GA events
const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
};

// In-memory state
let activeWorks = [];
let editingWorkId = null;

/* ---------- Toast ---------- */
const showToast = (message, type = 'success') => {
  const container = $('#toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size:1.1rem">${type === 'success' ? '✓' : '✕'}</span>
    <span style="font-size:0.92rem;font-weight:550">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-15px) scale(0.95)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

/* ---------- Image Preview / Dropzone ---------- */
const setupImagePreview = () => {
  const dropzone = $('#dropzone');
  const fileInput = $('#imageInput');
  const previewContainer = $('#previewContainer');
  const previewImage = $('#previewImage');
  const removeBtn = $('#removePreviewBtn');

  if (!dropzone || !fileInput) return;

  const displayFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Maximum 10MB.', 'error');
      fileInput.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed.', 'error');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  };

  fileInput.addEventListener('change', (e) => displayFile(e.target.files[0]));

  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }, false)
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }, false)
  );
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) { fileInput.files = e.dataTransfer.files; displayFile(file); }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = '';
    previewImage.src = '';
    previewContainer.style.display = 'none';
  });
};

/* ---------- Load & Render Works ---------- */
const loadWorks = async () => {
  const container = $('#worksListContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem 1rem">
      <span class="spinner" style="border-top-color:var(--primary-bronze);width:24px;height:24px;margin-bottom:0.8rem"></span>
      <p>Loading projects…</p>
    </div>`;

  try {
    const res = await fetch('/api/works');
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const works = await res.json();
    activeWorks = works;
    renderWorksList(works, container);
  } catch (err) {
    console.error('Error loading works:', err);
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:var(--danger-red);padding:3rem 1rem">
        <p>⚠ Failed to load projects: ${err.message}</p>
      </div>`;
  }
};

const renderWorksList = (works, container) => {
  if (!works || works.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:4rem 1rem">
        <p>No projects yet. Use the upload panel on the left to add your first work.</p>
      </div>`;
    return;
  }

  container.innerHTML = works.map((work) => `
    <article class="admin-card" id="work-card-${work.id}">
      <div class="admin-card-media" style="background-image:url('${work.image}')"></div>
      <div class="admin-card-body">
        <h3>${work.title}</h3>
        <div class="admin-card-meta">
          <span>${work.category}</span><span>•</span><span>${work.location}</span>
        </div>
        <p>${work.description}</p>
        <div style="display:flex;gap:0.6rem;margin-top:auto;width:100%">
          <button type="button"
            class="submit-btn button-ghost"
            style="padding:0.65rem 1rem;border-radius:999px;font-size:0.88rem;border-color:var(--glass-border);background:rgba(255,255,255,0.04);color:var(--primary-bronze);box-shadow:none;font-weight:600;cursor:pointer;flex-grow:1;min-height:unset;width:unset"
            onclick="startEditWork('${work.id}')">
            <span>✏ Edit</span>
          </button>
          <button type="button"
            class="delete-btn"
            style="padding:0.65rem 1rem;border-radius:999px;font-size:0.88rem;flex-grow:1"
            onclick="deleteWork('${work.id}')">
            <span>🗑 Delete</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');
};

/* ---------- Edit ---------- */
window.startEditWork = (id) => {
  const work = activeWorks.find((w) => String(w.id) === String(id));
  if (!work) return;

  editingWorkId = id;

  const formCard = $('#uploadForm')?.closest('.panel-card');
  if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  $('#titleInput').value = work.title;
  $('#categoryInput').value = work.category;
  $('#locationInput').value = work.location;
  $('#descriptionInput').value = work.description;

  const previewContainer = $('#previewContainer');
  const previewImage = $('#previewImage');
  previewImage.src = work.image;
  previewContainer.style.display = 'flex';

  $('#formSectionTitle').textContent = 'Edit Project';
  $('#submitBtn').querySelector('span').textContent = 'Save Changes';
  $('#cancelEditBtn').style.display = 'block';
};

window.cancelEditing = () => {
  editingWorkId = null;
  const form = $('#uploadForm');
  if (form) form.reset();

  const previewContainer = $('#previewContainer');
  const previewImage = $('#previewImage');
  const fileInput = $('#imageInput');
  if (previewContainer) previewContainer.style.display = 'none';
  if (previewImage) previewImage.src = '';
  if (fileInput) fileInput.value = '';

  $('#formSectionTitle').textContent = 'Upload New Project';
  $('#submitBtn').querySelector('span').textContent = 'Upload & Publish Project';
  $('#cancelEditBtn').style.display = 'none';
};

/* ---------- Form Submit (Create / Edit) ---------- */
const setupFormSubmit = () => {
  const form = $('#uploadForm');
  const submitBtn = $('#submitBtn');
  const cancelBtn = $('#cancelEditBtn');
  if (!form || !submitBtn) return;

  if (cancelBtn) cancelBtn.addEventListener('click', () => cancelEditing());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = $('#titleInput').value.trim();
    const location = $('#locationInput').value.trim();
    const category = $('#categoryInput').value;
    const description = $('#descriptionInput').value.trim();
    const imageFile = $('#imageInput').files[0];

    if (!editingWorkId && !imageFile) {
      showToast('Please upload an image for the project.', 'error');
      return;
    }
    if (!title || !location || !description) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <span class="spinner btn-spinner"></span>
      <span>${editingWorkId ? 'Saving Changes…' : 'Uploading Project…'}</span>
    `;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      let res;
      if (editingWorkId) {
        // PUT /api/works/:id
        res = await fetch(`/api/works/${editingWorkId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // POST /api/works
        res = await fetch('/api/works', {
          method: 'POST',
          body: formData,
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Server error');

      showToast(editingWorkId ? 'Project updated successfully!' : 'Project uploaded and published!');
      trackEvent('admin_work_save', { mode: editingWorkId ? 'edit' : 'create' });

      cancelEditing();
      await loadWorks();
    } catch (err) {
      console.error('Submit error:', err);
      showToast(err.message || 'An error occurred while saving.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
};

/* ---------- Delete ---------- */
window.deleteWork = async (id) => {
  if (!confirm('Permanently delete this project?')) return;

  if (String(editingWorkId) === String(id)) cancelEditing();

  const cardEl = $(`#work-card-${id}`);

  try {
    const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Server error');

    if (cardEl) {
      cardEl.classList.add('card-deleting');
      setTimeout(() => {
        cardEl.remove();
        if ($$('.admin-card').length === 0) loadWorks();
      }, 400);
    }

    showToast('Project removed successfully.');
    trackEvent('admin_work_delete');
  } catch (err) {
    console.error('Delete error:', err);
    showToast(err.message || 'Could not delete project.', 'error');
  }
};

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Always show the main dashboard — no Supabase setup needed
  const setupView = $('#supabaseSetupView');
  const mainView = $('#mainDashboardView');
  const settingsBtn = $('#openSettingsBtn');

  if (setupView) setupView.style.display = 'none';
  if (mainView) mainView.style.display = 'block';
  if (settingsBtn) settingsBtn.style.display = 'none'; // hide DB settings — not relevant

  setupImagePreview();
  setupFormSubmit();
  loadWorks();
});
