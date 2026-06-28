# Setup Transaksi Keuangan di Supabase

Panduan lengkap untuk membuat tabel-tabel transaksi keuangan.

## ✅ Langkah 1: Buka SQL Editor Supabase

1. Login ke [https://app.supabase.com](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **SQL Editor** (sebelah kiri)
4. Klik **New Query**

---

## ✅ Langkah 2: Jalankan SQL Setup Berikut

Copy-paste kode di bawah ke SQL Editor dan klik **Run**:

```sql
-- ========================================
-- 1. TABEL TRANSAKSI WARGA (Residents)
-- ========================================
CREATE TABLE IF NOT EXISTS transaksi_warga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis VARCHAR(50) NOT NULL, -- 'pembayaran_iuran', 'pembayaran_jasa', 'refund'
  nominal DECIMAL(12, 2) NOT NULL,
  deskripsi TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'selesai', 'ditolak'
  tanggal TIMESTAMP DEFAULT NOW(),
  bukti_pembayaran VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transaksi_warga ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk transaksi_warga
CREATE POLICY "Warga can read their own transactions"
  ON transaksi_warga FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Warga can insert their own transactions"
  ON transaksi_warga FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all transactions"
  ON transaksi_warga FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 2. TABEL TRANSAKSI COURIER (Kurir)
-- ========================================
CREATE TABLE IF NOT EXISTS transaksi_courier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis VARCHAR(50) NOT NULL, -- 'komisi', 'bonus', 'denda', 'refund'
  nominal DECIMAL(12, 2) NOT NULL,
  deskripsi TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'disetujui', 'ditolak'
  pengangkutan_id UUID REFERENCES pengangkutan(id) ON DELETE SET NULL,
  tanggal TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transaksi_courier ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk transaksi_courier
CREATE POLICY "Courier can read their own transactions"
  ON transaksi_courier FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Courier can insert their own transactions"
  ON transaksi_courier FOR INSERT
  WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Admin can read all courier transactions"
  ON transaksi_courier FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 3. TABEL LAPORAN TRANSAKSI
-- ========================================
CREATE TABLE IF NOT EXISTS laporan_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipe_laporan VARCHAR(50) NOT NULL, -- 'warga', 'courier', 'admin_summary'
  periode_bulan INTEGER NOT NULL,
  periode_tahun INTEGER NOT NULL,
  total_pemasukan DECIMAL(12, 2) DEFAULT 0,
  total_pengeluaran DECIMAL(12, 2) DEFAULT 0,
  total_transaksi_pending INTEGER DEFAULT 0,
  detail_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE laporan_transaksi ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk laporan_transaksi
CREATE POLICY "Users can read their own reports"
  ON laporan_transaksi FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON laporan_transaksi FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all reports"
  ON laporan_transaksi FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 4. TABEL RIWAYAT PEMBAYARAN (Payment History)
-- ========================================
CREATE TABLE IF NOT EXISTS riwayat_pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID NOT NULL REFERENCES transaksi_warga(id) ON DELETE CASCADE,
  warga_id UUID NOT NULL REFERENCES warga(id) ON DELETE CASCADE,
  metode_pembayaran VARCHAR(50), -- 'transfer_bank', 'cash', 'e_wallet'
  nomor_referensi VARCHAR(100),
  verifikasi_admin BOOLEAN DEFAULT FALSE,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE riwayat_pembayaran ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Warga can read their own payment history"
  ON riwayat_pembayaran FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transaksi_warga
      WHERE transaksi_warga.id = transaksi_id
      AND transaksi_warga.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can read all payment history"
  ON riwayat_pembayaran FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 5. TABEL KOMISI COURIER (Commission)
-- ========================================
CREATE TABLE IF NOT EXISTS komisi_courier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pengangkutan_id UUID NOT NULL REFERENCES pengangkutan(id) ON DELETE CASCADE,
  persentase_komisi DECIMAL(5, 2) DEFAULT 5.00, -- Dalam persen
  nominal_komisi DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'dibayar', 'ditarik'
  tanggal_pengangkutan DATE,
  tanggal_pembayaran TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE komisi_courier ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Courier can read their own commissions"
  ON komisi_courier FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Admin can read all commissions"
  ON komisi_courier FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 6. CREATE INDEXES untuk performa
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
```

---

## ✅ Langkah 3: Verifikasi Table Sudah Dibuat

1. Klik menu **Table Editor** (sebelah kiri)
2. Pastikan tabel berikut sudah muncul di list:
   - ✅ `transaksi_warga`
   - ✅ `transaksi_courier`
   - ✅ `laporan_transaksi`
   - ✅ `riwayat_pembayaran`
   - ✅ `komisi_courier`

---

## ✅ Selesai!

Semua tabel sudah siap digunakan untuk fitur transaksi keuangan.

### Struktur Data:

| Tabel                | Fungsi                                   |
| -------------------- | ---------------------------------------- |
| `transaksi_warga`    | Mencatat pembayaran/transaksi dari warga |
| `transaksi_courier`  | Mencatat bonus/komisi/denda untuk kurir  |
| `komisi_courier`     | Detail komisi per pengangkutan kurir     |
| `laporan_transaksi`  | Laporan ringkasan transaksi bulanan      |
| `riwayat_pembayaran` | Riwayat detail pembayaran dengan metode  |
