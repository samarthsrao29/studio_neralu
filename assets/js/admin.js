const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Global Admin Dashboard State
let activeWorks = [];
let editingWorkId = null;
let supabaseClient = null;

// Toast Notification Helper
const showToast = (message, type = "success") => {
  const container = $("#toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === "success" ? "✓" : "✕"}</span>
    <span style="font-size: 0.92rem; font-weight: 550;">${message}</span>
  `;

  container.appendChild(toast);

  // Self dismiss after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-15px) scale(0.95)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};

// Image Preview Handling
const setupImagePreview = () => {
  const dropzone = $("#dropzone");
  const fileInput = $("#imageInput");
  const previewContainer = $("#previewContainer");
  const previewImage = $("#previewImage");
  const removeBtn = $("#removePreviewBtn");

  if (!dropzone || !fileInput) return;

  const displayFile = (file) => {
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size too large. Maximum size is 10MB.", "error");
      fileInput.value = "";
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed.", "error");
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  };

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    displayFile(file);
  });

  // Drag and Drop Events
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    }, false);
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) {
      fileInput.files = dt.files;
      displayFile(file);
    }
  });

  // Clear preview
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Avoid triggering file input click
    fileInput.value = "";
    previewImage.src = "";
    previewContainer.style.display = "none";
  });
};

// Start editing an existing work
window.startEditWork = (id) => {
  const work = activeWorks.find((w) => String(w.id) === String(id));
  if (!work) return;

  editingWorkId = id;

  // Scroll form card into view smoothly
  const formCard = $("#uploadForm").closest(".panel-card");
  if (formCard) {
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Populate inputs
  $("#titleInput").value = work.title;
  $("#categoryInput").value = work.category;
  $("#locationInput").value = work.location;
  $("#descriptionInput").value = work.description;

  // Show active image in preview container
  const previewContainer = $("#previewContainer");
  const previewImage = $("#previewImage");
  previewImage.src = work.image;
  previewContainer.style.display = "flex";

  // Update layout header and buttons
  $("#formSectionTitle").textContent = "Edit Project";
  $("#submitBtn").querySelector("span").textContent = "Save Changes";
  $("#cancelEditBtn").style.display = "block";
};

// Cancel editing and restore upload mode
window.cancelEditing = () => {
  editingWorkId = null;

  const form = $("#uploadForm");
  if (form) form.reset();

  // Reset preview
  const previewContainer = $("#previewContainer");
  const previewImage = $("#previewImage");
  const fileInput = $("#imageInput");
  
  if (previewContainer) previewContainer.style.display = "none";
  if (previewImage) previewImage.src = "";
  if (fileInput) fileInput.value = "";

  // Restore layout headers and buttons
  $("#formSectionTitle").textContent = "Upload New Project";
  $("#submitBtn").querySelector("span").textContent = "Upload & Publish Project";
  $("#cancelEditBtn").style.display = "none";
};

// Fetch and Render Works
const loadWorks = async () => {
  const container = $("#worksListContainer");
  if (!container) return;

  if (!supabaseClient) return;

  try {
    const { data: works, error } = await supabaseClient
      .from("works")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Cache works array in memory for robust edit lookups
    activeWorks = works;

    if (works.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 4rem 1rem;">
          <p>No projects loaded yet. Use the upload panel to add your first work.</p>
        </div>`;
      return;
    }

    container.innerHTML = works
      .map(
        (work) => `
      <article class="admin-card" id="work-card-${work.id}">
        <div class="admin-card-media" style="background-image: url('${work.image}');"></div>
        <div class="admin-card-body">
          <h3>${work.title}</h3>
          <div class="admin-card-meta">
            <span>${work.category}</span>
            <span>•</span>
            <span>${work.location}</span>
          </div>
          <p>${work.description}</p>
          <div style="display: flex; gap: 0.6rem; margin-top: auto; width: 100%;">
            <button type="button" class="submit-btn button-ghost" style="padding: 0.65rem 1rem; border-radius: 999px; font-size: 0.88rem; border-color: var(--glass-border); background: rgba(255, 255, 255, 0.04); color: var(--primary-bronze); box-shadow: none; font-weight: 600; cursor: pointer; flex-grow: 1; min-height: unset; width: unset;" onclick="startEditWork('${work.id}')">
              <span>✏ Edit</span>
            </button>
            <button type="button" class="delete-btn" style="padding: 0.65rem 1rem; border-radius: 999px; font-size: 0.88rem; flex-grow: 1;" onclick="deleteWork('${work.id}')">
              <span>🗑 Delete</span>
            </button>
          </div>
        </div>
      </article>
    `
      )
      .join("");
  } catch (err) {
    console.error("Error loading works:", err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--danger-red); padding: 4rem 1rem;">
        <p>Failed to load projects. Make sure your Supabase "works" table is created and policies are configured.</p>
      </div>`;
  }
};

// Handle Setup Form Submission
const setupDatabaseConfig = () => {
  const form = $("#setupForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = $("#setupUrlInput").value.trim();
    const key = $("#setupKeyInput").value.trim();

    if (!url || !key) {
      showToast("Please fill in both fields.", "error");
      return;
    }

    localStorage.setItem("neralu_supabase_url", url);
    localStorage.setItem("neralu_supabase_key", key);

    showToast("Supabase Database successfully connected!");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
};

// Handle Form Submission (Create & Edit)
const setupFormSubmit = () => {
  const form = $("#uploadForm");
  const submitBtn = $("#submitBtn");
  const cancelBtn = $("#cancelEditBtn");

  if (!form || !submitBtn || !supabaseClient) return;

  // Bind cancel action
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      cancelEditing();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = $("#titleInput").value.trim();
    const location = $("#locationInput").value.trim();
    const category = $("#categoryInput").value;
    const description = $("#descriptionInput").value.trim();
    const imageFile = $("#imageInput").files[0];

    // Image validation: strictly required only in creation mode
    if (!editingWorkId && !imageFile) {
      showToast("Please upload an image for the project.", "error");
      return;
    }

    if (!title || !location || !description) {
      showToast("Please fill in all details.", "error");
      return;
    }

    // Set loading state on button
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    
    const loadingText = editingWorkId ? "Saving Changes..." : "Uploading Project...";
    submitBtn.innerHTML = `
      <span class="spinner btn-spinner"></span>
      <span>${loadingText}</span>
    `;

    try {
      let imageUrl = "";

      // 1. Image upload handling
      if (imageFile) {
        // Construct standard unique filepath inside the 'portfolio' storage bucket
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from("portfolio")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from("portfolio")
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;

        // Clean up: If in EDIT mode and new image uploaded, delete the old file from bucket
        if (editingWorkId) {
          const oldWork = activeWorks.find(w => String(w.id) === String(editingWorkId));
          if (oldWork && oldWork.image.includes("/storage/v1/object/public/portfolio/")) {
            const oldFileName = oldWork.image.split("/").pop();
            await supabaseClient.storage.from("portfolio").remove([oldFileName]);
          }
        }
      }

      // 2. Database transaction handling
      if (editingWorkId) {
        // EDIT MODE (PUT)
        const updatePayload = {
          title,
          category,
          location,
          description
        };
        
        if (imageUrl) {
          updatePayload.image = imageUrl;
        }

        const { error: dbError } = await supabaseClient
          .from("works")
          .update(updatePayload)
          .eq("id", editingWorkId);

        if (dbError) throw dbError;
        showToast("Project updated successfully!");
      } else {
        // UPLOAD MODE (POST)
        const { error: dbError } = await supabaseClient
          .from("works")
          .insert([{
            title,
            category,
            location,
            description,
            image: imageUrl
          }]);

        if (dbError) throw dbError;
        showToast("Project successfully uploaded and published!");
      }

      // Reset form and UI state back to upload mode
      cancelEditing();
      
      // Reload works list
      await loadWorks();
    } catch (err) {
      console.error("Supabase process error:", err);
      showToast(err.message || "An error occurred while saving project.", "error");
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
};

// Global Delete Function (Triggered by dynamic cards)
window.deleteWork = async (id) => {
  if (!confirm("Are you sure you want to permanently delete this project?")) return;

  if (!supabaseClient) return;

  // If deleting the project currently being edited, cancel edit mode first
  if (String(editingWorkId) === String(id)) {
    cancelEditing();
  }

  const cardElement = $(`#work-card-${id}`);
  const work = activeWorks.find(w => String(w.id) === String(id));

  try {
    // 1. Delete from PostgreSQL works table
    const { error: dbError } = await supabaseClient
      .from("works")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    // 2. Delete the associated image from Supabase Storage bucket to free space
    if (work && work.image.includes("/storage/v1/object/public/portfolio/")) {
      const fileName = work.image.split("/").pop();
      await supabaseClient.storage.from("portfolio").remove([fileName]);
    }

    // Success animation: add fade-out class
    if (cardElement) {
      cardElement.classList.add("card-deleting");
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        cardElement.remove();
        
        // Check if there are remaining cards
        const remainingCards = $$(".admin-card");
        if (remainingCards.length === 0) {
          loadWorks();
        }
      }, 400);
    }

    showToast("Project removed successfully.");
  } catch (err) {
    console.error("Delete error:", err);
    showToast(err.message || "Could not delete project.", "error");
  }
};

