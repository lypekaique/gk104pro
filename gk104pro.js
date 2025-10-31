// ============================================================
// Skyloong GK104 Pro (SEMITE) - SignalRGB Addon
// Autor: Felipe Kaique (lypekaique)
// Compatível com SDK v5 / API v4
// ============================================================

import { HIDDevice } from "signalrgb-sdk";

export default class SkyloongGK104Pro extends HIDDevice {
  // IDs vistos nos seus logs
  static vendorId = 0x1EA7;
  static productId = 0x0907;
  static interface = 2;                 // a interface que aparece no seu HID
  static name = "Skyloong GK104 Pro";
  static defaultLedCount = 104;

  // Utilitário de log
  log(...msg) { console.log("[GK104Pro]", ...msg); }

  // Chamado quando o add-on é carregado
  async Initialize() {
    this.log("Iniciando…");

    try {
      // Abra o dispositivo pela combinação vendor/product/interface.
      // (usagePage fica a cargo do plugin.json — deixamos omisso aqui)
      this.device = await this.OpenDevice({
        vendorId: SkyloongGK104Pro.vendorId,
        productId: SkyloongGK104Pro.productId,
        interface: SkyloongGK104Pro.interface
      });

      if (this.device) {
        this.log("✅ HID aberto!");
      } else {
        this.log("❌ Falha ao abrir o HID (device null).");
      }
    } catch (err) {
      this.log("⚠️ Erro ao inicializar HID:", err);
    }
  }

  // ====== Metadados/Mapa básico ======
  getLedCount() { return SkyloongGK104Pro.defaultLedCount; }
  getLedName(i)  { return `LED ${i + 1}`; }

  // Opcional: dá ao SignalRGB um tamanho/escala para desenhar o layout
  // (pode ajustar depois para o mapa real do teclado)
  Size() { return [22, 6]; }           // cols, rows (apenas visual)
  DefaultScale() { return 12.0; }      // zoom para exibição
  SupportsLighting() { return true; }

  // ====== Envio de quadro (placeholder) ======
  // Quando tivermos o protocolo real do firmware, trocamos este método.
  async SendUpdate() {
    if (!this.device || !this.frame) return;

    const count = Math.min(this.getLedCount(), this.frame.length);

    // Buffer exemplo (header 0xAA 0x55 + número de LEDs + RGBs).
    // Algumas firmwares exigem reportId 0, então usamos 0x00 aqui.
    const buf = new Uint8Array(3 + count * 3);
    buf[0] = 0xAA;
    buf[1] = 0x55;
    buf[2] = count & 0xFF;

    for (let i = 0; i < count; i++) {
      const c = this.frame[i]; // { r, g, b }
      const off = 3 + i * 3;
      buf[off + 0] = c.r | 0;
      buf[off + 1] = c.g | 0;
      buf[off + 2] = c.b | 0;
    }

    try {
      // Tente como Feature Report (alguns aparelhos aceitam):
      await this.device.sendFeatureReport(0x00, buf);
    } catch (e1) {
      try {
        // Alternativa comum: Output Report (interrupt/bulk OUT)
        await this.device.sendOutputReport(0x00, buf);
      } catch (e2) {
        this.log("Erro ao enviar quadro (hid):", e2);
      }
    }
  }
}
