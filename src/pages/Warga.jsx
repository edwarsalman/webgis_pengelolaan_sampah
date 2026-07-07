import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";

const statusStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("selesai")) return { bg: "rgba(63,163,77,0.12)", color: "#1F4B3F" };
  if (s.includes("proses")) return { bg: "rgba(42,111,119,0.12)", color: "#2A6F77" };
  if (s.includes("tolak") || s.includes("batal")) return { bg: "rgba(220,38,38,0.1)", color: "#B91C1C" };
  return { bg: "rgba(232,163,61,0.15)", color: "#8A5B12" }; // menunggu / default
};

export default function Warga() {
  const [warga, setWarga] = useState(null);
  const [latLng, setLatLng] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    alamat: "",
    jenis: "",
    berat: "",
  });
  const [history, setHistory] = useState({ sampah: [], bayar: [], angkut: [] });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    nominal: "",
    deskripsi: "",
  });

  const refreshData = async (wargaId) => {
    const { data: sampah } = await supabase
      .from("sampah")
      .select("*")
      .eq("warga_id", wargaId);
    const { data: bayar } = await supabase
      .from("transaksi_warga")
      .select("*")
      .eq("warga_id", wargaId)
      .in("jenis", ["pembayaran_iuran", "pembayaran_jasa"])
      .order("tanggal", { ascending: false });
    const { data: angkut } = await supabase
      .from("pengangkutan")
      .select("*, profiles:courier_id(name)")
      .eq("warga_id", wargaId);

    setHistory({
      sampah: sampah || [],
      bayar: bayar || [],
      angkut: angkut || [],
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("warga")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setWarga(data);
              setForm({ nama: data.nama, alamat: data.alamat });
              refreshData(data.id);
            }
          });
      }
    });
  }, []);

  const saveProfile = async () => {
    if (!latLng) return alert("Pilih lokasi anda di peta terlebih dahulu!");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      nama: form.nama,
      alamat: form.alamat,
      location: `POINT(${latLng.lng} ${latLng.lat})`,
    };

    const { data, error } = await supabase
      .from("warga")
      .upsert(payload)
      .select()
      .single();
    if (!error) {
      setWarga(data);
      alert("Profil dan lokasi berhasil disimpan!");
      refreshData(data.id);
    }
  };

  const addData = async (table, extraPayload) => {
    if (!warga) return alert("Simpan profil anda terlebih dahulu!");
    const { error } = await supabase
      .from(table)
      .insert({ warga_id: warga.id, ...extraPayload });
    if (!error) {
      alert("Berhasil mengirim data!");
      refreshData(warga.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="warga-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        * { box-sizing: border-box; }

        .warga-shell {
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
          margin-bottom: 24px;
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

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          align-items: start;
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

        .card h4 {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #4B554E;
          margin: 18px 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .field-label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #47504A;
          margin-bottom: 6px;
        }

        .input {
          width: 100%;
          padding: 11px 14px;
          margin-bottom: 14px;
          border-radius: 9px;
          border: 1.5px solid var(--border);
          background: #FBFAF4;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .input::placeholder { color: #A9AE9F; }
        .input:focus {
          border-color: var(--leaf);
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(63,163,77,0.13);
        }
        textarea.input { min-height: 80px; resize: vertical; font-family: inherit; }

        .map-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 1.5px solid var(--border);
          margin-bottom: 14px;
        }

        .btn {
          width: 100%;
          border: none;
          padding: 12px 16px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          color: #fff;
          margin-bottom: 12px;
          transition: transform .12s ease, box-shadow .18s ease, filter .18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .btn:active { transform: translateY(0); }

        .btn-primary { background: var(--ink); box-shadow: 0 10px 20px -10px rgba(22,33,28,0.5); }
        .btn-leaf { background: var(--leaf); box-shadow: 0 10px 20px -10px rgba(63,163,77,0.5); }
        .btn-amber { background: var(--amber); box-shadow: 0 10px 20px -10px rgba(232,163,61,0.5); }
        .btn-teal { background: var(--teal); box-shadow: 0 10px 20px -10px rgba(42,111,119,0.5); }
        .btn-neutral { background: #8A9186; }
        .btn-auto { width: auto; margin-bottom: 0; }

        .history-item {
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13.5px;
          color: #3A4340;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .history-item:last-child { border-bottom: none; }

        .pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }

        .empty-note {
          font-size: 13px;
          color: #9AA097;
          padding: 8px 0;
        }

        .history-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(22,33,28,0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }
        .modal-card {
          background: #fff;
          border-radius: 16px;
          padding: 26px 26px 22px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 30px 60px -20px rgba(22,33,28,0.4);
        }
        .modal-card h3 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 18px;
          margin: 0 0 18px;
          color: var(--ink);
        }
        .modal-actions { display: flex; gap: 10px; margin-top: 4px; }
        .modal-actions .btn { margin-bottom: 0; }

        @media (max-width: 900px) {
          .grid, .history-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
                stroke="#3FA34D" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M9.3 9.6c0-1.6 1.2-2.8 2.7-2.8s2.7 1.2 2.7 2.8-1.2 3.1-2.7 4.4c-1.5-1.3-2.7-2.8-2.7-4.4Z"
                stroke="#3FA34D" strokeWidth="1.4" />
            </svg>
          </div>
          <div>
            <h2 className="topbar-title">Dashboard Warga</h2>
            <div className="topbar-badge"><span className="dot" />WebGIS Sampah</div>
          </div>
        </div>
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>

      <div className="grid">
        <div className="card">
          <h3><span className="bar" />Profil & Lokasi Rumah</h3>

          <label className="field-label">Nama Warga</label>
          <input
            className="input"
            placeholder="Nama Warga"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />

          <label className="field-label">Alamat Rumah</label>
          <input
            className="input"
            placeholder="Alamat Rumah"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />

          <div className="map-wrap">
            <Map
              setLatLng={setLatLng}
              selectedMarker={latLng}
              data={warga ? [warga] : []}
            />
          </div>

          <button onClick={saveProfile} className="btn btn-primary">
            Simpan Profil & Lokasi
          </button>
        </div>

        <div className="card">
          <h3><span className="bar" />Aksi / Layanan Sampah</h3>

          <label className="field-label">Jenis Sampah</label>
          <input
            className="input"
            placeholder="Organik / Anorganik"
            onChange={(e) => setForm({ ...form, jenis: e.target.value })}
          />

          <label className="field-label">Berat (kg)</label>
          <input
            className="input"
            placeholder="Berat (kg)"
            type="number"
            onChange={(e) => setForm({ ...form, berat: e.target.value })}
          />

          <button
            onClick={() => addData("sampah", { jenis: form.jenis, berat: form.berat })}
            className="btn btn-leaf"
          >
            Kirim Data Sampah
          </button>
          <button
            onClick={() => addData("pengangkutan", { status: "Menunggu" })}
            className="btn btn-amber"
          >
            Request Pengangkutan
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn btn-teal">
            Bayar Iuran
          </button>

          {showPaymentModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h3>Bayar Iuran</h3>

                <label className="field-label">Nominal (Rp)</label>
                <input
                  type="number"
                  value={paymentForm.nominal}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, nominal: e.target.value })
                  }
                  className="input"
                  placeholder="Masukkan jumlah iuran"
                />

                <label className="field-label">Deskripsi (opsional)</label>
                <textarea
                  value={paymentForm.deskripsi}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, deskripsi: e.target.value })
                  }
                  className="input"
                  placeholder="Catatan pembayaran"
                />

                <div className="modal-actions">
                  <button
                    onClick={async () => {
                      if (!warga) return alert("Simpan profil anda terlebih dahulu!");
                      if (!paymentForm.nominal) return alert("Masukkan nominal pembayaran.");
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      const { error } = await supabase
                        .from("transaksi_warga")
                        .insert([
                          {
                            warga_id: warga.id,
                            user_id: user?.id || null,
                            jenis: "pembayaran_iuran",
                            nominal: parseFloat(paymentForm.nominal),
                            deskripsi: paymentForm.deskripsi || null,
                            tanggal: new Date(),
                            status: "selesai",
                          },
                        ])
                        .select()
                        .single();
                      if (error) {
                        console.error("Gagal mengirim pembayaran:", error);
                        alert("Gagal mengirim pembayaran. Silakan coba lagi.");
                        return;
                      }
                      alert("Pembayaran dikirim ke admin untuk diverifikasi.");
                      setShowPaymentModal(false);
                      setPaymentForm({ nominal: "", deskripsi: "" });
                      refreshData(warga.id);
                    }}
                    className="btn btn-leaf"
                  >
                    Kirim Pembayaran
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="btn btn-neutral"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3><span className="bar" />Riwayat Pengangkutan & Pembayaran</h3>

        <div className="history-grid">
          <div>
            <h4>Pengangkutan</h4>
            {history.angkut.length === 0 && (
              <div className="empty-note">Belum ada riwayat pengangkutan.</div>
            )}
            {history.angkut.map((a) => {
              const s = statusStyle(a.status);
              return (
                <div key={a.id} className="history-item">
                  <span>
                    {a.profiles?.name ? `Kurir: ${a.profiles.name}` : "Menunggu kurir"}
                  </span>
                  <span className="pill" style={{ background: s.bg, color: s.color }}>
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <h4>Pembayaran</h4>
            {history.bayar.length === 0 && (
              <div className="empty-note">Belum ada riwayat pembayaran.</div>
            )}
            {history.bayar.map((b) => {
              const s = statusStyle(b.status);
              return (
                <div key={b.id} className="history-item">
                  <span>{new Date(b.tanggal).toLocaleDateString()}</span>
                  <span className="pill" style={{ background: s.bg, color: s.color }}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}