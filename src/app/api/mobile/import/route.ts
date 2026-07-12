// POST /api/mobile/import — banka dökümü/ekstre (PDF veya foto) yükle → AI okur →
// önerilen işlem satırları döner (henüz kaydedilmez). multipart/form-data: "file".
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { reviewImportForUser } from "@/lib/import-core";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(400, "bad_request", "Dosya alınamadı.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return apiError(400, "bad_request", "Dosya bulunamadı.");
  }

  const result = await reviewImportForUser(auth.userId, file);
  return NextResponse.json(result);
}
