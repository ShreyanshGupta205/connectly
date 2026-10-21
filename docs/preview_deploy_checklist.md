# Preview Deployment & Social Link-Preview Verification Checklist

This checklist verifies the migration from hash-based routing to clean HTML5 path-based routes (`/@handle`, `/dashboard`, `/admin`, `/poster/:handle`), legacy hash backward compatibility redirects, and dynamic per-profile Open Graph / Twitter Card social previews.

---

## 1. Automated Verification Checks
Before manual verification, ensure all automated tests pass:
```bash
# Run unit tests for router, hash redirects, and crawler bot detection
node --test tests/router.test.mjs

# Verify type safety and Vite production bundle
npm run build
```

---

## 2. Browser Navigation & URL Architecture Checks

| Test Case | Input URL | Expected Behavior | Verification Status |
|---|---|---|---|
| **Root Landing** | `https://<preview>/` | Renders Landing Page, Navbar, Footer | ⏳ Pending deploy |
| **Path Vanity Profile** | `https://<preview>/@shreyansh` | Renders Public Profile for Shreyansh; URL stays `/@shreyansh` | ⏳ Pending deploy |
| **Alt Path Profile** | `https://<preview>/p/shreyansh` | Seamlessly canonicalizes to `/@shreyansh` | ⏳ Pending deploy |
| **Studio Dashboard** | `https://<preview>/dashboard` | Renders Dashboard Studio layout with tabs | ⏳ Pending deploy |
| **Printable Poster** | `https://<preview>/poster/shreyansh` | Renders Printable Poster Studio with QR code | ⏳ Pending deploy |
| **Browser History** | Click Back / Forward | `popstate` updates view without full page reload | ⏳ Pending deploy |

---

## 3. Legacy Hash URL Backward-Compatibility Redirects

Test old links from bookmarks, emails, or early social posts:

| Legacy URL | Target Canonical URL | Expected Redirect Mechanism | Verification Status |
|---|---|---|---|
| `https://<preview>/#/@shreyansh` | `https://<preview>/@shreyansh` | Client `window.history.replaceState` removes `#` instantly | ⏳ Pending deploy |
| `https://<preview>/#/dashboard` | `https://<preview>/dashboard` | Client `window.history.replaceState` converts to `/dashboard` | ⏳ Pending deploy |
| `https://<preview>/#/poster-shreyansh` | `https://<preview>/poster/shreyansh` | Client `window.history.replaceState` converts to `/poster/shreyansh` | ⏳ Pending deploy |
| `https://<preview>/#/` | `https://<preview>/` | Clean root URL without hash | ⏳ Pending deploy |

---

## 4. Social Media Crawler / Link Preview Debugger Checklist

When links are shared on messaging platforms and social networks, link crawlers do not execute JavaScript. Vercel edge rewrite rules intercept the crawler `User-Agent` and serve dynamic, server-rendered Open Graph tags from `/api/og.mjs`.

### A. WhatsApp Link Preview
- **Crawler User-Agent**: `WhatsApp/2.x`
- **Manual Verification Step**:
  1. Open WhatsApp Web or mobile app.
  2. Paste `https://<preview>/@shreyansh` into any chat draft.
  3. Wait 2–3 seconds for preview bubble generation.
- **Expected Result**:
  - Image: High-resolution profile avatar.
  - Title: `Shreyansh Gupta (@shreyansh) | Connectly`
  - Description: `IIT Madras student building with AI & AR...`
  - Site name: `Connectly`

### B. LinkedIn Post Inspector
- **Official Tool**: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/inspect/)
- **Manual Verification Step**:
  1. Paste `https://<preview>/@shreyansh` into the inspector.
  2. Click **Inspect**.
- **Expected Result**:
  - Status code: `200 OK`
  - Canonical URL: `https://<preview>/@shreyansh`
  - Title: Matches `og:title`
  - Image: Detected and formatted as large summary preview card.

### C. X (Twitter) Card Preview
- **Tool**: [X / Twitter Web Composer](https://x.com/compose/post)
- **Manual Verification Step**:
  1. Paste `https://<preview>/@shreyansh` into a draft tweet.
  2. Check the card preview box beneath the compose area.
- **Expected Result**:
  - Card type: `summary_large_image`
  - Title: `Shreyansh Gupta (@shreyansh) | Connectly`
  - Description: Accurate bio snippet with zero truncated markup.

### D. Facebook Sharing Debugger
- **Official Tool**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Manual Verification Step**:
  1. Input `https://<preview>/@shreyansh` and click **Debug**.
  2. If cached, click **Scrape Again**.
- **Expected Result**:
  - Response Code: `200`
  - Scraped URL: `https://<preview>/@shreyansh`
  - Open Graph Properties: All required tags (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:url`) populated with zero errors.

---

## 5. Deployment & PR Verification
- Branch: `feature/path-routing-and-edge-og`
- Status: **Staged on feature branch (PR only, NOT merged into main)**
- Clean Git State: 0 uncommitted artifacts in product working tree.
