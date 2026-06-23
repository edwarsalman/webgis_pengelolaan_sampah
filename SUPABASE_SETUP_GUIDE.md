# Panduan Setup Supabase untuk Login/Register

## Masalah yang Diperbaiki:

1. ✅ CSS Border Warning - Fixed (tidak akan melihat warning tentang border lagi)
2. ✅ Validasi input yang lebih baik
3. ✅ Error handling yang lebih informatif
4. ⏳ Auth 400 Error - Perlu verifikasi konfigurasi Supabase

## Penyebab Kemungkinan 400 Error

### 1. **Email Confirmation Required** (Paling Umum)

Jika Supabase mengharuskan email confirmation, ikuti langkah ini:

#### Cara Disable Email Confirmation:

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Authentication > Providers > Email**
4. Cari bagian "Confirm Email"
5. Ubah menjadi **OFF** (jika ingin testing tanpa email verification)

Atau jika ingin tetap menggunakan email confirmation:

- User akan menerima email dengan link verifikasi
- User harus klik link tersebut sebelum bisa login
- Update UI Register agar menunjukkan pesan untuk cek email

---

### 2. **Tabel 'profiles' Tidak Ada atau Tidak Proper**

#### Buat Tabel profiles:

```sql
-- Buka SQL Editor di Supabase Dashboard dan jalankan:

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'warga',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk users bisa read profil mereka sendiri
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Buat policy untuk users bisa insert profil mereka sendiri (saat register)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Buat policy untuk users bisa update profil mereka sendiri
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

---

### 3. **Cek API Key & URL Supabase**

Verifikasi bahwa URL dan Key di `src/lib/supabase.js` sudah benar:

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings > API**
4. Copy **Project URL** dan **Anon Public Key**
5. Update di file `src/lib/supabase.js`

```javascript
const supabaseUrl = "YOUR_PROJECT_URL_HERE";
const supabaseKey = "YOUR_ANON_KEY_HERE";
```

---

### 4. **Test Authentication dengan cURL atau Postman**

Untuk memastikan Supabase bisa menerima request:

```bash
curl --location 'https://YOUR_SUPABASE_URL/auth/v1/signup' \
  --header 'apikey: YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

---

## Langkah-Langkah Testing:

1. **Buka browser devtools (F12)**
2. **Buka tab Network**
3. **Coba register/login**
4. **Lihat request ke Supabase:**
   - Status code harus 200 atau 201 (bukan 400)
   - Response header harus menunjukkan detail error jika ada

---

## Checklist:

- [ ] Email confirmation setting sudah dicek di Supabase
- [ ] Tabel `profiles` sudah dibuat dengan RLS policies
- [ ] API Key dan URL sudah benar di `src/lib/supabase.js`
- [ ] Network request menunjukkan response yang lebih jelas
- [ ] Coba register dengan email baru (bukan email yang sudah ada)
- [ ] Password minimal 6 karakter

---

## Catatan:

- Jika tetap error, buka console di browser dan perhatikan pesan error detail
- Saat login, pastikan email yang digunakan sudah terdaftar dan password benar
- Jika email confirmation ON, user harus verify email dulu sebelum bisa login
