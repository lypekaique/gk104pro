// ======================================================
//  Skyloong GK104 Pro RGB — Single-file SignalRGB Addon
//  Formato antigo (sem plugin.json)
//  VID: 0x1EA7 | PID: 0x0907 | Mfr: "SEMITE"
//  Autor: Felipe Kaique (lypekaique)
// ======================================================

// ---------- Metadados / UI ----------
export function Name()            { return "Skyloong GK104 Pro RGB"; }
export function Publisher()       { return "Felipe Kaique"; }
export function DeviceType()      { return "keyboard"; }
export function Size()            { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }

// Controles básicos
export function ControlTableParameters() {
  return [
    { property: "mode",   group: "Lighting", Label: "Mode",   type: "combobox",
      values: ["Static","Breathing","Wave"], default: "Static" },
    { property: "color",  group: "Lighting", Label: "Color",  type: "color",
      default: "#00A0FF" },
    { property: "debug",  group: "Advanced", Label: "Enable Debug Packets", type: "boolean",
      default: true },
    { property: "reportId", group: "Advanced", Label: "HID Report ID", type: "number",
      default: 0 },
    { property: "pktLen", group: "Advanced", Label: "Packet Length", type: "number",
      default: 64 },
    { property: "rgbOrder", group: "Advanced", Label: "RGB Order (0=RGB,1=RBG,2=GRB,3=GBR,4=BRG,5=BGR)",
      type: "number", default: 0 }
  ];
}

// ---------- Layout simples (grid 22x7) ----------
const LED_COUNT = 104;
const keyNames = Array.from({ length: LED_COUNT }, (_, i) => `LED ${i+1}`);
export const vKeys = keyNames.map((_, i) => i);

function gridPositions(cols=22, rows=7) {
  const out = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      out.push([x, y]);
  return out;
}
let vKeyPositions = gridPositions().slice(0, LED_COUNT);

export function LedNames()     { return keyNames; }
export function LedPositions() { return vKeyPositions; }

// ---------- HID / Estado ----------
let EP = null;                 // endpoint cache
let settings = { mode: "Static", color: "#00A0FF", debug: true, reportId: 0, pktLen: 64, rgbOrder: 0 };
let t0 = Date.now();

// Helpers
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function hexToRGB(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#ffffff");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255,255,255];
}
function applyOrder(rgb, order) {
  let [r,g,b] = rgb;
  switch(order|0){
    case 1: return [r,b,g];
    case 2: return [g,r,b];
    case 3: return [g,b,r];
    case 4: return [b,r,g];
    case 5: return [b,g,r];
    default:return [r,g,b];
  }
}

// O SignalRGB injeta as props configuráveis assim:
export function SetProperty(k, v) { settings[k] = v; }

// ---------- Detecção ----------
/**
 * Aceita se:
 *  • VID/PID = 0x1EA7/0x0907
 *  • OU nomes contendo "semite", "usb-hid gaming keyboar" ou "gk104"
 */
export function Validate(endpoint) {
  if (!endpoint) return false;

  const vid  = endpoint.vendor_id  ?? endpoint.vendorId  ?? 0;
  const pid  = endpoint.product_id ?? endpoint.productId ?? 0;
  const mfr  = (endpoint.manufacturer ?? endpoint.manufacturer_name ?? "").toLowerCase();
  const prod = (endpoint.product_name ?? endpoint.product ?? "").toLowerCase();

  const idMatch   = (vid === 0x1EA7 && pid === 0x0907);
  const nameMatch = mfr.includes("semite") || prod.includes("usb-hid gaming keyboar") || prod.includes("gk104");

  const ok = idMatch || nameMatch;
  if (ok) {
    EP = endpoint;
  }

  try {
    console.log(`[GK104Pro][Validate] vid=0x${(vid||0).toString(16)} pid=0x${(pid||0).toString(16)} mfr="${mfr}" prod="${prod}" -> ${ok?"MATCH":"skip"}`);
  } catch(e) {}

  return ok;
}

// ---------- Inicialização ----------
export function Initialize(endpoint) {
  EP = endpoint || EP;
  if (!EP) {
    console.warn("[GK104Pro][Init] sem endpoint.");
    return false;
  }

  // Nem todos builds expõem write(); cria mock para não quebrar.
  if (typeof EP.write !== "function") {
    EP.write = (data) => console.log("[GK104Pro] HID write (mock):", data);
  }

  console.log("[GK104Pro] Inicializado.");
  return true;
}

