// ======================================================
//  Skyloong GK104 Pro (SEMITE) — SignalRGB Addon (single-file)
//  Compatível com Validate/Initialize e validate/initialize
//  VID: 0x1EA7 | PID: 0x0907
//  Autor: Felipe Kaique (lypekaique)
// ======================================================

// ---------- Metadados / UI ----------
export function Name()            { return "Skyloong GK104 Pro (SEMITE)"; }
export function Publisher()       { return "Felipe Kaique"; }
export function Size()            { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }
export function VendorId()        { return 0x1ea7; }
export function ProductId()       { return 0x0907; }

// ---------- Controles ----------
let LightingMode = "Canvas";
let forcedColor  = "009bde";
let DelayMs      = "0";
let RgbOrder     = "RGB";
let ChunkLeds    = "16";
let HeaderType   = "0x04/0x20";

export function ControllableParameters() {
  return [
    { property: "LightingMode", group: "lighting", label: "Lighting Mode",
      type: "combobox", values: ["Canvas","Forced"], default: "Canvas" },
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

// SignalRGB (varia por versão) injeta as mudanças via SetControllableParameter ou SetProperty.
// Implementamos os dois para compatibilidade.
export function SetControllableParameter(name, value) {
  setParam(name, value);
}
export function SetProperty(name, value) {
  setParam(name, value);
}
function setParam(name, value) {
  switch (name) {
    case "LightingMode": LightingMode = value; break;
    case "forcedColor":  forcedColor  = (value || "").replace(/^#/, ""); break;
    case "DelayMs":      DelayMs      = value; break;
    case "RgbOrder":     RgbOrder     = value; break;
    case "ChunkLeds":    ChunkLeds    = value; break;
    case "HeaderType":   HeaderType   = value; break;
  }
}

// ---------- Layout ----------
const LED_COUNT = 104;
export const vKeys = Array.from({ length: LED_COUNT }, (_, i) => i);

const vKeyPositions = (() => {
  const pos = [];
  for (let y=0; y<7; y++) for (let x=0; x<22; x++) pos.push([x, y]);
  return pos.slice(0, LED_COUNT);
})();
const vKeyNames = vKeys.map(i => `LED ${i+1}`);

export function LedNames()     { return vKeyNames; }
export function LedPositions() { return vKeyPositions; }

// ---------- Compat: versões que exigem lednames/ledpositions minúsculo
export const lednames     = LedNames;
export const ledpositions = LedPositions;

// ---------- Validate / Initialize (maiúsculo) ----------
export function Validate(endpoint) {
  if (!endpoint) return false;

  const vid  = endpoint.vendor_id  ?? endpoint.vendorId  ?? 0;
  const pid  = endpoint.product_id ?? endpoint.productId ?? 0;
  const mfr  = (endpoint.manufacturer ?? endpoint.manufacturer_name ?? "").toLowerCase();
  const prod = (endpoint.product_name ?? endpoint.product ?? "").toLowerCase();

  const idMatch   = (vid === 0x1EA7 && pid === 0x0907);
  const nameMatch = mfr.includes("semite") || prod.includes("usb-hid gaming keyboar") || prod.includes("gk104");

  const ok = idMatch || nameMatch;
  try {
    console.log(`[GK104Pro][Validate] vid=0x${(vid||0).toString(16)} pid=0x${(pid||0).toString(16)} mfr="${mfr}" prod="${prod}" -> ${ok?"MATCH":"skip"}`);
  } catch(e) {}

  return ok;
}

export function Initialize(/* endpoint opcional, depende da versão */) {
  // Se a tua versão não passa endpoint aqui, usamos 'device' global.
  // Pode colocar qualquer handshake leve aqui, se precisar.
  console.log("[GK104Pro] Initialize()");
  return true;
}
export function Shutdown() {
  console.log("[GK104Pro] Shutdown()");
}

// ---------- Compat: versões que chamam validate()/initialize()/shutdown() minúsculo ----------
export const validate   = Validate;
export const initialize = Initialize;
export const shutdown   = Shutdown;

// ---------- Render ----------
export function Render() { sendColors(); }
// Compat: algumas builds chamam render() minúsculo
export const render = Render;

// ---------- Helpers de cor/envio ----------
function rgbOrderSwap([r,g,b]) {
  switch (RgbOrder) {
    case "RBG": return [r,b,g];
    case "GRB": return [g,r,b];
    case "GBR": return [g,b,r];
    case "BRG": return [b,r,g];
    case "BGR": return [b,g,r];
    default:    return [r,g,b];
  }
}

function grabColors() {
  const arr = [];
  if (LightingMode === "Forced") {
    const hex = (forcedColor || "009bde").padEnd(6, "0");
    const r = parseInt(hex.slice(0,2), 16) | 0;
    const g = parseInt(hex.slice(2,4), 16) | 0;
    const b = parseInt(hex.slice(4,6), 16) | 0;
    for (let i=0; i<vKeys.length; i++) {
      const [R,G,B] = rgbOrderSwap([r,g,b]);
      arr.push(R,G,B);
    }
  } else {
    for (let i=0; i<vKeys.length; i++) {
      const c = device.color(vKeys[i]); // fornecido pelo SignalRGB
      const [R,G,B] = rgbOrderSwap(c);
      arr.push(R,G,B);
    }
  }
  return arr;
}

function refresh() {
  const delay = Number(DelayMs)||0;
  const pkt = new Array(65).fill(0);
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
  pkt[1] = 0x04; pkt[2] = 0x20; pkt[9] = 0x08;
  device.send_report(pkt, 65); device.pause(delay);
  const resp = new Array(65).fill(0);
  device.get_report(resp, 65); device.pause(delay);
}

function sendColors() {
  const delay      = Number(DelayMs)||0;
  const rgbdata    = grabColors();
  const ledsPerPkt = Number(ChunkLeds)||16;
  const totalLeds  = vKeys.length;

  // Chama periodicamente (barato) para manter handshake vivo
  if ((Date.now() & 0xFF) === 0) { refresh(); start_refresh(); }

  let led = 0;
  while (led < totalLeds) {
    const pkt = new Array(65).fill(0);

    if (HeaderType === "0x04/0x20") {
      pkt[1] = 0x04; pkt[2] = 0x20;
      pkt[3] = led & 0xFF;
      pkt[4] = (led >> 8) & 0xFF;
    } else if (HeaderType === "0x04/0x02") {
      pkt[1] = 0x04; pkt[2] = 0x02;
    } // "None": sem cabeçalho especial

    let out = 5; // payload começa aqui
    const limit = Math.min(ledsPerPkt, totalLeds - led);
    for (let i = 0; i < limit && out + 2 < 65; i++) {
      const idx = (led + i) * 3;
      pkt[out++] = rgbdata[idx];
      pkt[out++] = rgbdata[idx+1];
      pkt[out++] = rgbdata
