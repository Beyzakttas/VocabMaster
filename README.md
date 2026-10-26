# 🎯 YDS Kelime Öğrenme Platformu (YDS Vocab Master)

Modern, hafif ve sınav odaklı YDS & YDT İngilizce kelime öğrenme uygulaması.

---

## 📁 Proje Dizin Yapısı (Project Architecture)

Profesyonel yazılım geliştirme standartlarına uygun (SoC - Separation of Concerns) mimari:

```text
ingilizce/
├── db/                                # 🗄️ Veri Katmanı (Data Layer)
│   ├── words_dataset.json             # 1.243 adet tekilleştirilmiş YDS kelime havuzu
│   ├── words_by_level.json            # CEFR seviyelerine (A1 - C1/C2) göre gruplanmış veri
│   ├── doc1_words.json                # Remzi Hoca 600 İsim verisi
│   └── scripts/                       # Veri işleme & derleme betikleri (Data pipelines)
│       ├── build_dataset.js           # 1. Doküman ayrıştırıcı
│       └── build_full_dataset.js      # Çok kaynaklı veri birleştirici & tekilleştirici
│
├── src/                               # 💻 Uygulama Kaynak Kodları (Source Code)
│   ├── css/                           # Tasarım sistemi, tema ve stiller
│   │   ├── style.css                  # Değişkenler, reset ve ana düzen
│   │   └── components.css             # Kartlar, sınav paneli, animasyonlar
│   ├── js/                            # İstemci tarafı modülleri
│   │   ├── app.js                     # Ana uygulama başlatıcı ve yönlendirici
│   │   ├── state.js                   # Uygulama durum yönetimi (State Management)
│   │   ├── flashcard.js               # Kart çevirme & çalışma motoru
│   │   ├── quiz.js                    # 5 seçenekli YDS sınav motoru
│   │   ├── storage.js                 # LocalStorage ve SRS (Aralıklı Tekrar) algoritması
│   │   └── speech.js                  # Web Speech API doğal telaffuz servisi
│   └── assets/                        # Görseller, ikonlar ve medya dosyaları
│
├── index.html                         # 🌐 Uygulama Ana Giriş Noktası
└── README.md                          # 📖 Proje Dokümantasyonu
```

---

## 🚀 Özellikler
* **1.243 Kelimelik Zengin Havuz:** Remzi Hoca 600 İsim + DreamPiuv 58 Sayfalık YDT/YDS Listesi.
* **CEFR Filtreleme:** A1, A2, B1, B2, C1 ve C2 seviyelerine göre kelime seçimi.
* **Sıfır Ağır Veritabanı:** Kurulum gerektirmeyen, tarayıcıda ultra hızlı çalışan optimize JSON veri mimarisi.
* **Web Speech API:** Harici servislere bağımlı olmadan tarayıcı içi doğal İngilizce sesli telaffuz.
* **SRS (Aralıklı Tekrar):** Öğrenme durumuna göre (Öğrenildi, Tekrar Edilecek, Zor) kişisel kelime takip sistemi.
* **ÖSYM Tarzı Test:** 5 seçenekli soru simülatörü.
