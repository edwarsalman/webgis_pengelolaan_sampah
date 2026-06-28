import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    background: "#1e293b",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  btn: (color) => ({
    backgroundColor: color,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    marginBottom: 10,
  }),
};

export default function Warga() {
  const [warga, setWarga] = useState(null);
  const [latLng, setLatLng] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    alamat: "",
    jenis: "",
    berat: "",
  });
  const [history, setHistory] = useState({ sampah: [], bayar: [], angkut: [] });

  const refreshData = async (wargaId) => {
    const { data: sampah } = await supabase
      .from("sampah")
      .select("*")
      .eq("warga_id", wargaId);
    const { data: bayar } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("warga_id", wargaId);
    const { data: angkut } = await supabase
      .from("pengangkutan")
      .select("*, courier:profiles(name)")
      .eq("warga_id", wargaId);

    setHistory({
      sampah: sampah || [],
      bayar: bayar || [],
      angkut: angkut || [],
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("warga")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setWarga(data);
              setForm({ nama: data.nama, alamat: data.alamat });
              refreshData(data.id);
            }
          });
      }
    });
  }, []);

  const saveProfile = async () => {
    if (!latLng) return alert("Pilih lokasi anda di peta terlebih dahulu!");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      nama: form.nama,
      alamat: form.alamat,
      location: `POINT(${latLng.lng} ${latLng.lat})`,
    };

    const { data, error } = await supabase
      .from("warga")
      .upsert(payload)
      .select()
      .single();
    if (!error) {
      setWarga(data);
      alert("Profil dan lokasi berhasil disimpan!");
      refreshData(data.id);
    }
  };

  const addData = async (table, extraPayload) => {
    if (!warga) return alert("Simpan profil anda terlebih dahulu!");
    const { error } = await supabase
      .from(table)
      .insert({ warga_id: warga.id, ...extraPayload });
    if (!error) {
      alert("Berhasil mengirim data!");
      refreshData(warga.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={styles.header}>
        <h2>Dashboard Warga</h2>
        <div>
          <button
            onClick={() => (window.location.href = "/warga-transaction")}
            style={styles.btn("#2563eb")}
          >
            💳 Transaksi Keuangan
          </button>
          <button
            onClick={logout}
            style={{ ...styles.btn("#dc2626"), width: "auto" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <h3>Profil & Lokasi Rumah</h3>
          <input
            style={styles.input}
            placeholder="Nama Warga"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Alamat Rumah"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />

          <Map
            setLatLng={setLatLng}
            selectedMarker={latLng}
            data={warga ? [warga] : []}
          />
          <button
            onClick={saveProfile}
            style={{ ...styles.btn("#2563eb"), marginTop: 10 }}
          >
            Simpan Profil & Lokasi
          </button>
        </div>

        <div>
          <h3>Aksi / Layanan Sampah</h3>
          <input
            style={styles.input}
            placeholder="Jenis Sampah (Organik/Anorganik)"
            onChange={(e) => setForm({ ...form, jenis: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Berat (kg)"
            type="number"
            onChange={(e) => setForm({ ...form, berat: e.target.value })}
          />

          <button
            onClick={() =>
              addData("sampah", { jenis: form.jenis, berat: form.berat })
            }
            style={styles.btn("#16a34a")}
          >
            Kirim Data Sampah
          </button>
          <button
            onClick={() => addData("pengangkutan", { status: "Menunggu" })}
            style={styles.btn("#eab308")}
          >
            Request Pengangkutan
          </button>
          <button
            onClick={() =>
              addData("pembayaran", { status: "Sudah", tanggal: new Date() })
            }
            style={styles.btn("#2563eb")}
          >
            Bayar Iuran
          </button>

          <h3>Riwayat Pengangkutan & Pembayaran</h3>
          <div>
            <h4>Pengangkutan:</h4>
            {history.angkut.map((a) => (
              <div
                key={a.id}
                style={{ padding: 5, borderBottom: "1px solid #eee" }}
              >
                Status: <b>{a.status}</b>{" "}
                {a.courier?.name
                  ? `(Kurir: ${a.courier.name})`
                  : "(Menunggu Kurir)"}
              </div>
            ))}
            <h4>Pembayaran:</h4>
            {history.bayar.map((b) => (
              <div
                key={b.id}
                style={{ padding: 5, borderBottom: "1px solid #eee" }}
              >
                {new Date(b.tanggal).toLocaleDateString()} - Status:{" "}
                <b>{b.status}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
