# ROBoard Mobile - File Structure & Navigation Guide

## 📂 Complete File Structure

```
AMOSStockSearch/
│
├── MOBILE_COMPLETE.md                  ← START HERE: Project complete summary
├── MOBILE_DOCUMENTATION_INDEX.md       ← Navigation guide for all docs
├── MOBILE_README.md                    ← Comprehensive technical reference
├── MOBILE_QUICK_START.md               ← How to run the app
├── MOBILE_TESTING_GUIDE.md             ← 18 test cases for QA
├── MOBILE_IMPLEMENTATION_SUMMARY.md    ← Project status & deliverables
│
├── client/
│   ├── public/
│   │   └── manifest.json               ← PWA manifest (NEW)
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── MobileLayout.jsx        ← Mobile layout shell (NEW)
│   │   │   ├── Shell.jsx               (Desktop, unchanged)
│   │   │   ├── Toast.jsx               (Shared, unchanged)
│   │   │   └── PartCard.jsx            (Desktop, unchanged)
│   │   │
│   │   ├── hooks/
│   │   │   └── useScannerInput.js      ← Scanner input hook (NEW)
│   │   │
│   │   ├── pages/
│   │   │   ├── MobileScan.jsx          ← Scan entry page (NEW)
│   │   │   ├── MobileAssetDetail.jsx   ← Asset detail page (NEW)
│   │   │   ├── MobileResultList.jsx    ← Search results page (NEW)
│   │   │   ├── MobileRob.jsx           ← ROB action page (NEW)
│   │   │   ├── MobileWishlist.jsx      ← Location action page (NEW)
│   │   │   ├── MobileWishlistPage.jsx  ← Wishlist view (NEW)
│   │   │   │
│   │   │   ├── Parts.jsx               (Desktop, unchanged)
│   │   │   ├── Wishlist.jsx            (Desktop, unchanged)
│   │   │   ├── Rob.jsx                 (Desktop, unchanged)
│   │   │   ├── LocationsPage.jsx       (Desktop, unchanged)
│   │   │   ├── Import.jsx              (Desktop, unchanged)
│   │   │   └── Orders.jsx              (Desktop, unchanged)
│   │   │
│   │   ├── api.js                      (API utilities, unchanged)
│   │   ├── App.jsx                     (Routes updated - MODIFIED)
│   │   ├── App.css                     (Unchanged)
│   │   ├── main.jsx                    (Unchanged)
│   │   ├── index.css                   (Unchanged)
│   │   └── assets/                     (Unchanged)
│   │
│   ├── index.html                      (PWA meta tags added - MODIFIED)
│   ├── package.json                    (No changes)
│   ├── vite.config.js                  (No changes)
│   ├── tailwind.config.js              (No changes)
│   └── postcss.config.js               (No changes)
│
├── server/                             (NO CHANGES - uses existing API)
├── docs/                               (Unchanged)
├── scripts/                            (Unchanged)
├── testdata/                           (Unchanged)
├── README.md                           (Original project README)
└── CHANGELOG.md                        (Original changelog)
```

## 🗺️ Route Map

```
APPLICATION ROUTES
│
├── DESKTOP ROUTES (wrapped in Shell with navigation)
│   ├── /                    → Parts page
│   ├── /wishlist            → Wishlist page
│   ├── /rob                 → ROB page
│   ├── /locations           → Locations page
│   └── /import              → Import page
│
└── MOBILE ROUTES (full-screen, no Shell)
    ├── /roboard/mobile/scan              ← ENTRY POINT
    │   └── Features:
    │       - Large scan input
    │       - Auto-focus on mount
    │       - Quick action buttons
    │       - Search handling
    │
    ├── /roboard/mobile/assets/:id
    │   └── Features:
    │       - Asset details (name, number, location, ROB)
    │       - Update ROB inline form
    │       - Toggle wishlist
    │       - Back to scan
    │
    ├── /roboard/mobile/results
    │   └── Features:
    │       - Clickable result cards
    │       - Search result count
    │       - Navigate to asset detail
    │
    ├── /roboard/mobile/rob
    │   └── Features:
    │       - ROB info/instruction page
    │       - Directs to asset detail workflow
    │
    ├── /roboard/mobile/locations
    │   └── Features:
    │       - Location info/instruction page
    │       - Placeholder for feature development
    │
    └── /roboard/mobile/wishlist
        └── Features:
            - Wishlist items list
            - Remove from wishlist
            - Item details
```

