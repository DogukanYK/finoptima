"use server";

// Hazır yanıt makrosu (SupportMacro) admin action'ları.
// GÜVENLİK: layout'taki requireAdmin server action'ları KORUMAZ (action'lar doğrudan
// çağrılabilir POST'lardır) — bu yüzden HER action kendi içinde requireAdminId() ile
// rol kontrolü yapar. Mutasyonlar logAudit + revalidatePath ile kayıt altına alınır.

import { revalidatePath } from "next/cache";
import { requireAdminId } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { createMacro, updateMacro, deleteMacro } from "@/lib/support/macros";

export type MacroActionResult = { ok: true } | { ok: false; error: string };

export async function createMacroAction(input: {
  title: string;
  body: string;
  category?: string | null;
}): Promise<MacroActionResult> {
  const adminId = await requireAdminId();
  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();
  if (!title) return { ok: false, error: "Başlık boş olamaz." };
  if (!body) return { ok: false, error: "Yanıt metni boş olamaz." };

  const macro = await createMacro({
    title,
    body,
    category: input.category ?? null,
  });
  await logAudit({
    userId: adminId,
    action: "support.macro_create",
    entityType: "SupportMacro",
    entityId: macro.id,
    metadata: { title: macro.title },
  });
  revalidatePath("/admin/makrolar");
  return { ok: true };
}

export async function updateMacroAction(
  id: string,
  input: { title?: string; body?: string; category?: string | null },
): Promise<MacroActionResult> {
  const adminId = await requireAdminId();
  if (!id) return { ok: false, error: "Geçersiz makro." };
  if (input.title !== undefined && !input.title.trim())
    return { ok: false, error: "Başlık boş olamaz." };
  if (input.body !== undefined && !input.body.trim())
    return { ok: false, error: "Yanıt metni boş olamaz." };

  await updateMacro(id, input);
  await logAudit({
    userId: adminId,
    action: "support.macro_update",
    entityType: "SupportMacro",
    entityId: id,
  });
  revalidatePath("/admin/makrolar");
  return { ok: true };
}

export async function deleteMacroAction(
  id: string,
): Promise<MacroActionResult> {
  const adminId = await requireAdminId();
  if (!id) return { ok: false, error: "Geçersiz makro." };

  await deleteMacro(id);
  await logAudit({
    userId: adminId,
    action: "support.macro_delete",
    entityType: "SupportMacro",
    entityId: id,
  });
  revalidatePath("/admin/makrolar");
  return { ok: true };
}
