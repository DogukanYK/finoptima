"""
Gerçek Kaggle verisi indirilmeden ÖNCE, aynı şema+istatistiksel ilişkiye sahip
SENTETİK veriyle calibrate_findeks.py'nin mantığını doğrular. Bu dosya geçicidir,
gerçek veri geldikten sonra silinebilir — repoya commit edilmez (test amaçlı).
"""
import numpy as np
import pandas as pd
from pathlib import Path

rng = np.random.default_rng(42)
N = 20_000
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

ids = np.arange(1, N + 1)

# Bilinçli olarak GERÇEKÇİ bir ilişki kur: yüksek kullanım oranı ve sık gecikme
# → daha yüksek temerrüt olasılığı. Bu, WOE/IV analizinin "doğru yönü" bulup
# bulmadığını test eder (sahte veri kusursuz olmasa da yön tutarlı olmalı).
true_utilization = rng.beta(2, 3, N)  # 0-1 arası, gerçekçi dağılım
true_late_rate = rng.beta(1.5, 4, N)
risk_score = 2.5 * true_utilization + 3.0 * true_late_rate + rng.normal(0, 0.3, N)
default_prob = 1 / (1 + np.exp(-(risk_score - 2.2) * 2))
target = (rng.random(N) < default_prob).astype(int)

income = rng.lognormal(11, 0.5, N)
annuity = income * rng.beta(2, 8, N)
employed_days = -rng.integers(30, 365 * 20, N)
employed_days[rng.random(N) < 0.05] = 365243  # anomali sentinel'i test et

app = pd.DataFrame({
    "SK_ID_CURR": ids,
    "TARGET": target,
    "AMT_INCOME_TOTAL": income,
    "AMT_CREDIT": income * rng.uniform(1, 5, N),
    "AMT_ANNUITY": annuity,
    "DAYS_EMPLOYED": employed_days,
    "DAYS_BIRTH": -rng.integers(365 * 21, 365 * 65, N),
})
app.to_csv(DATA_DIR / "application_train.csv", index=False)

# Her başvurana 1-3 kart, her kartın birkaç ay bakiyesi
cc_rows = []
for sk_id, util in zip(ids, true_utilization):
    n_cards = rng.integers(1, 4)
    for _ in range(n_cards):
        limit = rng.choice([5000, 10000, 20000, 50000])
        for _ in range(rng.integers(3, 12)):
            cc_rows.append({
                "SK_ID_CURR": sk_id,
                "AMT_BALANCE": limit * util * rng.uniform(0.7, 1.3),
                "AMT_CREDIT_LIMIT_ACTUAL": limit,
            })
pd.DataFrame(cc_rows).to_csv(DATA_DIR / "credit_card_balance.csv", index=False)

# Her başvurana birkaç taksit, gecikme oranına göre gecikmeli/erken ödeme
inst_rows = []
for sk_id, late_rate in zip(ids, true_late_rate):
    n_inst = rng.integers(4, 24)
    for i in range(n_inst):
        due = -(n_inst - i) * 30
        is_late = rng.random() < late_rate
        actual = due + (rng.integers(1, 20) if is_late else -rng.integers(0, 3))
        amt = rng.uniform(200, 2000)
        inst_rows.append({
            "SK_ID_CURR": sk_id,
            "DAYS_INSTALMENT": due,
            "DAYS_ENTRY_PAYMENT": actual,
            "AMT_INSTALMENT": amt,
            "AMT_PAYMENT": amt * (rng.uniform(0.9, 1.0) if is_late else 1.0),
        })
pd.DataFrame(inst_rows).to_csv(DATA_DIR / "installments_payments.csv", index=False)

print(f"Sentetik veri üretildi: {N:,} başvuran → {DATA_DIR}")
print("Bilinen gerçek ilişki: utilization ve late_rate arttıkça TARGET (temerrüt) artıyor.")
print("Beklenti: WOE/IV analizi ikisi için de 'yüksek değer → daha riskli' + orta/güçlü IV bulmalı.")