## 📊 Component Hierarchy

```
App.jsx
├── Desktop Routes (wrapped in Shell)
│   └── Shell
│       ├── Header
│       │   └── Navigation
│       └── Pages
│           ├── Parts
│           │   └── PartCard (repeated)
│           ├── Wishlist
│           ├── Rob
│           ├── Locations
│           └── Import
│
└── Mobile Routes (no Shell)
    ├── MobileScan
    │   └── MobileLayout
    │       ├── Large input field (useScannerInput hook)
    │       ├── Quick action buttons
    │       └── Info panel
    │
    ├── MobileAssetDetail
    │   └── MobileLayout
    │       ├── Asset info panel
    │       ├── ROB update form (conditional)
    │       └── Action buttons
    │
    ├── MobileResultList
    │   └── MobileLayout
    │       └── Result cards (clickable)
    │
    ├── MobileRob
    │   └── MobileLayout
    │       └── Info content
    │
    ├── MobileLocations
    │   └── MobileLayout
    │       └── Info content
    │
    └── MobileWishlistPage
        └── MobileLayout
            └── Wishlist items list

Toast (shared globally)
```

## 🎨 Styling Reference

### Brand Colors (CSS Variables)
```css
:root {
  --rb-bg: #050f22;              /* Deep background */
  --rb-base: #071a33;            /* Navy - subtle background */
  --rb-surface: #0b2346;         /* Card/surface color */
  --rb-border: rgba(255, 255, 255, 0.10);
  
  --rb-text: #ffffff;            /* Primary text */
  --rb-muted: rgba(255, 255, 255, 0.70);
  --rb-dim: rgba(255, 255, 255, 0.55);
  
  --rb-accent: #ff4b00;          /* Orange - ROB highlight */
  --rb-accent-hover: #ff6a2a;
}
```

### Size Guidelines
- **Input height:** 64px
- **Button height:** 56-64px
- **Card height:** 100px+
- **Touch target minimum:** 56px
- **Typography scale:** 18px (body) → 32px (headings)
- **Border radius:** 8-16px

## 🔄 Data Flow

```
USER INPUT
    ↓
[MobileScan] - Large input field with auto-focus
    ↓
useScannerInput hook - Handles Enter key, clears, refocuses
    ↓
Search API Call - GET /api/parts?q=...
    ↓
Result Processing:
    ├─ 0 results    → Toast "No results found"
    ├─ 1 result     → Redirect to /roboard/mobile/assets/:id
    └─ 2+ results   → Redirect to /roboard/mobile/results
    ↓
[MobileAssetDetail] OR [MobileResultList]
    ↓
User Actions:
    ├─ Update ROB        → POST /api/rob/:id
    ├─ Toggle Wishlist   → POST /api/wishlist/toggle/:id
    ├─ View Wishlist     → GET /api/wishlist + redirect
    └─ Back to Scan      → Return to /roboard/mobile/scan
```

## 📱 Screen Layout Examples

### MobileScan (Main Page)
```
┌─────────────────────────────┐
│  ← ROBoard Mobile           │  Header (40px)
├─────────────────────────────┤
│                             │
│     Scan Barcode            │
│     Scan barcode or         │
│     search spare part       │
│                             │
│  [Large Input Field]        │  64px height
│  autocomplete off           │
│  autofocus                  │
│                             │
│  [🔍 Find Part]  [📊 ROB]  │  56px height
│  [📍 Location]   [⭐ WL]   │  Grid layout
│                             │
│  ℹ️ Tip: ...                │  Info panel
│                             │
└─────────────────────────────┘
```

