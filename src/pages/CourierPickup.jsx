import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const styles = {
  container: { padding: 20, fontFamily: "Poppins, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    background: "#14532d",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 20,
  },
  btn: (color) => ({
    backgroundColor: color,
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: 5,
  }),
  card: {
    background: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    border: "1px solid #ddd",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 15 },
  th: {
    background: "#16a34a",
    color: "#fff",
    padding: 12,
    textAlign: "left",
  },
  td: { padding: 12, borderBottom: "1px solid #eee" },
  badge: (color) => ({
    background: color,
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "bold",
  }),
  stat: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
};

export default function CourierPickup() {
  const [pickup, setPickup] = useState([]);
  const [courierId, setCourierId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [stats, setStats] = useState({
    total: 0,
    ambil: 0,
    belum_ambil: 0,
    selesai: 0,
  });

  const fetchPickupData = async (cId) => {
    const { data } = await supabase
      .from("pickup_sampah")
      .select(
        `
        *,
        warga:warga_id(nama, alamat),
        pengangkutan:pengangkutan_id(status)
      `,
      )
      .eq("courier_id", cId)
      .order("created_at", { ascending: false });

    if (data) {
      setPickup(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      ambil: data.filter((p) => p.status === "ambil").length,
      belum_ambil: data.filter((p) => p.status === "belum_ambil").length,
      selesai: data.filter((p) => p.status === "selesai").length,
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCourierId(user.id);
        fetchPickupData(user.id);
      }
    });
  }, []);

  const handlePickupStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("pickup_sampah")
      .update({
        status: newStatus,
        tanggal_pickup: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      const statusText =
        newStatus === "ambil"
          ? "Sampah berhasil diambil!"
          : newStatus === "belum_ambil"
            ? "Sampah belum bisa diambil"
            : "Pickup selesai!";
      alert(statusText);
      fetchPickupData(courierId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "selesai":
        return "#16a34a";
      case "ambil":
        return "#2563eb";
      case "belum_ambil":
        return "#eab308";
      case "pending":
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "⏳ Pending",
      ambil: "✅ Ambil",
      belum_ambil: "❌ Belum Ambil",
      selesai: "🎉 Selesai",
    };
    return labels[status] || status;
  };

  const filteredPickup =
    filter === "semua" ? pickup : pickup.filter((p) => p.status === filter);

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📦 Pickup Sampah - Courier</h2>
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

      {/* Statistik */}
      <div style={styles.stat}>
        <div style={styles.statCard}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
            Total Pickup
          </div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#2563eb" }}>
            {stats.total}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
            ✅ Sudah Ambil
          </div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#16a34a" }}>
            {stats.ambil}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
            ❌ Belum Ambil
          </div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#eab308" }}>
            {stats.belum_ambil}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
            🎉 Selesai
          </div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#059669" }}>
            {stats.selesai}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 15 }}>
        <label style={{ marginRight: 10, fontWeight: "bold" }}>Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="semua">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="ambil">✅ Sudah Ambil</option>
          <option value="belum_ambil">❌ Belum Ambil</option>
          <option value="selesai">🎉 Selesai</option>
        </select>
      </div>

      {/* Tabel Pickup */}
      {filteredPickup.length === 0 ? (
        <div style={styles.card}>
          <p style={{ textAlign: "center", color: "#666" }}>
            Tidak ada data pickup
          </p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nama Warga</th>
              <th style={styles.th}>Alamat</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Berat (kg)</th>
              <th style={styles.th}>Catatan</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPickup.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>
                  <strong>{p.warga?.nama}</strong>
                </td>
                <td style={styles.td}>{p.warga?.alamat}</td>
                <td style={styles.td}>
                  <span style={styles.badge(getStatusColor(p.status))}>
                    {getStatusLabel(p.status)}
                  </span>
                </td>
                <td style={styles.td}>
                  {p.berat_terambil ? `${p.berat_terambil} kg` : "-"}
                </td>
                <td style={styles.td}>{p.catatan || "-"}</td>
                <td style={styles.td}>
                  {p.status === "pending" && (
                    <>
                      <button
                        onClick={() => handlePickupStatus(p.id, "ambil")}
                        style={styles.btn("#16a34a")}
                      >
                        ✅ Ambil
                      </button>
                      <button
                        onClick={() => handlePickupStatus(p.id, "belum_ambil")}
                        style={styles.btn("#eab308")}
                      >
                        ❌ Belum
                      </button>
                    </>
                  )}
                  {p.status === "ambil" && (
                    <button
                      onClick={() => handlePickupStatus(p.id, "selesai")}
                      style={styles.btn("#2563eb")}
                    >
                      🎉 Selesai
                    </button>
                  )}
                  {(p.status === "selesai" || p.status === "belum_ambil") && (
                    <span style={{ color: "#666", fontSize: 12 }}>
                      {p.tanggal_pickup
                        ? new Date(p.tanggal_pickup).toLocaleDateString("id-ID")
                        : "-"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
