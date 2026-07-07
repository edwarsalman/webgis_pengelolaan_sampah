import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map, { parseLocation } from "../components/Map";

const getAssignmentColumn = (row) => {
  if (!row) return null;
  if (Object.prototype.hasOwnProperty.call(row, "courier_id"))
    return "courier_id";
  if (Object.prototype.hasOwnProperty.call(row, "transporter_id"))
    return "transporter_id";
  if (Object.prototype.hasOwnProperty.call(row, "driver_id"))
    return "driver_id";
  if (Object.prototype.hasOwnProperty.call(row, "courier")) return "courier";
  if (Object.prototype.hasOwnProperty.call(row, "transporter"))
    return "transporter";
  return Object.keys(row).find(
    (key) =>
      key !== "id" &&
      key !== "warga_id" &&
      key !== "pengangkutan_id" &&
      key.endsWith("_id"),
  );
};

const normalizeAssignmentValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "object") {
    if (value.id) return value.id;
    return null;
  }
  return null;
};

const getAssignedCourierId = (row) => {
  if (!row) return null;
  const candidates = [
    row.courier_id,
    row.transporter_id,
    row.driver_id,
    row.courier,
    row.transporter,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeAssignmentValue(candidate);
    if (normalized) return normalized;
  }
  const assignmentColumn = getAssignmentColumn(row);
  return assignmentColumn
    ? normalizeAssignmentValue(row[assignmentColumn])
    : null;
};

const getPrimaryRowId = (row) => {
  if (!row || typeof row !== "object") return null;
  if (row.id) return { key: "id", value: row.id };
  if (row.pengangkutan_id)
    return { key: "pengangkutan_id", value: row.pengangkutan_id };
  const candidate = Object.keys(row).find(
    (key) =>
      key.endsWith("_id") &&
      !["warga_id", "courier_id", "transporter_id", "driver_id"].includes(key),
  );
  return candidate ? { key: candidate, value: row[candidate] } : null;
};

const getPrimaryRowIdValue = (row) => {
  const primary = getPrimaryRowId(row);
  return primary ? primary.value : null;
};

const normalizeStatus = (status) => {
  if (status === null || status === undefined) return "";
  return String(status).trim().toLowerCase();
};

const isWaitingStatus = (status) => {
  const normalized = normalizeStatus(status);
  return (
    normalized === "" || ["menunggu", "pending", "waiting"].includes(normalized)
  );
};

const isInProgressStatus = (status) => {
  const normalized = normalizeStatus(status);
  return [
    "proses",
    "in progress",
    "in_progress",
    "processing",
    "ongoing",
  ].includes(normalized);
};

const isDoneStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["selesai", "completed", "done"].includes(normalized);
};

const statusPillStyle = (status) => {
  if (isDoneStatus(status)) return { bg: "rgba(63,163,77,0.12)", color: "#1F4B3F" };
  if (isInProgressStatus(status)) return { bg: "rgba(42,111,119,0.12)", color: "#2A6F77" };
  if (isWaitingStatus(status)) return { bg: "rgba(232,163,61,0.15)", color: "#8A5B12" };
  return { bg: "rgba(75,85,99,0.1)", color: "#374151" };
};

