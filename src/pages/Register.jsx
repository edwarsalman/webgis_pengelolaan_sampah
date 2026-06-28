import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "warga", // Default role
  });

  const navigate = useNavigate();

  const handleRegister = async () => {
    // Validasi form
    if (!form.nama || !form.email || !form.password) {
      alert("Semua field harus diisi");
      return;
    }

    if (form.password.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }

    try {
      // 1. Daftarkan akun ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        console.error("Signup error:", error);
        if (error.message.includes("User already registered")) {
          alert(
            "Email ini sudah terdaftar. Silakan:\n1. Gunakan email lain\n2. Atau login jika sudah punya akun",
          );
        } else if (
          error.message.includes("Password should be at least 6 characters")
        ) {
          alert("Password minimal 6 karakter");
        } else {
          alert("Gagal Daftar: " + error.message);
        }
        return;
      }

      if (!data.user) {
        alert("Gagal membuat akun. Silakan coba lagi.");
        return;
      }

      // 2. Jika sukses auth, simpan data tambahan (nama & role) ke tabel 'profiles'
      // Pastikan tabel 'profiles' sudah dibuat di Supabase
      const profileData = {
        id: data.user.id,
        nama: form.nama,
        role: form.role,
      };

      console.log("📝 Attempting to insert profile with data:", profileData);

      const { data: insertedData, error: pError } = await supabase
        .from("profiles")
        .insert([profileData])
        .select();

      console.log("📊 Profile insert result:", {
        data: insertedData,
        error: pError,
      });

      if (pError) {
        console.error("❌ Profile insert error - Full Details:", {
          message: pError.message,
          code: pError.code,
          details: pError.details,
          hint: pError.hint,
          status: pError.status,
          fullError: pError,
        });
        alert(
          "❌ GAGAL SIMPAN PROFIL\n\n" +
            "Error: " +
            (pError.message || JSON.stringify(pError, null, 2)) +
            "\n\n" +
            "Tolong catat pesan error ini, lalu share jika masih bingung.\n\n" +
            "DEBUGGING:\n" +
            "1. Buka Supabase → Table Editor → profiles\n" +
            "2. Pastikan RLS ENABLED\n" +
            "3. Pastikan policy INSERT ada dan auth.uid() = id\n\n" +
            "Jika masih gagal, kirimkan pesan error lengkap dari alert ini",
        );
        return;
      }

      if (!insertedData || insertedData.length === 0) {
        console.warn(
          "⚠️ Profile insert did not return data, but no error either",
        );
      } else {
        console.log("✅ Profile inserted successfully:", insertedData);
      }

      alert("Pendaftaran Berhasil! Silakan login dengan akun Anda.");
      setForm({ nama: "", email: "", password: "", role: "warga" });
      navigate("/login"); // Arahkan ke halaman login
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // --- STYLE CSS INLINE MODERN (Konsisten dengan Login) ---
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
      fontFamily: "'Poppins', sans-serif",
      padding: "20px", // Spasi tambahan untuk layar kecil
    },
    card: {
      backgroundColor: "#ffffff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      width: "100%",
      maxWidth: "450px", // Sedikit lebih lebar untuk form register
      textAlign: "center",
    },
    title: {
      marginBottom: "10px",
      color: "#1f2937",
      fontWeight: "600",
      fontSize: "28px",
    },
    subtitle: {
      color: "#6b7280",
      marginBottom: "30px",
      fontSize: "16px",
    },
    inputGroup: {
      marginBottom: "18px",
      textAlign: "left",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#4b5563",
      fontSize: "14px",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      fontSize: "16px",
      boxSizing: "border-box",
      transition: "all 0.2s",
      outline: "none",
    },
    // Style khusus untuk Select
    select: {
      width: "100%",
      padding: "12px 15px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      fontSize: "16px",
      backgroundColor: "#fff",
      appearance: "none", // Hapus panah default browser
      backgroundImage:
        "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.3c0%204.9%201.8%209.2%205.4%2012.8l128.1%20128.1c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095.1c3.6-3.6%205.4-7.8%205.4-12.8%200-5-1.8-9.3-5.4-12.9z%22%2F%3E%3C%2Fsvg%3E')", // Panah custom
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 15px top 50%",
      backgroundSize: "12px auto",
      cursor: "pointer",
    },
    inputFocus: {
      border: "1px solid #10b981", // Warna hijau untuk register (full border property)
      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Gradasi Hijau
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 4px 6px rgba(5, 150, 105, 0.2)",
      marginTop: "10px",
    },
    footerText: {
      marginTop: "25px",
      color: "#6b7280",
      fontSize: "14px",
    },
    link: {
      color: "#059669",
      textDecoration: "none",
      fontWeight: "500",
    },
  };

  const [focusedInput, setFocusedInput] = useState(null);

  const getInputStyle = (inputName, isSelect = false) => {
    const baseStyle = isSelect ? styles.select : styles.input;
    return focusedInput === inputName
      ? { ...baseStyle, ...styles.inputFocus }
      : baseStyle;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Daftar Akun</h2>
        <p style={styles.subtitle}>Lengkapi data Anda untuk bergabung</p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Lengkap</label>
          <input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            onFocus={() => setFocusedInput("nama")}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle("nama")}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle("email")}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle("password")}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Daftar Sebagai</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            onFocus={() => setFocusedInput("role")}
            onBlur={() => setFocusedInput(null)}
            style={getInputStyle("role", true)}
          >
            <option value="warga">Warga</option>
            <option value="courier">Courier</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          onClick={handleRegister}
          style={styles.button}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 6px 12px rgba(5, 150, 105, 0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px rgba(5, 150, 105, 0.2)";
          }}
        >
          Buat Akun
        </button>

        <p style={styles.footerText}>
          Sudah punya akun?{" "}
          <Link to="/login" style={styles.link}>
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
