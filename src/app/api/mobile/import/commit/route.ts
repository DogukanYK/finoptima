// POST /api/mobile/import/commit — seçilen döküm satırlarını işleme kaydeder.
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { commitImportForUser, type ImportRow } from "@/lib/import-core";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: {
    bankName?: unknown;
    fileName?: unknown;
    rows?: unknown;
    newAccount?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return apiError(400, "bad_request", "Kaydedilecek satır yok.");
  }

  const rows = body.rows as ImportRow[];
  const newAccount =
    body.newAccount && typeof body.newAccount === "object"
      ? (body.newAccount as { label: string; type: string })
      : null;

  const result = await commitImportForUser(auth.userId, {
    bankName: typeof body.bankName === "string" ? body.bankName : "",
    accountId: null,
    newAccount,
    fileName: typeof body.fileName === "string" ? body.fileName : "ekstre",
    rows,
  });

  return NextResponse.json(result);
}
