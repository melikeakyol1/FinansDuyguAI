import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  TrendingDown, TrendingUp, Activity, AlertTriangle,
  Calendar, Tag, CreditCard, Brain, Sparkles, LogOut, ArrowRight, UploadCloud
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [veriler, setVeriler] = useState([]);
  const [oneriler, setOneriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oneriYukleniyor, setOneriYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [seciliIslem, setSeciliIslem] = useState(null);
  const [duyguNotu, setDuyguNotu] = useState("");
  const [duyguKaydediliyor, setDuyguKaydediliyor] = useState(false);

  // ✅ Güvenli parse — crash fix
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    const sessionVeri = sessionStorage.getItem("denemeVerileri");
    const sessionGuest = sessionStorage.getItem("isGuest");

    if (sessionVeri) {
      // Misafir modu
      setVeriler(JSON.parse(sessionVeri));
      setIsGuest(sessionGuest === "true");
      setLoading(false);
    } else if (user) {
      // Kayıtlı kullanıcı — JWT ile fetch
      const token = sessionStorage.getItem("token");
      fetch(`https://localhost:7181/api/FinansalVeri/liste/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => {
          if (!res.ok) throw new Error(`Hata: ${res.status}`);
          return res.json();
        })
        .then(data => {
          // Boş dizi veya dizi değilse [] kullan
          setVeriler(Array.isArray(data) ? data : []);
          setIsGuest(false);
          setLoading(false);
          aiOnerileriGetir(user.id);
        })
        .catch(err => {
          // 404 = henüz veri yok, hata değil
          if (err.message.includes("404")) {
            setVeriler([]);
            setLoading(false);
          } else {
            setHata(err.message);
            setLoading(false);
          }
        });
    } else {
      navigate("/");
    }
  }, []);

  const aiOnerileriGetir = async (kullaniciId) => {
    setOneriYukleniyor(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`https://localhost:7181/api/Analitik/ai-oneri/${kullaniciId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setOneriler(data);
      }
    } catch (err) {
      console.error("Öneri alınamadı:", err);
    } finally {
      setOneriYukleniyor(false);
    }
  };
  const duyguNotuKaydet = async () => {
  if (!seciliIslem || !duyguNotu.trim()) return;

  setDuyguKaydediliyor(true);

  try {
    const token = sessionStorage.getItem("token");

    const res = await fetch(`https://localhost:7181/api/FinansalVeri/${seciliIslem.id}/duygu`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        duyguNotu: duyguNotu
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data || "Duygu notu kaydedilemedi.");
    }

    setVeriler(prev =>
      prev.map(item =>
        item.id === seciliIslem.id
          ? {
              ...item,
              duyguNotu: data.duyguNotu,
              duygu: data.duygu,
              metinDuygusu: data.metinDuygusu,
              guvenSkoru: data.guvenSkoru
            }
          : item
      )
    );

    setSeciliIslem(null);
    setDuyguNotu("");
  } catch (err) {
    alert(err.message);
  } finally {
    setDuyguKaydediliyor(false);
  }
};

  const cikisYap = () => {
    sessionStorage.clear();
    navigate("/");
  };

  // KPI hesapları
  const toplamHarcama = veriler
    .filter(x => x.islemTutari < 0)
    .reduce((sum, x) => sum + Math.abs(x.islemTutari), 0);

  const toplamGelir = veriler
    .filter(x => x.islemTutari > 0)
    .reduce((sum, x) => sum + x.islemTutari, 0);

  // ✅ Aylık özet grafik — tüm işlemler yerine ay bazında
  const aylikOzet = veriler.reduce((acc, v) => {
    const ay = (v.tarih || "").slice(0, 7); // "DD.MM.YYYY" → ilk 7 karakter değil, biz backend'den "dd.MM.yyyy" alıyoruz
    // "15.03.2024" → "03.2024"
    const parts = (v.tarih || "").split(".");
    const ayKey = parts.length === 3 ? `${parts[1]}.${parts[2]}` : v.tarih;
    if (!acc[ayKey]) acc[ayKey] = 0;
    acc[ayKey] += v.islemTutari;
    return acc;
  }, {});

  const chartData = {
  labels: Object.keys(aylikOzet),
  datasets: [{
    fill: true,
    label: "Aylık Net",
    data: Object.values(aylikOzet),
    borderColor: (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return "#2563eb";

      const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
      gradient.addColorStop(0, "#0ea5e9");   // cyan-blue
      gradient.addColorStop(0.5, "#2563eb"); // blue
      gradient.addColorStop(1, "#7c3aed");   // purple

      return gradient;
    },
    backgroundColor: (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return "rgba(37,99,235,0.12)";

      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, "rgba(124,58,237,0.32)");
      gradient.addColorStop(0.45, "rgba(37,99,235,0.18)");
      gradient.addColorStop(1, "rgba(14,165,233,0.04)");

      return gradient;
    },
    borderWidth: 4,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBorderWidth: 2,
    pointBackgroundColor: "#ffffff",
    pointBorderColor: "#2563eb",
    tension: 0.45,
  }]
};
const duyguStili = (duygu = "") => {
  switch (duygu) {
    case "Mutlu":
      return "bg-purple-50 text-purple-600 border-purple-100";
    case "Stresli":
      return "bg-rose-50 text-rose-600 border-rose-100";
    case "Üzgün":
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case "Kaygılı":
      return "bg-amber-50 text-amber-600 border-amber-100";
    case "Normal":
      return "bg-slate-50 text-slate-500 border-slate-100";
    default:
      return "bg-purple-50 text-purple-600 border-purple-100";
  }
};

  if (loading) return (
    <div className="p-20 text-center font-bold text-slate-500">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      Yükleniyor...
    </div>
  );

  if (hata) return (
    <div className="p-20 text-center text-red-600 font-bold">
      ⚠️ {hata}
      <br />
      <button onClick={() => navigate("/")} className="mt-4 text-blue-600 underline text-base font-normal">
        Giriş sayfasına dön
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex relative bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#f8fafc_100%)]">
      {/* Misafir Uyarısı */}
      {isGuest && (
        <div className="fixed top-4 right-4 z-50 bg-orange-100 border border-orange-200 p-4 rounded-2xl shadow-lg">
          <p className="text-orange-700 text-sm font-bold">⚠️ Deneme Modu: Verileriniz kaydedilmiyor!</p>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/85 backdrop-blur-xl border-r border-white/70 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-10">
          <Brain size={28} />
          <span>FinansAI</span>
        </div>
        <nav className="space-y-2 flex-1">
          <NavItem icon={<Activity size={20} />} label="Genel Bakış" active onClick={() => navigate("/dashboard")} />
          <NavItem
            icon={<TrendingUp size={20} />}
            label="Analizler"
            onClick={() => isGuest ? alert("Analizler için üye olmalısın!") : navigate("/analytics")}
            className={isGuest ? "opacity-40 cursor-not-allowed" : ""}
          />
          <NavItem
            icon={<UploadCloud size={20} />}
            label="CSV Yükle"
            onClick={() => navigate("/upload")}
          />
          <NavItem icon={<CreditCard size={20} />} label="İşlemler" onClick={() => navigate("/transactions")} />
        </nav>
        {/* ✅ Çıkış butonu */}
        <button
          onClick={cikisYap}
          className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition text-sm font-medium mt-4"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 bg-transparent">
        <header className="mb-8 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-xl">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_34%)]" />

  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
    <div>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        {isGuest ? "Hoş Geldin, Misafir" : `Hoş Geldin, ${user?.adSoyad?.split(" ")[0] || "Kullanıcı"}`}
      </h1>

      <p className="text-blue-100 mt-2 max-w-xl">
        İşte finansal durumunun yapay zeka analizi.
      </p>
    </div>

    <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-4 text-right backdrop-blur-sm">
      <p className="text-xs text-blue-100 font-bold uppercase">İşlem Tarihi</p>
      <p className="text-lg font-bold">
        {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  </div>
</header>
        {seciliIslem && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
  >
    <div
      className="w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#ffffff 0%,#f8f7ff 100%)", border: "1px solid rgba(139,92,246,0.15)" }}
    >
      {/* Üst renkli şerit */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />

      <div className="p-7">
        {/* Başlık */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 text-xl">
            💭
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Duygu Notu Ekle</h3>
            <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
              {seciliIslem.aciklama}
              <span className="mx-1.5 text-slate-200">·</span>
              <span className="text-violet-500 font-bold">
                {Math.abs(seciliIslem.islemTutari).toLocaleString("tr-TR")} ₺
              </span>
            </p>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={duyguNotu}
            onChange={(e) => setDuyguNotu(e.target.value)}
            placeholder="Bu harcamayı yaparken ne hissediyordun?"
            className="w-full min-h-32 rounded-2xl p-4 outline-none resize-none text-sm text-slate-700 placeholder-slate-300 leading-relaxed transition-all"
            style={{
              background: "#f8f7ff",
              border: "1.5px solid #ede9fe",
            }}
            onFocus={e => { e.target.style.borderColor = "#a78bfa"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#ede9fe"; e.target.style.boxShadow = "none"; }}
          />
          <span className="absolute bottom-3 right-4 text-[11px] text-slate-300 font-medium">
            {duyguNotu.length} harf
          </span>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { setSeciliIslem(null); setDuyguNotu(""); }}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all"
          >
            Vazgeç
          </button>

          <button
            onClick={duyguNotuKaydet}
            disabled={duyguKaydediliyor || !duyguNotu.trim()}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
              boxShadow: duyguNotu.trim() ? "0 4px 14px rgba(124,58,237,0.35)" : "none"
            }}
          >
            {duyguKaydediliyor ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analiz ediliyor...
              </>
            ) : "✨ Analiz Et ve Kaydet"}
        </button>
      </div>
    </div>
  </div>
   </div>
)}

        {/* KPI KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KpiCard title="Toplam Gelir" amount={toplamGelir} color="text-emerald-600" bg="bg-emerald-50" icon={<TrendingUp />} />
          <KpiCard title="Toplam Harcama" amount={toplamHarcama} color="text-rose-600" bg="bg-rose-50" icon={<TrendingDown />} />
          <KpiCard title="Net Durum" amount={toplamGelir - toplamHarcama} color="text-blue-600" bg="bg-blue-50" icon={<Activity />} />
        </div>

        {/* GRAFİK + AI ÖNERİLER */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
  <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/70 shadow-sm">
    <h3 className="text-lg font-bold mb-6">Aylık Finansal Değişim</h3>
    <div className="h-72">
      <Line data={chartData} options={{ maintainAspectRatio: false ,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.18)"
        },
        ticks: {
          color: "#64748b"
        }
      },
      y: {
        grid: {
          color: "rgba(148, 163, 184, 0.22)"
        },
        ticks: {
          color: "#64748b"
        }
      }
    }
  }}
