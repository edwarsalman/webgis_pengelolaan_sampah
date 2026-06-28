import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const styles = {
  container: { padding: 20, fontFamily: "Poppins, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    background: "#0f172a",
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
  tab: (active) => ({
    padding: 10,
    marginRight: 5,
    cursor: "pointer",
    background: active ? "#2563eb" : "#ccc",
    color: active ? "#fff" : "#000",
    border: "none",
    borderRadius: 4,
  }),
  table: { width: "100%", borderCollapse: "collapse", marginTop: 15 },
  th: {
    background: "#2563eb",
    color: "#fff",
    padding: 12,
    textAlign: "left",
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
};

export default function TransactionReport() {
  const [tab, setTab] = useState("ringkasan");
  const [wargaTransactions, setWargaTransactions] = useState([]);
  const [courierTransactions, setCourierTransactions] = useState([]);
  const [komisi, setKomisi] = useState([]);
  const [filter, setFilter] = useState("semua");
  const [stats, setStats] = useState({
    total_transaksi_warga: 0,
    total_terverifikasi: 0,
    total_pending: 0,
    total_komisi_kurir: 0,
    total_komisi_belum_dibayar: 0,
    jumlah_warga_aktif: 0,
    jumlah_kurir_aktif: 0,
  });

  const fetchAllTransactions = async () => {
    // Fetch transaksi warga
    const { data: wargaTx } = await supabase
      .from("transaksi_warga")
      .select("*, warga(nama), profiles:user_id(name)")
      .order("tanggal", { ascending: false });

    // Fetch transaksi kurir
    const { data: courierTx } = await supabase
      .from("transaksi_courier")
      .select("*, profiles(name)")
      .order("tanggal", { ascending: false });

    // Fetch komisi kurir
    const { data: komisiData } = await supabase
      .from("komisi_courier")
      .select(
        "*, pengangkutan(warga:warga_id(nama)), profiles:courier_id(name)",
      )
      .order("tanggal_pengangkutan", { ascending: false });

    if (wargaTx) setWargaTransactions(wargaTx);
    if (courierTx) setCourierTransactions(courierTx);
    if (komisiData) setKomisi(komisiData);

    calculateStats(wargaTx || [], courierTx || [], komisiData || []);
  };

  const calculateStats = async (wargaTx, courierTx, komisiData) => {
    // Total transaksi warga yang sudah terverifikasi
    const totalVerified = wargaTx
      .filter((t) => t.status === "selesai")
      .reduce((sum, t) => sum + parseFloat(t.nominal), 0);

    // Total transaksi warga pending
    const totalPending = wargaTx
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.nominal), 0);

    // Total komisi kurir
    const totalKomisi = komisiData.reduce(
      (sum, k) => sum + parseFloat(k.nominal_komisi),
      0,
    );

    // Total komisi belum dibayar
    const totalKomisiPending = komisiData
      .filter((k) => k.status !== "dibayar")
      .reduce((sum, k) => sum + parseFloat(k.nominal_komisi), 0);

    // Count active warga dan kurir
    const { data: warga } = await supabase.from("warga").select("id");
    const { data: couriers } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "courier");

    setStats({
      total_transaksi_warga: wargaTx.length,
      total_terverifikasi: totalVerified,
      total_pending: totalPending,
      total_komisi_kurir: totalKomisi,
      total_komisi_belum_dibayar: totalKomisiPending,
      jumlah_warga_aktif: warga?.length || 0,
      jumlah_kurir_aktif: couriers?.length || 0,
    });
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "selesai":
      case "dibayar":
        return "#16a34a";
      case "pending":
      case "disetujui":
        return "#eab308";
      case "ditolak":
        return "#dc2626";
      case "ditarik":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const handleVerify = async (id, status) => {
    const { error } = await supabase
      .from("transaksi_warga")
      .update({ status })
      .eq("id", id);

    if (!error) {
      alert("Status berhasil diperbarui!");
      fetchAllTransactions();
    }
  };

  const handleVerifyComission = async (id, status) => {
    const { error } = await supabase
      .from("komisi_courier")
      .update({ status })
      .eq("id", id);

    if (!error) {
      alert("Status komisi berhasil diperbarui!");
      fetchAllTransactions();
    }
  };

  const filteredWargaTx =
    filter === "semua"
      ? wargaTransactions
      : wargaTransactions.filter((t) => t.status === filter);

  const filteredCourierTx =
    filter === "semua"
      ? courierTransactions
      : courierTransactions.filter((t) => t.status === filter);

  const filteredKomisi =
    filter === "semua" ? komisi : komisi.filter((k) => k.status === filter);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📊 Laporan Transaksi Keuangan</h2>
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

      {/* Statistik Overview */}
      <div style={styles.stat}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Transaksi Warga</div>
          <div style={styles.statValue}>{stats.total_transaksi_warga}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Terverifikasi</div>
          <div style={{ ...styles.statValue, color: "#16a34a" }}>
            Rp{stats.total_terverifikasi.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Pending Verifikasi</div>
          <div style={{ ...styles.statValue, color: "#eab308" }}>
            Rp{stats.total_pending.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Komisi Kurir</div>
          <div style={{ ...styles.statValue, color: "#2563eb" }}>
            Rp{stats.total_komisi_kurir.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Komisi Belum Dibayar</div>
          <div style={{ ...styles.statValue, color: "#dc2626" }}>
            Rp{stats.total_komisi_belum_dibayar.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Warga Aktif</div>
          <div style={styles.statValue}>{stats.jumlah_warga_aktif}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Kurir Aktif</div>
          <div style={styles.statValue}>{stats.jumlah_kurir_aktif}</div>
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
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 15 }}>
        <button
          onClick={() => setTab("ringkasan")}
          style={styles.tab(tab === "ringkasan")}
        >
          📋 Ringkasan
        </button>
        <button
          onClick={() => setTab("warga")}
          style={styles.tab(tab === "warga")}
        >
          👥 Transaksi Warga
        </button>
        <button
          onClick={() => setTab("kurir")}
          style={styles.tab(tab === "kurir")}
        >
          🚗 Transaksi Kurir
        </button>
        <button
          onClick={() => setTab("komisi")}
          style={styles.tab(tab === "komisi")}
        >
          💳 Komisi Kurir
        </button>
      </div>

      {/* Tab: Ringkasan */}
      {tab === "ringkasan" && (
        <div style={styles.card}>
          <h3>📈 Ringkasan Transaksi</h3>
          <p>
            Total Transaksi Warga:{" "}
            <strong>{stats.total_transaksi_warga}</strong>
          </p>
          <p>
            Total Transaksi Terverifikasi:{" "}
            <strong>Rp{stats.total_terverifikasi.toLocaleString()}</strong>
          </p>
          <p>
            Total Transaksi Pending:{" "}
            <strong>Rp{stats.total_pending.toLocaleString()}</strong>
          </p>
          <hr />
          <h3>💰 Ringkasan Komisi Kurir</h3>
          <p>
            Total Komisi:{" "}
            <strong>Rp{stats.total_komisi_kurir.toLocaleString()}</strong>
          </p>
          <p>
            Komisi Belum Dibayar:{" "}
            <strong>
              Rp{stats.total_komisi_belum_dibayar.toLocaleString()}
            </strong>
          </p>
        </div>
      )}

      {/* Tab: Transaksi Warga */}
      {tab === "warga" && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tanggal</th>
              <th style={styles.th}>Warga</th>
              <th style={styles.th}>Jenis</th>
              <th style={styles.th}>Nominal</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredWargaTx.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              filteredWargaTx.map((t) => (
                <tr key={t.id}>
                  <td style={styles.td}>
                    {new Date(t.tanggal).toLocaleDateString("id-ID")}
                  </td>
                  <td style={styles.td}>{t.warga?.nama}</td>
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
                  <td style={styles.td}>
                    {t.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleVerify(t.id, "selesai")}
                          style={styles.btn("#16a34a")}
                        >
                          Verifikasi
                        </button>
                        <button
                          onClick={() => handleVerify(t.id, "ditolak")}
                          style={styles.btn("#dc2626")}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Tab: Transaksi Kurir */}
      {tab === "kurir" && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tanggal</th>
              <th style={styles.th}>Kurir</th>
              <th style={styles.th}>Jenis</th>
              <th style={styles.th}>Nominal</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourierTx.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              filteredCourierTx.map((t) => (
                <tr key={t.id}>
                  <td style={styles.td}>
                    {new Date(t.tanggal).toLocaleDateString("id-ID")}
                  </td>
                  <td style={styles.td}>{t.profiles?.name}</td>
                  <td style={styles.td}>{t.jenis}</td>
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
                  <td style={styles.td}>
                    {t.status === "pending" && (
                      <button
                        onClick={() => handleVerify(t.id, "disetujui")}
                        style={styles.btn("#16a34a")}
                      >
                        Setujui
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Tab: Komisi Kurir */}
      {tab === "komisi" && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tanggal Pengangkutan</th>
              <th style={styles.th}>Kurir</th>
              <th style={styles.th}>Warga</th>
              <th style={styles.th}>Persentase</th>
              <th style={styles.th}>Nominal Komisi</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredKomisi.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...styles.td, textAlign: "center" }}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              filteredKomisi.map((k) => (
                <tr key={k.id}>
                  <td style={styles.td}>
                    {new Date(k.tanggal_pengangkutan).toLocaleDateString(
                      "id-ID",
                    )}
                  </td>
                  <td style={styles.td}>{k.profiles?.name}</td>
                  <td style={styles.td}>{k.pengangkutan?.warga?.nama}</td>
                  <td style={styles.td}>{k.persentase_komisi}%</td>
                  <td style={styles.td}>
                    <strong>
                      Rp{parseFloat(k.nominal_komisi).toLocaleString()}
                    </strong>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        background: getStatusColor(k.status),
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {k.status === "pending" && (
                      <button
                        onClick={() => handleVerifyComission(k.id, "dibayar")}
                        style={styles.btn("#16a34a")}
                      >
                        Bayar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
