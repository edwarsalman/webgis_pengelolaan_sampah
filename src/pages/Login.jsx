import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Email dan Password harus diisi");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        alert("Email atau Password salah.");
      } else if (error.message.includes("Email not confirmed")) {
        alert("Email belum diverifikasi.");
      } else {
        alert(error.message);
      }
      return;
    }

    window.location.href = "/";
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

        /* topographic contour rings, faint */
        .contours {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .contours svg { width: 100%; height: 100%; }

        /* dot grid */
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
          max-width: 480px;
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
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--leaf);
          box-shadow: 0 0 0 0 rgba(63,163,77,0.6);
          animation: ping 2.2s ease-out infinite;
        }
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 rgba(63,163,77,0.55); }
          70%  { box-shadow: 0 0 0 7px rgba(63,163,77,0); }
          100% { box-shadow: 0 0 0 0 rgba(63,163,77,0); }
        }

        .mark {
          width: 50px;
          height: 50px;
          border-radius: 13px;
          background: linear-gradient(140deg, var(--forest) 0%, var(--ink) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
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
          margin: 0 0 28px;
          line-height: 1.55;
        }

        .field { margin-bottom: 17px; }

        .field label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #47504A;
          margin-bottom: 7px;
        }

        .field-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field input {
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

        .field input:focus {
          border-color: var(--leaf);
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(63,163,77,0.14);
        }

        .toggle-visibility {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #8B9186;
          padding: 4px 6px;
        }
        .toggle-visibility:hover { color: var(--ink); }

        .row-between {
          display: flex;
          justify-content: flex-end;
          margin: -7px 0 20px;
        }
        .row-between a { font-size: 13px; color: #838B7F; text-decoration: none; }
        .row-between a:hover { color: var(--ink); }

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
          transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
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

        .divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0 18px;
        }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #ECE9DA; }
        .divider span { font-size: 12px; color: #ADB2A2; }

        .switch-line { text-align: center; color: #6B7568; font-size: 14px; margin: 0; }
        .switch-line a {
          color: var(--ink); font-weight: 700; text-decoration: none;
          border-bottom: 1.5px solid var(--leaf);
        }

        @media (max-width: 540px) {
          .card { padding: 32px 24px 26px; border-radius: 18px; }
        }
      `}</style>

      {/* decorative topographic contours + route */}
      <div className="contours" aria-hidden="true">
        <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
          <g fill="none" strokeWidth="1.2">
            <path d="M -50 620 Q 150 560, 300 610 T 650 590 T 900 630"
              stroke="#2A6F77" opacity="0.16" />
            <path d="M -50 670 Q 170 600, 330 660 T 660 640 T 900 680"
              stroke="#2A6F77" opacity="0.12" />
            <path d="M -50 720 Q 190 650, 360 710 T 690 690 T 900 730"
              stroke="#2A6F77" opacity="0.09" />
            <path d="M -50 130 Q 130 80, 260 120 T 560 100 T 850 140"
              stroke="#1F4B3F" opacity="0.10" />
            <path d="M -50 90 Q 150 40, 290 80 T 590 60 T 850 100"
              stroke="#1F4B3F" opacity="0.07" />
          </g>
          <g strokeDasharray="4 6" stroke="#3FA34D" strokeOpacity="0.35" fill="none" strokeWidth="1.4">
            <path d="M 620 120 C 700 180, 700 260, 640 320" />
          </g>
          <circle cx="620" cy="120" r="4.5" fill="#1F4B3F" opacity="0.5" />
          <circle cx="640" cy="320" r="4.5" fill="#3FA34D" opacity="0.6" />
        </svg>
      </div>

      <div className="card">
        <div className="badge">
          <span className="dot" />
          WebGIS Sampah
        </div>

        <div className="mark">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
              stroke="#3FA34D" strokeWidth="1.7" strokeLinejoin="round"
            />
            <path
              d="M9.3 9.6c0-1.6 1.2-2.8 2.7-2.8s2.7 1.2 2.7 2.8-1.2 3.1-2.7 4.4c-1.5-1.3-2.7-2.8-2.7-4.4Z"
              stroke="#3FA34D" strokeWidth="1.5"
            />
          </svg>
        </div>

        <h2>Masuk ke peta sampah</h2>
        <p className="sub">
          Pantau titik TPS, jadwal angkut, dan laporan warga secara langsung di peta.
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="field-input">
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
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
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              autoComplete="current-password"
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
        </div>

        <div className="row-between">
          <Link to="/forgot-password">Lupa password?</Link>
        </div>

        <button className="submit-btn" onClick={login} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Memproses..." : "Login"}
        </button>

        <div className="divider"><span>atau</span></div>

        <p className="switch-line">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
