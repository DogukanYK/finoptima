"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helpers";
import { forgetDevice } from "@/lib/security/devices";
import { logAudit } from "@/lib/audit";

export type DeviceActionState = {
  ok?: boolean;
  error?: string;
};

// Kullanıcının kendi cihazını listeden kaldırır. forgetDevice userId eşleşmesini
// zorunlu kılar — başkasının cihazı silinemez.
export async function forgetDeviceAction(
  deviceId: string,
): Promise<DeviceActionState> {
  const userId = await requireUserId();

  const removed = await forgetDevice(userId, deviceId);
  if (!removed) return { error: "Cihaz bulunamadı." };

  await logAudit({
    userId,
    action: "device.forget",
    entityType: "KnownDevice",
    entityId: deviceId,
  });

  revalidatePath("/settings");
  return { ok: true };
}
