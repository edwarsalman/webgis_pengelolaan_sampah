import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email || !password) {
      alert("Email dan password harus diisi");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error("Login error:", error);
      if (error.message.includes("Invalid login credentials")) {
        alert("Email atau password salah. Pastikan akun Anda sudah terdaftar.");
      } else if (error.message.includes("Email not confirmed")) {
        alert("Email belum diverifikasi. Silakan cek email Anda.");
      } else {
        alert("Gagal Login: " + error.message);
      }
    } else {
      // Clear inputs setelah login berhasil
      setEmail("");
      setPassword("");
      // Tunggu sebentar sebelum redirect untuk memastikan session tersimpan
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  };

  // --- STYLE CSS INLINE MODERN ---
  const styles = {
    // Container Utama untuk Pusatkan Kartu
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh", // Penuh satu layar
      backgroundColor: "#f3f4f6", // Abu-abu sangat muda untuk background
      fontFamily: "'Poppins', sans-serif", // Gunakan font yang bagus jika ada
    },
    // Kartu Login
    card: {
      backgroundColor: "#ffffff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.05)", // Bayangan lembut
      width: "100%",
      maxWidth: "400px", // Lebar maksimal kartu
      textAlign: "center",
    },
    // Judul
    title: {
      marginBottom: "30px",
      color: "#1f2937", // Abu-abu gelap
      fontWeight: "600",
      fontSize: "28px",
    },
    // Grup Input (untuk spasi)
    inputGroup: {
      marginBottom: "20px",
      textAlign: "left", // Label alinea kiri
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#4b5563",
      fontSize: "14px",
      fontWeight: "500",
    },
    // Input Field
    input: {
      width: "100%",
      padding: "12px 15px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      fontSize: "16px",
      boxSizing: "border-box", // Penting agar padding tidak nambah lebar
      transition: "border-color 0.2s",
      outline: "none", // Hapus outline default
    },
    // Input Fokus (efek saat diklik)
    inputFocus: {
      border: "1px solid #3b82f6", // Warna biru saat fokus (full border property)
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    // Tombol Login Modern
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // Gradasi Biru
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "transform 0.1s, box-shadow 0.2s",
      boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)",
    },
    // Teks Bawah
    footerText: {
      marginTop: "25px",
      color: "#6b7280",
      fontSize: "14px",
    },
    // Link
    link: {
      color: "#2563eb",
      textDecoration: "none",
      fontWeight: "500",
    },
  };

  // State untuk efek fokus input (opsional, untuk interaktivitas)
  const [focusedInput, setFocusedInput] = useState(null);

  const getInputStyle = (inputName) => {
    return focusedInput === inputName
      ? { ...styles.input, ...styles.inputFocus }
      : styles.input;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Selamat Datang</h2>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          Silakan login ke akun Anda
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
            placeholder="nama@email.com"
            style={getInputStyle("email")}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
            placeholder="••••••••"
            style={getInputStyle("password")}
          />
        </div>

        <button
          onClick={login}
          style={styles.button}
          // Efek hover sederhana dengan inline style (opsional)
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 6px 12px rgba(37, 99, 235, 0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px rgba(37, 99, 235, 0.2)";
          }}
        >
          Masuk
        </button>

        <p style={styles.footerText}>
          Belum punya akun?{" "}
          <Link to="/register" style={styles.link}>
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
