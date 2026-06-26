import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Sparkles, Loader2,
  BarChart2, AlertTriangle, SmilePlus,
  Lightbulb, CalendarCheck, Frown,
} from "lucide-react";

const BOLUMLER = [
  { 
    key: "finansal", 
    baslik: "Teknik Finansal Analiz",       
    eslesen: ["teknik", "finansal", "harcama", "durum", "analiz raporu"],       
    tag: "FİNANSAL",    
    Icon: BarChart2,    
    defaultOpen: true 
  },
  { 
    key: "duygu",    
    baslik: "Duygu & Harcama Tespitleri",   
    eslesen: ["duygu", "davranış", "tespit", "psikoloji", "harcama ve duygu", "duygu ve harcama", "hissi", "harcama tespit"], 
    tag: "DAVRANIŞSAL", 
    Icon: SmilePlus 
  },
  { 
    key: "tavsiye",  
    baslik: "Uygulanabilir Tavsiyeler",     
    eslesen: ["tavsiye", "öneri", "günlük", "strateji", "uygulanabilir"], 
    tag: "TAVSİYELER",  
    Icon: Lightbulb 
  },
  { 
    key: "aksiyon",  
    baslik: "Önümüzdeki Ay Aksiyon Planı",  
    eslesen: ["aksiyon", "plan", "önümüzdeki", "hedef"],  
    tag: "AKSİYON",     
    Icon: CalendarCheck 
  },
];

function metniParcala(metin) {
  if (!metin) return {};
  const satirlar = metin.split("\n");
  const parcalar = {};
  let aktifKey = null, buffer = [];

  const eslestir = (s) => {
    const normalize = (str) =>
      str.toLowerCase()
        .replace(/ı/g, "i").replace(/ğ/g, "g")
        .replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/\u0443/g, "u")
        .replace(/\u0430/g, "a")
        .replace(/\u0435/g, "e")
        .replace(/\u043e/g, "o")
        .replace(/\u0440/g, "r")
        .replace(/\u0441/g, "c");

    const temizSatir = s.replace(/^#+\s*/, "").trim();
    const satirNorm = normalize(temizSatir);

    // Numara bazlı eşleştirme (en güvenilir yöntem)
    if (/^1\./.test(satirNorm)) return BOLUMLER.find(b => b.key === "finansal");
    if (/^2\./.test(satirNorm)) return BOLUMLER.find(b => b.key === "duygu");
    if (/^3\./.test(satirNorm)) return BOLUMLER.find(b => b.key === "tavsiye");
    if (/^4\./.test(satirNorm)) return BOLUMLER.find(b => b.key === "aksiyon");

    // Fallback: kelime bazlı
    return BOLUMLER.find(b =>
      b.eslesen.some(e => satirNorm.includes(normalize(e)))
    );
  };

  for (const satir of satirlar) {
    if (satir.trimStart().startsWith("###") || satir.trimStart().startsWith("##")) {
      if (aktifKey) parcalar[aktifKey] = buffer.join("\n").trim();
      buffer = [];
      const b = eslestir(satir);
      aktifKey = b ? b.key : null;
    } else { 
      if (aktifKey) buffer.push(satir); 
    }
  }
  if (aktifKey) parcalar[aktifKey] = buffer.join("\n").trim();

  if (Object.keys(parcalar).length === 0 && metin) {
    parcalar["finansal"] = metin;
  }

  return parcalar;
}

/* ── Markdown render ── */
const MarkdownBody = ({ content }) => (
  <ReactMarkdown
    components={{
      h4: ({ ...p }) => <h4 className="text-sm font-semibold text-violet-700 mt-4 mb-1.5" {...p} />,
      p:  ({ ...p }) => <p  className="text-[14px] leading-7 text-slate-500 mb-2" {...p} />,
      ul: ({ ...p }) => <ul className="mt-2 mb-3 space-y-2" {...p} />,
      li: ({ ...p }) => (
        <li className="flex gap-2.5 items-start list-none text-[13px] text-slate-500 leading-6">
          <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
          <span {...p} />
        </li>
      ),
      strong: ({ ...p }) => <strong className="font-semibold text-slate-700" {...p} />,
    }}
  >
    {content}
  </ReactMarkdown>
);

/* ── Widget bileşenleri ── */
const FinansalWidget = () => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Harcama Dağılımı</p>
    {[
      { label: "Eğitim", val: "10.038 TL", pct: 100, color: "bg-violet-500" },
      { label: "Giyim & Aksesuar", val: "2.454 TL", pct: 24, color: "bg-blue-400" },
      { label: "Eğlence", val: "1.205 TL", pct: 12, color: "bg-indigo-300" },
    ].map(({ label, val, pct, color }) => (
      <div key={label}>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-600">{label}</span>
          <span className="text-xs font-bold text-slate-700">{val}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    ))}
    <div className="pt-2 border-t border-slate-100 flex justify-between">
      <span className="text-[11px] text-slate-400">Toplam</span>
      <span className="text-[11px] font-bold text-violet-600">13.697 TL</span>
    </div>
  </div>
);

const DuyguWidget = () => (
  <div className="space-y-3">
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
          <SmilePlus size={14} className="text-emerald-500" />
        </div>
        <span className="text-xs font-bold text-emerald-700">Mutluluk</span>
      </div>
      <p className="text-[12px] text-slate-500 leading-relaxed">Eğlence · Arkadaş aktiviteleri · Sosyal harcamalar</p>
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
          <Frown size={14} className="text-amber-500" />
        </div>
        <span className="text-xs font-bold text-amber-700">Stres</span>
      </div>
      <p className="text-[12px] text-slate-500 leading-relaxed">Market & gıda · Restoran & kafe · Zorunlu giderler</p>
    </div>
  </div>
);

