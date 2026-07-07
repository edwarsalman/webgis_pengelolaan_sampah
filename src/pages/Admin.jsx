import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";

const statusPillStyle = (status) => {
  const s = (status || "").toString().toLowerCase();
  if (s === "selesai" || s === "sudah" || s === "dibayar")
    return { bg: "rgba(63,163,77,0.12)", color: "#1F4B3F" };
  if (s === "proses" || s === "in progress")
    return { bg: "rgba(42,111,119,0.12)", color: "#2A6F77" };
  if (s === "pending" || s === "menunggu" || s === "belum")
    return { bg: "rgba(232,163,61,0.15)", color: "#8A5B12" };
  return { bg: "rgba(75,85,99,0.1)", color: "#374151" };
};

const TABS = ["peta", "warga", "pembayaran", "pengangkutan", "transaksi", "laporan"];
const TAB_LABELS = {
  peta: "Peta",
  warga: "Warga",
  pembayaran: "Pembayaran",
  pengangkutan: "Pengangkutan",
  transaksi: "Transaksi",
  laporan: "Laporan",
};

const exportToExcel = async (data, filename) => {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const exportToPDF = async (columns, rows, title, filename) => {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 34,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 75, 63] },
  });
  doc.save(`${filename}.pdf`);
};

export default function Admin() {
  const [tab, setTab] = useState("peta");
  const [list, setList] = useState({ warga: [], bayar: [], angkut: [] });
  const [filter, setFilter] = useState("semua");
  const [laporanType, setLaporanType] = useState("pengangkutan");
  const [stats, setStats] = useState({
    total_transaksi_warga: 0,
    total_terverifikasi: 0,
    total_pending: 0,
  });
  const [pendingAutoUpdated, setPendingAutoUpdated] = useState(false);

  const fetchAllData = async () => {
    const { data: warga } = await supabase
      .from("warga")
      .select("*, transaksi_warga(jenis,status,tanggal)");
    const { data: bayar } = await supabase
      .from("transaksi_warga")
      .select("*, warga(nama)")
      .order("tanggal", { ascending: false });

    let angkut = [];
    const { data: angkutRaw, error: errAngkut } = await supabase
      .from("pengangkutan")
      .select("*");

    if (!errAngkut && angkutRaw) {
      const wargaIds = [...new Set(angkutRaw.map((a) => a.warga_id).filter(Boolean))];
      let wargaMap = {};
      if (wargaIds.length) {
        const { data: wargaInfo } = await supabase
          .from("warga")
          .select("id, nama")
          .in("id", wargaIds);
        (wargaInfo || []).forEach((w) => (wargaMap[w.id] = w.nama));
      }
      const transporterIds = [...new Set(angkutRaw.map((a) => a.transporter_id).filter(Boolean))];
      let transporterMap = {};
      if (transporterIds.length) {
        const { data: profilesInfo } = await supabase
          .from("profiles")
          .select("id, nama")
          .in("id", transporterIds);
        (profilesInfo || []).forEach((p) => (transporterMap[p.id] = p.nama));
      }
      angkut = angkutRaw.map((a) => ({
        ...a,
        warga_nama: wargaMap[a.warga_id] || "-",
        transporter_nama: transporterMap[a.transporter_id] || "-",
      }));
    }

    setList({ warga: warga || [], bayar: bayar || [], angkut });
    const totalTransaksi = (bayar || []).length;
    const totalTerverifikasi = (bayar || [])
      .filter((t) => (t.status || "").toString().toLowerCase() === "selesai")
      .reduce((s, t) => s + (parseFloat(t.nominal) || 0), 0);
    const totalPending = (bayar || [])
      .filter((t) => (t.status || "").toString().toLowerCase() === "pending")
      .reduce((s, t) => s + (parseFloat(t.nominal) || 0), 0);
    setStats({ total_transaksi_warga: totalTransaksi, total_terverifikasi: totalTerverifikasi, total_pending: totalPending });
  };

  useEffect(() => {
    const init = async () => {
      if (!pendingAutoUpdated) {
        try {
          await supabase.from("transaksi_warga").update({ status: "selesai" }).eq("status", "pending");
        } catch (e) { console.error(e); }
        setPendingAutoUpdated(true);
      }
      await fetchAllData();
    };
    init();
  }, [pendingAutoUpdated]);

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
    const isSudah = (w.transaksi_warga || []).some((p) => {
      const status = p.status?.toString().toLowerCase();
      return status === "selesai" || status === "sudah";
    });
    return filter === "sudah" ? isSudah : !isSudah;
  });

  const handleExportExcel = () => {
    if (laporanType === "pengangkutan") {
      exportToExcel(list.angkut.map((a) => ({ Warga: a.warga_nama, Driver: a.transporter_nama, Status: a.status || "-" })), "laporan_pengangkutan");
    } else if (laporanType === "pembayaran") {
      exportToExcel(list.bayar.map((p) => ({ Tanggal: p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-", Warga: p.warga?.nama || "-", Jenis: (p.jenis || "").replace(/_/g, " "), Nominal: parseFloat(p.nominal || 0), Status: p.status || "-" })), "laporan_pembayaran");
    } else {
      exportToExcel(list.warga.map((w) => ({ Nama: w.nama || "-", Alamat: w.alamat || "-" })), "laporan_warga");
    }
  };

  const handleExportPDF = () => {
    if (laporanType === "pengangkutan") {
      exportToPDF(["Warga", "Driver", "Status"], list.angkut.map((a) => [a.warga_nama, a.transporter_nama, a.status || "-"]), "Laporan Pengangkutan", "laporan_pengangkutan");
    } else if (laporanType === "pembayaran") {
      exportToPDF(["Tanggal", "Warga", "Jenis", "Nominal", "Status"], list.bayar.map((p) => [p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-", p.warga?.nama || "-", (p.jenis || "").replace(/_/g, " "), `Rp${parseFloat(p.nominal || 0).toLocaleString()}`, p.status || "-"]), "Laporan Pembayaran", "laporan_pembayaran");
    } else {
      exportToPDF(["Nama", "Alamat"], list.warga.map((w) => [w.nama || "-", w.alamat || "-"]), "Laporan Data Warga", "laporan_warga");
    }
  };
  return (
    <div className="admin-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        .admin-shell { --ink: #16211C; --forest: #1F4B3F; --leaf: #3FA34D; --teal: #2A6F77; --sand: #F5F2E6; --amber: #E8A33D; --border: #E4E1D3; min-height: 100vh; background: var(--sand); background-image: radial-gradient(rgba(31,75,63,0.08) 1px, transparent 1.4px); background-size: 26px 26px; font-family: 'Inter', sans-serif; color: var(--ink); padding: 24px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: linear-gradient(135deg, var(--forest) 0%, var(--ink) 100%); color: #F3F1E8; border-radius: 16px; padding: 18px 24px; margin-bottom: 20px; box-shadow: 0 16px 32px -18px rgba(22,33,28,0.5); }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-mark { width: 40px; height: 40px; border-radius: 11px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; }
        .topbar-mark svg { width: 20px; height: 20px; }
        .topbar-title { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 19px; margin: 0; }
        .topbar-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: #BFE7C8; margin-top: 2px; }
        .topbar-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--leaf); animation: ping 2.2s ease-out infinite; }
        @keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(63,163,77,0.55); } 70% { box-shadow: 0 0 0 6px rgba(63,163,77,0); } 100% { box-shadow: 0 0 0 0 rgba(63,163,77,0); } }
        .btn-logout { background: rgba(220,38,38,0.14); color: #FCA5A5; border: 1px solid rgba(220,38,38,0.3); padding: 9px 16px; border-radius: 9px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
        .btn-logout:hover { background: rgba(220,38,38,0.22); color: #FEE2E2; }
        .tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; background: #EDEADD; padding: 4px; border-radius: 11px; margin-bottom: 18px; }
        .tab-btn { border: none; padding: 9px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; background: transparent; color: #5B6459; transition: background .16s ease, color .16s ease; }
        .tab-btn.active { background: var(--ink); color: #F3F1E8; box-shadow: 0 6px 14px -6px rgba(22,33,28,0.4); }
        .card { background: #FFFFFF; border-radius: 16px; padding: 22px 24px 24px; border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(22,33,28,0.04), 0 18px 36px -22px rgba(22,33,28,0.18); }
        .card h3 { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 16px; margin: 0 0 16px; color: var(--ink); display: flex; align-items: center; gap: 8px; }
        .card h3 .bar { width: 4px; height: 16px; background: var(--leaf); border-radius: 3px; }
        .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 13.5px; font-weight: 600; color: #47504A; }
        .filter-row select { padding: 9px 12px; border-radius: 9px; border: 1.5px solid var(--border); background: #FBFAF4; font-size: 13.5px; color: var(--ink); outline: none; cursor: pointer; }
        .map-wrap { border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border); }
        table.modern-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .modern-table thead th { text-align: left; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7568; padding: 10px 12px; border-bottom: 2px solid var(--border); }
        .modern-table tbody td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 14px; color: #26312B; vertical-align: middle; }
        .modern-table tbody tr:hover { background: #FBFAF4; }
        .modern-table tbody tr:last-child td { border-bottom: none; }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-sm { border: none; padding: 7px 13px; border-radius: 8px; font-weight: 700; font-size: 12.5px; cursor: pointer; color: #fff; transition: transform .12s ease, filter .18s ease; }
        .btn-sm:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .btn-leaf { background: var(--leaf); }
        .btn-teal { background: var(--teal); }
        .btn-amber { background: var(--amber); }
        .btn-danger { background: #C0392B; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 22px; }
        .stat-card { background: #FFFFFF; border: 1px solid var(--border); border-radius: 14px; padding: 15px 18px; }
        .stat-card .stat-label { font-size: 12px; font-weight: 700; color: #6B7568; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
        .stat-card .stat-value { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 21px; }
        .empty-note { padding: 20px; background: #FBFAF4; border: 1px dashed var(--border); border-radius: 12px; color: #6B7568; font-size: 14px; text-align: center; }
        .export-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
        @media (max-width: 720px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="#3FA34D" strokeWidth="1.6" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="#3FA34D" strokeWidth="1.6" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="#3FA34D" strokeWidth="1.6" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="#3FA34D" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <h2 className="topbar-title">Admin Panel</h2>
            <div className="topbar-badge"><span className="dot" />WebGIS Sampah Control</div>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="btn-logout">Logout</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? "active" : ""}`}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {tab === "peta" && (
        <div className="card">
          <h3><span className="bar" />Peta Sebaran Warga</h3>
          <div className="filter-row">
            Filter Pembayaran:
            <select onChange={(e) => setFilter(e.target.value)}>
              <option value="semua">Semua</option>
              <option value="sudah">Sudah Bayar</option>
              <option value="belum">Belum Bayar</option>
            </select>
          </div>
          <div className="map-wrap"><Map data={filteredWarga} /></div>
        </div>
      )}

      {tab === "warga" && (
        <div className="card">
          <h3><span className="bar" />Data Warga</h3>
          {list.warga.length === 0 ? <div className="empty-note">Belum ada data warga.</div> : (
            <table className="modern-table">
              <thead><tr><th>Nama</th><th>Alamat</th><th>Aksi</th></tr></thead>
              <tbody>
                {list.warga.map((w) => (
                  <tr key={w.id}><td>{w.nama}</td><td>{w.alamat}</td><td><button onClick={() => removeData("warga", w.id)} className="btn-sm btn-danger">Hapus</button></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "pembayaran" && (
        <div className="card">
          <h3><span className="bar" />Pembayaran Warga</h3>
          {list.bayar.length === 0 ? <div className="empty-note">Belum ada data pembayaran.</div> : (
            <table className="modern-table">
              <thead><tr><th>Warga</th><th>Jenis</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {list.bayar.map((p) => {
                  const s = statusPillStyle(p.status);
                  return (
                    <tr key={p.id}>
                      <td>{p.warga?.nama}</td>
                      <td>{p.jenis?.replace(/_/g, " ")}</td>
                      <td>Rp{parseFloat(p.nominal || 0).toLocaleString()}</td>
                      <td><span className="pill" style={{ background: s.bg, color: s.color }}>{p.status}</span></td>
                      <td><div className="row-actions">
                        {p.status?.toString().toLowerCase() !== "selesai" && <button onClick={() => updateStatus("transaksi_warga", p.id, "Selesai")} className="btn-sm btn-leaf">Verifikasi</button>}
                        <button onClick={() => removeData("transaksi_warga", p.id)} className="btn-sm btn-danger">Hapus</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "pengangkutan" && (
        <div className="card">
          <h3><span className="bar" />Data Pengangkutan</h3>
          {list.angkut.length === 0 ? <div className="empty-note">Belum ada data pengangkutan.</div> : (
            <table className="modern-table">
              <thead><tr><th>Warga</th><th>Driver</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {list.angkut.map((a) => {
                  const s = statusPillStyle(a.status);
                  return (
                    <tr key={a.id}>
                      <td>{a.warga_nama || "-"}</td>
                      <td>{a.transporter_nama || "-"}</td>
                      <td><span className="pill" style={{ background: s.bg, color: s.color }}>{a.status}</span></td>
                      <td><div className="row-actions">
                        {a.status !== "Selesai" && <button onClick={() => updateStatus("pengangkutan", a.id, "Selesai")} className="btn-sm btn-leaf">Selesai</button>}
                        <button onClick={() => removeData("pengangkutan", a.id)} className="btn-sm btn-danger">Hapus</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "transaksi" && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Transaksi Warga</div>
              <div className="stat-value" style={{ color: "var(--ink)" }}>{stats.total_transaksi_warga}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Terverifikasi</div>
              <div className="stat-value" style={{ color: "var(--leaf)" }}>Rp{stats.total_terverifikasi.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Pending</div>
              <div className="stat-value" style={{ color: "#8A5B12" }}>Rp{stats.total_pending.toLocaleString()}</div>
            </div>
          </div>
          <div className="card">
            <h3><span className="bar" />Detail Transaksi Warga</h3>
            <table className="modern-table">
              <thead><tr><th>Tanggal</th><th>Warga</th><th>Jenis</th><th>Nominal</th><th>Status</th></tr></thead>
              <tbody>
                {list.bayar.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px 12px" }}>Tidak ada transaksi</td></tr>
                ) : (
                  list.bayar.map((t) => {
                    const s = statusPillStyle(t.status);
                    return (
                      <tr key={t.id}>
                        <td>{new Date(t.tanggal).toLocaleDateString()}</td>
                        <td>{t.warga?.nama}</td>
                        <td>{t.jenis?.replace(/_/g, " ")}</td>
                        <td>Rp{parseFloat(t.nominal || 0).toLocaleString()}</td>
                        <td><span className="pill" style={{ background: s.bg, color: s.color }}>{t.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "laporan" && (
        <div className="card">
          <h3><span className="bar" />Ekspor Laporan</h3>
          <div className="export-bar">
            <select value={laporanType} onChange={(e) => setLaporanType(e.target.value)} style={{ padding: "9px 12px", borderRadius: "9px", border: "1.5px solid var(--border)", background: "#FBFAF4", fontSize: "13.5px", fontFamily: "'Inter', sans-serif", color: "var(--ink)", outline: "none", cursor: "pointer" }}>
              <option value="pengangkutan">Pengangkutan</option>
              <option value="pembayaran">Pembayaran</option>
              <option value="warga">Data Warga</option>
            </select>
            <button onClick={handleExportExcel} className="btn-sm btn-teal">Export Excel</button>
            <button onClick={handleExportPDF} className="btn-sm btn-amber">Export PDF</button>
          </div>

          {laporanType === "pengangkutan" && (
            <table className="modern-table">
              <thead><tr><th>Warga</th><th>Driver</th><th>Status</th></tr></thead>
              <tbody>
                {list.angkut.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: "center", padding: "20px 12px" }}>Tidak ada data</td></tr>
                ) : (
                  list.angkut.map((a) => {
                    const s = statusPillStyle(a.status);
                    return (
                      <tr key={a.id}>
                        <td>{a.warga_nama || "-"}</td>
                        <td>{a.transporter_nama || "-"}</td>
                        <td><span className="pill" style={{ background: s.bg, color: s.color }}>{a.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {laporanType === "pembayaran" && (
            <table className="modern-table">
              <thead><tr><th>Tanggal</th><th>Warga</th><th>Jenis</th><th>Nominal</th><th>Status</th></tr></thead>
              <tbody>
                {list.bayar.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px 12px" }}>Tidak ada data</td></tr>
                ) : (
                  list.bayar.map((p) => {
                    const s = statusPillStyle(p.status);
                    return (
                      <tr key={p.id}>
                        <td>{p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                        <td>{p.warga?.nama || "-"}</td>
                        <td>{(p.jenis || "").replace(/_/g, " ")}</td>
                        <td>Rp{parseFloat(p.nominal || 0).toLocaleString()}</td>
                        <td><span className="pill" style={{ background: s.bg, color: s.color }}>{p.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {laporanType === "warga" && (
            <table className="modern-table">
              <thead><tr><th>Nama</th><th>Alamat</th></tr></thead>
              <tbody>
                {list.warga.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: "center", padding: "20px 12px" }}>Tidak ada data</td></tr>
                ) : (
                  list.warga.map((w) => (
                    <tr key={w.id}>
                      <td>{w.nama || "-"}</td>
                      <td>{w.alamat || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}