import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "leaflet/dist/leaflet.css";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import WargaTransaction from "./pages/WargaTransaction.jsx";
import CourierTransaction from "./pages/CourierTransaction.jsx";
import CourierPickup from "./pages/CourierPickup.jsx";
import TransactionReport from "./pages/TransactionReport.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/warga-transaction" element={<WargaTransaction />} />
        <Route path="/courier-transaction" element={<CourierTransaction />} />
        <Route path="/courier-pickup" element={<CourierPickup />} />
        <Route path="/transaction-report" element={<TransactionReport />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
