# GitHub Pages Deployment Plan
## Strategic Landing Page Mockup for thinkhaven

### Objective
Deploy enhanced landing page as a GitHub Pages hosted website for Kevin to showcase mockup, content, and gather feedback on the strategic analysis tool concept.

### Deployment Strategy Overview
**Option 1: Static Export from Next.js (Recommended)**
- Generate static HTML/CSS/JS files from the Next.js app
- Deploy to GitHub Pages using GitHub Actions
- Custom domain support available
- Fast loading and SEO-friendly

**Option 2: Separate Static Branch**
- Create dedicated `gh-pages` branch with pure HTML/CSS
- Simpler deployment but requires manual maintenance
- Good for quick mockups and prototypes

### Implementation Plan - Option 1 (Next.js Static Export)

#### Phase 1: Next.js Configuration
1. **Update `next.config.ts`** to enable static export:
   ```typescript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   
   module.exports = nextConfig
   ```

2. **Create GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
     workflow_dispatch:
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
         - run: npm ci
           working-directory: ./apps/web
         - run: npm run build
           working-directory: ./apps/web
         - uses: actions/upload-pages-artifact@v3
           with:
             path: ./apps/web/out
         - uses: actions/deploy-pages@v4
   ```

#### Phase 2: Repository Configuration
1. **Enable GitHub Pages**:
   - Repository Settings → Pages
   - Source: GitHub Actions
   - Custom domain: `thinkhaven` (optional)

2. **Update package.json** build script:
   ```json
   {
     "scripts": {
       "build": "next build",
       "export": "next build && next export"
     }
   }
   ```

#### Phase 3: Content Optimization for Static Deployment
1. **Remove Dynamic Features** (temporarily):
   - Supabase authentication (show static demo instead)
   - API routes (not needed for landing page)
   - Server-side features

2. **Update Navigation Links**:
   - Convert `/signup` and `/login` to contact forms or waitlist
   - Add "Coming Soon" modals for demo interactions

3. **SEO Optimization**:
   - Add `metadata` export to page.tsx
   - Include Open Graph tags
   - Add structured data for business information

### Content Strategy for Feedback Collection

#### Key Messaging Focus
✅ **Completed Enhancements**:
- Mary as AI Business Analyst (not generic coach)
- bMAD Method positioning and credibility
- Evidence-based analysis framework
- Numbered options protocol demonstration
- Social proof and testimonials
- Clear value propositions with metrics

#### Feedback Collection Elements
1. **Interactive Assessment** (coming soon modal)
2. **Demo Request Form** instead of live demo
3. **Beta Waitlist Signup** with email collection
4. **Contact Information** prominently displayed

### Technical Implementation Steps

#### Step 1: Configure Static Export
```bash
# Navigate to web app
cd apps/web

# Update next.config.ts for static export
# Remove dynamic imports and server-side features
# Test static build locally
npm run build
```

#### Step 2: Create GitHub Actions Workflow
```bash
# Create workflow directory
mkdir -p .github/workflows

# Add deploy.yml workflow file
# Configure Pages deployment permissions
```

#### Step 3: Repository Settings
- Enable GitHub Pages with Actions source
- Configure custom domain (optional)
- Set up branch protection rules
- Add environment secrets if needed

#### Step 4: Test and Deploy
```bash
# Test static export locally
npm run build && npx serve out/

# Commit and push to trigger deployment
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### Post-Deployment Checklist
- [ ] Verify all pages load correctly
- [ ] Test responsive design on mobile/tablet
- [ ] Confirm all links work (no 404s)
- [ ] Check page load speeds
- [ ] Validate HTML/CSS/JS
- [ ] Test contact forms functionality
- [ ] Verify SEO meta tags
- [ ] Set up Google Analytics (optional)

### Expected Outcomes
1. **Fast Loading**: Static site with optimized performance
2. **Professional Appearance**: Enhanced design showcasing Mary and bMAD Method
3. **Clear Value Proposition**: Strategic analysis positioning over generic AI chat
4. **Feedback Mechanisms**: Multiple ways for visitors to express interest
5. **SEO Friendly**: Proper meta tags and structure for search engines

### Alternative Quick Deploy Option
If Next.js static export has issues, fall back to:
1. Create `docs/` folder with pure HTML version
2. Enable Pages from `docs/` folder
3. Manual HTML/CSS implementation based on current design

### Domain Configuration (Optional)
- Point thinkhaven CNAME to `username.github.io`
- Add CNAME file to repository root
- Configure DNS settings with domain provider

### Success Metrics
- Page load speed < 3 seconds
- Mobile responsiveness score > 95%
- All interactive elements working
- Clear feedback collection mechanism
- Professional brand presentation

---

**Next Steps**: Execute Phase 1 configuration and test static export build locally before deploying to GitHub Pages.