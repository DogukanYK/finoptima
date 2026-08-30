#!/usr/bin/env python3
"""
FinOptima — Findeks skor motoru kalibrasyonu (Kaggle "Home Credit Default Risk")

NE YAPAR
--------
`src/lib/findeks.ts` içindeki mevcut motor (tasarruf/gider-gelir/istikrar/ödeme
düzeni ağırlıkları: 0.30/0.25/0.20/0.15/0.10 ve sihirli sabitler 250/160/150/140)
hiçbir gerçek veriye kalibre edilmemiş, elle seçilmiş sabitler kullanıyor. Ayrıca
motorda BORÇ ve KART KULLANIM ORANI hiç yok (bkz. src/lib/debt.ts:24 — hesaplanıyor
ama findeks.ts hiç çağırmıyor).

Bu script, gerçek kredi geri ödeme verisiyle (307.511 gerçek başvuru + gerçek
"ödedi/ödemedi" etiketi) motorda TAMAMEN EKSİK olan iki faktörü istatistiksel
olarak kalibre eder:

  1. Kredi kullanım oranı (utilization)       — motorda hiç yok
  2. Ödeme disiplini (gecikme sıklığı/süresi) — motorda kaba/keyfi (sabit metin)

DÜRÜST SINIRLAMA — ÖNEMLİ
-------------------------
Bu veri seti bir KREDİ BAŞVURUSU veri setidir, ham banka hesap hareketi (aylık
gelir/gider zaman serisi) DEĞİLDİR. Bu yüzden FinOptima'nın "tasarruf oranı" ve
"harcama istikrarı" faktörlerini bu veriden YENİDEN KALİBRE ETMEK mümkün değildir
— o ikisi gerçek banka ekstresi zaman serisi + geri ödeme etiketi ister (böyle bir
veri seti kamuya açık değil; bkz. arXiv 2510.16066 — yazarları "yayınlamayı
planlıyoruz" diyor, henüz yayınlamadılar). Bu script o iki faktöre DOKUNMAZ.
Yalnızca modelde eksik olan iki faktörü, gerçek veriyle kalibre edilmiş kanıta
dayalı ağırlıklarla EKLEMEK için sayı üretir — var olan üç faktörü "düzeltmiyor",
onlara yeni ikisini "gerçek veriyle destekli" olarak ekliyor.

YÖNTEM
------
Kredi skorlama sektöründe standart teknik: Weight of Evidence (WOE) + Information
Value (IV) analizi (bkz. arXiv 2510.16066'nın kullandığı yöntem). Her özelliği 10
dilime (decile) ayırıp, her dilimde "iyi" (zamanında ödedi) / "kötü" (temerrüde
düştü) oranının log-oranını (WOE) ve ağırlıklı toplamını (IV) hesaplar.

IV yorumlama eşikleri (endüstri standardı):
  < 0.02        → önemsiz, tahmin gücü yok
  0.02 - 0.10   → zayıf
  0.10 - 0.30   → orta
  0.30 - 0.50   → güçlü
  > 0.50        → şüpheli derecede güçlü (veri sızıntısı olabilir, kontrol et)

Çapraz kontrol için basit bir lojistik regresyon (AUC) da raporlanır — WOE/IV
sıralamasıyla tutarlı mı diye bakılır.

VERİYİ NEREDEN ALACAKSIN
------------------------
1. https://www.kaggle.com/c/home-credit-default-risk/data
   (ücretsiz Kaggle hesabı aç, yarışma kurallarını kabul et — 2 dakika)
2. İndir (yalnız bu 3 dosya yeterli, hepsini indirmene gerek yok):
     application_train.csv
     installments_payments.csv
     credit_card_balance.csv
3. Bu 3 dosyayı `scripts/calibration/data/` klasörüne koy.
   (Bu klasör .gitignore'da — ham veri asla repoya girmez.)

ÇALIŞTIRMA
----------
    cd scripts/calibration
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python calibrate_findeks.py

ÇIKTI
-----
Konsola okunaklı bir rapor + `output/findeks-weights-v2.json` — bu dosya,
`src/lib/findeks.ts`'e yeni faktörleri eklerken referans alınacak (kodu OTOMATİK
değiştirmez — kalibrasyon sonucunu üretime almak ayrı, bilinçli bir adım olmalı).
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_DIR = Path(__file__).parent / "output"

REQUIRED_FILES = [
    "application_train.csv",
    "installments_payments.csv",
    "credit_card_balance.csv",
]

# Home Credit veri setinin bilinen bir tuhaflığı: DAYS_EMPLOYED alanında
# emekli/işsiz başvuranlar için 365243 (~1000 yıl) sentinel değeri var.
# Gerçek bir süre değil — eksik veri olarak ele alınmalı.
DAYS_EMPLOYED_ANOMALY = 365243


# --------------------------------------------------------------------------- #
# 1) Veri yükleme
# --------------------------------------------------------------------------- #

def check_data_files() -> None:
    missing = [f for f in REQUIRED_FILES if not (DATA_DIR / f).exists()]
    if missing:
        print("HATA: Gerekli veri dosyaları bulunamadı:\n", file=sys.stderr)
        for f in missing:
            print(f"  ✗ {DATA_DIR / f}", file=sys.stderr)
        print(
            "\nKaggle'dan indir: https://www.kaggle.com/c/home-credit-default-risk/data"
            f"\nVe şu klasöre koy: {DATA_DIR}\n",
            file=sys.stderr,
        )
        sys.exit(1)


def load_raw() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    check_data_files()
    print("Veri yükleniyor...")
    app = pd.read_csv(
        DATA_DIR / "application_train.csv",
        usecols=[
            "SK_ID_CURR",
            "TARGET",
            "AMT_INCOME_TOTAL",
            "AMT_CREDIT",
            "AMT_ANNUITY",
            "DAYS_EMPLOYED",
            "DAYS_BIRTH",
        ],
    )
    installments = pd.read_csv(
        DATA_DIR / "installments_payments.csv",
        usecols=[
            "SK_ID_CURR",
            "DAYS_INSTALMENT",
            "DAYS_ENTRY_PAYMENT",
            "AMT_INSTALMENT",
            "AMT_PAYMENT",
        ],
    )
    cc_balance = pd.read_csv(
        DATA_DIR / "credit_card_balance.csv",
        usecols=["SK_ID_CURR", "AMT_BALANCE", "AMT_CREDIT_LIMIT_ACTUAL"],
    )
    print(
        f"  application_train: {len(app):,} satır | "
        f"installments: {len(installments):,} satır | "
        f"credit_card_balance: {len(cc_balance):,} satır"
    )
    return app, installments, cc_balance


# --------------------------------------------------------------------------- #
# 2) Özellik mühendisliği — başvuran başına tek satıra indirgeme
# --------------------------------------------------------------------------- #

def engineer_utilization(cc_balance: pd.DataFrame) -> pd.Series:
    """Kredi kullanım oranı — motorda ŞU AN HİÇ OLMAYAN faktör."""
    df = cc_balance.copy()
    df = df[df["AMT_CREDIT_LIMIT_ACTUAL"] > 0]  # sıfır limitte oran tanımsız
    df["util"] = (df["AMT_BALANCE"] / df["AMT_CREDIT_LIMIT_ACTUAL"]).clip(0, 2)
    # Başvuran başına ortalama kullanım oranı (birden çok kart olabilir)
    return df.groupby("SK_ID_CURR")["util"].mean().rename("utilization")


def engineer_payment_discipline(installments: pd.DataFrame) -> pd.DataFrame:
    """Ödeme disiplini — gecikme sıklığı + ortalama gecikme günü."""
    df = installments.copy()
    df["days_late"] = (df["DAYS_ENTRY_PAYMENT"] - df["DAYS_INSTALMENT"]).clip(lower=0)
    df["is_late"] = (df["days_late"] > 0).astype(int)
    df["underpaid"] = (df["AMT_PAYMENT"] < df["AMT_INSTALMENT"] * 0.98).astype(int)

    agg = df.groupby("SK_ID_CURR").agg(
        late_payment_rate=("is_late", "mean"),
        avg_days_late=("days_late", "mean"),
        underpayment_rate=("underpaid", "mean"),
        n_installments=("is_late", "count"),
    )
    # En az 3 taksit geçmişi olmayanları güvenilmez sinyal say (tek taksitte
    # "hep zamanında" ya da "hep geç" demek istatistiksel gürültüdür).
    return agg[agg["n_installments"] >= 3].drop(columns="n_installments")


def engineer_application_features(app: pd.DataFrame) -> pd.DataFrame:
    df = app.copy()
    df["DAYS_EMPLOYED"] = df["DAYS_EMPLOYED"].replace(DAYS_EMPLOYED_ANOMALY, np.nan)
    df["employment_years"] = (-df["DAYS_EMPLOYED"] / 365.25).clip(lower=0)
    df["age_years"] = -df["DAYS_BIRTH"] / 365.25
    df["debt_service_ratio"] = (df["AMT_ANNUITY"] / df["AMT_INCOME_TOTAL"]).clip(0, 2)
    return df.set_index("SK_ID_CURR")[
        ["TARGET", "debt_service_ratio", "employment_years", "age_years"]
    ]


def build_feature_table(
    app: pd.DataFrame, installments: pd.DataFrame, cc_balance: pd.DataFrame
) -> pd.DataFrame:
    print("Özellikler hesaplanıyor (utilization, ödeme disiplini, borç servisi)...")
    base = engineer_application_features(app)
    util = engineer_utilization(cc_balance)
    disc = engineer_payment_discipline(installments)

    out = base.join(util, how="left").join(disc, how="left")
    # Kaggle verisinde bilinen aşırı-uç değerler var (ör. AMT_INCOME_TOTAL'da
    # ~117 milyonluk bir uç değer). Oran hesaplarında bunlar sonsuza (inf)
    # kaçabilir — WOE/IV ve lojistik regresyonu bozmadan önce NaN'a çevir
    # (dropna zaten eksik veriyi tutarlı şekilde dışlıyor).
    numeric_cols = out.select_dtypes(include=[np.number]).columns
    out[numeric_cols] = out[numeric_cols].replace([np.inf, -np.inf], np.nan)
    print(f"  Toplam başvuran: {len(out):,}")
    print(
        f"  Kart kullanım verisi olan: {out['utilization'].notna().sum():,} "
        f"({out['utilization'].notna().mean():.1%})"
    )
    print(
        f"  Taksit ödeme geçmişi olan: {out['late_payment_rate'].notna().sum():,} "
        f"({out['late_payment_rate'].notna().mean():.1%})"
    )
    return out


# --------------------------------------------------------------------------- #
# 3) Weight of Evidence / Information Value
# --------------------------------------------------------------------------- #

@dataclass
class IvResult:
    feature: str
    iv: float
    n_used: int
    coverage: float  # bu özelliğin dolu olduğu başvuran oranı
    direction: str  # "yüksek değer → daha riskli" ya da tersi


def compute_woe_iv(df: pd.DataFrame, feature: str, target: str = "TARGET", bins: int = 10) -> IvResult:
    """
    Endüstri standardı WOE/IV analizi. Eksik değerleri ayrı bir "bilinmiyor"
    dilimi olarak tutar (atmak yerine) — eksik olması da bir sinyal olabilir.
    """
    sub = df[[feature, target]].copy()
    sub["_bin"] = pd.qcut(sub[feature], q=bins, duplicates="drop")
    sub["_bin"] = sub["_bin"].cat.add_categories(["_missing_"])
    sub.loc[sub[feature].isna(), "_bin"] = "_missing_"

    total_good = (sub[target] == 0).sum()
    total_bad = (sub[target] == 1).sum()

    grouped = sub.groupby("_bin", observed=True)[target].agg(["count", "sum"])
    grouped.columns = ["n", "bad"]
    grouped["good"] = grouped["n"] - grouped["bad"]

    # Sıfıra bölmeyi/log(0)'ı önlemek için Laplace düzeltmesi (endüstri normu)
    grouped["good_dist"] = (grouped["good"] + 0.5) / (total_good + 0.5 * len(grouped))
    grouped["bad_dist"] = (grouped["bad"] + 0.5) / (total_bad + 0.5 * len(grouped))
    grouped["woe"] = np.log(grouped["good_dist"] / grouped["bad_dist"])
    grouped["iv_contrib"] = (grouped["good_dist"] - grouped["bad_dist"]) * grouped["woe"]

    iv_total = grouped["iv_contrib"].sum()

    # Yön: dilim ortalaması arttıkça kötü oranı artıyor mu azalıyor mu
    numeric_bins = grouped.drop("_missing_", errors="ignore")
    bad_rate_trend = (numeric_bins["bad"] / numeric_bins["n"]).values
    direction = (
        "yüksek değer → daha riskli"
        if len(bad_rate_trend) > 1 and bad_rate_trend[-1] > bad_rate_trend[0]
        else "yüksek değer → daha güvenli"
    )

    return IvResult(
        feature=feature,
        iv=round(float(iv_total), 4),
        n_used=int(sub[feature].notna().sum()),
        coverage=round(float(sub[feature].notna().mean()), 4),
        direction=direction,
    )


# --------------------------------------------------------------------------- #
# 4) Çapraz kontrol: lojistik regresyon (AUC)
# --------------------------------------------------------------------------- #

def logistic_cross_check(df: pd.DataFrame, features: list[str], target: str = "TARGET") -> float:
    sub = df[features + [target]].dropna()
    if len(sub) < 500:
        print(f"  (Uyarı: çapraz kontrol için yeterli tam-veri satırı yok: {len(sub)})")
        return float("nan")

    X = sub[features].values
    y = sub[target].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    scaler = StandardScaler().fit(X_train)
    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(scaler.transform(X_train), y_train)
    proba = model.predict_proba(scaler.transform(X_test))[:, 1]
    return round(float(roc_auc_score(y_test, proba)), 4)


# --------------------------------------------------------------------------- #
# 5) IV'den ağırlığa çevirme
# --------------------------------------------------------------------------- #

def derive_weights(results: list[IvResult]) -> dict[str, float]:
    """
    IV değerlerini normalize edip 1.0'a toplam ağırlıklara çevirir.
    Bu, YALNIZCA bu script'te hesaplanan yeni faktörler ARASINDAKİ göreli
    önemi verir — mevcut 5 faktörlü modele nasıl entegre edileceği (toplam
    bütçenin ne kadarını bu ikisinin alacağı) ayrı, ürün kararı gerektiren
    bir adımdır; bu script o kararı vermez.
    """
    total_iv = sum(r.iv for r in results)
    if total_iv <= 0:
        return {r.feature: 0.0 for r in results}
    return {r.feature: round(r.iv / total_iv, 4) for r in results}


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> None:
    app, installments, cc_balance = load_raw()
    features = build_feature_table(app, installments, cc_balance)

    print("\n" + "=" * 72)
    print("WOE / INFORMATION VALUE ANALİZİ")
    print("=" * 72)

    candidate_features = [
        "utilization",
        "late_payment_rate",
        "avg_days_late",
        "underpayment_rate",
        "debt_service_ratio",
        "employment_years",
    ]

    iv_results: list[IvResult] = []
    for f in candidate_features:
        r = compute_woe_iv(features, f)
        iv_results.append(r)
        yorum = (
            "önemsiz" if r.iv < 0.02 else
            "zayıf" if r.iv < 0.10 else
            "ORTA" if r.iv < 0.30 else
            "GÜÇLÜ" if r.iv < 0.50 else
            "ŞÜPHELİ DERECEDE GÜÇLÜ (kontrol et)"
        )
        print(
            f"  {f:22s} IV={r.iv:.4f}  [{yorum:28s}]  "
            f"kapsam={r.coverage:.0%}  yön: {r.direction}"
        )

    # Modelde şu an TAMAMEN eksik olan iki faktöre odaklan
    core_two = [r for r in iv_results if r.feature in ("utilization", "late_payment_rate")]
    weights = derive_weights(core_two)

    print("\n" + "=" * 72)
    print("YENİ FAKTÖRLER İÇİN KALİBRE EDİLMİŞ GÖRELİ AĞIRLIK")
    print("(yalnızca 'utilization' ve 'late_payment_rate' arasında, 1.0'a normalize)")
    print("=" * 72)
    for f, w in weights.items():
        print(f"  {f:22s} → {w:.4f}")

    print("\n" + "=" * 72)
    print("ÇAPRAZ KONTROL — Lojistik Regresyon AUC")
    print("=" * 72)
    auc = logistic_cross_check(
        features,
        ["utilization", "late_payment_rate", "debt_service_ratio", "employment_years"],
    )
    print(f"  AUC = {auc}  (0.5 = rastgele, 1.0 = mükemmel; sektörde 0.65-0.75 tipik)")

    # --- Çıktıyı kaydet ---
    OUTPUT_DIR.mkdir(exist_ok=True)
    result = {
        "kaynak": "Kaggle Home Credit Default Risk (307.511 gerçek başvuru)",
        "yontem": "Weight of Evidence / Information Value + lojistik regresyon çapraz kontrolü",
        "uyari": (
            "Bu kalibrasyon YALNIZCA 'utilization' ve 'late_payment_rate' faktörleri "
            "içindir — bunlar mevcut findeks.ts motorunda hiç yoktu. 'Tasarruf oranı' "
            "ve 'harcama istikrarı' faktörleri bu veri setiyle kalibre EDİLEMEZ (ham "
            "banka hareketi zaman serisi gerektirir, bu veri setinde yok)."
        ),
        "iv_analizi": [asdict(r) for r in iv_results],
        "yeni_faktor_agirliklari": weights,
        "capraz_kontrol_auc": auc,
        "hesaplanan_ornek_sayisi": len(features),
    }
    out_path = OUTPUT_DIR / "findeks-weights-v2.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSonuç kaydedildi: {out_path}")
    print(
        "\nSonraki adım: bu sayıları src/lib/findeks.ts'e MANUEL olarak, mevcut "
        "5 faktörle nasıl bütçe paylaşacağına karar vererek ekle (bkz. roadmap "
        "Faz 1.3 — computeCreditHealth v2). Bu script kodu otomatik değiştirmez."
    )


if __name__ == "__main__":
    main()
