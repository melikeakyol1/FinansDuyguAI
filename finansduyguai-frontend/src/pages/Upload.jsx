import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  //const user = JSON.parse(sessionStorage.getItem("user"));
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const token = sessionStorage.getItem("token");
  const isGuest = sessionStorage.getItem("isGuest") === "true";
  // Upload.jsx içinde
const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("csvFile", file);

    // URL belirleme
    const url = !isGuest && user
        ? `https://localhost:7181/api/FinansalVeri/csv-yukle?kullaniciId=${user.id}`
        : "https://localhost:7181/api/FinansalVeri/deneme-analiz";

    // Header belirleme (Kullanıcı varsa Token ekle)
    const headers = {};
    if (!isGuest && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { 
        method: "POST", 
        body: formData,
        headers: headers // ✅ Token buraya eklendi
      });

      const result = await res.json();

      if (res.ok) {
        if (!isGuest && user) {
          // Kayıtlı kullanıcı akışı
          sessionStorage.setItem("isGuest", "false");
          navigate("/dashboard");
        } else {
          // Misafir (Deneme Analizi) akışı
          sessionStorage.setItem("denemeVerileri", JSON.stringify(result.veriler));
          sessionStorage.setItem("isGuest", "true");
          navigate("/dashboard");
        }
      } else {
        const errorMsg = result.message || "Yükleme sırasında bir hata oluştu.";
        alert(res.status === 401 ? "Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın." : errorMsg);
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Bağlantı hatası oluştu.");
    } finally {
      setUploading(false);
    }
  };

  return (
  <div className="min-h-screen bg-white text-slate-900 flex flex-col">
    {/* Üst geri butonu */}
    <button
      onClick={() => navigate(user ? "/dashboard" : "/")}
      className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-medium text-sm"
    >
      <ArrowLeft size={18} />
      {user ? "Dashboard'a Dön" : "Ana Sayfaya Dön"}
    </button>

    <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-10">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          CSV Dosyanızı Yükleyin
        </h1>
        <p className="mt-5 text-slate-500 text-base md:text-lg">
          Finansal hareketlerinizi içeren CSV dosyasını yükleyin ve analiz etmeye başlayın.
        </p>
        
      </motion.div>

      {/* Geniş upload alanı */}
      <motion.label
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`
          relative w-full max-w-6xl min-h-[260px] border-2 border-dashed rounded-none
          flex flex-col items-center justify-center cursor-pointer transition-all
          ${file ? "border-green-300 bg-green-50/40" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"}
        `}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {file ? (
          <div className="text-center">
            <CheckCircle2 className="text-green-500 mx-auto mb-4" size={46} />
            <p className="text-green-700 font-bold text-lg">{file.name}</p>
            <p className="text-green-600/70 text-sm mt-2">Dosya analize hazır.</p>
          </div>
        ) : (
          <div className="text-center">

            <div className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-lg font-bold text-base transition shadow-sm">
              Dosyayı yükleyerek başlayın ↑
            </div>
          </div>
        )}

        <span className="absolute left-8 bottom-7 text-sm text-slate-400">
          dosyaları buraya bırak
        </span>

      </motion.label>

      {/* Bilgilendirme */}
      <div className="mt-10 flex items-start gap-3 max-w-4xl bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
      <p className="text-sm text-amber-700 leading-relaxed">
        Yüklediğiniz veriler anomali tespiti ve finansal analiz için işlenir.
        Duygu analizi, daha sonra işlem satırlarına ekleyeceğiniz duygu notları üzerinden yapılır.
      </p>
    </div>

      {/* İşlem Butonu */}
      <button
        disabled={!file || uploading}
        onClick={handleUpload}
        className={`
          mt-8 px-10 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3
          ${!file || uploading
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200 active:scale-[0.98]"}
        `}
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Veriler analiz ediliyor...
          </>
        ) : (
          "Analizi Başlat ve Dashboard'a Git"
        )}
      </button>
    </main>
  </div>
);
}