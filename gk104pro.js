// ======================================================
//  Skyloong GK104 Pro RGB — Single-file SignalRGB Addon
//  (sem plugin.json)
//  VID: 0x1EA7 | PID: 0x0907 | Mfr: "SEMITE"
//  Autor: Felipe Kaique (lypekaique)
// ======================================================

// -------- Metadados para a UI --------
export function Name()            { return "Skyloong GK104 Pro RGB"; }
export function Publisher()       { return "Felipe Kaique"; }
export function DeviceType()      { return "keyboard"; }
export function Size()            { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }

// (Opcional) controles básicos na UI
export function ControlTableParameters() {
  return [
    { property: "mode",  group: "Lighting", Label: "Mode",  type: "combobox",
      values: ["Static","Breathing","Wave"], default: "Static" },
    { property: "color", group: "Lighting", Label: "Color", type: "color",
      default: "#00A0FF" }
  ];
}

// --------- Layout simples (placeholder) ---------
const LED_COUNT = 104;
const keyNames = Array.from({ length: LED_COUNT }, (_, i) => `LED ${i+1}`);
export const vKeys = keyNames.map((_, i) => i);

function gridPositions(cols=22, rows=7) {
  const out = [];
  for (let y=0; y<rows; y++) for (let x=0; x<cols; x++) out.push([x,y]);
  return out;
}
let vKeyPositions = gridPositions().slice(0, LED_COUNT);

export function LedNames()     { return keyNames; }
export function LedPositions() { return vKeyPositions; }

// --------- HID binding (formato antigo) ---------
let cachedEndpoint = null;

/**
 * O SignalRGB chama Validate para cada endpoint HID detectado.
 * Aqui aceitamos por:
 *   • VID/PID = 0x1EA7/0x0907  (sem exigir interface/usage)
 *   • OU nomes contendo "semite" ou "usb-hid gaming keyboar"
 */
export function Validate(endpoint) {
  if (!endpoint) return false;

  // Campos variam entre builds — tratamos ambos camel/snake.
  const vid  = endpoint.vendor_id  ?? endpoint.vendorId  ?? 0;
  const pid  = endpoint.product_id ?? endpoint.productId ?? 0;
  const mfr  = (endpoint.manufacturer ?? endpoint.manufacturer_name ?? "").toLowerCase();
  const prod = (endpoint.product_name ?? endpoint.product ?? "").toLowerCase();

  const idMatch   = (vid === 0x1EA7 && pid === 0x0907);
  const nameMatch = mfr.includes("semite") || prod.includes("usb-hid gaming keyboar") || prod.includes("gk104");

  const ok = idMatch || nameMatch;
  if (ok) cachedEndpoint = endpoint;

  // Log útil pra depurar (aparece nos logs do SignalRGB)
  try {
    console.log(`[GK104Pro][Validate] vid=0x${vid.toString(16)} pid=0x${pid.toString(16)} ` +
                `mfr="${mfr}" prod="${prod}" -> ${ok ? "MATCH" : "skip"}`);
  } catch(e) {}

  return ok;
}

/**
 * Chamado quando o addon é inicializado para o endpoint correspondente.
 * Não enviamos nada ainda (protocolo real vem depois). Apenas guardamos
 * o endpoint e colocamos um "mock" de write para evitar erros.
 */
export function Initialize(endpoint) {
  if (!endpoint && cachedEndpoint) endpoint = cachedEndpoint;
  if (!endpoint) {
    console.warn("[GK104Pro][Init] sem endpoint válido.");
    return false;
  }

  cachedEndpoint = endpoint;

  // Nem todos os builds expõem write(); evitamos crash.
  if (typeof endpoint.write !== "function") {
    endpoint.write = (data) => console.log("[GK104Pro] HID write (mock):", data);
  }

  console.log("[GK104Pro] Inicializado com sucesso.");
  return true;
}

// (Opcional) Futuro: quando tivermos o protocolo, dá pra
// implementar um envio real por quadro. Por enquanto,
// deixar assim garante que o dispositivo APAREÇA na lista.
