import { LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-6 px-10 bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
        <LayoutDashboard size={28} />
        <span>FinansDuygu AI</span>
      </div>
      <div className="hidden md:flex gap-8 text-gray-600 font-medium">
        <a href="#ozellikler" className="hover:text-blue-600 transition">Özellikler</a>
        <a href="#analiz" className="hover:text-blue-600 transition">Nasıl Çalışır?</a>
        <a href="#guvenlik" className="hover:text-blue-600 transition">Güvenlik</a>
      </div>
      <div className="flex gap-4">
        <button className="text-blue-700 font-semibold px-4 py-2">Giriş Yap</button>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold transition shadow-lg">
          Ücretsiz Deneyin
        </button>
      </div>
    </nav>
  );
};
export default Navbar;