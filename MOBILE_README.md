# ROBoard Mobile Framework

A mobile/scanner-first frontend for ROBoard, designed for handheld Android devices with barcode 1D/2D scanner support.

## Overview

The mobile framework provides a streamlined interface optimized for:
- **Landscape-first design** on 1440x720 Android devices
- **Large touch targets** suitable for use with gloves
- **Keyboard-wedge scanner input** (scanner injects text + Enter key)
- **High contrast** dark theme matching the desktop ROBoard branding
- **Minimal clutter** with action-focused workflows

## Architecture

The mobile frontend follows the existing ROBoard patterns:
- Reuses the existing **API services** (`/api/parts`, `/api/rob/...`, `/api/wishlist/...`)
- **No backend changes** required
- Separate route structure at `/roboard/mobile/*`
- Independent layout (`MobileLayout`) without the desktop Shell
- Uses the same **Tailwind CSS** with custom brand color variables

## Routes

```
/roboard/mobile/scan              Main scan/search entry point (default)
/roboard/mobile/assets/:id        Asset detail page
/roboard/mobile/results           Search results list
/roboard/mobile/rob               Update ROB (quick action)
/roboard/mobile/locations         Manage locations (quick action)
/roboard/mobile/wishlist          Wishlist view
```

## Components

### MobileLayout
**File:** `src/components/MobileLayout.jsx`

A full-screen handheld-friendly layout with:
- Minimal header with optional "Back" button
- Full-height main content area
- Responsive design for landscape and portrait

Usage:
```jsx
<MobileLayout title="Title" showBack onBack={handleBack}>
  {/* Content */}
</MobileLayout>
```

### useScannerInput Hook
**File:** `src/hooks/useScannerInput.js`

Handles keyboard-wedge scanner input pattern:
- Input field auto-focus and refocus
- Enter key submission
- Trimming and empty value validation
- Input clearing after submission

Usage:
```jsx
const { inputRef, handleScanSubmit, focusInput } = useScannerInput(
  async (value) => {
    console.log("Scanned:", value);
  }
);

<input 
  ref={inputRef} 
  onKeyDown={handleScanSubmit}
  autocomplete="off"
  inputMode="none"
/>
```

## Pages

### MobileScan
**File:** `src/pages/MobileScan.jsx`

The main entry point for mobile workflows. Features:
- Large scan input field (64px height)
- Search query handling (reuses `/api/parts?q=...`)
- Quick action buttons (Find Part, Update ROB, Change Location, Wishlist)
- Single-result direct navigation to asset detail
- Multiple-result navigation to results list
- Auto-focus on mount

### MobileAssetDetail
**File:** `src/pages/MobileAssetDetail.jsx`

Displays asset information and actions:
- **Display fields:** name, part number, maker reference, barcode, ROB, unit, location
- **Action buttons:**
  - Update ROB (with inline input form)
  - Change Location (placeholder, feature coming)
  - Add/Remove from Wishlist (toggleable)
  - Back to Scan
- Fetches data from `/api/parts?q=...`

### MobileResultList
**File:** `src/pages/MobileResultList.jsx`

Shows search results as large clickable cards:
- Displays: name, part number, maker reference, location, ROB
- Each card is clickable and navigates to asset detail
- Back to Scan button

### Quick Action Pages

**MobileRob** (`src/pages/MobileRob.jsx`)
Placeholder directing users to search first, then update via asset detail.

**MobileLocations** (`src/pages/MobileWishlist.jsx`)
Placeholder for location management feature.

**MobileWishlistPage** (`src/pages/MobileWishlistPage.jsx`)
Shows wishlist items with remove functionality.

## Styling

Uses **Tailwind CSS** with existing brand color variables:

```css
--rb-bg: #050f22         /* Deep background */
--rb-base: #071a33       /* Navy */
--rb-surface: #0b2346    /* Card surface */
--rb-border: rgba(...)   /* Borders */
--rb-text: #ffffff       /* Main text */
--rb-muted: rgba(...)    /* Muted text */
--rb-dim: rgba(...)      /* Dimmed text */
--rb-accent: #ff4b00     /* Orange accent (ROB color) */
--rb-accent-hover: #ff6a2a
```

Mobile-specific styling priorities:
- **Minimum button height:** 56-64px (touch-friendly)
- **Input height:** 64-72px (easy scanning)
- **Large typography:** 18-32px for readability
- **High contrast:** Dark background with bright text
- **Glove-friendly:** Avoid hover-only interactions
- **Responsive:** Works landscape and portrait (landscape preferred)

## API Integration

The mobile framework reuses existing ROBoard API endpoints:

| Endpoint | Usage |
|----------|-------|
| `GET /api/parts?q=...&field=all&limit=50` | Search assets |
| `POST /api/rob/:id` | Update ROB value |
| `POST /api/wishlist/toggle/:id` | Add/remove from wishlist |
| `GET /api/wishlist` | Fetch wishlist items |

All API calls use the existing `apiGet()` and `apiPost()` functions from `src/api.js`.

### TODOs / Known Limitations

