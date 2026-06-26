# 🚀 FinansDuyguAI - Yapay Zeka Destekli Finansal Analiz Platformu

FinansDuyguAI; kullanıcıların banka hesap hareketlerini analiz ederken, harcama alışkanlıkları ile o anki duygu durumları arasındaki ilişkiyi inceleyen, harcama anomalilerini yakalayan ve buna göre kişiselleştirilmiş finansal öneriler sunan akıllı bir asistandır.

---

## ✨ Temel Özellikler

* **Banka Geçmişi Yükleme:** Bankadan alınan `.csv` formatındaki harcama listelerinin sisteme aktarılması ve otomatik şablon eşleştirmesi (`CSVHelper`).
* **Yapay Zeka ile Duygu Analizi:** Harcama dönemlerindeki kullanıcı notlarının doğal dil işleme (BERT tabanlı Türkçe model) ile analiz edilerek "Pozitif", "Negatif" veya "Nötr" olarak sınıflandırılması.
* **Harcama Sapmaları (Anomali Tespiti):** Kullanıcının geçmiş harcama zaman serileri incelenerek alışılmışın dışındaki ani artışların akıllı algoritmalarla (`ML.NET - SSA`) otomatik yakalanması.
* **Hibrit Akıllı Öneriler:** Finansal özetler ve duygu durum çıktıları birleştirilerek hem kural tabanlı motor hem de büyük dil modelleri (`Groq Cloud API & Llama 3.1`) aracılığıyla kullanıcıya özel bütçe tavsiyeleri üretilmesi.

---

## 📁 Proje Yapısı 

Proje; frontend, backend ve yapay zeka servislerinin tek bir çatı altında düzenli bir şekilde toplandığı **Monorepo** standartlarına uygun geliştirilmiştir:

* 📁 **finansduyguai-frontend:** Kullanıcının grafiklerle harcamalarını ve analizlerini izlediği animasyon destekli (`Framer Motion`) React / Vite arayüzü.
* 📁 **finansduyguai-backend:** Veritabanı yönetimini, JWT tabanlı güvenliği ve `ML.NET` anomali tespit servislerini barındıran Hizmet Odaklı (SOA) ASP.NET Core Web API projesi.
* 📁 **finansduyguai-ai:** Duygu analizi modelinin çalıştığı ve backend ile asenkron haberleşen FastAPI tabanlı Python mikro servisi.

---

## 🛠️ Teknolojik Altyapı

* **Frontend:** React, Vite, Tailwind CSS, Framer Motion, JavaScript
* **Backend:** ASP.NET Core Web API (.NET 8), Entity Framework Core
* **Veritabanı:** Microsoft SQL Server
* **Yapay Zeka & Analitik:** Python, FastAPI, ML.NET, HuggingFace (BERT), Groq API (Llama 3.1)