export default function Courier() {
  const [tab, setTab] = useState("peta");
  const [data, setData] = useState({ warga: [], tugas: [] });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
  });
  const [myId, setMyId] = useState(null);

  const fetchAll = async (tid) => {
    const { data: warga, error: errWarga } = await supabase
      .from("warga")
      .select("*, transaksi_warga(status)");
    if (errWarga) {
      console.error("Error fetching warga:", JSON.stringify(errWarga, null, 2));
    }

    const { data: tugasRaw, error: errTugas } = await supabase
      .from("pengangkutan")
      .select("*");
    if (errTugas) {
      console.error(
        "Error fetching pengangkutan:",
        JSON.stringify(errTugas, null, 2),
      );
      alert("Gagal memuat data tugas. Lihat console untuk detail.");
      setData({ warga: warga || [], tugas: [] });
      setPendingRequests([]);
      return;
    }

    let tugas = [];
    if (tugasRaw && tugasRaw.length) {
      console.log(
        "Courier raw tugas sample:",
        tugasRaw[0],
        Object.keys(tugasRaw[0] || {}),
      );
      const wargaIds = Array.from(
        new Set(tugasRaw.map((t) => t.warga_id).filter(Boolean)),
      );
      let wargaMap = {};
      if (wargaIds.length) {
        const { data: wargaInfo, error: errW } = await supabase
          .from("warga")
          .select("id,nama,alamat,location")
          .in("id", wargaIds);
        if (errW) {
          console.error(
            "Error fetching warga for tugas hydration:",
            JSON.stringify(errW, null, 2),
          );
        }
        (wargaInfo || []).forEach((w) => (wargaMap[w.id] = w));
      }
      tugas = tugasRaw.map((t) => ({
        ...t,
        warga: wargaMap[t.warga_id] || null,
      }));
    }

    const tugasFiltered = (tugas || []).filter((t) => {
      const assignedId = getAssignedCourierId(t);
      return assignedId && assignedId === tid;
    });
    const requestList = (tugas || []).filter((t) => {
      const assignedId = getAssignedCourierId(t);
      return !assignedId && !isDoneStatus(t.status);
    });

    console.log("Courier tasks:", {
      tid,
      total: tugas.length,
      tugasFilteredCount: tugasFiltered.length,
      requestCount: requestList.length,
      sample: tugas.slice(0, 5),
    });

    setData({ warga: warga || [], tugas: tugasFiltered });
    setPendingRequests(requestList);
    setTaskCounts({
      total: tugas.length,
      pending: requestList.length,
      assigned: tugasFiltered.length,
    });
    console.log("Courier fetched tugas", {
      tid,
      total: tugas.length,
      pending: requestList.length,
      assigned: tugasFiltered.length,
      sample: tugas.slice(0, 5),
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMyId(user.id);
        fetchAll(user.id);
      }
    });
  }, []);

  const handleClaim = async (row) => {
    const primaryId = getPrimaryRowId(row);
    if (!primaryId || !primaryId.value) {
      console.error("Unable to determine primary key for pengangkutan:", row);
      alert("Tidak dapat menemukan kunci utama tugas. Hubungi admin.");
      return;
    }

    if (!myId) {
      alert("Sesi anda belum siap. Silakan tunggu sebentar lalu coba lagi.");
      return;
    }

    // Determine which column actually holds the assignment on this row,
    // falling back to "courier_id" (the column used across the app).
    const assignmentColumn = getAssignmentColumn(row) || "courier_id";

    try {
      const updatePayload = { status: "Selesai" };
      updatePayload[assignmentColumn] = myId;

      const { data: updated, error } = await supabase
        .from("pengangkutan")
        .update(updatePayload)
        .eq(primaryId.key, primaryId.value)
        .is(assignmentColumn, null)
        .select()
        .maybeSingle();

      if (error) {
        console.error(
          "Error claiming tugas (update):",
          JSON.stringify(error, null, 2),
        );
        alert("Gagal mengambil tugas. Silakan coba lagi.");
        return fetchAll(myId);
      }

      if (!updated) {
        alert("Tugas ini sudah diambil oleh kurir lain.");
        return fetchAll(myId);
      }

      alert("Tugas berhasil diambil dan ditandai Selesai.");
    } catch (e) {
      console.error("Unhandled error in handleClaim:", e);
      alert("Terjadi kesalahan saat mengambil tugas.");
    }
    fetchAll(myId);
  };

  const handleStatus = async (row, status) => {
    const primaryId = getPrimaryRowId(row);
    if (!primaryId || !primaryId.value) {
      console.error("Unable to determine primary key for pengangkutan:", row);
      return;
    }
    await supabase
      .from("pengangkutan")
      .update({ status })
      .eq(primaryId.key, primaryId.value);
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
    <div className="courier-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        * { box-sizing: border-box; }

        .courier-shell {
          --ink: #16211C;
          --forest: #1F4B3F;
          --leaf: #3FA34D;
          --teal: #2A6F77;
          --sand: #F5F2E6;
          --amber: #E8A33D;
          --border: #E4E1D3;

          min-height: 100vh;
          background: var(--sand);
          background-image: radial-gradient(rgba(31,75,63,0.08) 1px, transparent 1.4px);
          background-size: 26px 26px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          padding: 24px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, var(--forest) 0%, var(--ink) 100%);
          color: #F3F1E8;
          border-radius: 16px;
          padding: 18px 24px;
          margin-bottom: 20px;
          box-shadow: 0 16px 32px -18px rgba(22,33,28,0.5);
        }

        .topbar-left { display: flex; align-items: center; gap: 12px; }

        .topbar-mark {
          width: 40px; height: 40px; border-radius: 11px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
        }
        .topbar-mark svg { width: 20px; height: 20px; }

        .topbar-title {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 19px;
          margin: 0;
        }
        .topbar-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #BFE7C8;
          margin-top: 2px;
        }
        .topbar-badge .dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--leaf);
          animation: ping 2.2s ease-out infinite;
        }
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 rgba(63,163,77,0.55); }
          70%  { box-shadow: 0 0 0 6px rgba(63,163,77,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,163,77,0); }
        }

        .btn-logout {
          background: rgba(220,38,38,0.14);
          color: #FCA5A5;
          border: 1px solid rgba(220,38,38,0.3);
          padding: 9px 16px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }
        .btn-logout:hover { background: rgba(220,38,38,0.22); color: #FEE2E2; }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: 0 1px 2px rgba(22,33,28,0.04);
        }
        .stat-card .stat-label {
          font-size: 12px;
          font-weight: 700;
          color: #6B7568;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .stat-card .stat-value {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 26px;
          color: var(--ink);
        }
        .stat-card.total .stat-value { color: var(--ink); }
        .stat-card.pending .stat-value { color: #8A5B12; }
        .stat-card.assigned .stat-value { color: var(--leaf); }

        .tabs {
          display: inline-flex;
          gap: 4px;
          background: #EDEADD;
          padding: 4px;
          border-radius: 11px;
          margin-bottom: 18px;
        }
        .tab-btn {
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          background: transparent;
          color: #5B6459;
          transition: background .16s ease, color .16s ease, box-shadow .16s ease;
        }
        .tab-btn.active {
          background: var(--ink);
          color: #F3F1E8;
          box-shadow: 0 6px 14px -6px rgba(22,33,28,0.4);
        }

        .card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 22px 24px 24px;
          border: 1px solid var(--border);
          box-shadow: 0 1px 2px rgba(22,33,28,0.04), 0 18px 36px -22px rgba(22,33,28,0.18);
        }

        .card h3 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 16px;
          margin: 0 0 16px;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card h3 .bar { width: 4px; height: 16px; background: var(--leaf); border-radius: 3px; }

        .map-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 1.5px solid var(--border);
        }

        .empty-note {
          padding: 20px;
          background: #FBFAF4;
          border: 1px dashed var(--border);
          border-radius: 12px;
          color: #6B7568;
          font-size: 14px;
        }

        table.modern-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }
        .modern-table thead th {
          text-align: left;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6B7568;
          padding: 10px 12px;
          border-bottom: 2px solid var(--border);
        }
        .modern-table tbody td {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          color: #26312B;
          vertical-align: middle;
        }
        .modern-table tbody tr:hover { background: #FBFAF4; }
        .modern-table tbody tr:last-child td { border-bottom: none; }

        .pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }

        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .btn-sm {
          border: none;
          padding: 7px 13px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          color: #fff;
          transition: transform .12s ease, filter .18s ease;
        }
        .btn-sm:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .btn-sm:active { transform: translateY(0); }

        .btn-primary { background: var(--ink); }
        .btn-leaf { background: var(--leaf); }
        .btn-amber { background: var(--amber); }
        .btn-teal { background: var(--teal); }

        @media (max-width: 720px) {
          .stats-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7h11l3 4h4v6h-2" stroke="#3FA34D" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M3 7v9h2" stroke="#3FA34D" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="17" r="2" stroke="#3FA34D" strokeWidth="1.6" />
              <circle cx="17" cy="17" r="2" stroke="#3FA34D" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <h2 className="topbar-title">Courier Dashboard</h2>
            <div className="topbar-badge"><span className="dot" />WebGIS Sampah</div>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="btn-logout"
        >
          Logout
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card total">
          <div className="stat-label">Total Tugas</div>
          <div className="stat-value">{taskCounts.total}</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-label">Permintaan</div>
          <div className="stat-value">{taskCounts.pending}</div>
        </div>
        <div className="stat-card assigned">
          <div className="stat-label">Tugas Saya</div>
          <div className="stat-value">{taskCounts.assigned}</div>
        </div>
      </div>

      <div className="tabs">
        <button
          onClick={() => setTab("peta")}
          className={`tab-btn ${tab === "peta" ? "active" : ""}`}
        >
          Peta Kerja
        </button>
        <button
          onClick={() => setTab("warga")}
          className={`tab-btn ${tab === "warga" ? "active" : ""}`}
        >
          Permintaan
        </button>
        <button
          onClick={() => setTab("tugas")}
          className={`tab-btn ${tab === "tugas" ? "active" : ""}`}
        >
          Tugas Saya
        </button>
      </div>

      {tab === "peta" && (
        <div className="card">
          <h3><span className="bar" />Peta Kerja</h3>
          <div className="map-wrap">
            <Map data={data.warga} />
          </div>
        </div>
      )}

      {tab === "warga" && (
        <div className="card">
          <h3><span className="bar" />Permintaan Pengangkutan</h3>
          {pendingRequests.length === 0 ? (
            <div className="empty-note">
              Tidak ada permintaan pengangkutan yang belum diambil.
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req, index) => {
                  const s = statusPillStyle(req.status || "Menunggu");
                  return (
                    <tr key={req.id || req.pengangkutan_id || index}>
                      <td>
                        {req.warga?.nama ||
                          req.nama ||
                          req.warga_name ||
                          req.warga_nama ||
                          "-"}
                      </td>
                      <td>
                        {req.warga?.alamat ||
                          req.alamat ||
                          req.warga_alamat ||
                          req.warga_address ||
                          "-"}
                      </td>
                      <td>
                        <span className="pill" style={{ background: s.bg, color: s.color }}>
                          {req.status || "Menunggu"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => handleClaim(req)}
                            className="btn-sm btn-primary"
                          >
                            Ambil Tugas
                          </button>
                          <button
                            onClick={() =>
                              openRoute(req.warga?.location || req.location)
                            }
                            className="btn-sm btn-amber"
                          >
                            Rute
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "tugas" && (
        <div className="card">
          <h3><span className="bar" />Tugas Saya</h3>
          {data.tugas.length === 0 ? (
            <div className="empty-note">Belum ada tugas yang anda ambil.</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nama Warga</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.tugas.map((t, index) => {
                  const s = statusPillStyle(t.status || "Menunggu");
                  return (
                    <tr key={t.id || t.pengangkutan_id || index}>
                      <td>
                        {t.warga?.nama ||
                          t.nama ||
                          t.warga_name ||
                          t.warga_nama ||
                          "-"}
                      </td>
                      <td>
                        <span className="pill" style={{ background: s.bg, color: s.color }}>
                          {t.status || "Menunggu"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {!isDoneStatus(t.status) && (
                            <button
                              onClick={() => handleStatus(t, "Selesai")}
                              className="btn-sm btn-leaf"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            onClick={() => openRoute(t.warga?.location || t.location)}
                            className="btn-sm btn-amber"
                          >
                            Rute
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
