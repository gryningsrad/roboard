import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Shell from "./components/Shell.jsx";
import Toast from "./components/Toast.jsx";

import Parts from "./pages/Parts.jsx";
import Wishlist from "./pages/Wishlist.jsx";
{/*import Orders from "./pages/Orders.jsx"; */}
import ImportPage from "./pages/Import.jsx";
import Rob from "./pages/Rob.jsx";

export default function App() {
  const [toast, setToast] = useState({ kind: "info", message: "" });

  function pushToast(kind, message) {
    setToast({ kind, message });
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Parts pushToast={pushToast} />} />
        <Route path="/wishlist" element={<Wishlist />} />
        {/*<Route path="/orders" element={<Orders />} /> */}
        <Route path="/rob" element={<Rob pushToast={pushToast} />} />
        <Route path="/import" element={<ImportPage pushToast={pushToast} />} />
      </Routes>

      <Toast
        kind={toast.kind}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, message: "" }))}
      />
    </Shell>
  );
}
