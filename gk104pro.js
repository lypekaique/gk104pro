// ======================================================
//  Skyloong GK104 Pro RGB — SignalRGB Plugin (heurístico v0.1)
//  VID: 0x1EA7  PID: 0x0907   Interface HID de LEDs (provável I=2)
//  Autor: Felipe Kaique (plugin montado por ChatGPT)
//  Observação: tenta múltiplos formatos de pacote HID até um “pegar”.
// ======================================================

export function Name() { return "Skyloong GK104 Pro RGB (Heurístico)"; }
export function Publisher() { return "Felipe Kaique"; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 12.0; }
export function SupportsLighting() { return true; }

// Identificação HID
export function Validate(endpoint) {
  if (!endpoint) return false;
  // Procuramos a interface de LEDs típica: usage_page 0x0001 (Generic Desktop), usage 0x80 (System Control)
  // e interface 2 (nos logs você viu várias instâncias; a de LEDs geralmente é a 2)
  if (endpoint.vendor_id === 0x1EA7 && endpoint.product_id === 0x0907) {
    // Se a interface for 2, ótimo; senão, aceitamos e testamos mesmo assim.
    return true;
  }
  return false;
}

let ep = null;
let ledCount = 104;
let lastGoodProto = null;    // salva protocolo que funcionou
let lastSentPreview = 0;
let warnOnce = false;

// -------------- Controles simples no UI --------------
export function ControlTableParameters() {
  return [
    { property: "probe", group: "Debug", Label: "Re-provar protocolos", type: "button", action: "reprobe" },
    { property: "mode", group: "Lighting", Label: "Modo (fallback local)", type: "combobox", values: ["Static"], default: "Static" },
    { property: "color", group: "Lighting", Label: "Cor (fallback local)", type: "color", default: "#00a2ff" }
  ];
}
export function OnControlTableAction(action) {
  if (action === "reprobe") {
    lastGoodProto = null;
    console.log("🔁 Re-probing HID protocols…");
  }
}

// -------------- Layout ANSI 104 (nome/posição) --------------
function placeRow(names, row, startCol) {
  const positions = [];
  let c = startCol;
  for (const n of names) {
    positions.push([c, row]);
    if (["Backspace","Enter","RShift"].includes(n)) c += 2;
    else if (["Tab","Caps","LShift"].includes(n)) c += 1.5;
    else if (["Space","Space2"].includes(n)) c += 3.5;
    else c += 1;
  }
  return positions;
}
const layout = {
  row0: ["Esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","PrtSc","ScrLk","Pause"],
  row1: ["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Ins","Home","PgUp"],
  row2: ["Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Del","End","PgDn"],
  row3: ["Caps","A","S","D","F","G","H","J","K","L",";","'","Enter"],
  row4: ["LShift","Z","X","C","V","B","N","M",",",".","/","RShift","Up"],
  row5: ["LCtrl","LWin","LAlt","Space","Space2","RAlt","Menu","RCtrl","Left","Down","Right"],
};
const keyNames = [
  ...layout.row0, ...layout.row1, ...layout.row2,
  ...layout.row3, ...layout.row4, ...layout.row5
];
const np = ["NumLock","Np/","Np*","Np-","Np7","Np8","Np9","Np+","Np4","Np5","Np6","Np1","Np2","Np3","NpEnter","Np0","Np."];
const keyNamesFull = [...keyNames, ...np];

let positions = [
  ...placeRow(layout.row0, 0, 0),
  ...placeRow(layout.row1, 1, 0),
  ...placeRow(layout.row2, 2, 0),
  ...placeRow(layout.row3, 3, 0),
  ...placeRow(layout.row4, 4, 0),
  ...placeRow(layout.row5, 5, 0),
];
// keypad à direita, 4 colunas a partir de x=17
const baseX = 17;
np.forEach((_, i) => {
  const x = baseX + (i % 4);
  const y = 1 + Math.floor(i / 4);
  positions.push([x, y]);
});

if (positions.length !== keyNamesFull.length) {
  const diff = keyNamesFull.length - positions.length;
  for (let i = 0; i < diff; i++) positions.push([i % 22, Math.floor(i / 22)]);
}

export function LedNames() { return keyNamesFull; }
export function LedPositions() { return positions; }
export function LedCount() { return ledCount; }

// -------------- Inicialização HID --------------
export function Initialize(endpoint) {
  ep = endpoint;
  console.log(`🚀 GK104 Pro: endpoint iface=${ep.interface}, usage=0x${ep.usage?.toString(16)}, upage=0x${ep.usage_page?.toString(16)}`);
  // pequena “sonda” de handshakes comuns (não destrutiva)
  tryHandshake();
  return true;
}

function tryHandshake() {
  // Alguns 1EA7 precisam “acordar” o canal com um report curto
  const attempts = [
    new Uint8Array([0x00, 0x00]),
    new Uint8Array([0x00, 0x01, 0x00]),
    new Uint8Array([0x01, 0x00]),
  ];
  for (const pkt of attempts) {
    safeWrite(pkt);
  }
}

