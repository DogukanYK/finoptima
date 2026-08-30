import Anthropic from "@anthropic-ai/sdk";
import {
  AnthropicFoundry,
  type FoundryClientOptions,
} from "@anthropic-ai/foundry-sdk";

// Claude istemcisi — YALNIZCA sunucuda kullanılır (server action / server component).
// API anahtarı asla client bundle'a girmez; .env (lokal) ve Vercel project env'inden okunur.
//
// Tek giriş noktası getAnthropic(): kredi koçu, asistan, destek ve ekstre çıkarımı
// hepsi buradan geçer. AI_PROVIDER ile aynı kod aynı modelleri iki farklı kapıdan
// çağırabilir:
//   AI_PROVIDER yok | "anthropic"  → doğrudan Anthropic API (varsayılan, mevcut davranış)
//   AI_PROVIDER="foundry"          → Microsoft Foundry üzerinden Claude
// Çağrı yüzeyi (messages.create / messages.parse / zodOutputFormat) iki tarafta aynı,
// bu yüzden özellik kodlarının hiçbirinde değişiklik gerekmez.

export type AIProvider = "anthropic" | "foundry";

export const AI_PROVIDER: AIProvider =
  (process.env.AI_PROVIDER ?? "").trim().toLowerCase() === "foundry"
    ? "foundry"
    : "anthropic";

// ---------------------------------------------------------------------------
// Microsoft Entra ID (anahtarsız) token sağlayıcısı
// ---------------------------------------------------------------------------
// Foundry SDK'sı `azureADTokenProvider: () => Promise<string>` bekler ve her istekte
// çağırır. @azure/identity kurmadan aynı işi iki dokümante Entra akışıyla yapıyoruz:
//   1) Managed Identity  — Azure üstünde çalışırken (IDENTITY_ENDPOINT/IDENTITY_HEADER)
//   2) Client credentials — Vercel gibi Azure dışı ortamda (uygulama kaydı ile)
// Token süresi dolmadan yeniden kullanılır (60 sn emniyet payı).

const DEFAULT_FOUNDRY_SCOPE = "https://ai.azure.com/.default";

let _entraToken: { value: string; expiresAt: number } | null = null;

type TokenResponse = {
  access_token?: string;
  expires_in?: number | string;
  expires_on?: number | string;
};

async function fetchEntraToken(): Promise<{ value: string; ttl: number }> {
  const scope =
    process.env.AZURE_FOUNDRY_SCOPE?.trim() || DEFAULT_FOUNDRY_SCOPE;
  const resource = scope.replace(/\/\.default$/, "");

  // 1) Azure içi Managed Identity (App Service / Container Apps enjekte eder).
  const identityEndpoint = process.env.IDENTITY_ENDPOINT?.trim();
  const identityHeader = process.env.IDENTITY_HEADER?.trim();
  if (identityEndpoint && identityHeader) {
    const url = `${identityEndpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`;
    const res = await fetch(url, {
      headers: { "X-IDENTITY-HEADER": identityHeader },
    });
    if (!res.ok) {
      throw new Error(
        `Entra ID (Managed Identity) token alınamadı: ${res.status} ${await res.text()}`,
      );
    }
    const json = (await res.json()) as TokenResponse;
    if (!json.access_token) {
      throw new Error("Entra ID (Managed Identity) yanıtında access_token yok.");
    }
    const expiresOn = Number(json.expires_on ?? 0);
    const ttl = expiresOn > 0 ? expiresOn * 1000 - Date.now() : 3600_000;
    return { value: json.access_token, ttl };
  }

  // 2) Client credentials (uygulama kaydı) — Azure dışı ortamlar.
  const tenantId = process.env.AZURE_TENANT_ID?.trim();
  const clientId = process.env.AZURE_CLIENT_ID?.trim();
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim();
  if (tenantId && clientId && clientSecret) {
    const res = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(
        `Entra ID token alınamadı: ${res.status} ${await res.text()}`,
      );
    }
    const json = (await res.json()) as TokenResponse;
    if (!json.access_token) {
      throw new Error("Entra ID yanıtında access_token yok.");
    }
    const ttl = Number(json.expires_in ?? 3600) * 1000;
    return { value: json.access_token, ttl };
  }

  throw new Error(
    "AI_PROVIDER=foundry için kimlik bilgisi yok. Ya AZURE_FOUNDRY_API_KEY verin, " +
      "ya Entra ID için AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET tanımlayın, " +
      "ya da uygulamayı Managed Identity'li bir Azure kaynağında çalıştırın.",
  );
}

