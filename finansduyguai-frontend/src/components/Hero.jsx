import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="bg-linear-to-br from-blue-50 to-white py-20 px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-1/2 text-center md:text-left"
        >
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            Harcamalarınızın <span className="text-blue-600">Duygusunu</span> Keşfedin
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Yapay zeka destekli sistemimizle sadece rakamları değil, harcamalarınızın arkasındaki psikolojiyi de takip edin. [cite: 23] Gelir-gider dengenizi korurken duygusal tüketimlerinizi fark edin. [cite: 24]
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl transition">
              Hemen Analize Başla
            </button>
            <div className="flex items-center gap-2 text-gray-500 font-medium px-4">
              <span>⭐ 4.9 Kullanıcı Puanı</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default Hero;