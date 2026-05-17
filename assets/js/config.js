// Studio Neralu — Supabase Configuration
// You can either paste your credentials below, or leave them blank and
// paste them directly into the Setup UI on the Admin Panel page!

const SUPABASE_CONFIG = {
  // Option A: Hardcode your credentials here (Optional)
  url: "",       // e.g. "https://your-project-id.supabase.co"
  anonKey: "",   // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

// Helper to resolve Supabase credentials dynamically
window.getSupabaseCredentials = () => {
  // 1. Try hardcoded configuration first
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    return {
      url: SUPABASE_CONFIG.url,
      anonKey: SUPABASE_CONFIG.anonKey,
      isConfigured: true
    };
  }

  // 2. Fall back to local storage (for no-code setup in Admin Panel)
  const savedUrl = localStorage.getItem("neralu_supabase_url");
  const savedKey = localStorage.getItem("neralu_supabase_key");

  if (savedUrl && savedKey) {
    return {
      url: savedUrl,
      anonKey: savedKey,
      isConfigured: true
    };
  }

  // 3. Not configured yet
  return {
    url: "",
    anonKey: "",
    isConfigured: false
  };
};
