import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "warga",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!form.nama || !form.email || !form.password) {
      alert("Semua field harus diisi");
      return;
    }
    if (form.password.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        console.error("Signup error:", error);
        if (error.message.includes("User already registered")) {
          alert("Email ini sudah terdaftar. Silakan login atau gunakan email lain.");
        } else {
          alert("Gagal Daftar: " + error.message);
        }
        return;
      }

      if (!data.user) {
        alert("Gagal membuat akun. Silakan coba lagi.");
        return;
      }

      const profileData = {
        id: data.user.id,
        nama: form.nama,
        role: form.role,
      };

      const { error: pError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (pError) {
        console.error("❌ Profile insert error:", pError);
        alert(`❌ GAGAL SIMPAN PROFIL\n\nError: ${pError.message}`);
        return;
      }

      alert("Pendaftaran Berhasil! Silakan login dengan akun Anda.");
      setForm({ nama: "", email: "", password: "", role: "warga" });
      navigate("/login");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    warga: { label: "Warga", desc: "Melaporkan titik sampah & memantau jadwal angkut" },
    courier: { label: "Courier", desc: "Menjalankan rute pengangkutan di peta" },
    admin: { label: "Admin", desc: "Mengelola data TPS, rute, dan pengguna" },
  };

  return (
    <div className="auth-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        * { box-sizing: border-box; }

        .auth-shell {
          --ink: #16211C;
          --forest: #1F4B3F;
          --leaf: #3FA34D;
          --teal: #2A6F77;
          --sand: #F5F2E6;
          --amber: #E8A33D;

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          background: var(--sand);
          position: relative;
          overflow: hidden;
        }

        .contours { position: absolute; inset: 0; pointer-events: none; }
        .contours svg { width: 100%; height: 100%; }

        .auth-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(31,75,63,0.14) 1px, transparent 1.4px);
          background-size: 26px 26px;
          mask-image: radial-gradient(circle at 50% 35%, black, transparent 72%);
          pointer-events: none;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 500px;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 46px 52px 38px;
          box-shadow:
            0 1px 2px rgba(22,33,28,0.05),
            0 24px 48px -18px rgba(22,33,28,0.24),
            0 0 0 1px rgba(22,33,28,0.05);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--teal);
          background: rgba(42,111,119,0.08);
          border: 1px solid rgba(42,111,119,0.18);
          padding: 6px 11px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .badge .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--leaf);
          animation: ping 2.2s ease-out infinite;
        }
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 rgba(63,163,77,0.55); }
          70%  { box-shadow: 0 0 0 7px rgba(63,163,77,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,163,77,0); }
        }

        .mark {
          width: 50px; height: 50px; border-radius: 13px;
          background: linear-gradient(140deg, var(--forest) 0%, var(--ink) 100%);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
          box-shadow: 0 10px 22px -8px rgba(22,33,28,0.55);
        }
        .mark svg { width: 24px; height: 24px; }

        .card h2 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 26px;
          color: var(--ink);
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .card .sub {
          color: #6B7568;
          font-size: 14px;
          margin: 0 0 26px;
          line-height: 1.55;
        }

        .field { margin-bottom: 16px; }

        .field label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #47504A;
          margin-bottom: 7px;
        }

        .field-input { position: relative; display: flex; align-items: center; }

        .field input,
        .field select {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          border: 1.5px solid #DEDBC9;
          background: #FBFAF4;
          font-size: 14.5px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .field input::placeholder { color: #A9AE9F; }

        .field input:focus,
        .field select:focus {
          border-color: var(--leaf);
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(63,163,77,0.14);
        }

        .field select {
          appearance: none;
          cursor: pointer;
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7568%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.3c0%204.9%201.8%209.2%205.4%2012.8l128.1%20128.1c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095.1c3.6-3.6%205.4-7.8%205.4-12.8%200-5-1.8-9.3-5.4-12.9z%22%2F%3E%3C%2Fsvg%3E');
          background-repeat: no-repeat;
          background-position: right 16px top 50%;
          background-size: 11px auto;
        }

        .toggle-visibility {
          position: absolute; right: 14px;
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 700; color: #8B9186;
          padding: 4px 6px;
        }
        .toggle-visibility:hover { color: var(--ink); }

        .hint { margin: 6px 2px 0; font-size: 12px; color: #9AA097; }

        .role-desc {
          margin: 7px 2px 0;
          font-size: 12px;
          color: var(--teal);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .role-desc .rd-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--teal);
          flex-shrink: 0;
        }

        .submit-btn {
          width: 100%;
          padding: 13.5px;
          border: none;
          border-radius: 10px;
          background: var(--ink);
          color: #F3F1E8;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--forest);
          box-shadow: 0 12px 24px -8px rgba(31,75,63,0.5);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(243,241,232,0.35);
          border-top-color: #F3F1E8;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .switch-line { text-align: center; color: #6B7568; font-size: 14px; margin: 22px 0 0; }
        .switch-line a {
          color: var(--ink); font-weight: 700; text-decoration: none;
          border-bottom: 1.5px solid var(--leaf);
        }

        @media (max-width: 540px) {
          .card { padding: 32px 24px 26px; border-radius: 18px; }
        }
      `}</style>

      <div className="contours" aria-hidden="true">
        <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
          <g fill="none" strokeWidth="1.2">
            <path d="M -50 620 Q 150 560, 300 610 T 650 590 T 900 630" stroke="#2A6F77" opacity="0.16" />
            <path d="M -50 670 Q 170 600, 330 660 T 660 640 T 900 680" stroke="#2A6F77" opacity="0.12" />
            <path d="M -50 720 Q 190 650, 360 710 T 690 690 T 900 730" stroke="#2A6F77" opacity="0.09" />
            <path d="M -50 130 Q 130 80, 260 120 T 560 100 T 850 140" stroke="#1F4B3F" opacity="0.10" />
            <path d="M -50 90 Q 150 40, 290 80 T 590 60 T 850 100" stroke="#1F4B3F" opacity="0.07" />
          </g>
          <g strokeDasharray="4 6" stroke="#3FA34D" strokeOpacity="0.35" fill="none" strokeWidth="1.4">
            <path d="M 150 680 C 220 620, 260 600, 210 540" />
          </g>
          <circle cx="150" cy="680" r="4.5" fill="#1F4B3F" opacity="0.5" />
          <circle cx="210" cy="540" r="4.5" fill="#3FA34D" opacity="0.6" />
        </svg>
      </div>

      <div className="card">
        <div className="badge">
          <span className="dot" />
          WebGIS Sampah
        </div>

        <div className="mark">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
              stroke="#3FA34D" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 6.2v2.6M9.5 9.6h5" stroke="#3FA34D" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h2>Buat akun baru</h2>
        <p className="sub">Bergabung untuk melapor, memantau, atau mengelola data sampah di peta.</p>

        <div className="field">
          <label htmlFor="nama">Nama Lengkap</label>
          <div className="field-input">
            <input
              id="nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              autoComplete="name"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="field-input">
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="field-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              style={{ paddingRight: "58px" }}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="hint">Gunakan minimal 6 karakter.</p>
        </div>

        <div className="field">
          <label htmlFor="role">Daftar Sebagai</label>
          <div className="field-input">
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="warga">Warga</option>
              <option value="courier">Courier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="role-desc">
            <span className="rd-dot" />
            {roleMeta[form.role].desc}
          </p>
        </div>

        <button className="submit-btn" onClick={handleRegister} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Memproses..." : "Daftar"}
        </button>

        <p className="switch-line">
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}