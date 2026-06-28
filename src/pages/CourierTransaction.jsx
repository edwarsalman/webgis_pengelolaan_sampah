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
    background: active ? "#16a34a" : "#ccc",
    color: active ? "#fff" : "#000",
    border: "none",
    borderRadius: 4,
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
  statValue: { fontSize: 24, fontWeight: "bold", color: "#16a34a" },
};

export default function CourierTransaction() {
  const [tab, setTab] = useState("komisi");
  const [courier, setCourier] = useState(null);
  const [komisi, setKomisi] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [stats, setStats] = useState({
    total_komisi: 0,
    komisi_pending: 0,
    komisi_dibayar: 0,
  });
  const [myId, setMyId] = useState(null);

  const fetchCourierData = async (userId) => {
    // Fetch courier profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      setCourier(profile);
    }
  };

  const fetchKomisi = async (userId) => {
    const { data } = await supabase
      .from("komisi_courier")
      .select("*, pengangkutan(warga:warga_id(nama))")
      .eq("courier_id", userId)
      .order("tanggal_pengangkutan", { ascending: false });

    if (data) {
      setKomisi(data);
      calculateStats(data);
    }
  };

  const fetchTransactions = async (userId) => {
    const { data } = await supabase
      .from("transaksi_courier")
      .select("*")
      .eq("courier_id", userId)
      .order("tanggal", { ascending: false });

    if (data) {
      setTransaksi(data);
    }
  };

  const calculateStats = (komisiData) => {
    const stats = {
      total_komisi: komisiData.reduce(
        (sum, k) => sum + parseFloat(k.nominal_komisi),
        0,
      ),
      komisi_pending: komisiData
        .filter((k) => k.status === "pending")
        .reduce((sum, k) => sum + parseFloat(k.nominal_komisi), 0),
      komisi_dibayar: komisiData
        .filter((k) => k.status === "dibayar")
        .reduce((sum, k) => sum + parseFloat(k.nominal_komisi), 0),
    };
    setStats(stats);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMyId(user.id);
        fetchCourierData(user.id);
        fetchKomisi(user.id);
        fetchTransactions(user.id);
      }
    });
  }, []);

  const handleWithdraw = async () => {
    if (stats.komisi_pending === 0) {
      alert("Tidak ada komisi yang dapat ditarik!");
      return;
    }

    const { error } = await supabase.from("transaksi_courier").insert([
      {
        courier_id: myId,
        jenis: "komisi",
        nominal: stats.komisi_pending,
        deskripsi: "Pencairan komisi pengangkutan",
        status: "pending",
      },
    ]);

    if (!error) {
      // Update komisi status
      const pendingKomisi = komisi.filter((k) => k.status === "pending");
      for (let k of pendingKomisi) {
        await supabase
          .from("komisi_courier")
          .update({ status: "ditarik" })
          .eq("id", k.id);
      }

      alert("Permintaan pencairan komisi berhasil dikirim!");
      fetchKomisi(myId);
      fetchTransactions(myId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "dibayar":
        return "#16a34a";
      case "pending":
        return "#eab308";
      case "ditolak":
        return "#dc2626";
      case "ditarik":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>💳 Transaksi Kurir - {courier?.name || "Loading..."}</h2>
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
          <div style={styles.statLabel}>Total Komisi</div>
          <div style={styles.statValue}>
            Rp{stats.total_komisi.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Komisi Pending</div>
          <div style={{ ...styles.statValue, color: "#eab308" }}>
            Rp{stats.komisi_pending.toLocaleString()}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Komisi Sudah Dibayar</div>
          <div style={{ ...styles.statValue, color: "#16a34a" }}>
            Rp{stats.komisi_dibayar.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ marginBottom: 15 }}>
        <button
          onClick={() => setTab("komisi")}
          style={styles.tab(tab === "komisi")}
        >
          📊 Detail Komisi
        </button>
        <button
          onClick={() => setTab("transaksi")}
          style={styles.tab(tab === "transaksi")}
        >
          💰 Transaksi Keuangan
        </button>
      </div>

      {/* Tab: Detail Komisi */}
      {tab === "komisi" && (
        <div>
          <div style={{ marginBottom: 15 }}>
            <button onClick={handleWithdraw} style={styles.btn("#2563eb")}>
              💸 Tarik Komisi Pending
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tanggal Pengangkutan</th>
                <th style={styles.th}>Nama Warga</th>
                <th style={styles.th}>Persentase</th>
                <th style={styles.th}>Nominal Komisi</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {komisi.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: "center" }}>
                    Tidak ada data komisi
                  </td>
                </tr>
              ) : (
                komisi.map((k) => (
                  <tr key={k.id}>
                    <td style={styles.td}>
                      {new Date(k.tanggal_pengangkutan).toLocaleDateString(
                        "id-ID",
                      )}
                    </td>
                    <td style={styles.td}>
                      {k.pengangkutan?.warga?.nama || "-"}
                    </td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Transaksi Keuangan */}
      {tab === "transaksi" && (
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
            {transaksi.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: "center" }}>
                  Tidak ada transaksi
                </td>
              </tr>
            ) : (
              transaksi.map((t) => (
                <tr key={t.id}>
                  <td style={styles.td}>
                    {new Date(t.tanggal).toLocaleDateString("id-ID")}
                  </td>
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
                  <td style={styles.td}>{t.deskripsi || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
