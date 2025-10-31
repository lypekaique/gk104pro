// ============================================================
// Skyloong GK104 Pro (SEMITE) - SignalRGB Addon
// Autor: Felipe Kaique (lypekaique)
// SDK v5 / API v4  |  Fallback de metadados estilo antigo
// ============================================================

import { HIDDevice } from "signalrgb-sdk";

// --------- Metadados (ajudam a UI a desenhar) ----------
export function Name() { return "Skyloong GK104 Pro RGB"; }
export function Publisher() { return "Felipe Kaique"; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 12.0; }

// Layout simples: 104 LEDs em grade (placeholder)
function gridPositions(cols = 22, rows = 7) {
  const pos = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) pos.push([x, y]);
  }
  return pos;
}
const LED_COUNT = 104;
const ledNames = Array.from({ length: LED_COUNT }, (_, i) => `LED ${i+1}`);
const ledPositions = gridPositions().slice(0, LED_COUNT);

export function LedNames() { return ledNames; }
export function LedPositions() { return ledPositions; }

// ----------------- Classe principal (SDK v5) -----------------
export default class SkyloongGK104Pro extends HIDDevice {
  static vendorId = 0x1EA7;
  static productId = 0x0907;
  static interface = 2;                 // visto nos seus logs
  static name = "Skyloong GK104 Pro";
  static defaultLedCount = LED_COUNT;

  log(...m) { console.log("[GK104Pro]", ...m); }
  getLedCount() { return SkyloongGK104Pro.defaultLedCount; }
  SupportsLighting() { return true; }

  // Opcional: ajuda a UI a escalar/posicionar
  Size() { return [22, 7]; }
  DefaultScale() { return 12.0; }

  async Initialize() {
    this.log("Inicializando…");
    try {
      // Tenta abrir com interface específica primeiro…
      this.device = await this.OpenDevice({
        vendorId: SkyloongGK104Pro.vendorId,
        productId: SkyloongGK104Pro.productId,
        interface: SkyloongGK104Pro.interface
      });

      // …se não rolar, tenta sem interface (queda suave)
      if (!this.device) {
        this.log("Tentando abrir sem filtrar interface…");
        this.device = await this.OpenDevice({
          vendorId: SkyloongGK104Pro.vendorId,
          productId: SkyloongGK104Pro.productId
        });
      }

      if (this.device) this.log("✅ HID aberto!");
      else this.log("❌ Falha ao abrir o HID.");
    } catch (err) {
      this.log("⚠️ Erro ao inicializar HID:", err);
    }
  }

  // Envio de quadro (placeholder). Assim que tivermos o
  // protocolo correto do GK104 Pro, trocamos este método.
  async SendUpdate() {
    if (!this.device || !this.frame) return;

    const n = Math.min(this.getLedCount(), this.frame.length);
    // Header fictício 0xAA 0x55 + count + RGBs
    const buf = new Uint8Array(3 + n * 3);
    buf[0] = 0xAA;
    buf[1] = 0x55;
    buf[2] = n & 0xff;

    for (let i = 0; i < n; i++) {
      const c = this.frame[i]; // {r,g,b}
      const o = 3 + i * 3;
      buf[o+0] = c.r | 0;
      buf[o+1] = c.g | 0;
      buf[o+2] = c.b | 0;
    }

    try {
      await this.device.sendFeatureReport(0x00, buf);
    } catch (e1) {
      try {
        await this.device.sendOutputReport(0x00, buf);
      } catch (e2) {
        this.log("Erro ao enviar quadro:", e2);
      }
    }
  }
}
