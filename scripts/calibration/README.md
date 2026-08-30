# Findeks Skor Motoru Kalibrasyonu

`src/lib/findeks.ts` motorundaki ağırlıklar (0.30/0.25/0.20/0.15/0.10) ve sihirli
sabitler (250/160/150/140) hiçbir gerçek veriye kalibre edilmemiş — elle seçilmiş.
Bu klasör, **motorda tamamen eksik olan iki faktörü** (kredi kullanım oranı, ödeme
disiplini) gerçek kredi geri ödeme verisiyle kalibre eden bir araç içerir.

**Neyi kalibre EDEMEZ:** "Tasarruf oranı" ve "harcama istikrarı" faktörleri —
bunlar ham banka hesap hareketi (aylık gelir/gider zaman serisi) gerektirir,
kullanılan veri setinde (kredi başvurusu verisi) o yok. Bu script o iki faktöre
dokunmuyor, yalnız eksik olan ikisini gerçek veriyle destekliyor. Detay: script
içindeki docstring.

## 1) Veriyi al

1. [kaggle.com/c/home-credit-default-risk/data](https://www.kaggle.com/c/home-credit-default-risk/data) — ücretsiz hesap aç, yarışma kurallarını kabul et.
2. Şu 3 dosyayı indir (hepsi değil, sadece bunlar):
   - `application_train.csv`
   - `installments_payments.csv`
   - `credit_card_balance.csv`
3. `scripts/calibration/data/` klasörüne koy (bu klasör `.gitignore`'da).

## 2) Çalıştır

```bash
cd scripts/calibration
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python calibrate_findeks.py
```

## 3) Çıktı

Konsolda WOE/IV tablosu + AUC + `output/findeks-weights-v2.json`. Bu JSON,
`computeCreditHealth` v2'ye (roadmap Faz 1.3) yeni faktör eklerken referans
alınır — kodu otomatik değiştirmez, kasıtlı bir sonraki adımdır.

## Yöntem

Kredi skorlama sektöründe standart teknik: **Weight of Evidence / Information
Value (WOE-IV)** analizi (bkz. [arXiv 2510.16066](https://arxiv.org/html/2510.16066v2)'nın
kullandığı yöntem). Çapraz kontrol için lojistik regresyon AUC'si de raporlanır.
