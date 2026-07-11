// Asistan için paylaşılan tipler — istemci (sohbet paneli) ve sunucu (action + AI
// motoru) aynı şekli kullanır. Bu modül SUNUCUYA-ÖZEL bir şey import ETMEZ
// (Anthropic SDK yok), böylece client bileşeni tip olarak güvenle içe aktarabilir.

export type AssistantRole = "user" | "assistant";

export type AssistantMessage = {
  role: AssistantRole;
  content: string;
};

// AI'nın önerdiği tek bir veri girişi. Şimdilik yalnız "transaction" (gelir/gider);
// ileride borç/hatırlatma eklenebilir. Kullanıcı onaylayınca sisteme yazılır.
export type ProposedAction = {
  type: "transaction";
  kind: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null; // kullanıcı kategori adı önerisi (ya da null)
  date: string; // yyyy-mm-dd
  note: string | null;
};

// askAssistant() dönüşü: doğal dil yanıt + önerilen işlemler + opsiyonel yönlendirme.
export type AssistantResult = {
  reply: string;
  actions: ProposedAction[];
  navigate: string | null;
};

// commitAssistantAction() dönüşü.
export type CommitResult =
  | {
      ok: true;
      created: {
        kind: "INCOME" | "EXPENSE";
        amount: number;
        description: string;
        date: string;
        categoryName: string | null;
      };
    }
  | { ok: false; error: string };
