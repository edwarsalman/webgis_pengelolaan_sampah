# Setup Tabel `profiles` di Supabase

## ⚠️ PENTING: Penyebab Error "Profile data: data: null"

Error yang Anda alami terjadi karena:

- Tabel `profiles` **belum dibuat** atau **RLS policies salah**
- Saat User login, App.jsx mencoba fetch role dari tabel `profiles` tapi tidak menemukan data

---

## ✅ Solusi: Setup Tabel Profiles

### **LANGKAH 1: Buka Supabase SQL Editor**

1. Login ke [https://app.supabase.com](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke menu **SQL Editor** (sebelah kiri)
4. Klik **New Query**

---

### **LANGKAH 2: Jalankan SQL Berikut**

Copy-paste kode di bawah ke SQL Editor dan klik **Run**:

```sql
-- 1️⃣ BUAT TABEL PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'warga',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3️⃣ DROP POLICIES YANG LAMA (JIKA ADA)
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- 4️⃣ BUAT POLICY BARU - READ (Setiap user bisa baca profil mereka sendiri)
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 5️⃣ BUAT POLICY BARU - INSERT (User bisa insert profil sendiri saat register)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6️⃣ BUAT POLICY BARU - UPDATE (User bisa update profil mereka)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7️⃣ POLICY UNTUK SERVICE ROLE (Untuk testing/admin operations)
CREATE POLICY "Service role can do everything"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Hasil Expected:**

- ✅ Query executed successfully
- ✅ Tidak ada error messages

---

### **LANGKAH 3: Verifikasi Tabel Dibuat**

1. Pergi ke **Table Editor** (sebelah kiri, di bawah SQL Editor)
2. Seharusnya muncul tabel baru: **profiles**
3. Klik tabel untuk lihat struktur:
   - `id` (UUID, Primary Key)
   - `name` (VARCHAR)
   - `role` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

---

### **LANGKAH 4: Verifikasi RLS Policies**

1. Di **Table Editor**, klik tabel **profiles**
2. Klik tab **RLS** di atas
3. Seharusnya muncul 4 policies:
   - ✅ Users can read their own profile
   - ✅ Users can insert their own profile
   - ✅ Users can update their own profile
   - ✅ Service role can do everything

---

## 🧪 Testing Setelah Setup

### **Test 1: Register User Baru**

1. Buka aplikasi Anda
2. Pergi ke halaman **Register**
3. Isi form dan klik **Daftar**
4. Check browser console (F12) - seharusnya:
   - ✅ "Inserting profile with data: { id: ..., name: ..., role: ... }"
   - ✅ Tidak ada error

### **Test 2: Login dan Lihat Console**

1. Login dengan akun yang baru dibuat
2. Buka browser console (F12)
3. Seharusnya lihat:
   - ✅ "✅ Setting role to: warga"
   - ❌ BUKAN "Profile data: Object { data: null, error: {...} }"

### **Test 3: Simpan Profil di Halaman Warga**

1. Login sebagai warga
2. Klik di peta untuk pilih lokasi
3. Isi nama dan alamat
4. Klik **Simpan Profil & Lokasi**
5. Seharusnya berhasil tanpa error

---

## ❌ Troubleshooting

### **Error 1: "new row violates row-level security policy"**

**Penyebab:** RLS policy tidak sesuai  
**Solusi:** Jalankan ulang SQL di Langkah 2 (DROP policies yang lama terlebih dahulu)

### **Error 2: "Data type UUID does not exist"**

**Penyebab:** UUID extension belum aktif  
**Solusi:** Buka **SQL Editor** dan jalankan:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Error 3: "relation \"profiles\" does not exist"**

**Penyebab:** Tabel belum dibuat  
**Solusi:** Jalankan SQL di Langkah 2 lagi

### **Error 4: "Profile data: { data: null, error: {...} }"**

**Penyebab:** Profile tidak ada untuk user tersebut (mungkin register gagal)  
**Solusi:**

1. Buka **Table Editor** → **profiles**
2. Check apakah ada row dengan user_id Anda
3. Jika tidak ada:
   - Delete akun user dari Auth → Users
   - Register ulang
   - Lihat console untuk error detail saat register

---

## 📋 Checklist Setup

- [ ] SQL code sudah dijalankan di SQL Editor (No Errors)
- [ ] Tabel `profiles` muncul di Table Editor
- [ ] RLS Policies sudah ada (4 policies)
- [ ] Email confirmation di Auth → Providers → Email set ke OFF (untuk testing)
- [ ] Coba register akun baru → Check table profiles punya data baru
- [ ] Coba login → Console tidak menunjukkan `data: null` error
- [ ] Coba simpan profil dan lokasi di halaman Warga → Berhasil

---

## 💡 Tips

**Jika masih error setelah setup:**

1. Refresh browser (Ctrl+F5)
2. Clear browser cache/cookies (atau gunakan Incognito mode)
3. Buka console browser (F12) dan lihat error detail
4. Coba register dengan email baru
5. Jangan lupa: Password minimal 6 karakter

---

## 📞 Bantuan Lebih Lanjut

Jika masih error, **screenshot console error dan share:**

- Network tab (lihat response dari request ke Supabase)
- Console tab (lihat error messages)
- Tabel profiles di Supabase (ada data atau tidak)
