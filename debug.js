// ======================================================
//  Skyloong GK104 Pro RGB — DEBUG version for discovery
// ======================================================
export function Name() { return "Skyloong GK104 Pro DEBUG"; }
export function Publisher() { return "Felipe Kaique"; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 12.0; }
export function SupportsLighting() { return true; }

let ep = null;
let ledCount = 104;

// ⚙️ Força a validação universal e log detalhado
export function Validate(endpoint) {
  console.log("🔍 HID endpoint detectado:", {
    vendor_id: endpoint.vendor_id,
    product_id: endpoint.product_id,
    interface: endpoint.interface,
    product_name: endpoint.product_name,
    usage_page: endpoint.usage_page,
    usage: endpoint.usage
  });
  
  // Aceita dispositivos que pareçam Skyloong/SEMITE
  if (
    (endpoint.vendor_id === 0x1EA7 && endpoint.product_id === 0x0907) ||
    (endpoint.product_name && (
      endpoint.product_name.toLowerCase().includes("skyloong") ||
      endpoint.product_name.toLowerCase().includes("semite") ||
      endpoint.product_name.toLowerCase().includes("gk104")
    ))
  ) {
    console.log("✅ GK104 DEBUG matched endpoint:", endpoint.product_name);
    return true;
  }

  // Mesmo sem match, ainda aparece pra debug
  console.log("⚠️ GK104 DEBUG forçando reconhecimento.");
  return true;
}

// 💡 Mapeamento mínimo de LEDs (placeholder)
export function LedCount() { return ledCount; }
export function LedNames() {
  return Array.from({ length: ledCount }, (_, i) => "LED " + (i + 1));
}
export function LedPositions() {
  return Array.from({ length: ledCount }, (_, i) => [i % 22, Math.floor(i / 22)]);
}

// Inicialização
export function Initialize(endpoint) {
  ep = endpoint;
  console.log("🚀 GK104 DEBUG inicializado com endpoint:", endpoint);
  return true;
}

// Teste simples de envio de cor estática
export function Render(frame) {
  if (!ep || !frame) return;
  try {
    const c = frame[0] || { r: 255, g: 0, b: 0 };
    const pkt = new Uint8Array([0x00, c.r, c.g, c.b]);
    ep.write(pkt);
  } catch (err) {
    console.warn("⚠️ Erro ao escrever HID:", err);
  }
}

console.log("🧩 Skyloong GK104 Pro DEBUG carregado — aguardando reconhecimento.");
