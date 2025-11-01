// ======================================================
//  Skyloong GK104 Pro RGB — Direct SignalRGB Plugin v3.8
//  Author: Felipe Kaique (lypekaique)
//  VendorID: 0x1EA7 | ProductID: 0x0907
//  Layout: 21 x 6 (106 LEDs)
// ======================================================

export function Name()            { return "Skyloong GK104 Pro RGB"; }
export function Publisher()       { return "Felipe Kaique"; }
export function VendorId()        { return 0x1EA7; }
export function ProductId()       { return 0x0907; }
export function DeviceType()      { return "keyboard"; }
export function Size()            { return [21, 6]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }

// ======================================================
//  Painel de Controle
// ======================================================
export function ControlTableParameters() {
  return [
    {
      property: "LightingMode",
      group: "Lighting",
      label: "Lighting Mode",
      type: "combobox",
      values: ["Static", "Breathing", "Wave"],
      default: "Static"
    },
    {
      property: "BaseColor",
      group: "Lighting",
      label: "Base Color",
      type: "color",
      default: [255, 255, 255]
    }
  ];
}

// ======================================================
//  Inicialização
// ======================================================
export function Initialize() {
  device.SetLedCount(106);
  console.log("[GK104Pro] Inicializado com 106 LEDs (layout 21x6)");
}

// ======================================================
//  HID Layer — Corrige erro validate() not found
// ======================================================
export function InitializeHid() {
  try {
    device.RegisterHid(0x1EA7, 0x0907);
    console.log("[GK104Pro] HID interface initialized (VID 1EA7, PID 0907)");
  } catch (e) {
    console.log("[GK104Pro] HID init falhou:", e);
  }
}

export function Validate() {
  console.log("[GK104Pro] HID validate() chamado — OK");
  return true;
}

// ======================================================
//  Loop principal de renderização
// ======================================================
export function Render() {
  const props = device.properties || {};
  const mode = props.LightingMode || "Static";
  const base = props.BaseColor || [255, 255, 255];
  const t = Date.now() / 1000; // substitui performance.now()

  for (let i = 0; i < device.ledCount; i++) {
    let [r, g, b] = base;

    switch (mode) {
      case "Breathing": {
        const k = 0.5 + 0.5 * Math.sin(t * 2 + i / 5);
        r *= k; g *= k; b *= k;
        break;
      }
      case "Wave": {
        const phase = (i / device.ledCount) * 2 * Math.PI + t * 4;
        r = 127 + 128 * Math.sin(phase);
        g = 127 + 128 * Math.sin(phase + 2);
        b = 127 + 128 * Math.sin(phase + 4);
        break;
      }
      default:
        break;
    }

    device.SetLedColor(i, [r, g, b]);
  }
}

// ======================================================
//  Encerramento
// ======================================================
export function Shutdown() {
  for (let i = 0; i < device.ledCount; i++) {
    device.SetLedColor(i, [15, 0, 0]); // leve vermelho no desligamento
  }
  console.log("[GK104Pro] Shutdown aplicado.");
}