async function entraTokenProvider(): Promise<string> {
  const now = Date.now();
  if (_entraToken && _entraToken.expiresAt > now + 60_000) {
    return _entraToken.value;
  }
  const { value, ttl } = await fetchEntraToken();
  _entraToken = { value, expiresAt: now + Math.max(ttl, 60_000) };
  return value;
}

// ---------------------------------------------------------------------------
// İstemci kurulumu
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function createDirectClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY tanımlı değil. .env (lokal) ve Vercel project env'ine ekleyin.",
    );
  }
  return new Anthropic({ apiKey });
}

function createFoundryClient(): Anthropic {
  const resource = process.env.AZURE_FOUNDRY_RESOURCE?.trim();
  const baseURL = process.env.AZURE_FOUNDRY_BASE_URL?.trim();
  if (!resource && !baseURL) {
    throw new Error(
      "AI_PROVIDER=foundry ama AZURE_FOUNDRY_RESOURCE tanımlı değil " +
        "(ör. 'finoptima.services.ai.azure.com'). Alternatif: AZURE_FOUNDRY_BASE_URL.",
    );
  }

  const opts: FoundryClientOptions = {};
  if (resource) opts.resource = resource;
  if (baseURL) opts.baseURL = baseURL;

  const apiKey = process.env.AZURE_FOUNDRY_API_KEY?.trim();
  if (apiKey) {
    // Anahtarlı mod — en hızlı kurulum (demo/sunum için yeterli).
    opts.apiKey = apiKey;
  } else {
    // Anahtarsız mod — Entra ID (kurumsal tercih).
    opts.azureADTokenProvider = entraTokenProvider;
  }

  // AnthropicFoundry, Anthropic sınıfından türer ve messages/beta yüzeyi birebir aynıdır;
  // yalnızca Batch ve Models alt kaynakları yoktur (bu uygulama ikisini de kullanmaz).
  // Tip düzeyinde bu farkı yutup tek dönüş tipini koruyoruz → çağıran kodlar değişmez.
  return new AnthropicFoundry(opts) as unknown as Anthropic;
}

/**
 * Tüm AI özelliklerinin kullandığı tek Claude istemcisi.
 * AI_DEMO=true iken çağrılmaz — demo kısa devresi her özellikte bu fonksiyondan
 * ÖNCE çalışır, yani demo modu iki provider'da da anahtarsız çalışır.
 */
export function getAnthropic(): Anthropic {
  _client ??=
    AI_PROVIDER === "foundry" ? createFoundryClient() : createDirectClient();
  return _client;
}

// ---------------------------------------------------------------------------
// Model çözümlemesi
// ---------------------------------------------------------------------------
// Foundry'de model bazen bir "deployment" adıyla çağrılır. Varsayılan olarak aynı
// model kimliği kullanılır; farklıysa tek env ile eşlenir:
//   AZURE_FOUNDRY_MODEL_MAP="claude-opus-4-8=opus-prod,claude-sonnet-4-6=sonnet-prod"

const FOUNDRY_MODEL_MAP: Record<string, string> = Object.fromEntries(
  (process.env.AZURE_FOUNDRY_MODEL_MAP ?? "")
    .split(",")
    .map((pair) => pair.split("="))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([from, to]) => [from.trim(), to.trim()]),
);

function resolveModel(id: string): string {
  if (AI_PROVIDER !== "foundry") return id;
  return FOUNDRY_MODEL_MAP[id] ?? id;
}

// Kredi koçu için varsayılan model. Hacim artınca maliyet için
// "claude-sonnet-4-6" veya "claude-haiku-4-5"e düşürülebilir.
export const CREDIT_COACH_MODEL = resolveModel("claude-opus-4-8");

// Belge okuma (vision/PDF) modeli — mekanik çıkarım + HIZ için Sonnet
// (çok işlemli ekstrede Opus ~85s sürüp Vercel zaman aşımına takılıyor).
// Maksimum doğruluk istenirse "claude-opus-4-8"e çekilebilir.
export const EXTRACT_MODEL = resolveModel("claude-sonnet-4-6");

// Sohbet asistanı modeli — interaktif olduğu için düşük gecikme önemli → Sonnet.
// (Yapısal işlem çıkarımı + kısa Q&A için fazlasıyla yeterli.)
export const CHAT_MODEL = resolveModel("claude-sonnet-4-6");

// Demo modu: AI_DEMO=true ise API ÇAĞRILMAZ, gerçekçi örnek sonuç döner
// (kullanıcının kendi verisinden beslenir). Anahtarsız akışı 0$ ile test etmek için.
export const AI_DEMO = process.env.AI_DEMO === "true";
