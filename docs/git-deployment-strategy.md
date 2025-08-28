# Git Commit and Push Strategy
## Landing Page Mockup Deployment

### Current Changes Summary
Based on git status, the following files have been modified:
- `apps/web/app/components/dual-pane/StateBridge.tsx` (Modified)
- `apps/web/app/layout.tsx` (Modified) 
- `apps/web/lib/bmad/template-engine.ts` (Modified)
- `apps/web/lib/workspace/WorkspaceContext.tsx` (Modified)
- `docs/index.md` (New file)

### New Files Added for Deployment
- `docs/github-pages-deployment-plan.md` (Deployment strategy)
- `docs/git-deployment-strategy.md` (This file)
- Enhanced `apps/web/app/page.tsx` (Landing page improvements)

### Commit Strategy

#### Commit 1: Landing Page Enhancement
**Purpose**: Update landing page with Mary/bMAD Method positioning

```bash
git add apps/web/app/page.tsx
git commit -m "Enhance landing page: Transform to Mary/bMAD Method positioning

- Replace generic 'Strategic Workspace' with Mary AI Business Analyst branding
- Update hero messaging: 'Transform Strategic Analysis from Art into Science'
- Add bMAD Method value propositions (Curiosity-Driven Inquiry, Evidence-Based Analysis, Numbered Options Protocol)
- Improve demo interface to show structured competitive analysis example
- Add social proof section with testimonials and metrics
- Enhance CTAs with Mary-specific messaging and trial offers
- Add comprehensive footer with contact information and resources
- Maintain responsive design and accessibility standards

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Commit 2: Documentation and Deployment Planning
**Purpose**: Add deployment strategy and documentation

```bash
git add docs/github-pages-deployment-plan.md docs/git-deployment-strategy.md docs/index.md
git commit -m "Add GitHub Pages deployment strategy and documentation

- Create comprehensive GitHub Pages deployment plan with Next.js static export
- Document technical implementation steps and configuration requirements  
- Add post-deployment checklist and success metrics
- Include alternative deployment options and domain configuration
- Create git deployment strategy for structured release management

🤖 Generated with Claude Code  
Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Commit 3: Pre-deployment Cleanup (if needed)
**Purpose**: Address any remaining modified files

```bash
# Review and commit any other pending changes
git add apps/web/app/components/dual-pane/StateBridge.tsx
git add apps/web/app/layout.tsx
git add apps/web/lib/bmad/template-engine.ts
git add apps/web/lib/workspace/WorkspaceContext.tsx
git commit -m "Prepare existing changes for landing page deployment

- Update dual-pane components and workspace context
- Ensure compatibility with static export deployment
- Clean up any development artifacts

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Push Strategy

#### Option 1: Direct Push (Recommended for mockup)
```bash
# Push all commits to main branch
git push origin main

# This will:
# - Update the repository with enhanced landing page
# - Make deployment documentation available
# - Trigger any existing CI/CD pipelines
```

#### Option 2: Feature Branch (More Conservative)
```bash
# Create feature branch for landing page updates
git checkout -b feature/landing-page-mockup

# Push feature branch
git push origin feature/landing-page-mockup

# Create pull request for review before merging
# Allows for feedback before deployment
```

### Deployment Execution Plan

#### Phase 1: Immediate Deployment (Mockup Mode)
1. **Commit and Push Changes**:
   ```bash
   # Execute commits 1 and 2 above
   git push origin main
   ```

2. **Quick Verification**:
   ```bash
   # Test current build locally
   cd apps/web
   npm run build
   ```

3. **Share with Kevin**:
   - Repository URL: `https://github.com/username/ideally.co`
   - Live preview via development server
   - Documentation in `docs/` folder

#### Phase 2: GitHub Pages Setup (Next Steps)
1. **Configure Static Export** (as per deployment plan)
2. **Set up GitHub Actions** workflow
3. **Enable GitHub Pages** in repository settings
4. **Test deployment** and verify all features work

### Risk Assessment and Mitigation

#### Potential Issues
1. **Build Failures**: Next.js app may have dependencies that break static export
   - **Mitigation**: Test build locally first, document any issues
   
2. **Authentication Dependencies**: Current app uses Supabase
   - **Mitigation**: Landing page works for non-authenticated users
   
3. **API Route Dependencies**: Static export doesn't support API routes  
   - **Mitigation**: Landing page doesn't require API routes

#### Rollback Strategy
```bash
# If issues arise, revert landing page changes
git revert <commit-hash>
git push origin main

# Or reset to previous working state
git reset --hard HEAD~3  # Revert last 3 commits
git push origin main --force-with-lease
```

### Success Criteria

#### Technical Success
- [ ] All commits pushed successfully
- [ ] Repository accessible and up-to-date
- [ ] Local build completes without errors
- [ ] Landing page displays correctly in development

#### Business Success  
- [ ] Enhanced value proposition clearly communicated
- [ ] Mary/bMAD Method positioning prominent
- [ ] Professional appearance for stakeholder feedback
- [ ] Multiple feedback collection mechanisms available
- [ ] Clear next steps for interested visitors

### Post-Push Checklist
- [ ] Verify all commits are in remote repository
- [ ] Confirm landing page renders correctly
- [ ] Test responsive design on multiple devices  
- [ ] Check all internal links work
- [ ] Validate contact information is accurate
- [ ] Share repository URL with Kevin for feedback

### Communication Plan

#### For Kevin
**Subject**: Landing Page Mockup Ready for Feedback

"I've enhanced the landing page with Mary/bMAD Method positioning and created a comprehensive GitHub Pages deployment strategy. Key improvements include:

- Transformed messaging from generic to Mary AI Business Analyst focus
- Added bMAD Method credibility with structured methodology showcase
- Enhanced social proof and clear value propositions
- Professional design with feedback collection mechanisms

**Repository**: [GitHub URL]
**Local Preview**: `npm run dev` in apps/web folder
**Deployment Plan**: docs/github-pages-deployment-plan.md

Ready for your feedback and GitHub Pages deployment when approved."

---

**Execution Priority**: 
1. Commit 1 (Landing page enhancement) - HIGH
2. Commit 2 (Documentation) - MEDIUM  
3. Push to main - HIGH
4. Share with Kevin - HIGH
5. GitHub Pages setup - PENDING FEEDBACK