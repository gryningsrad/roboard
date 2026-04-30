import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Shell from "./components/Shell.jsx";
import Toast from "./components/Toast.jsx";
import { apiGet } from "./api.js";

import Parts from "./pages/Parts.jsx";
import Wishlist from "./pages/Wishlist.jsx";
{/*import Orders from "./pages/Orders.jsx"; */}
import ImportPage from "./pages/Import.jsx";
import Locations from "./pages/LocationsPage.jsx";
import Rob from "./pages/Rob.jsx";

// Mobile Routes
import MobileScan from "./pages/MobileScan.jsx";
import MobileAssetDetail from "./pages/MobileAssetDetail.jsx";
import MobileResultList from "./pages/MobileResultList.jsx";
import MobileRob from "./pages/MobileRob.jsx";
import MobileLocation from "./pages/MobileLocation.jsx";
import MobileWishlistPage from "./pages/MobileWishlistPage.jsx";

export default function App() {
  const [toast, setToast] = useState({ kind: "info", message: "" });
  const [navCounts, setNavCounts] = useState({
    rob: null,
    wishlist: null,
    locations: null,
  });

  function pushToast(kind, message) {
    setToast({ kind, message });
  }

  async function refreshNavCounts() {
    try {
      const data = await apiGet("/api/nav-counts");
      setNavCounts({
        rob: Number.isFinite(data?.rob) ? data.rob : 0,
        wishlist: Number.isFinite(data?.wishlist) ? data.wishlist : 0,
        locations: Number.isFinite(data?.locations) ? data.locations : 0,
      });
    } catch (e) {
      console.error("Failed to refresh nav counts", e);
    }
  }

  useEffect(() => {
    refreshNavCounts();
  }, []);

  return (
    <>
      <Routes>
        {/* Mobile Routes - separate from desktop app */}
        <Route path="/m" element={<MobileScan pushToast={pushToast} />} />
        <Route path="/m/assets/:id" element={<MobileAssetDetail pushToast={pushToast} />} />
        <Route path="/m/results" element={<MobileResultList />} />
        <Route path="/m/rob" element={<MobileRob pushToast={pushToast} />} />
        <Route path="/m/location" element={<MobileLocation pushToast={pushToast} />} />
        <Route path="/m/wishlist" element={<MobileWishlistPage pushToast={pushToast} />} />

        {/* Desktop Routes - wrapped in Shell */}
        <Route
          path="*"
          element={
            <Shell navCounts={navCounts}>
              <Routes>
                <Route
                  path="/"
                  element={<Parts pushToast={pushToast} refreshNavCounts={refreshNavCounts} />}
                />
                <Route
                  path="/wishlist"
                  element={<Wishlist pushToast={pushToast} refreshNavCounts={refreshNavCounts} />}
                />
                {/*<Route path="/orders" element={<Orders />} /> */}
                {<Route path="/locations" element={<Locations pushToast={pushToast} refreshNavCounts={refreshNavCounts} />} /> }
                <Route
                  path="/rob"
                  element={<Rob pushToast={pushToast} refreshNavCounts={refreshNavCounts} />}
                />
                <Route
                  path="/import"
                  element={<ImportPage pushToast={pushToast} refreshNavCounts={refreshNavCounts} />}
                />
              </Routes>
            </Shell>
          }
        />
      </Routes>

      <Toast
        kind={toast.kind}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, message: "" }))}
      />
    </>
  );
}
