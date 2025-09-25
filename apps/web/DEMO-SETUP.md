# 🎬 Demo Environment Setup Guide

## **Overview**
This guide sets up a compelling demo environment with pre-loaded scenarios for video creation and customer demonstrations.

## **🎯 Demo Environment Features**
- **3 Pre-loaded Strategic Scenarios** with realistic business conversations
- **Professional Demo User Account** with sample data
- **Video-Optimized Workspace** layouts for screen recording
- **Conversion-Ready Content** that showcases Mary's capabilities

---

## **🚀 Quick Setup Instructions**

### **Step 1: Run Demo Seeding Script**
```bash
cd apps/web
node scripts/seed-demo-data.js
```

### **Step 2: Demo Login Credentials**
- **Email:** `demo@thinkhaven.co`
- **Password:** `DemoUser2024!`

### **Step 3: Access Demo Environment**
- Navigate to your deployed app
- Login with demo credentials
- See 3 pre-loaded workspaces ready for video recording

---

## **📊 Demo Scenarios Overview**

### **🎯 Scenario 1: "SaaS Product Launch Strategy"**
**Best for:** B2B SaaS founders, product managers  
**Duration:** 3-4 minute video  
**Workspace:** "AnalyticsPro - Market Entry Strategy"

**Key Demo Points:**
- Mary's systematic strategic approach
- Competitive analysis framework
- Market positioning methodology
- Pain point discovery process

### **🎯 Scenario 2: "Competitive Intelligence Deep Dive"**  
**Best for:** Strategy consultants, business analysts
**Duration:** 4-5 minute video
**Workspace:** "Fintech Startup - Competitive Analysis"

**Key Demo Points:**
- Structured competitive intelligence
- Market strategy deconstruction
- Strategic opportunity identification  
- Evidence-based analysis approach

### **🎯 Scenario 3: "Strategic Brainstorming Session"**
**Best for:** Business owners, entrepreneurs  
**Duration:** 5-6 minute video
**Workspace:** "New Business Model Exploration"

**Key Demo Points:**
- Systematic brainstorming methodology
- Business model innovation framework
- Product-ization opportunity discovery
- Revenue projection and validation

---

## **🎥 Video Recording Setup**

### **Optimal Screen Recording Settings**
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Browser:** Chrome (clean profile, no extensions)
- **Window Size:** Maximized for clean recording

### **Demo Recording Tips**
1. **Clear browser cache** before recording
2. **Use incognito mode** for clean interface
3. **Prepare talking points** but keep natural conversation flow
4. **Record in segments** - easier to edit and repurpose
5. **Test audio levels** before full recording

### **Recommended Recording Flow**
1. **Start with landing page** - show value proposition
2. **Login to demo account** - quick, seamless transition  
3. **Navigate to pre-loaded workspace** - demonstrate user flow
4. **Walk through conversation** - highlight Mary's strategic approach
5. **End with call-to-action** - seamless transition to signup

---

## **💡 Demo Script Templates**

### **Opening Hook (15 seconds)**
*"What if you had an AI business analyst who could guide you through strategic decisions with the same rigor as a top consulting firm? Meet Mary..."*

### **Value Demonstration (2-3 minutes)**
*"Watch how Mary doesn't just give generic advice - she uses structured frameworks to uncover insights you wouldn't find on your own..."*

### **Closing CTA (15 seconds)**  
*"Ready to transform your strategic thinking? Get started with Mary today..."*

---

## **📈 Demo Environment Customization**

### **Adding New Scenarios**
1. Edit `scripts/seed-demo-data.js`
2. Add new scenario object to `demoScenarios` array
3. Re-run seeding script
4. Test new scenario flows

### **Customizing Conversations**
- **Realistic business context** - use actual industry data
- **Strategic depth** - showcase Mary's analytical capabilities  
- **Natural flow** - conversations should feel organic
- **Clear value props** - each exchange should demonstrate ROI

### **Updating Demo Content**
```bash
# Re-seed demo data
cd apps/web
node scripts/seed-demo-data.js

# Deploy updated demo environment  
vercel --prod
```

---

## **🎬 Video Production Workflow**

### **Pre-Production**
- [ ] Review all demo scenarios
- [ ] Prepare talking points for each scenario
- [ ] Set up recording environment
- [ ] Test demo login and navigation

### **Production** 
- [ ] Record individual scenario videos (3-6 minutes each)
- [ ] Record overview/teaser video (60-90 seconds)
- [ ] Record quick feature highlights (30 seconds each)
- [ ] Capture high-quality screenshots for thumbnails

### **Post-Production**
- [ ] Edit videos for optimal pacing
- [ ] Add captions for accessibility
- [ ] Create multiple formats (LinkedIn, Twitter, YouTube)
- [ ] Design compelling thumbnails
- [ ] Export with optimized compression settings

---

## **📊 Content Distribution Strategy**

### **Primary Video Placements**
1. **Landing page hero section** - Replace static demo with video
2. **"Watch Method Demo" button** - Link to scenario-specific videos
3. **Email sequences** - Drip campaign with targeted scenarios
4. **Social media** - LinkedIn posts with scenario highlights

### **Video Variations**
- **Full demos:** 3-6 minutes for detailed exploration
- **Quick highlights:** 60 seconds for social media
- **Micro-snippets:** 15-30 seconds for maximum engagement
- **Feature spotlights:** Focus on specific capabilities

### **Call-to-Action Integration**
- **Seamless signup flow** from video to demo account
- **Scenario-specific landing pages** for different audience segments
- **Progressive engagement** - start with video, move to interactive demo
- **Clear value proposition** maintained throughout funnel

---

## **🚀 Deployment Instructions**

### **Demo Environment URL**
You can deploy the demo to a separate URL for dedicated demo use:

```bash
# Option 1: Deploy to demo subdomain
vercel --prod --alias demo-ideally.vercel.app

# Option 2: Use existing deployment with demo login
# Current: https://ideally-66ayuwa03-hollandkevints-projects.vercel.app
# Login with demo@thinkhaven.co / DemoUser2024!
```

### **Demo Account Management**
- Demo account persists across deployments
- Workspaces can be refreshed by re-running seeding script
- Consider setting up automated demo refresh (weekly/monthly)

---

## **✅ Demo Readiness Checklist**

### **Technical Setup**
- [ ] Demo seeding script runs successfully
- [ ] Demo login credentials work
- [ ] All 3 scenarios load properly
- [ ] Mary AI integration responds correctly
- [ ] Mobile responsiveness tested

### **Content Quality** 
- [ ] Conversations feel natural and realistic
- [ ] Strategic value is clearly demonstrated  
- [ ] Business contexts are relevant to target audiences
- [ ] Call-to-actions are compelling and clear

### **Video Production Ready**
- [ ] Screen recording setup optimized
- [ ] Demo scripts prepared
- [ ] Recording environment configured
- [ ] Distribution strategy planned

---

## **🎯 Success Metrics to Track**

### **Engagement Metrics**
- Video completion rates by scenario
- Click-through rates to demo signup  
- Time spent in demo environment
- Scenario preference by audience segment

### **Conversion Metrics**
- Demo-to-signup conversion rate
- Video-to-demo conversion rate
- Scenario-specific conversion performance
- Lead quality from demo traffic

### **Content Performance**
- Social media engagement by video type
- Email open/click rates for video content
- Landing page performance with video integration
- SEO performance for video-optimized pages

---

**🎉 Your demo environment is now ready for compelling video content creation that showcases Mary's strategic capabilities!**