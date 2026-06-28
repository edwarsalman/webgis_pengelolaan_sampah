# Setup Transaksi & Pickup Sampah - SQL Supabase

Panduan lengkap untuk membuat semua tabel yang diperlukan.

## ✅ Langkah 1: Buka SQL Editor Supabase

1. Login ke [https://app.supabase.com](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **SQL Editor** → **New Query**

---

## ✅ Langkah 2: Copy-Paste SQL Lengkap

```sql
-- ========================================
-- TABEL TRANSAKSI WARGA
-- ========================================
CREATE TABLE IF NOT EXISTS transaksi_warga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis VARCHAR(50) NOT NULL,
  nominal DECIMAL(12, 2) NOT NULL,
  deskripsi TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  tanggal TIMESTAMP DEFAULT NOW(),
  bukti_pembayaran VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE transaksi_warga ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Warga can read their own transactions" ON transaksi_warga FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Warga can insert their own transactions" ON transaksi_warga FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can read all transactions" ON transaksi_warga FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- TABEL TRANSAKSI COURIER
-- ========================================
CREATE TABLE IF NOT EXISTS transaksi_courier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis VARCHAR(50) NOT NULL,
  nominal DECIMAL(12, 2) NOT NULL,
  deskripsi TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  pengangkutan_id UUID REFERENCES pengangkutan(id) ON DELETE SET NULL,
  tanggal TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE transaksi_courier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courier can read their own transactions" ON transaksi_courier FOR SELECT USING (auth.uid() = courier_id);
CREATE POLICY "Courier can insert their own transactions" ON transaksi_courier FOR INSERT WITH CHECK (auth.uid() = courier_id);
CREATE POLICY "Admin can read all courier transactions" ON transaksi_courier FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- TABEL KOMISI COURIER
-- ========================================
CREATE TABLE IF NOT EXISTS komisi_courier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pengangkutan_id UUID NOT NULL REFERENCES pengangkutan(id) ON DELETE CASCADE,
  persentase_komisi DECIMAL(5, 2) DEFAULT 5.00,
  nominal_komisi DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  tanggal_pengangkutan DATE,
  tanggal_pembayaran TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE komisi_courier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courier can read their own commissions" ON komisi_courier FOR SELECT USING (auth.uid() = courier_id);
CREATE POLICY "Admin can read all commissions" ON komisi_courier FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- TABEL LAPORAN TRANSAKSI
-- ========================================
CREATE TABLE IF NOT EXISTS laporan_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipe_laporan VARCHAR(50) NOT NULL,
  periode_bulan INTEGER NOT NULL,
  periode_tahun INTEGER NOT NULL,
  total_pemasukan DECIMAL(12, 2) DEFAULT 0,
  total_pengeluaran DECIMAL(12, 2) DEFAULT 0,
  total_transaksi_pending INTEGER DEFAULT 0,
  detail_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE laporan_transaksi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own reports" ON laporan_transaksi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON laporan_transaksi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can read all reports" ON laporan_transaksi FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- TABEL RIWAYAT PEMBAYARAN
-- ========================================
CREATE TABLE IF NOT EXISTS riwayat_pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID NOT NULL REFERENCES transaksi_warga(id) ON DELETE CASCADE,
  warga_id UUID NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
  metode_pembayaran VARCHAR(50),
  nomor_referensi VARCHAR(100),
  verifikasi_admin BOOLEAN DEFAULT FALSE,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE riwayat_pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Warga can read their own payment history" ON riwayat_pembayaran FOR SELECT USING (EXISTS (SELECT 1 FROM transaksi_warga WHERE transaksi_warga.id = transaksi_id AND transaksi_warga.user_id = auth.uid()));
CREATE POLICY "Admin can read all payment history" ON riwayat_pembayaran FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- TABEL PICKUP SAMPAH ⭐ NEW
-- ========================================
CREATE TABLE IF NOT EXISTS pickup_sampah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warga_id UUID NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
  pengangkutan_id UUID NOT NULL REFERENCES pengangkutan(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'pending', 'ambil', 'belum_ambil', 'selesai'
  berat_terambil DECIMAL(10, 2),
  catatan TEXT,
  tanggal_pickup TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE pickup_sampah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courier can manage their pickups" ON pickup_sampah FOR ALL USING (auth.uid() = courier_id) WITH CHECK (auth.uid() = courier_id);
CREATE POLICY "Warga can read their pickup history" ON pickup_sampah FOR SELECT USING (auth.uid() IN (SELECT user_id FROM warga WHERE warga.id = pickup_sampah.warga_id));
CREATE POLICY "Admin can read all pickups" ON pickup_sampah FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ========================================
-- CREATE INDEXES
-- ========================================
CREATE INDEX idx_transaksi_warga_user_id ON transaksi_warga(user_id);
CREATE INDEX idx_transaksi_warga_warga_id ON transaksi_warga(warga_id);
CREATE INDEX idx_transaksi_warga_status ON transaksi_warga(status);
CREATE INDEX idx_transaksi_warga_tanggal ON transaksi_warga(tanggal);

CREATE INDEX idx_transaksi_courier_courier_id ON transaksi_courier(courier_id);
CREATE INDEX idx_transaksi_courier_status ON transaksi_courier(status);
CREATE INDEX idx_transaksi_courier_tanggal ON transaksi_courier(tanggal);

CREATE INDEX idx_komisi_courier_courier_id ON komisi_courier(courier_id);
CREATE INDEX idx_komisi_courier_status ON komisi_courier(status);
CREATE INDEX idx_komisi_courier_tanggal_pengangkutan ON komisi_courier(tanggal_pengangkutan);

CREATE INDEX idx_laporan_transaksi_user_id ON laporan_transaksi(user_id);
CREATE INDEX idx_laporan_transaksi_periode ON laporan_transaksi(periode_bulan, periode_tahun);

CREATE INDEX idx_pickup_sampah_courier_id ON pickup_sampah(courier_id);
CREATE INDEX idx_pickup_sampah_warga_id ON pickup_sampah(warga_id);
CREATE INDEX idx_pickup_sampah_status ON pickup_sampah(status);
CREATE INDEX idx_pickup_sampah_tanggal ON pickup_sampah(tanggal_pickup);
```

---

## ✅ Langkah 3: Verifikasi Tabel

Di **Table Editor**, verifikasi 6 tabel ada:

- ✅ `transaksi_warga`
- ✅ `transaksi_courier`
- ✅ `komisi_courier`
- ✅ `laporan_transaksi`
- ✅ `riwayat_pembayaran`
- ✅ `pickup_sampah` ⭐ BARU!

---

## 🎯 Tabel Baru: `pickup_sampah`

| Field           | Tipe        | Keterangan                           |
| --------------- | ----------- | ------------------------------------ |
| id              | UUID        | Primary Key                          |
| courier_id      | UUID        | FK ke auth.users                     |
| warga_id        | UUID        | FK ke warga                          |
| pengangkutan_id | UUID        | FK ke pengangkutan                   |
| status          | VARCHAR(50) | pending, ambil, belum_ambil, selesai |
| berat_terambil  | DECIMAL     | Berat sampah yang terambil (kg)      |
| catatan         | TEXT        | Catatan tambahan                     |
| tanggal_pickup  | TIMESTAMP   | Waktu pickup                         |
| created_at      | TIMESTAMP   | Waktu dibuat                         |
| updated_at      | TIMESTAMP   | Waktu diupdate                       |

---

**Selesai! Database siap dengan fitur pickup sampah.**