// ---------- Render loop ----------
/**
 * O SignalRGB chamará Render() por frame. Aqui calculamos as cores
 * e tentamos enviar via HID. Se o protocolo não bater, use Debug para
 * inspecionar e ajustar reportId/pktLen/ordem RGB.
 */
export function Render() {
  const now = Date.now();
  const dt  = (now - t0) / 1000.0; // segundos
  const base = hexToRGB(settings.color);

  // Gera um buffer de cores por LED
  const colors = new Array(LED_COUNT);
  for (let i = 0; i < LED_COUNT; i++) {
    let rgb;

    if (settings.mode === "Static") {
      rgb = base;

    } else if (settings.mode === "Breathing") {
      const s = (Math.sin((dt + i*0.02) * Math.PI * 1.0) * 0.5 + 0.5); // 0..1
      rgb = base.map(v => clamp(Math.round(v * s), 0, 255));

    } else { // "Wave"
      const phase = (i % 22) / 22; // por coluna
      const s = (Math.sin((dt*2.0 + phase*2*Math.PI)) * 0.5 + 0.5);
      rgb = base.map(v => clamp(Math.round(v * s), 0, 255));
    }

    colors[i] = applyOrder(rgb, settings.rgbOrder|0);
  }

  // Envia (ou loga) no formato "genérico"
  sendColorsGeneric(colors, settings);
}

// ---------- Envio genérico / Debug ----------
/**
 * Estratégia:
 *  • Monta pacotes de tamanho fixo (pktLen).
 *  • Primeiro byte pode ser ReportID (reportId). Muitos devices usam 0.
 *  • Cabeçalho de teste [0xAA,0x55,0x01] (ajustável a gosto) só pra
 *    ter um prefixo estável enquanto snifa/procura o protocolo certo.
 *  • Corpo: pares/trincas de RGB sequenciais dos LEDs.
 *
 * Ajuste:
 *  • Se nada acontecer, troque reportId (0,1,2) e pktLen (32, 64).
 *  • Inverta ordem RGB com rgbOrder.
 *  • Se o device exigir FeatureReport, alguns builds têm EP.sendFeatureReport.
 */
function sendColorsGeneric(colors, opt) {
  if (!EP) return;

  const reportId = (opt.reportId|0) >>> 0;
  const pktLen   = clamp(opt.pktLen|0, 32, 256);
  const header   = [0xAA, 0x55, 0x01]; // placeholder
  const bytesPerLed = 3;
  const payloadLen = header.length + (LED_COUNT * bytesPerLed);

  // Monta o buffer com possível ReportID na posição 0.
  const totalLen = reportId ? (1 + Math.max(pktLen, payloadLen)) : Math.max(pktLen, payloadLen);
  const buf = new Uint8Array(totalLen);

  let off = 0;
  if (reportId) {
    buf[0] = reportId & 0xFF;
    off = 1;
  }

  // Cabeçalho
  for (let i=0; i<header.length; i++) buf[off+i] = header[i];
  let p = off + header.length;

  // Cores
  for (let i=0; i<LED_COUNT; i++) {
    const [r,g,b] = colors[i];
    buf[p++] = r & 0xFF;
    buf[p++] = g & 0xFF;
    buf[p++] = b & 0xFF;
  }

  // Padding até pktLen
  for (; p < ((reportId?1:0) + pktLen); p++) buf[p] = 0x00;

  // Debug/log para engenharia reversa
  if (settings.debug) {
    try {
      console.log(`[GK104Pro][TX] reportId=${reportId} pktLen=${pktLen} total=${buf.length}`);
    } catch(e){}
  }

  // Envio
  try {
    if (typeof EP.write === "function") {
      EP.write(buf);
    } else if (typeof EP.sendFeatureReport === "function") {
      EP.sendFeatureReport(buf);
    } else {
      console.warn("[GK104Pro] EP não tem write/sendFeatureReport.");
    }
  } catch (e) {
    console.warn("[GK104Pro] Falha no write:", e);
  }
}

// ---------- Opcional: limpeza ----------
export function Shutdown() {
  // Se o teclado precisar de “reset de efeito”, faça aqui.
  console.log("[GK104Pro] Shutdown.");
}
