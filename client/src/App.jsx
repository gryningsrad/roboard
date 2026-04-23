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

      <Toast
        kind={toast.kind}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, message: "" }))}
      />
    </Shell>
  );
}