/>
    </div>
  </div>

  {/* AI Öneriler paneli */}
<div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/70 shadow-sm">
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Sparkles size={18} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">AI Öneriler</h3>
      </div>
      <p className="text-sm text-slate-500 mt-2">
        Verilerine göre kısa ve uygulanabilir finans önerileri.
      </p>
    </div>
  </div>

  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scroll">
    {oneriYukleniyor ? (
      <div className="flex items-center gap-3 text-slate-500 text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        Öneriler hazırlanıyor...
      </div>
    ) : oneriler.length > 0 ? (
      oneriler.map((o, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100/70 rounded-2xl p-4 transition hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
              {o.kategori || "Öneri"}
            </span>
            <span className="text-[11px] text-slate-400">
              {o.kaynak === "Groq" ? "AI" : "Kural"}
            </span>
          </div>

          <p className="text-sm leading-6 text-slate-700">
            {o.mesaj}
          </p>
        </motion.div>
      ))
    ) : (
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-slate-100 rounded-2xl p-4 transition hover:shadow-sm">
        <p className="text-sm text-slate-500 leading-6">
          {isGuest
            ? "Yüklenen CSV verilerine göre harcama dağılımınız analiz edildi."
            : "Veri yüklendikten sonra öneriler burada görünecek."}
        </p>
      </div>
    )}
  </div>

  {!isGuest && (
    <button
      onClick={() => navigate("/akilli-oneriler")}
      className="mt-5 w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl px-4 py-3 text-sm font-bold transition"
    >
      <span>Detaylı analizi gör</span>
      <ArrowRight size={18} />
    </button>
    )}
  </div>