// -------------- Renderização (recebe frames do SignalRGB) --------------
export function Render(frame) {
  if (!ep) return;
  if (!frame || !frame.length) {
    if (!warnOnce) { console.warn("⚠️ Frame vazio"); warnOnce = true; }
    return;
  }
  // Tenta enviar com protocolo “bom” já descoberto
  if (lastGoodProto) {
    sendWith(lastGoodProto, frame);
    return;
  }
  // Senão, faz “multi-probe” (testa vários formatos)
  const candidates = [proto00_01_linear, proto02_chunked, proto05_leadin, protoF3_indexed];
  for (const p of candidates) {
    if (sendWith(p, frame)) {
      lastGoodProto = p;
      console.log(`✅ Protocolo OK: ${p.name}`);
      break;
    }
  }
  // Pré-visual: manda um frame estático a cada 3s de segurança
  const now = Date.now();
  if (now - lastSentPreview > 3000 && !lastGoodProto) {
    const c = hexToRgb("#00a2ff");
    const preview = new Array(ledCount).fill(c);
    for (const p of candidates) {
      if (sendWith(p, preview)) { lastGoodProto = p; break; }
    }
    lastSentPreview = now;
  }
}

// -------------- Protótipos de pacotes (heurística) --------------
// 1) Cabeçalho 00 01 + RGB linear (muito comum em SEMITE/Keydous)
function proto00_01_linear(colors) {
  const buf = new Uint8Array(2 + ledCount * 3);
  buf[0] = 0x00; buf[1] = 0x01;
  let o = 2;
  for (let i = 0; i < ledCount; i++) {
    const c = colors[i] || colors[0];
    buf[o++] = c.r; buf[o++] = c.g; buf[o++] = c.b;
  }
  return chunked(buf); // HID costuma precisar em blocos <= 64 bytes
}

// 2) Cabeçalho 02 00 + RGB linear
function proto02_chunked(colors) {
  const buf = new Uint8Array(2 + ledCount * 3);
  buf[0] = 0x02; buf[1] = 0x00;
  let o = 2;
  for (let i = 0; i < ledCount; i++) {
    const c = colors[i] || colors[0];
    buf[o++] = c.r; buf[o++] = c.g; buf[o++] = c.b;
  }
  return chunked(buf);
}

// 3) Cabeçalho 05 00 00 80 + RGB linear (vista em alguns 1EA7)
function proto05_leadin(colors) {
  const head = [0x05,0x00,0x00,0x80];
  const buf = new Uint8Array(head.length + ledCount * 3);
  head.forEach((v,i)=>buf[i]=v);
  let o = head.length;
  for (let i = 0; i < ledCount; i++) {
    const c = colors[i] || colors[0];
    buf[o++] = c.r; buf[o++] = c.g; buf[o++] = c.b;
  }
  return chunked(buf);
}

// 4) Por índice: F3 [idx RGB]… (varia por firmware; aqui testamos blocos)
function protoF3_indexed(colors) {
  // Envia em blocos de 16 LEDs: [F3, count=16, (idx, r,g,b)*16]
  const packets = [];
  const block = 16;
  for (let start = 0; start < ledCount; start += block) {
    const cnt = Math.min(block, ledCount - start);
    const buf = new Uint8Array(2 + cnt * 4);
    buf[0] = 0xF3; buf[1] = cnt;
    let o = 2;
    for (let i = 0; i < cnt; i++) {
      const idx = start + i;
      const c = colors[idx] || colors[0];
      buf[o++] = idx; buf[o++] = c.r; buf[o++] = c.g; buf[o++] = c.b;
    }
    packets.push(buf);
  }
  return packets;
}

// -------------- Envio/fragmentação HID --------------
function sendWith(protoFn, frame) {
  try {
    const packets = protoFn(frame);
    if (!packets || (Array.isArray(packets) && packets.length === 0)) return false;
    if (Array.isArray(packets)) {
      for (const pkt of packets) safeWrite(pkt);
    } else {
      // result is Uint8Array
      for (const chunk of chunked(packets)) safeWrite(chunk);
    }
    return true;
  } catch (e) {
    console.warn(`❌ Falha ${protoFn.name}:`, e);
    return false;
  }
}

// Divide em chunks ≤ 64 bytes (típico HID)
function chunked(bytes) {
  const out = [];
  const max = 64;
  for (let i = 0; i < bytes.length; i += max) {
    out.push(bytes.subarray(i, Math.min(i + max, bytes.length)));
  }
  return out;
}

function safeWrite(u8) {
  if (!ep) return;
  // Alguns firmwares exigem reportId 0x00 prefixado
  try {
    ep.write(u8);
  } catch (e1) {
    // tenta com reportId 0x00
    const withRep = new Uint8Array(u8.length + 1);
    withRep[0] = 0x00; withRep.set(u8, 1);
    try { ep.write(withRep); } catch (e2) { /* silencioso */ }
  }
}

// -------------- Util --------------
function hexToRgb(hex) {
  const h = hex.replace("#",""); const n = parseInt(h,16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}

console.log(`🧩 Skyloong GK104 Pro (heurístico) carregado. LEDs=${ledCount}`);
