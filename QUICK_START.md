# 💰 Quick Start - Fitur Transaksi Keuangan

## 🚀 Setup Cepat (5 Menit)

### 1️⃣ Setup Database Supabase

```bash
# 1. Buka: https://app.supabase.com
# 2. Pilih project
# 3. Buka SQL Editor → New Query
# 4. Copy isi dari: TRANSACTION_SETUP_GUIDE.md
# 5. Jalankan / Run
```

**Verifikasi:**

- Buka Table Editor → lihat 5 tabel baru ✓

### 2️⃣ Jalankan Lokal

```bash
cd "d:/Praktikum SIG 6/webgies_pengolahaan_sampah"
npm install
npm run dev
```

**Akses:** `http://localhost:5173`

### 3️⃣ Test Fitur

**Login sebagai Warga:**

- Buka Dashboard → Klik tombol "💳 Transaksi Keuangan"
- Verifikasi bisa tambah transaksi baru

**Login sebagai Courier:**

- Buka Dashboard → Lihat tab "💳 Transaksi"
- Klik "Lihat Transaksi Lengkap" → Verifikasi komisi tampil

**Login sebagai Admin:**

- Buka Admin Panel → Klik tab "TRANSAKSI"
- Klik "Lihat Laporan Transaksi" → Verifikasi laporan tampil

### 4️⃣ Deploy ke Vercel

```bash
# 1. Setup Git
git init
git add .
git commit -m "Add financial transactions"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/repo.git
git push -u origin main

# 2. Buka Vercel → New Project
# 3. Import dari GitHub
# 4. Add Environment Variables:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
# 5. Deploy!
```

**Live URL:** Vercel akan berikan URL production

---

## 📍 File-File Penting

| File                               | Fungsi                  |
| ---------------------------------- | ----------------------- |
| `TRANSACTION_SETUP_GUIDE.md`       | SQL setup database      |
| `FINANCIAL_TRANSACTIONS_GUIDE.md`  | Panduan lengkap         |
| `src/pages/WargaTransaction.jsx`   | Halaman transaksi warga |
| `src/pages/CourierTransaction.jsx` | Halaman transaksi kurir |
| `src/pages/TransactionReport.jsx`  | Halaman laporan admin   |
| `src/main.jsx`                     | Routes transaksi        |

---

## 🔄 Auto-Deploy dari Git

Setelah connect GitHub ke Vercel:

```bash
# Setiap kali push ke main:
git add .
git commit -m "Update fitur"
git push origin main

# ✅ Vercel otomatis:
# - Build
# - Test
# - Deploy
# - Live dalam 2-5 menit
```

---

## ❓ Cepat FAQ

**Q: Bagaimana cara ubah persentase komisi kurir?**
A: Edit di `TRANSACTION_SETUP_GUIDE.md` baris `DEFAULT 5.00` dan re-run SQL

**Q: Data belum muncul di Vercel?**
A: Update Environment Variables → Deploy ulang

**Q: Gimana clear cache Vercel?**
A: Vercel Dashboard → Settings → Caching → Clear Cache

**Q: Bisa tracking siapa yang akses?**
A: Ya! Cek di Supabase → Audit Logs

---

## ✅ Status

✅ **Transaksi Warga** - Ready  
✅ **Transaksi Courier** - Ready  
✅ **Laporan Transaksi Admin** - Ready  
✅ **Rename Courier** - Done  
✅ **Supabase Setup** - Ready  
✅ **Vercel Deploy** - Ready

**🎉 SIAP PRODUCTION!**

---

Lihat `FINANCIAL_TRANSACTIONS_GUIDE.md` untuk panduan lengkap.
