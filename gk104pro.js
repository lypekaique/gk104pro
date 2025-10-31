// ============================================================
// Skyloong GK104 Pro (SEMITE) - SignalRGB Addon
// Autor: Felipe Kaique (lypekaique)
// Compatível com SDK v5 / API v4
// ============================================================

import { HIDDevice } from "signalrgb-sdk";

export class SkyloongGK104Pro extends HIDDevice {
  static vendorId = 0x1EA7;
  static productId = 0x0907;
  static interface = 1;
  static usagePage = 0xFF00;
  static name = "Skyloong GK104 Pro";
  static defaultLedCount = 104;

  async Initialize() {
    this.log("🔌 Iniciando comunicação com Skyloong GK104 Pro...");

    try {
      this.device = await this.OpenDevice({
        vendorId: SkyloongGK104Pro.vendorId,
        productId: SkyloongGK104Pro.productId,
        interface: SkyloongGK104Pro.interface,
        usagePage: SkyloongGK104Pro.usagePage
      });

      if (this.device) {
        this.log("✅ HID aberto com sucesso!");
      } else {
        this.log("❌ Falha ao abrir o HID do GK104 Pro.");
      }
    } catch (err) {
      this.log("⚠️ Erro ao inicializar HID:", err);
    }
  }

  // Envio de dados RGB (placeholder)
  async SendUpdate() {
    if (!this.device) return;

    const buffer = new Uint8Array(65);
    buffer[0] = 0x00;
    buffer[1] = 0x01;
    buffer[2] = 255; // Vermelho
    buffer[3] = 0;
    buffer[4] = 0;

    try {
      await this.device.sendFeatureReport(buffer);
      this.log("🟠 Pacote RGB enviado (placeholder).");
    } catch (err) {
      this.log("⚠️ Erro ao enviar pacote RGB:", err);
    }
  }

  getLedCount() {
    return SkyloongGK104Pro.defaultLedCount;
  }

  getLedName(index) {
    return `LED ${index + 1}`;
  }

  log(...msg) {
    console.log(`[GK104Pro]`, ...msg);
  }
}

export default SkyloongGK104Pro;
