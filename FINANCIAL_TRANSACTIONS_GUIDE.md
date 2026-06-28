# 📊 Fitur Transaksi Keuangan - Panduan Implementasi & Deployment

Panduan lengkap untuk mengimplementasikan dan mendeploy fitur transaksi keuangan WebGIS Pengolahan Sampah.

---

## 🎯 Fitur Yang Telah Ditambahkan

### 1. **Transaksi Warga** (`/warga-transaction`)

- Warga dapat melihat riwayat transaksi keuangan mereka
- Jenis transaksi: Pembayaran Iuran, Pembayaran Jasa, Refund
- Status transaksi: Pending, Selesai, Ditolak
- Dashboard dengan statistik total masuk dan pending
- Filter transaksi berdasarkan status

### 2. **Transaksi Courier** (`/courier-transaction`)

- Kurir dapat melihat komisi dan transaksi mereka
- Detail komisi per pengangkutan
- Fitur pencairan komisi (withdraw)
- Statistik: Total Komisi, Komisi Pending, Komisi Sudah Dibayar
- Riwayat transaksi keuangan

### 3. **Laporan Transaksi (Admin)** (`/transaction-report`)

- Dashboard ringkasan semua transaksi
- Filter transaksi warga, kurir, dan komisi
- Verifikasi transaksi manual oleh admin
- Statistik overview: total, terverifikasi, pending
- Manajemen pembayaran komisi kurir

### 4. **Rename: Transporter → Courier**

- Semua referensi "transporter" diganti menjadi "courier"
- Database field: `transporter_id` → `courier_id`
- UI: "Driver Dashboard" → "Courier Dashboard"
- Pilihan role di register: "Courier"

---

## 🔧 Setup Supabase

### **LANGKAH 1: Buka Supabase Dashboard**

