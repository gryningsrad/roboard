# ROBoard Mobile - Quick Start Guide

## Starting the Application

### 1. Start the Server (Backend)
```bash
cd server
.\\.venv\\Scripts\\Activate.ps1
uvicorn app:app --reload --host 127.0.0.1 --port 8000 --env-file .devenv
```

Or use the configured task:
```bash
# In VS Code, run the "ROBoard: server (uvicorn)" task
```

### 2. Start the Client (Frontend)
```bash
cd client
npm run dev
```

Or use the configured task:
```bash
# In VS Code, run the "ROBoard: client (vite)" task
```

Or run both together:
```bash
# In VS Code, run the "ROBoard: dev (server + client)" task
```

### 3. Access the App

**Desktop:** http://localhost:5173/  
**Mobile (Scan):** http://localhost:5173/roboard/mobile/scan

If running on a device on the same network:
```
http://[YOUR_COMPUTER_IP]:5173/roboard/mobile/scan
```

## Testing the Mobile App

### First Load
1. Navigate to `/roboard/mobile/scan`
2. The scan input should auto-focus (blue border, ready for input)
3. You should see the main interface with four quick-action buttons

### Test a Search (Keyboard)
1. In the scan input field, type a part number you know exists (e.g., from the Parts page)
2. Press Enter
3. **If one result:** Should navigate directly to the asset detail page
4. **If multiple results:** Should show a result list page
5. **If no results:** Should show a "No results found" message

### Test Quick Actions
- **🔍 Find Part:** Same as above - searches for the typed value
- **📊 Update ROB:** Shows instruction page (feature ready from asset detail)
- **📍 Location:** Shows instruction page (feature placeholder)
- **⭐ Wishlist:** Shows wishlist view

### Test Asset Detail
From a search result:
1. Tap any result to open the asset detail page
2. You should see:
   - Asset name (large)
   - Part number, maker reference, barcode (if available)
   - ROB value (orange, large)
   - Current location
   - Last update date (if available)
3. Try the action buttons:
   - **📊 Update ROB:** Tap to reveal input, enter a number, save
   - **⭐ Wishlist:** Tap to toggle wishlist state (button changes color)
   - **← Back:** Returns to scan page

### Test Wishlist
1. From asset detail, tap the **⭐ Wishlist** button
2. Navigate to `/roboard/mobile/wishlist`
3. Added items should appear in the list
4. Tap "Remove from Wishlist" to delete items

### Test Back Navigation
- Every page (except scan) has a back button (←) in the header
- Tapping back returns to the previous page or scan screen
- Mobile header is always visible at top

## Scanner Device Setup

### Physical Barcode Scanner (USB or Bluetooth HID)
1. Connect scanner to device as HID keyboard
2. Navigate to scan page
3. Scan a barcode using the device
4. Scanner output appears in the input field followed by Enter key
5. App processes automatically

### Keyboard Simulation (Testing without scanner)
- Manually type into the scan field and press Enter
- App behaves identically to physical scanner input

## Troubleshooting

### Page doesn't load or shows blank
- Check browser console for errors (F12 → Console tab)
- Verify backend server is running: `http://localhost:8000/api/nav-counts`
- Clear browser cache or do a hard refresh (Ctrl+Shift+R)

### Search returns no results for valid part
- Check the exact part number in the desktop Parts page
- Try the same search in the desktop app to verify it works
- Check backend logs for errors

### Update ROB doesn't work
- Verify backend is accessible
- Check browser console for errors
- Ensure the part number is valid

### Buttons/text too small on Android
- Verify Android device viewport width
- Check that meta viewport tag is correct in index.html
- Test on actual device (emulator may have different DPI)

### Scan input doesn't auto-focus
- Click the input field manually
- Verify JavaScript is enabled in browser
- Check for console errors

### App not running in fullscreen on Android
- This requires installing as PWA first
- Chrome: Menu → "Install app" or "Add to Home Screen"
- Once installed, app will run standalone in fullscreen

## Accessing the App as PWA (Android)

### Installation Steps
1. Open Chrome on Android device
2. Navigate to `http://[IP]:5173/roboard/mobile/scan`
3. Tap menu (three dots) → "Install app" or "Add to Home Screen"
4. Follow prompts
5. App appears on home screen and can be launched standalone

### Benefits
- Fullscreen mode (no browser chrome)
- Landscape orientation lock as configured
- Standalone window
- Can work offline with service worker (if implemented)
- Appears as native app in recent apps list

## Development Notes

- **Port 5173** is the default Vite dev server port
- **Port 8000** is the default FastAPI backend port
- Both must be accessible for the mobile app to function
- The app uses the existing API endpoints; no backend code changes needed
- Mobile and desktop routes are completely separate; desktop app is unaffected

## File Locations

Key mobile files created:
- **Components:** `client/src/components/MobileLayout.jsx`
- **Hooks:** `client/src/hooks/useScannerInput.js`
- **Pages:** `client/src/pages/Mobile*.jsx`
- **Routes:** `client/src/App.jsx` (updated)
- **Manifest:** `client/public/manifest.json` (new)
- **Documentation:** `MOBILE_README.md` (comprehensive guide)

## Next Steps

1. ✅ Test on localhost first
2. ✅ Test with physical or simulated keyboard input
3. ✅ Test search functionality with known parts
4. ✅ Test on Android device on same network
5. ✅ Install and test as PWA
6. ✅ Test with actual barcode scanner if available

For detailed documentation, see **MOBILE_README.md** in the project root.

---

**Status:** Ready to Deploy  
**Tested:** Desktop keyboard input, navigation flows  
**Next Phase:** Android device testing, scanner hardware integration
