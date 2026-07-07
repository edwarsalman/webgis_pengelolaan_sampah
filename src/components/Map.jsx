/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-underscore-dangle */
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix icon default Leaflet yang sering corrupt di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Fungsi pembantu parsing lokasi dari database (Hex/WKB/POINT)
export const parseLocation = (loc) => {
  if (!loc) return null;
  if (typeof loc === "string" && /^[0-9A-F]+$/i.test(loc)) {
    const bytes = new Uint8Array(
      loc.match(/.{1,2}/g).map((b) => parseInt(b, 16)),
    );
    const view = new DataView(bytes.buffer);
    const offset = loc.startsWith("0101000020") ? 9 : 5;
    return {
      lng: view.getFloat64(offset, true),
      lat: view.getFloat64(offset + 8, true),
    };
  }
  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([^\s]+)\s+([^\s)]+)\s*\)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
  }
  if (typeof loc === "object") {
    return loc.coordinates
      ? { lat: loc.coordinates[1], lng: loc.coordinates[0] }
      : loc;
  }
  return null;
};

// --- KOMPONEN BARU: FITUR PENCARIAN (SEARCH BAR) ---
function MapSearchBar({ onLocationFound }) {
  const map = useMap();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Menggunakan Nominatim API OpenStreetMap (Gratis & Tanpa API Key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const targetLat = parseFloat(lat);
        const targetLng = parseFloat(lon);

        // Pindahkan kamera peta secara halus ke lokasi yang dicari
        map.flyTo([targetLat, targetLng], 14);

        // Jika komponen induk butuh koordinat ini (misal untuk plotting warga)
        if (onLocationFound) {
          onLocationFound({ lat: targetLat, lng: targetLng });
        }
      } else {
        alert("Lokasi tidak ditemukan, coba kata kunci lain.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Gagal mencari lokasi. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "50px", // Menggeser posisi agar tidak menutupi tombol Zoom (+/-) bawaan Leaflet
        zIndex: 1000,
        background: "white",
        padding: "6px 10px",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        display: "flex",
        gap: "6px",
      }}
    >
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "5px", margin: 0 }}
      >
        <input
          type="text"
          placeholder="Cari desa/jalan/kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "200px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {loading ? "..." : "Cari"}
        </button>
      </form>
    </div>
  );
}

// Komponen internal handle event klik manual pada peta
function MapEvents({ setLatLng, center }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 13);
  }, [center, map]);

  useMapEvents({
    click: (e) => setLatLng && setLatLng(e.latlng),
  });

  return null;
}

// Komponen Utama Map
export default function Map({ data = [], setLatLng, selectedMarker }) {
  const center = selectedMarker ||
    parseLocation(data[0]?.location) || { lat: -7.7956, lng: 110.3695 };

  return (
    <div style={{ position: "relative" }}>
      {" "}
      {/* Pembungkus agar posisi absolute Search Bar bekerja dengan benar */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "350px", borderRadius: "8px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Render Search Bar di atas Peta */}
        <MapSearchBar onLocationFound={setLatLng} />

        <MapEvents setLatLng={setLatLng} center={selectedMarker} />

        {data.map((item, i) => {
          const pos = parseLocation(item.location);
          return (
            pos && (
              <Marker key={i} position={[pos.lat, pos.lng]}>
                <Popup>
                  <b>{item.nama}</b>
                  <br />
                  {item.alamat}
                  <br />
                  Status: {item.transaksi_warga?.[0]?.status || "Belum Bayar"}
                </Popup>
              </Marker>
            )
          );
        })}

        {selectedMarker && (
          <Marker position={[selectedMarker.lat, selectedMarker.lng]} />
        )}
      </MapContainer>
    </div>
  );
}