const TavsiyeWidget = () => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Tasarruf Potansiyeli</p>
    {[
      { label: "Eğitim harcaması", azalt: "%20", tl: "~2.000 TL", color: "text-violet-600" },
      { label: "Giyim harcaması",  azalt: "%15", tl: "~368 TL",   color: "text-blue-600" },
    ].map(({ label, azalt, tl, color }) => (
      <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <div>
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className="text-[11px] text-slate-400">Azaltma hedefi: {azalt}</p>
        </div>
        <span className={`text-sm font-bold ${color}`}>{tl}</span>
      </div>
    ))}
    <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 flex justify-between items-center">
      <span className="text-[11px] text-violet-600 font-medium">Toplam tasarruf hedefi</span>
      <span className="text-sm font-bold text-violet-700">~2.368 TL</span>
    </div>
  </div>
);

const AnomalyWidget = () => (
  <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={15} className="text-red-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-red-800">IYZICO / OPENENGLISH</p>
        <p className="text-[11px] text-red-400 mt-0.5">9.490 TL · Olağandışı işlem</p>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center bg-red-50 rounded-xl px-3 py-2">
        <span className="text-[11px] text-red-600">Güven skoru</span>
        <span className="text-xs font-bold text-red-700">0.00</span>
      </div>
      <div className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
        <span className="text-[11px] text-slate-500">Önerilen aksiyon</span>
        <span className="text-[11px] font-semibold text-slate-700">Uzmanla incele</span>
      </div>
    </div>
  </div>
);

const WIDGETS = { finansal: FinansalWidget, duygu: DuyguWidget, tavsiye: TavsiyeWidget, aksiyon: AnomalyWidget };

/* ── Bölüm satırı ── */
const BolumSatiri = ({ bolum, content, index }) => {
  const { baslik, tag } = bolum;
  const Widget = WIDGETS[bolum.key];
  const reversed = index % 2 !== 0;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 py-14 border-b border-slate-100 last:border-0 ${reversed ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : ""}`}>
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-violet-500 mb-3">
          {tag}
        </span>
        <h2
          className="text-2xl font-bold text-slate-900 leading-tight mb-4"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          {baslik}
        </h2>
        {content
          ? <MarkdownBody content={content} />
          : <p className="text-sm text-slate-400 italic">Bu bölüm için içerik hazırlanamadı.</p>
        }
      </div>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-xs">
          <Widget />
        </div>
      </div>
    </div>
  );
};

/* ── Ana bileşen ── */
export default function AkilliOneriler() {
  const navigate = useNavigate();
  const [parcalar, setParcalar] = useState(null);
  const [hata, setHata] = useState("");

  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    const token = sessionStorage.getItem("token");

    fetch(`https://localhost:7181/api/Analitik/akilli-oneriler/${user.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || "Detaylı öneriler alınamadı.");

        const ham = (data?.oneriMetni || "")
          .replace(/```[\w]*[\s\S]*?```/g, "")
          .replace(/~~~[\s\S]*?~~~/g, "")
          .replace(/^\s*[\[{][\s\S]*$/m, "")
          .split(/yanıtı (json|kod)/i)[0]
          .trim();

        // ── State güncelleme (kritik satır) ──
        setParcalar(metniParcala(ham));
      })
      .catch((err) => {
        setHata(err.message);
        setParcalar({});
      });
  }, []);

  const yukleniyor = parcalar === null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Geri
          </button>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <div className="py-16 border-b border-slate-100">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-violet-500 mb-4 block">
            Yapay Zeka · Kişisel Analiz
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1
                className="text-5xl font-bold text-slate-900 leading-tight mb-3"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Finansal &amp;<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-500">
                  Duygusal Analiz
                </span>
              </h1>
              <p className="text-[15px] text-slate-400 max-w-md leading-relaxed">
                Harcamalarınız, duygu notlarınız ve anomalileriniz birlikte yorumlandı.
              </p>
            </div>
            <div className="flex gap-10 flex-shrink-0">
              {[
                { label: "TOPLAM HARCAMA", value: "13.697", sub: "TL bu ay", color: "text-violet-600" },
                { label: "KATEGORİ",       value: "3",       sub: "aktif",    color: "text-blue-500"   },
                { label: "ANOMALİ",        value: "1",       sub: "tespit",   color: "text-indigo-500" },
              ].map(({ label, value, sub, color }) => (
                <div key={label}>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1">{label}</p>
                  <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {yukleniyor && (
          <div className="py-28 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Loader2 className="animate-spin text-violet-500" size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Analiz hazırlanıyor…</p>
              <p className="text-sm text-slate-400 mt-1">Bu işlem birkaç saniye sürebilir.</p>
            </div>
          </div>
        )}

        {!yukleniyor && hata && (
          <div className="mt-10 flex gap-3 bg-red-50 border border-red-100 rounded-2xl p-5">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{hata}</p>
          </div>
        )}

        {!yukleniyor && !hata && (
          <div>
            {BOLUMLER.map((bolum, i) => (
              <BolumSatiri
                key={bolum.key}
                bolum={bolum}
                content={parcalar[bolum.key]}
                index={i}
              />
            ))}
          </div>
        )}

        {!yukleniyor && !hata && (
          <div className="py-8 flex items-start gap-3 border-t border-slate-100">
            <Sparkles size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Daha fazla harcamaya duygu notu ekledikçe analiz daha kişisel ve isabetli hale gelir.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
