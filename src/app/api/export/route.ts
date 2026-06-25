// Veri dışa aktarma (KVKK — veri taşınabilirliği).
// Kullanıcının tüm verisini okunur JSON olarak indirir.

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Yetkisiz", { status: 401 });
  }
  const userId = session.user.id;

  const [
    user,
    theme,
    accounts,
    categories,
    rules,
    transactions,
    events,
    debts,
    debtPayments,
    automations,
    financeProfile,
    findeksReports,
    monthlyReports,
    statementImports,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      // Sırlar (passwordHash, twoFactorSecret) dışa aktarılmaz.
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardedAt: true,
        twoFactorEnabled: true,
        consentedAt: true,
        createdAt: true,
      },
    }),
    db.themeSettings.findUnique({ where: { userId } }),
    db.account.findMany({ where: { userId } }),
    db.category.findMany({ where: { userId } }),
    db.categoryRule.findMany({ where: { userId } }),
    db.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    db.calendarEvent.findMany({ where: { userId } }),
    db.debt.findMany({ where: { userId } }),
    db.debtPayment.findMany({ where: { userId } }),
    db.paymentAutomation.findMany({ where: { userId } }),
    db.financeProfile.findUnique({ where: { userId } }),
    db.findeksReport.findMany({ where: { userId } }),
    db.monthlyReport.findMany({ where: { userId } }),
    db.statementImport.findMany({ where: { userId } }),
  ]);

  // Şifreli profil alanları okunur halde verilir (kullanıcının kendi verisi).
  const profil = financeProfile
    ? {
        ...financeProfile,
        taxOrIdNumber: decryptField(financeProfile.taxOrIdNumber),
        fullAddress: decryptField(financeProfile.fullAddress),
        aiIdentityText: decryptField(financeProfile.aiIdentityText),
      }
    : null;

  const data = {
    disaAktarimTarihi: new Date().toISOString(),
    kullanici: user,
    profil,
    tema: theme,
    hesaplar: accounts,
    kategoriler: categories,
    kategoriKurallari: rules,
    islemler: transactions,
    takvimOlaylari: events,
    borclar: debts,
    borcOdemeleri: debtPayments,
    odemeOtomasyonlari: automations,
    findeksRaporlari: findeksReports,
    aylikRaporlar: monthlyReports,
    dokumIceAktarimlari: statementImports,
  };

  await logAudit({ userId, action: "data.export" });

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="akca-verilerim.json"',
      "Cache-Control": "no-store",
    },
  });
}
