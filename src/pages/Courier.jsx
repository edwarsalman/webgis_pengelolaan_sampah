import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map, { parseLocation } from "../components/Map";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    background: "#14532d",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 20,
  },
  btn: (color) => ({
    backgroundColor: color,
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: 4,
    cursor: "pointer",
    marginRight: 5,
  }),
  tab: (active) => ({
    padding: 10,
    marginRight: 5,
    cursor: "pointer",
    background: active ? "#16a34a" : "#ccc",
    color: active ? "#fff" : "#000",
    border: "none",
    borderRadius: 4,
  }),
  table: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  td: { padding: 8, borderBottom: "1px solid #eee" },
};

export default function Courier() {
  const [tab, setTab] = useState("peta");
  const [data, setData] = useState({ warga: [], tugas: [] });
  const [myId, setMyId] = useState(null);

  const fetchAll = async (tid) => {
    const { data: warga } = await supabase
      .from("warga")
      .select("*, pembayaran(status)");
    const { data: tugas } = await supabase
      .from("pengangkutan")
      .select("*, warga(*)")
      .eq("courier_id", tid);
    setData({ warga: warga || [], tugas: tugas || [] });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMyId(user.id);
        fetchAll(user.id);
      }
    });
  }, []);

  const handleClaim = async (id) => {
    await supabase
      .from("pengangkutan")
      .update({ courier_id: myId, status: "Proses" })
      .eq("id", id);
    fetchAll(myId);
  };

  const handleStatus = async (id, status) => {
    await supabase.from("pengangkutan").update({ status }).eq("id", id);
    fetchAll(myId);
  };

  const openRoute = (loc) => {
    const p = parseLocation(loc);
    if (p)
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
        "_blank",
      );
    else alert("Lokasi tidak valid.");
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={styles.header}>
        <h2>Courier Dashboard</h2>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          style={styles.btn("#dc2626")}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: 15 }}>
        <button
          onClick={() => setTab("peta")}
          style={styles.tab(tab === "peta")}
        >
          Peta Kerja
        </button>
        <button
          onClick={() => setTab("warga")}
          style={styles.tab(tab === "warga")}
        >
          Daftar Warga
        </button>
        <button
          onClick={() => setTab("tugas")}
          style={styles.tab(tab === "tugas")}
        >
          Tugas Saya
        </button>
        <button
          onClick={() => setTab("transaksi")}
          style={styles.tab(tab === "transaksi")}
        >
          Transaksi Saya
        </button>
        <button
          onClick={() => setTab("pickup")}
          style={styles.tab(tab === "pickup")}
        >
          📦 Pickup Sampah
        </button>
      </div>

      {tab === "peta" && <Map data={data.warga} />}

      {tab === "warga" && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.warga.map((w) => (
              <tr key={w.id}>
                <td style={styles.td}>{w.nama}</td>
                <td style={styles.td}>{w.alamat}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleClaim(w.id)}
                    style={styles.btn("#2563eb")}
                  >
                    Ambil Tugas
                  </button>
                  <button
                    onClick={() => openRoute(w.location)}
                    style={styles.btn("#eab308")}
                  >
                    Rute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "tugas" && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Nama Warga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.tugas.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.warga?.nama}</td>
                <td style={styles.td}>{t.status}</td>
                <td style={styles.td}>
                  {t.status === "Proses" && (
                    <button
                      onClick={() => handleStatus(t.id, "Selesai")}
                      style={styles.btn("#16a34a")}
                    >
                      Selesai
                    </button>
                  )}
                  <button
                    onClick={() => openRoute(t.warga?.location)}
                    style={styles.btn("#eab308")}
                  >
                    Rute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "transaksi" && (
        <div
          style={{
            padding: 15,
            background: "#f0fdf4",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <h3>💳 Halaman Transaksi Kurir</h3>
          <p>
            Klik tombol di bawah untuk melihat detail transaksi dan komisi Anda
          </p>
          <button
            onClick={() => (window.location.href = "/courier-transaction")}
            style={{ ...styles.btn("#16a34a"), marginTop: 10 }}
          >
            Lihat Transaksi Lengkap →
          </button>
        </div>
      )}

      {tab === "pickup" && (
        <div
          style={{
            padding: 15,
            background: "#f0fdf4",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <h3>📦 Pickup Sampah</h3>
          <p>Klik tombol di bawah untuk melakukan pickup sampah dari warga</p>
          <button
            onClick={() => (window.location.href = "/courier-pickup")}
            style={{ ...styles.btn("#2563eb"), marginTop: 10 }}
          >
            Buka Halaman Pickup →
          </button>
        </div>
      )}
    </div>
  );
}