- [ ] **Change Location feature:** Currently placeholder; needs backend integration
- [ ] **Location search endpoint:** If not available, consider creating `/api/parts/:id` for single-item fetch
- [ ] **Wishlist endpoint validation:** Verify `/api/wishlist` returns expected format
- [ ] **Barcode format detection:** Could add barcode type detection (1D, 2D, QR) in future
- [ ] **Offline support:** Consider service worker for offline access
- [ ] **Scan speed optimization:** Could add scanner speed detection if needed
- [ ] **Mobile keyboard handling:** Currently `inputMode="none"` to minimize keyboard, may need refinement per device

## PWA Configuration

The mobile app includes PWA manifest configuration for install-ability:

**File:** `public/manifest.json`

- **name:** ROBoard
- **short_name:** ROBoard
- **start_url:** `/roboard/mobile/scan`
- **display:** `standalone` (full-screen mode)
- **orientation:** `landscape`
- **theme_color:** `#050f22`
- **Shortcuts:** Scan, Wishlist

Updates to `index.html`:
- Added `<link rel="manifest" href="/manifest.json" />`
- Added theme-color meta tag
- Apple mobile web app meta tags for iOS

On supported devices (Android Chrome, Edge), users can:
- Install app: "Add to Home Screen"
- Launch in standalone mode without browser chrome
- See the app in landscape orientation

## Testing on Android

### Preparation
1. Ensure the development server is running: `npm run dev`
2. Access the app on Android: `http://[YOUR_IP]:5173/roboard/mobile/scan`

### Scanner Testing
1. **Physical scanner:** Connect via USB or Bluetooth as HID keyboard
   - Scan a known barcode from your test data
   - App should search and find/display the asset
   
2. **Keyboard simulation (no physical scanner):**
   - Open `/roboard/mobile/scan`
   - Input should auto-focus
   - Type a part number/EAN and press Enter
   - Result should appear or navigate accordingly

### Test Scenarios

1. **Exact Match:**
   - Scan/enter a valid part number
   - Should navigate directly to asset detail page
   
2. **Multiple Matches:**
   - Scan/enter a partial search term or common prefix
   - Should show result list
   - Tap any result to open asset detail
   
3. **No Match:**
   - Scan/enter an invalid/unknown code
   - Should show "No results found" message
   - Can navigate back to scan
   
4. **Update ROB:**
   - From asset detail, tap "Update ROB"
   - Enter a number and confirm
   - ROB value should update in real-time
   
5. **Wishlist Toggle:**
   - From asset detail, tap "⭐ Wishlist" button
   - Button should toggle to show "❌ Wishlist"
   - Can open `/roboard/mobile/wishlist` to see the item
   
6. **Orientation:**
   - Test in landscape (primary) and portrait
   - Layout should adapt without breaking
   - Touch targets should remain accessible

## Code Organization

```
client/src/
├── components/
│   ├── MobileLayout.jsx          # Mobile layout shell
│   ├── Shell.jsx                 # Desktop layout (unchanged)
│   ├── Toast.jsx                 # Toast notifications (reused)
│   └── PartCard.jsx              # Part card (desktop only)
├── hooks/
│   └── useScannerInput.js        # Scanner input handling hook
├── pages/
│   ├── MobileScan.jsx            # Scan/search entry page
│   ├── MobileAssetDetail.jsx     # Asset detail page
│   ├── MobileResultList.jsx      # Search results page
│   ├── MobileRob.jsx             # Quick action: Update ROB
│   ├── MobileWishlist.jsx        # Quick action: Change Location (placeholder)
│   ├── MobileWishlistPage.jsx    # Wishlist view
│   ├── Parts.jsx                 # Desktop parts page (unchanged)
│   ├── Wishlist.jsx              # Desktop wishlist (unchanged)
│   ├── Rob.jsx                   # Desktop ROB page (unchanged)
│   ├── LocationsPage.jsx         # Desktop locations (unchanged)
│   └── Import.jsx                # Import page (unchanged)
├── api.js                         # API utilities (unchanged)
├── App.jsx                        # Routes updated with mobile routes
└── main.jsx                       # Entry point (unchanged)
```

## Future Enhancements

1. **Advanced Search:** Barcode type detection, fuzzy search
2. **Offline Mode:** Service worker for offline scanning queue
3. **Scan History:** Show recent scans for quick re-access
4. **Bulk Operations:** Scan multiple items in a workflow
5. **Location Management:** UI for assigning/changing part locations
6. **Voice Feedback:** Audio cues for successful/failed scans
7. **Camera Barcode Scanning:** Native device camera integration (future)
8. **Real-time Sync:** WebSocket updates for inventory changes

## Troubleshooting

### Scanner not detected
- Ensure scanner is paired as HID keyboard device
- Test keyboard input by typing in the scan field
- Check device logs for connection issues

### Search returns no results
- Verify the search term matches part numbers or names in the database
- Check `/api/parts?q=...` endpoint directly in browser
- Ensure backend server is running and accessible

### UI elements appear small or unreadable
- Verify viewport meta tag in `index.html`
- Check device zoom level
- Test on actual Android device (emulator may have different DPI)

### App not installable as PWA
- Verify `manifest.json` is accessible at `/manifest.json`
- Check browser console for manifest loading errors
- Ensure HTTPS or localhost (PWA requires secure context)

## Development Notes

- The mobile routes are completely separate from desktop routes to avoid conflicts
- All existing desktop functionality is preserved
- Toast notifications are shared between mobile and desktop
- API service abstraction makes switching endpoints easy
- Tailwind's responsive utilities handle layout adapting

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Initial Release (Beta)