// Initialize Admin functions on load
document.addEventListener("DOMContentLoaded", () => {
  // 1. Resolve credentials
  const creds = window.getSupabaseCredentials ? window.getSupabaseCredentials() : { isConfigured: false };
  const disconnectBtn = $("#disconnectDbBtn");

  if (!creds.isConfigured) {
    // Show Connect Setup View, hide main dashboard
    $("#supabaseSetupView").style.display = "block";
    $("#mainDashboardView").style.display = "none";
    if (disconnectBtn) disconnectBtn.style.display = "none";
    
    // Bind Setup submit listener
    setupDatabaseConfig();
  } else {
    // Show Main Dashboard, hide Setup View
    $("#supabaseSetupView").style.display = "none";
    $("#mainDashboardView").style.display = "block";
    
    // Enable Disconnect Toggle in Header
    if (disconnectBtn) {
      disconnectBtn.style.display = "block";
      disconnectBtn.addEventListener("click", () => {
        if (confirm("Disconnect from the Supabase database? You can reconnect at any time.")) {
          localStorage.removeItem("neralu_supabase_url");
          localStorage.removeItem("neralu_supabase_key");
          window.location.reload();
        }
      });
    }

    // Initialize Supabase SDK client globally
    supabaseClient = supabase.createClient(creds.url, creds.anonKey);

    // Initialize regular upload panel functionality
    setupImagePreview();
    setupFormSubmit();
    loadWorks();
  }
});