</div>
        {/* İŞLEMLER TABLOSU */}
<div className="bg-gradient-to-br from-white/80 via-white/50 to-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-lg overflow-hidden transition-all duration-300">
  <div className="p-6 border-b border-white/20 bg-white/20">
    <h3 className="text-lg font-bold text-slate-800">Son İşlemler</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs uppercase font-bold border-b border-blue-100/70">
        <tr>
          <th className="px-6 py-4">İşlem Detay</th>
          <th className="px-6 py-4">Kategori</th>
          <th className="px-6 py-4">Tutar</th>
          <th className="px-6 py-4">Durum</th>
          <th className="px-6 py-4">Duygu</th>
        </tr>
      </thead>
      <tbody>
        {veriler.map((item, i) => (
          <tr 
            key={i} 
            className="hover:bg-blue-50/20 transition-colors border-b border-white/10 last:border-0"
          >
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{item.aciklama}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} /> {item.tarih}
                </span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="bg-blue-50/60 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 border border-blue-100/50">
                <Tag size={12} /> {item.kategori || "Genel"}
              </span>
            </td>
            <td className={`px-6 py-4 font-bold ${item.islemTutari < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {item.islemTutari?.toLocaleString("tr-TR")} ₺
            </td>
            <td className="px-6 py-4">
              {/* ✅ Gerçek anomali verisi — backend'den geliyor */}
              {item.isAnomali ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-50/70 backdrop-blur-sm text-amber-600 border border-amber-100/60 px-3 py-1.5 rounded-full text-xs font-bold">
                  <AlertTriangle size={13} />
                  Anomali Tespiti
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50/70 backdrop-blur-sm text-emerald-600 border border-emerald-100/60 px-3 py-1.5 rounded-full text-xs font-bold">
                  <Activity size={13} />
                  Güvenli
                </span>
              )}
            </td>
            <td className="px-6 py-4">
              {item.duygu ? (
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border w-fit shadow-sm ${duyguStili(item.duygu)}`}>
                    {item.duygu}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.metinDuygusu} · %{Math.round((item.guvenSkoru || 0) * 100)}
                  </span>
                </div>
              ) : item.islemTutari < 0 && !isGuest ? (
                <button
                  onClick={() => {
                    setSeciliIslem(item);
                    setDuyguNotu("");
                  }}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                >
                  Duygu Ekle
                </button>
              ) : (
                <span className="text-slate-300 text-xs italic">Yok</span>
              )}
                  </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </main>
                      </div>
                    );
                  }

function KpiCard({ title, amount, color, bg, icon }) {
  return (
    <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/70 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h4 className={`text-2xl font-bold mt-1 ${color}`}>
          {(amount || 0).toLocaleString("tr-TR")} ₺
        </h4>
      </div>
      <div className={`${bg} ${color} p-3 rounded-2xl`}>{icon}</div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium cursor-pointer transition
        ${active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}