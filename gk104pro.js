// ============================================================
// Skyloong GK104 Pro (SEMITE) - SignalRGB Addon
// Autor: Felipe Kaique (lypekaique)
// Baseado em logs HID extraídos via OpenRGB
// ============================================================

import { HIDDevice } from "signalrgb-sdk";

export class SkyloongGK104Pro extends HIDDevice {
  static vendorId = 0x1EA7;       // SEMITE / Skyloong
  static productId = 0x0907;      // GK104 Pro
  static interface = 1;
  static usagePage = 0xFF00;      // Página de uso RGB custom
  static name = "Skyloong GK104 Pro";
  static defaultLedCount = 104;

  // ============================================================
  // Inicialização do dispositivo
  // ============================================================
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
      this.log("❌ Erro ao inicializar HID:", err);
    }
  }

  // ============================================================
  // Envia dados RGB — (placeholder até captura real do protocolo)
  // ============================================================
  async SendUpdate() {
    if (!this.device) return;

    // Pacote temporário apenas pra testar a comunicação
    const buffer = new Uint8Array(65);
    buffer[0] = 0x00;    // Report ID
    buffer[1] = 0x01;    // Comando (a confirmar)
    buffer[2] = 255;     // R
    buffer[3] = 0;       // G
    buffer[4] = 0;       // B

    try {
      await this.device.sendFeatureReport(buffer);
      this.log("🟠 Pacote RGB enviado (placeholder).");
    } catch (err) {
      this.log("⚠️ Erro ao enviar pacote RGB:", err);
    }
  }

  // ============================================================
  // LED Map e Metadados
  // ============================================================
  getLedCount() {
    return SkyloongGK104Pro.defaultLedCount;
  }

  getLedName(index) {
    return `LED ${index + 1}`;
  }

  // ============================================================
  // Logging auxiliar
  // ============================================================
  log(...msg) {
    console.log(`[GK104Pro]`, ...msg);
  }
}

export default SkyloongGK104Pro;