1. Login ke [https://app.supabase.com](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor** → **New Query**

### **LANGKAH 2: Copy-Paste SQL Setup**

Lihat file `TRANSACTION_SETUP_GUIDE.md` untuk SQL lengkap.

Jalankan SQL untuk membuat tabel:

- ✅ `transaksi_warga` - Transaksi dari warga
- ✅ `transaksi_courier` - Transaksi dari kurir
- ✅ `komisi_courier` - Detail komisi kurir
- ✅ `laporan_transaksi` - Laporan ringkasan
- ✅ `riwayat_pembayaran` - Riwayat detail pembayaran

### **LANGKAH 3: Verifikasi Table**

1. Klik **Table Editor** di sidebar kiri
2. Pastikan 5 tabel baru sudah muncul di list
3. Verifikasi RLS (Row Level Security) sudah enabled

---

## 💻 Struktur Halaman Transaksi

### **Halaman Warga Transaksi**

```
/warga-transaction
- Header: Nama Warga + Tombol Transaksi Baru
- Statistik: Total Masuk, Total Pending, Transaksi Bulan Ini
- Filter: Semua, Pending, Selesai, Ditolak
- Tabel: Tanggal, Jenis, Nominal, Status, Deskripsi
- Modal: Form untuk menambah transaksi baru
```

### **Halaman Courier Transaksi**

```
/courier-transaction
- Header: Nama Kurir + Tombol Logout
- Statistik: Total Komisi, Komisi Pending, Komisi Dibayar
- Tab 1 - Detail Komisi:
  * Tabel komisi dengan persentase
  * Tombol "Tarik Komisi Pending"
- Tab 2 - Transaksi Keuangan:
  * Riwayat semua transaksi kurir
```

### **Halaman Admin Laporan Transaksi**

```
/transaction-report
- Header: "Admin Panel - Laporan Transaksi"
- Statistik 7 KPI:
  * Total Transaksi Warga
  * Total Terverifikasi
  * Total Pending
  * Total Komisi Kurir
  * Komisi Belum Dibayar
  * Warga Aktif
  * Kurir Aktif
- Tab 1 - Ringkasan: Overview transaksi
- Tab 2 - Transaksi Warga: Verifikasi/Tolak
- Tab 3 - Transaksi Kurir: Setujui pencairan
- Tab 4 - Komisi Kurir: Bayar komisi
```

---

## 📝 Database Schema

### Tabel: `transaksi_warga`

```sql
- id: UUID (Primary Key)
- warga_id: UUID (FK to warga)
- user_id: UUID (FK to auth.users)
- jenis: VARCHAR(50) - pembayaran_iuran, pembayaran_jasa, refund
- nominal: DECIMAL(12,2)
- deskripsi: TEXT
- status: VARCHAR(50) - pending, selesai, ditolak
- tanggal: TIMESTAMP
- bukti_pembayaran: VARCHAR(255)
- created_at, updated_at: TIMESTAMP
```

### Tabel: `transaksi_courier`

```sql
- id: UUID (Primary Key)
- courier_id: UUID (FK to auth.users)
- jenis: VARCHAR(50) - komisi, bonus, denda, refund
- nominal: DECIMAL(12,2)
- deskripsi: TEXT
- status: VARCHAR(50) - pending, disetujui, ditolak
- pengangkutan_id: UUID (FK to pengangkutan)
- tanggal: TIMESTAMP
- created_at, updated_at: TIMESTAMP
```

### Tabel: `komisi_courier`

```sql
- id: UUID (Primary Key)
- courier_id: UUID (FK to auth.users)
- pengangkutan_id: UUID (FK to pengangkutan)
- persentase_komisi: DECIMAL(5,2) - default 5%
- nominal_komisi: DECIMAL(12,2)
- status: VARCHAR(50) - pending, dibayar, ditarik
- tanggal_pengangkutan: DATE
- tanggal_pembayaran: TIMESTAMP
- created_at, updated_at: TIMESTAMP
```

---

## 🚀 Deployment ke Vercel dengan Git Integration

### **LANGKAH 1: Setup Git Repository**

```bash
# Di folder project
git init
git add .
git commit -m "Add financial transaction features"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/webgies_pengolahaan_sampah.git
git push -u origin main
```

### **LANGKAH 2: Connect Vercel dengan GitHub**

1. Buka [https://vercel.com](https://vercel.com)
2. Login dengan GitHub account
3. Klik **"New Project"**
4. Pilih repository: `webgies_pengolahaan_sampah`
5. Klik **"Import"**

### **LANGKAH 3: Configure Environment Variables**

1. Di Vercel Dashboard, pergi ke **Settings** → **Environment Variables**
2. Tambahkan:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
3. Klik **"Save"**

### **LANGKAH 4: Deploy**

1. Klik **"Deploy"**
2. Vercel akan otomatis:
   - Build project dengan Vite
   - Deploy ke CDN global
   - Berikan URL production (misalnya: `https://webgies.vercel.app`)

---

## 📦 Auto-Deploy dari Git ke Vercel

### **Konfigurasi Otomatis**

Setelah connect GitHub ke Vercel, deployment otomatis akan trigger ketika:

- Push ke branch `main` (production deployment)
- Push ke branch `staging` (preview deployment)

### **Deploy Manual**

```bash
# Install Vercel CLI (opsional)
npm install -g vercel

# Deploy dari folder project
vercel
```

---

## 🔄 Workflow Pengembangan

### **Saat Ada Update Fitur:**

1. **Development Lokal**

   ```bash
   npm run dev  # Run di localhost:5173
   ```

2. **Commit ke Git**

   ```bash
   git add .
   git commit -m "Add new feature: [description]"
   git push origin main
   ```

3. **Vercel Auto-Deploy**
   - Vercel mendeteksi push ke GitHub
   - Build & test otomatis
   - Deploy ke production dalam ~2-5 menit

4. **Live di Vercel**
   - Akses: `https://webgies.vercel.app`
   - Semua perubahan langsung live

---

## 🧪 Testing Lokal

### **Test Fitur Transaksi:**

```bash
# 1. Jalankan dev server
npm run dev

# 2. Buka di browser
http://localhost:5173

# 3. Test setiap role:
# - Warga: Login → Dashboard → Transaksi Keuangan
# - Courier: Login → Dashboard → Transaksi
# - Admin: Login → Admin Panel → Transaksi
```

### **Test Supabase Connection:**

```bash
# Buka console browser (F12)
# Check di Application → Local Storage
# Verifikasi: SUPABASE_URL dan SUPABASE_KEY ada
```

---

## 📊 Monitoring & Analytics

### **Di Vercel Dashboard:**

- Lihat deployment history
- Monitor performance metrics
- Check error logs
- Analyze traffic

### **Di Supabase Dashboard:**

- Database size & usage
- API calls & quota
- Real-time data
- Audit logs

---

## 🐛 Troubleshooting

### **Error: "Transaksi tidak masuk database"**

- ✅ Cek RLS policies di Supabase
- ✅ Verifikasi user role di profiles table
- ✅ Check browser console untuk error message

### **Error: "Table not found"**

- ✅ Jalankan ulang SQL setup dari TRANSACTION_SETUP_GUIDE.md
- ✅ Refresh Supabase Table Editor
- ✅ Pastikan 5 tabel sudah muncul

### **Error: "401 Unauthorized"**

- ✅ Verifikasi VITE_SUPABASE_ANON_KEY di .env lokal
- ✅ Update Environment Variables di Vercel
- ✅ Deploy ulang setelah update env

### **Deployment Failed di Vercel**

- ✅ Cek build logs: Vercel → Deployments → Details
- ✅ Verifikasi npm dependencies terpasang
- ✅ Check vite.config.js tidak ada error

---

## ✅ Checklist Selesai

- ✅ Rename Transporter → Courier di semua file
- ✅ Buat 5 tabel transaksi di Supabase
- ✅ Tambah halaman Warga Transaksi
- ✅ Tambah halaman Courier Transaksi
- ✅ Tambah halaman Admin Laporan Transaksi
- ✅ Update routing di main.jsx
- ✅ Setup Git repository
- ✅ Connect Vercel dengan GitHub
- ✅ Setup Environment Variables di Vercel
- ✅ Auto-deploy aktif
- ✅ Live di production

---

## 📞 Support

Jika ada error atau pertanyaan:

1. Check console browser (F12)
2. Lihat Supabase logs
3. Lihat Vercel deployment logs
4. Share error message lengkap untuk debugging

---

**Status: ✅ SIAP PRODUCTION**

Semua fitur transaksi keuangan sudah diimplementasi dan siap untuk dideploy ke production dengan Git integration ke Vercel.
