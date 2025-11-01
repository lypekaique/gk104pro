// ======================================================
//  Skyloong GK104 Pro (SEMITE) — SignalRGB Addon (single-file)
//  Baseado no estilo do "Kzzi Z98.js" (Nollie)
//  VID: 0x1EA7 | PID: 0x0907
//  Autor: Felipe Kaique (lypekaique)
// ======================================================

export function Name()            { return "Skyloong GK104 Pro (SEMITE)"; }
export function VendorId()        { return 0x1ea7; }
export function ProductId()       { return 0x0907; }
export function Publisher()       { return "Felipe Kaique"; }
export function Documentation()   { return "gettingstarted/srgbmods-net-info"; } // opcional
export function Size()            { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }

// === Controles no painel ===
export function ControllableParameters() {
  return [
    { property: "LightingMode", group: "lighting", label: "Lighting Mode",
      type: "combobox", values: ["Canvas", "Forced"], default: "Canvas" },
    { property: "forcedColor", group: "lighting", label: "Forced Color",
      type: "color", default: "009bde" },
    { property: "DelayMs", group: "advanced", label: "Delay (ms)",
      type: "combobox", values: ["0","1","2","3","4","5","6","7","8","9","10"], default: "0" },
    { property: "RgbOrder", group: "advanced", label: "RGB Order",
      type: "combobox", values: ["RGB","RBG","GRB","GBR","BRG","BGR"], default: "RGB" },
    { property: "ChunkLeds", group: "advanced", label: "LEDs per packet",
      type: "combobox", values: ["12","14","16","18"], default: "16" },
    { property: "HeaderType", group: "advanced", label: "Header Type",
      type: "combobox", values: ["0x04/0x20","0x04/0x02","None"], default: "0x04/0x20" }
  ];
}

// === Layout ===
// índice lógico dos LEDs que o SignalRGB vai consultar
const LED_COUNT = 104;
const vKeys = Array.from({ length: LED_COUNT }, (_, i) => i);

// grid 22x7 simples (ajuste depois para o layout real por keycap)
const vKeyPositions = (() => {
  const pos = [];
  for (let y=0; y<7; y++) for (let x=0; x<22; x++) pos.push([x, y]);
  return pos.slice(0, LED_COUNT);
})();
const vKeyNames = vKeys.map(i => `LED ${i+1}`);

export function LedNames()     { return vKeyNames; }
export function LedPositions() { return vKeyPositions; }
export function Initialize()   { /* se precisar iniciar algo do device, faça aqui */ }
export function Shutdown()     { /* opcional: resetar efeito/hard-off */ }
export function Render()       { sendColors(); }

// === Helpers ===
function rgbOrderSwap([r,g,b]) {
  switch (RgbOrder) {
    case "RBG": return [r,b,g];
    case "GRB": return [g,r,b];
    case "GBR": return [g,b,r];
    case "BRG": return [b,r,g];
    case "BGR": return [b,g,r];
    default:    return [r,g,b]; // "RGB"
  }
}

function grabColors() {
  const arr = [];
  if (LightingMode === "Forced") {
    const hex = forcedColor || "009bde";
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    for (let i=0; i<vKeys.length; i++) {
      const [R,G,B] = rgbOrderSwap([r,g,b]);
      arr.push(R,G,B);
    }
  } else {
    // "Canvas": pega do efeito atual do SignalRGB
    for (let i=0; i<vKeys.length; i++) {
      const c = device.color(vKeys[i]); // [r,g,b] 0..255
      const [R,G,B] = rgbOrderSwap(c);
      arr.push(R,G,B);
    }
  }
  return arr;
}

// Pequenas rotinas de "handshake" como no Kzzi (podem ajudar em alguns controladores)
function refresh() {
  const delay = Number(DelayMs)||0;
  const pkt = new Array(65).fill(0);

  // alguns firmwares esperam 1~2 relatórios vazios
  device.send_report(pkt, 65); device.pause(delay);

  if (HeaderType === "0x04/0x02") {
    pkt[1] = 0x04; pkt[2] = 0x02;
    device.send_report(pkt, 65); device.pause(delay);
    const resp = new Array(65).fill(0);
    device.get_report(resp, 65); device.pause(delay);
  }
}

function start_refresh() {
  const delay = Number(DelayMs)||0;
  if (HeaderType !== "0x04/0x20") return;
  const pkt = new Array(65).fill(0);
  pkt[1] = 0x04; pkt[2] = 0x20; pkt[9] = 0x08; // padrão visto na base
  device.send_report(pkt, 65); device.pause(delay);
  const resp = new Array(65).fill(0);
  device.get_report(resp, 65); device.pause(delay);
}

// === Envio dos frames ===
function sendColors() {
  const delay      = Number(DelayMs)||0;
  const rgbdata    = grabColors();            // 3*LED_COUNT bytes
  const ledsPerPkt = Number(ChunkLeds)||16;   // ajuste se necessário (cabe em 65 bytes)
  const totalLeds  = vKeys.length;

  // tenta um "refresh"/"start_refresh" como no Z98
  // (seguro chamar de vez em quando; custo baixo)
  if ((Date.now() & 0xFF) === 0) { refresh(); start_refresh(); }

  // Cada pacote: 65 bytes (reportId 0, 64 bytes de payload)
  // Cabeçalho simples + blocos RGB
  let led = 0;
  while (led < totalLeds) {
    const pkt = new Array(65).fill(0);

    // Cabeçalhos compatíveis com a base (você pode alternar no painel)
    if (HeaderType === "0x04/0x20") {
      pkt[1] = 0x04; pkt[2] = 0x20; // tipo de envio "stream"
      pkt[3] = led & 0xFF;          // offset (baixo)
      pkt[4] = (led >> 8) & 0xFF;   // offset (alto)
    } else if (HeaderType === "0x04/0x02") {
      pkt[1] = 0x04; pkt[2] = 0x02; // outro comando testável
    } // "None" = sem cabeçalho especial

    // Copia até ledsPerPkt LEDs (3 bytes por LED) começando em led
    let out = 5; // começa após o header simples
    const limit = Math.min(ledsPerPkt, totalLeds - led);
    for (let i = 0; i < limit; i++) {
      const idx = (led + i) * 3;
      pkt[out++] = rgbdata[idx];
      pkt[out++] = rgbdata[idx+1];
      pkt[out++] = rgbdata[idx+2];
      if (out >= 65) break; // segurança
    }

    device.send_report(pkt, 65);
    device.pause(delay);
    led += limit;
  }
}