### MobileAssetDetail (Asset Page)
```
┌─────────────────────────────┐
│  ← Back                     │  Header (40px)
├─────────────────────────────┤
│                             │
│  [Asset Name - LARGE]       │  32px font
│                             │
│  Part Number: ABC-123       │
│  Maker Ref: XYZ             │
│  Barcode: 1234567890        │
│                             │
│  ROB: 42  [ORANGE, LARGE]   │  28px font
│  Unit: pcs                  │
│  Location: Shelf A-12       │
│                             │
│  [📊 ROB] [📍 Loc]          │  56px buttons
│  [⭐ WL]  [← Back]          │  Grid layout
│                             │
└─────────────────────────────┘
```

### MobileResultList (Results Page)
```
┌─────────────────────────────┐
│  ← Results (5 found)        │  Header
├─────────────────────────────┤
│  Results for "part"         │
│                             │
│  ┌─────────────────────────┐│  Clickable
│  │ Asset Name              ││  card
│  │ Number: ABC-123         ││  100px+
│  │ Location │ ROB: 42      ││  height
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Another Asset           ││
│  │ Number: DEF-456         ││
│  │ Location │ ROB: 15      ││
│  └─────────────────────────┘│
│                             │
│  [← Back to Scan]           │  56px button
│                             │
└─────────────────────────────┘
```

## 🔐 Data Security

- ✅ No sensitive data stored locally
- ✅ All API calls go through existing backend
- ✅ Standard HTTP/HTTPS protocols
- ✅ Same authentication as desktop app
- ✅ No hardcoded credentials or URLs

## 🌐 API Contract

```javascript
// Search
GET /api/parts?q=QUERY&field=all&limit=50
→ [{number, name, makers_ref, ean, rob, location, ...}]

// Update ROB
POST /api/rob/:id {rob: number}
→ {rob: number, updated_at: timestamp}

// Wishlist Toggle
POST /api/wishlist/toggle/:id
→ {wishlisted: boolean}

// Wishlist Items
GET /api/wishlist
→ [{number, name, wishlisted: 1}]

// Navigation Counts (desktop only)
GET /api/nav-counts
→ {rob: number, wishlist: number, locations: number}
```

## 📦 Export Structure

```
Production Build Output (npm run build):
dist/
├── index.html               (with PWA meta tags)
├── manifest.json
├── roboard-favicon.svg      (existing)
├── roboard-favicon-32.png   (existing)
├── roboard-favicon-16.png   (existing)
├── roboard-favicon.ico      (existing)
└── assets/
    ├── index-HASH.js        (bundled app)
    └── index-HASH.css       (bundled styles)
```

## 🧪 Test Coverage

```
Test Scenarios (see MOBILE_TESTING_GUIDE.md):
├── Page Load              ✅
├── Scanner Input          ✅
├── Search (1 result)      ✅
├── Search (multiple)      ✅
├── Search (none)          ✅
├── Asset Detail           ✅
├── ROB Update             ✅
├── Wishlist Toggle        ✅
├── Back Navigation        ✅
├── Responsive Design      ✅
├── Touch Targets          ✅
├── Colors & Contrast      ✅
├── PWA Installation       ✅
├── Desktop Compatibility  ✅
├── Error Handling         ✅
├── Console Validation     ✅
├── Performance            ✅
└── Cross-platform Sync    ✅
```

## 🚀 Deployment Sequence

```
1. Development
   npm run dev
   
2. Testing
   Test on localhost:5173/roboard/mobile/scan
   Follow MOBILE_TESTING_GUIDE.md
   
3. Build
   npm run build
   
4. Deployment
   Upload dist/ to web server
   
5. Mobile Access
   http://server-url/roboard/mobile/scan
   
6. PWA Installation (Android)
   Chrome → Menu → Install app
   App launches in standalone mode
```

## 📞 Quick Reference

| Need | Location | How |
|------|----------|-----|
| Quick start | MOBILE_QUICK_START.md | Follow steps 1-3 |
| Technical details | MOBILE_README.md | Read sections |
| Test procedures | MOBILE_TESTING_GUIDE.md | Run test cases |
| Project status | MOBILE_IMPLEMENTATION_SUMMARY.md | Review checklist |
| Navigate docs | MOBILE_DOCUMENTATION_INDEX.md | Find what you need |
| See this file | MOBILE_FILE_STRUCTURE.md | You are here |

---

**File Structure Reference Version:** 1.0  
**Last Updated:** April 27, 2026  
**Status:** Complete
