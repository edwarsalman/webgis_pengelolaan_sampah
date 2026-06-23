import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#0f172a", color: "#fff", borderRadius: 8, marginBottom: 20 },
  btn: (color) => ({ backgroundColor: color, color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4, cursor: "pointer", marginRight: 5 }),
  tab: (active) => ({ padding: 10, marginRight: 5, cursor: "pointer", background: active ? "#2563eb" : "#ccc", color: active ? "#fff" : "#000", border: "none", borderRadius: 4 }),
  table: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  td: { padding: 8, borderBottom: "1px solid #eee" }
};

export default function Admin() {
  const [tab, setTab] = useState("peta");
  const [list, setList] = useState({ warga: [], bayar: [], angkut: [] });
  const [filter, setFilter] = useState("semua");

  const fetchAllData = async () => {
    const { data: warga } = await supabase.from("warga").select("*, pembayaran(status)");
    const { data: bayar } = await supabase.from("pembayaran").select("*, warga(nama)");
    const { data: angkut } = await supabase.from("pengangkutan").select("*, warga(nama), transporter:profiles(name)");
    setList({ warga: warga || [], bayar: bayar || [], angkut: angkut || [] });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const updateStatus = async (table, id, status) => {
    await supabase.from(table).update({ status }).eq("id", id);
    fetchAllData();
  };

  const removeData = async (table, id) => {
    if (confirm("Apakah anda yakin ingin menghapus data ini?")) {
      await supabase.from(table).delete().eq("id", id);
      fetchAllData();
    }
  };

  const filteredWarga = list.warga.filter((w) => {
    if (filter === "semua") return true;
    const isSudah = w.pembayaran?.some((p) => p.status === "Sudah");
    return filter === "sudah" ? isSudah : !isSudah;
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={styles.header}>
        <h2>Admin Panel (WebGIS Control)</h2>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} style={styles.btn("#dc2626")}>Logout</button>
      </div>

      <div style={{ marginBottom: 15 }}>
        {["peta", "warga", "pembayaran", "pengangkutan"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={styles.tab(tab === t)}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === "peta" && (
        <div>
          <div style={{ marginBottom: 10 }}>
            Filter Pembayaran: 
            <select onChange={(e) => setFilter(e.target.value)} style={{ marginLeft: 10, padding: 5 }}>
              <option value="semua">Semua</option>
              <option value="sudah">Sudah Bayar</option>
              <option value="belum">Belum Bayar</option>
            </select>
          </div>
          <Map data={filteredWarga} />
        </div>
      )}

      {tab === "warga" && (
        <table style={styles.table}>
          <thead><tr><th>Nama</th><th>Alamat</th><th>Aksi</th></tr></thead>
          <tbody>
            {list.warga.map((w) => (
              <tr key={w.id}>
                <td style={styles.td}>{w.nama}</td>
                <td style={styles.td}>{w.alamat}</td>
                <td style={styles.td}><button onClick={() => removeData("warga", w.id)} style={styles.btn("#dc2626")}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "pembayaran" && (
        <table style={styles.table}>
          <thead><tr><th>Warga</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {list.bayar.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{p.warga?.nama}</td>
                <td style={styles.td}>{p.status}</td>
                <td style={styles.td}>
                  {p.status !== "Sudah" && <button onClick={() => updateStatus("pembayaran", p.id, "Sudah")} style={styles.btn("#16a34a")}>Verifikasi</button>}
                  <button onClick={() => removeData("pembayaran", p.id)} style={styles.btn("#dc2626")}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "pengangkutan" && (
        <table style={styles.table}>
          <thead><tr><th>Warga</th><th>Driver</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {list.angkut.map((a) => (
              <tr key={a.id}>
                <td style={styles.td}>{a.warga?.nama}</td>
                <td style={styles.td}>{a.transporter?.name || "-"}</td>
                <td style={styles.td}>{a.status}</td>
                <td style={styles.td}>
                  {a.status !== "Selesai" && <button onClick={() => updateStatus("pengangkutan", a.id, "Selesai")} style={styles.btn("#16a34a")}>Selesai</button>}
                  <button onClick={() => removeData("pengangkutan", a.id)} style={styles.btn("#dc2626")}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}