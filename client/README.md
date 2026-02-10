# spares-kiosk React + Tailwind MVP

## Install
```bash
npm install
```

## Dev
```bash
npm run dev
```
Vite proxies `/api` to `http://localhost:8000`.

## Build (for Raspberry Pi)
```bash
npm run build
```
Copy the resulting `dist/` folder into your server repo under `client/dist` (so `server/app.py` can serve it).

## Pages
- Parts (search + wishlist toggle)
- Wishlist
- Orders (headers only)
- Import (uploads .xlsx to `/api/import`)
