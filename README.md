# Studio Neralu — Serverless Web App

Welcome to the serverless edition of **Studio Neralu**! 

Both your main portfolio website (`index.html`) and your admin dashboard (`admin.html`) are **100% serverless, static, and client-side**. This means you can host them **directly on GitHub Pages for free, forever, with unlimited bandwidth and zero wake-up delays!**

Your files connect directly to a cloud database (**Supabase**) to load, upload, edit, and delete portfolio projects in real-time.

---

## 🚀 Step-by-Step: Host on GitHub Pages with Supabase

Follow these 4 simple steps to get your serverless website and admin panel live in the cloud:

### 1. Set Up Your Supabase Database
Before deploying, make sure you configure your database and storage bucket:
* Follow the quick **[Supabase Setup Guide](.gemini/antigravity/brain/81dc12a3-95d7-4397-b837-988d629eee2d/supabase_setup_instructions.md)** inside your workspace to create your `works` table and your `portfolio` public image bucket.

### 2. Push Your Project to GitHub
Since your folder is already configured as a local Git repository, open your terminal and run these commands to push your updated serverless files to GitHub:

```bash
# 1. Add all updated files
git add .

# 2. Commit the serverless transition
git commit -m "feat: migrate to serverless supabase portfolio with admin dashboard"

# 3. Push to your active GitHub branch (usually 'main' or 'master')
git push origin main
```

### 3. Enable GitHub Pages
1. Go to your repository on the [GitHub Website](https://github.com/).
2. Click on the **Settings** tab (the gear icon in the top menu bar).
3. Select the **Pages** menu from the left-hand sidebar.
4. Under **Build and deployment**:
   * **Source:** Select **Deploy from a branch** from the dropdown.
   * **Branch:** Select `main` (or `master`) and set the folder to `/ (root)`.
5. Click the **Save** button.

### 4. Paste Your API Keys & Live Test!
1. Wait 1 minute for GitHub Actions to build and deploy your site in the background.
2. Under the **Settings → Pages** menu, GitHub will display your public URL (e.g. `https://samarthsrao29.github.io/studio_neralu/`).
3. Open your live links:
   * **User Website:** `https://your-username.github.io/your-repo-name/`
   * **Admin Dashboard:** `https://your-username.github.io/your-repo-name/admin.html`
4. Open the **Admin Dashboard** in your browser, enter your Supabase Project URL and Anon API key, and click **Connect & Initialize Database**.

🎉 **Congratulations!** Your database is connected securely. You can immediately upload projects from the live Admin Panel and see them reflect **instantly (in 0.5 seconds)** on your live portfolio!

---

## 💻 Running & Testing Locally

Since the codebase is serverless, you don't even need to run a Node server locally to test it! You can run it in two easy ways:

### Method A: Double-Click
Simply double-click `index.html` or `admin.html` to open them directly in your web browser!

### Method B: Local Static Server (Recommended)
To run a local server that matches GitHub Pages exactly:
1. Open your terminal in this directory:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000/` and `http://localhost:3000/admin.html`.
