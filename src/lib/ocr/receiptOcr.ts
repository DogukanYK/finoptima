// Cihaz-içi fiş OCR — fiş fotoğrafı kullanıcının cihazında okunur,
// sunucuya yalnız çıkarılan metin/veri gider, fotoğraf gönderilmez.
// tesseract.js dinamik import edilir (ana paket boyutuna girmez).

// Görüntüyü OCR için hazırla: ölçekle + gri tonlama.
async function preprocess(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const maxW = 1600;
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // Gri tonlama + hafif kontrast — OCR doğruluğunu artırır.
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const c = Math.max(0, Math.min(255, (g - 128) * 1.25 + 128));
    d[i] = d[i + 1] = d[i + 2] = c;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Fiş fotoğrafını cihazda OCR'la, ham metni döndür.
// langs: tesseract dil paketleri ("+" ile çoklu), varsayılan TR + EN.
// Başka diller: "tur+eng+ara", "tur+eng+deu", "eng+fra" gibi geçilebilir.
export async function recognizeReceipt(
  file: File,
  langs: string = "tur+eng",
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const canvas = await preprocess(file);
  const worker = await createWorker(langs);
  try {
    const { data } = await worker.recognize(canvas);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}
