import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut, Bar } from "react-chartjs-2";
import { TrendingUp, Wallet, ArrowRightCircle } from "lucide-react";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Analytics() {
  const [aylikData, setAylikData]                         = useState([]);
  const [kategoriHarcama, setKategoriHarcama]             = useState([]);
  const [enCokHarcananKategori, setEnCokHarcananKategori] = useState(null);
  const [toplamAnaliz, setToplamAnaliz]                   = useState(null);
  const [hatalar, setHatalar]                             = useState([]);
  const [yukleniyor, setYukleniyor]                       = useState(true);
  const [duyguAnalizi, setDuyguAnalizi] = useState([]);

  const navigate = useNavigate();

  const rawUser = sessionStorage.getItem("user");
  const user    = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    if (!user) { navigate("/"); return; }

    const id      = user.id;
    const token   = sessionStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const yeniHatalar = [];

    const fetchSafe = (url, setter, label) =>
      fetch(`https://localhost:7181${url}`, { headers })
        .then(res => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
        .then(data => setter(data))
        .catch(err => {
          yeniHatalar.push(`${label} yuklenemedi (${err.message})`);
          setHatalar([...yeniHatalar]);
        });

    Promise.all([
      fetchSafe(`/api/Analitik/aylik-gelir-gider/${id}`, setAylikData,             "Aylik veri"),
      fetchSafe(`/api/Analitik/kategori-harcama/${id}`,  setKategoriHarcama,       "Kategori"),
      fetchSafe(`/api/Analitik/en-cok-harcama/${id}`,   setEnCokHarcananKategori, "En cok harcama"),
      fetchSafe(`/api/Analitik/toplam-analiz/${id}`,    setToplamAnaliz,           "Toplam analiz"),
      fetchSafe(`/api/Analitik/duygu-harcama-analizi/${id}`, setDuyguAnalizi, "Duygu analizi"),
    ]).finally(() => setYukleniyor(false));
  }, []);

  const pieData = {
    labels: kategoriHarcama.map(x => x.kategori),
    datasets: [{
      data: kategoriHarcama.map(x => x.toplamHarcama),
      backgroundColor: ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#6366f1","#ec4899","#f43f5e","#14b8a6"],
      borderWidth: 2,
      borderColor: "#ffffff",
    }]
  };

  const barData = {
    labels: aylikData.map(d => `${String(d.ay).padStart(2,"0")}/${d.yil}`),
    datasets: [
      { label: "Gelir", data: aylikData.map(d => d.gelir), backgroundColor: "rgba(16,185,129,0.75)", borderRadius: 6 },
      { label: "Gider", data: aylikData.map(d => d.gider), backgroundColor: "rgba(239,68,68,0.75)",  borderRadius: 6 }
    ]
  };
  const duyguBarData = {
  labels: duyguAnalizi.map(x => `${x.duygu} / ${x.metinDuygusu || "neutral"}`),
  datasets: [{
    label: "Ortalama Harcama",
    data: duyguAnalizi.map(x => x.ortalamaHarcama),
    backgroundColor: [
      "rgba(124,58,237,0.72)",
      "rgba(37,99,235,0.72)",
      "rgba(14,165,233,0.72)",
      "rgba(99,102,241,0.72)"
],
    borderRadius: 8
  }]
};

  if (yukleniyor) return (
    <div className="p-20 text-center text-slate-500">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      Yukleniyor...
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#f8fafc_100%)]">
      <header className="mb-10 bg-gradient-to-r from-white/95 via-blue-50/60 to-indigo-50/50 backdrop-blur-xl border border-blue-100/70 shadow-sm rounded-3xl p-7 flex items-center justify-between">
  <div>

    <h1 className="text-3xl font-black text-slate-900 mt-2">
      Analitik Raporlar
    </h1>

    <p className="text-slate-500 font-medium italic mt-1">
      Finansal verileriniz API üzerinden canlı olarak analiz ediliyor.
    </p>
  </div>

  <button
    onClick={() => navigate("/dashboard")}
    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition"
  >
    Dashboard'a Dön
  </button>
</header>

      {hatalar.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          {hatalar.map((h, i) => <p key={i} className="text-red-600 text-sm">hata: {h}</p>)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Toplam Gelir" value={toplamAnaliz?.toplamGelir != null ? `${toplamAnaliz.toplamGelir.toLocaleString("tr-TR")} TL` : "---"} icon={<TrendingUp />} color="text-emerald-600" />
        <StatCard title="Toplam Gider" value={toplamAnaliz?.toplamGider != null ? `${toplamAnaliz.toplamGider.toLocaleString("tr-TR")} TL` : "---"} icon={<TrendingUp className="rotate-180" />} color="text-rose-600" />
        <StatCard title="Net Bakiye"   value={toplamAnaliz?.net       != null ? `${toplamAnaliz.net.toLocaleString("tr-TR")} TL`       : "---"} icon={<Wallet />} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-white/70 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Harcama Dağılımı</h3>
          <div className="h-72 flex justify-center items-center">
            {kategoriHarcama.length > 0
              ? <Doughnut data={pieData} options={{ cutout: "65%", plugins: { legend: { position: "right" } } }} />
              : <p className="text-slate-400 text-sm">Harcama verisi bulunamadı.</p>}
          </div>
        </div>
     <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100/70 p-8 rounded-3xl shadow-sm">
  <h3 className="text-xl font-bold mb-6 text-slate-900">Duyguya Göre Harcama</h3>
          <div className="h-72">
            {duyguAnalizi.length > 0 ? (
              <Bar
                data={duyguBarData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "top" } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Henüz duygu kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/95 via-blue-50/50 to-indigo-50/40 backdrop-blur-xl p-8 rounded-3xl border border-blue-100/70 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Aylık Gelir / Gider</h3>
          <div className="h-72">
            {aylikData.length > 0
              ? <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } }} />
              : <div className="flex items-center justify-center h-full text-slate-400 text-sm">Veri yok</div>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
      <h3 className="text-lg font-bold mb-4">Aylık Değişim Özeti</h3>
      <div className="space-y-3">
        {aylikData.map((data, i) => (
          <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm font-bold">
            <span className="text-slate-500">{data.yil} / {data.ay}</span>
            <div className="flex gap-4">
              <span className="text-emerald-600">+{data.gelir.toLocaleString("tr-TR")} TL</span>
              <span className="text-rose-600">-{data.gider.toLocaleString("tr-TR")} TL</span>
            </div>
          </div>
        ))}
      </div>
    </div>
      </div>

      {enCokHarcananKategori && (
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-bold opacity-80 mb-2 italic">Zirve Harcama Grubu</h3>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black">{enCokHarcananKategori.kategori ?? "---"}</h2>
              <p className="mt-2 text-indigo-100 font-medium">Bu kategori toplam bütçenizin büyük kısmını oluşturuyor.</p>
            </div>
            {enCokHarcananKategori.toplamHarcama != null && (
              <span className="text-2xl font-bold">{enCokHarcananKategori.toplamHarcama.toLocaleString("tr-TR")} TL</span>
            )}
          </div>
          <ArrowRightCircle className="absolute -right-4 -bottom-4 opacity-10" size={120} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-slate-50 mb-4`}>{icon}</div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 mt-1">{value}</h4>
    </div>
  );
}
