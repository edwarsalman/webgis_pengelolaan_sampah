import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const styles = {
  container: { padding: 20, fontFamily: "Poppins, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    background: "#1e293b",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 20,
  },
  btn: (color) => ({
    backgroundColor: color,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
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
    background: "#2563eb",
    color: "#fff",
    padding: 12,
    textAlign: "left",
    borderRadius: "8px 0 0 0",
  },
  td: { padding: 12, borderBottom: "1px solid #eee" },
  stat: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    padding: 15,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  statLabel: { fontSize: 12, color: "#666", marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#2563eb" },
  modal: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    background: "#fff",
    padding: 30,
    borderRadius: 8,
    maxWidth: 500,
    width: "90%",
  },
};

export default function WargaTransaction() {
  const [warga, setWarga] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("semua");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    jenis: "pembayaran_iuran",
    nominal: "",
    deskripsi: "",
  });
  const [stats, setStats] = useState({
    total_masuk: 0,
    total_pending: 0,
    transaksi_bulan_ini: 0,
  });

  const fetchWarga = async (userId) => {
    const { data } = await supabase
      .from("warga")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) setWarga(data);
  };

  const fetchTransactions = async (wargaId) => {
    const { data } = await supabase
      .from("transaksi_warga")
      .select("*")
      .eq("warga_id", wargaId)
      .order("tanggal", { ascending: false });

    if (data) {
      setTransactions(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      total_masuk: data
        .filter((t) => t.status === "selesai")
        .reduce((sum, t) => sum + parseFloat(t.nominal), 0),
      total_pending: data
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + parseFloat(t.nominal), 0),
      transaksi_bulan_ini: data.filter((t) => {
        const date = new Date(t.tanggal);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      }).length,
    };
    setStats(stats);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchWarga(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (warga) {
      fetchTransactions(warga.id);
    }
  }, [warga]);

  const handleAddTransaction = async () => {
    if (!formData.nominal || !warga) {
      alert("Lengkapi semua field!");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("transaksi_warga").insert([
      {
        warga_id: warga.id,
        user_id: user.id,
        jenis: formData.jenis,
        nominal: parseFloat(formData.nominal),
        deskripsi: formData.deskripsi,
        status: "pending",
      },
    ]);

    if (!error) {
      alert("Transaksi berhasil ditambahkan!");
      setFormData({ jenis: "pembayaran_iuran", nominal: "", deskripsi: "" });
      setShowModal(false);
      fetchTransactions(warga.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "selesai":
        return "#16a34a";
      case "pending":
        return "#eab308";
      case "ditolak":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const filteredTransactions =
    filter === "semua"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💰 Transaksi Keuangan - {warga?.nama || "Loading..."}</h2>
        <div>
          <button
            onClick={() => setShowModal(true)}
            style={styles.btn("#10b981")}
          >
            + Transaksi Baru
          </button>
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
      </div>

      {/* Statistik */}
      <div style={styles.stat}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Masuk (Terverifikasi)</div>
          <div style={styles.statValue}>
            Rp{stats.total_masuk.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Pending</div>
          <div style={{ ...styles.statValue, color: "#eab308" }}>
            Rp{stats.total_pending.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Transaksi Bulan Ini</div>
          <div style={{ ...styles.statValue, color: "#2563eb" }}>
            {stats.transaksi_bulan_ini}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 15 }}>
        <label style={{ marginRight: 10 }}>Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="semua">Semua Transaksi</option>
          <option value="pending">Pending</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {/* Tabel Transaksi */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Tanggal</th>
            <th style={styles.th}>Jenis</th>
            <th style={styles.th}>Nominal</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ ...styles.td, textAlign: "center" }}>
                Tidak ada transaksi
              </td>
            </tr>
          ) : (
            filteredTransactions.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>
                  {new Date(t.tanggal).toLocaleDateString("id-ID")}
                </td>
                <td style={styles.td}>{t.jenis.replace(/_/g, " ")}</td>
                <td style={styles.td}>
                  <strong>Rp{parseFloat(t.nominal).toLocaleString()}</strong>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      background: getStatusColor(t.status),
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {t.status}
                  </span>
                </td>
                <td style={styles.td}>{t.deskripsi || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Tambah Transaksi */}
      {showModal && (
        <div style={{ ...styles.modal, display: "flex" }}>
          <div style={styles.modalContent}>
            <h3>Tambah Transaksi Keuangan</h3>
            <div style={{ marginTop: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>
                Jenis Transaksi:
              </label>
              <select
                value={formData.jenis}
                onChange={(e) =>
                  setFormData({ ...formData, jenis: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginBottom: 15,
                }}
              >
                <option value="pembayaran_iuran">Pembayaran Iuran</option>
                <option value="pembayaran_jasa">Pembayaran Jasa</option>
                <option value="refund">Refund</option>
              </select>

              <label style={{ display: "block", marginBottom: 5 }}>
                Nominal (Rp):
              </label>
              <input
                type="number"
                placeholder="Masukkan nominal"
                value={formData.nominal}
                onChange={(e) =>
                  setFormData({ ...formData, nominal: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginBottom: 15,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ display: "block", marginBottom: 5 }}>
                Deskripsi:
              </label>
              <textarea
                placeholder="Masukkan deskripsi (opsional)"
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginBottom: 15,
                  boxSizing: "border-box",
                  minHeight: 80,
                }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleAddTransaction}
                  style={styles.btn("#10b981")}
                >
                  Simpan
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={styles.btn("#6b7280")}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
