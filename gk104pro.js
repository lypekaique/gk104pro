// ======================================================
//  Skyloong GK104 Pro RGB — SignalRGB Plugin (v1.3)
//  VendorID: 0x1EA7 | ProductID: 0x0907
//  Author: Felipe Kaique
// ======================================================

export function Name() { return "Skyloong GK104 Pro RGB"; }
export function Publisher() { return "Felipe Kaique"; }
export function VendorId() { return 0x1EA7; }
export function ProductId() { return 0x0907; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 12.0; }

// ------------ Parâmetros no painel do SignalRGB ------------
export function ControlTableParameters() {
  return [
    {
      property: "mode",
      group: "Lighting",
      Label: "Lighting Mode",
      type: "combobox",
      values: ["Static", "Breathing", "Wave"],
      default: "Static"
    },
    {
      property: "color",
      group: "Lighting",
      Label: "Main Color",
      type: "color",
      default: "#009bde"
    }
  ];
}

// ======================================================
//  HID Interface
// ======================================================

export function Validate(endpoint) {
  if (!endpoint) {
    console.warn("⚠️ Validate() chamado sem endpoint!");
    return false;
  }

  console.log(
    `🔍 Endpoint detectado: interface=${endpoint.interface}, usage=0x${endpoint.usage.toString(16)}, usage_page=0x${endpoint.usage_page.toString(16)}`
  );

  // Canal de LEDs correto: interface 2 / usage 0x80 / usage_page 0x0001
  if (endpoint.interface === 2 && endpoint.usage === 0x80 && endpoint.usage_page === 0x0001) {
    console.log("✅ GK104 Pro RGB endpoint de LEDs detectado:", endpoint.interface);
    return true;
  }
  return false;
}

export function Initialize(endpoint) {
  if (!endpoint) {
    console.warn("⚠️ Initialize() chamado sem endpoint válido!");
    return false;
  }

  console.log(`🚀 Inicializando GK104 Pro RGB (interface ${endpoint.interface})`);

  endpoint.write = (data) => {
    console.log("💡 HID write (mock):", data);
  };

  return true;
}

// ======================================================
//  Layout ANSI 104 — LEDs e posições visuais
// ======================================================

const row0 = ["Esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","PrtSc","ScrLk","Pause"];
const row1 = ["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Ins","Home","PgUp"];
const row2 = ["Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Del","End","PgDn"];
const row3 = ["Caps","A","S","D","F","G","H","J","K","L",";","'","Enter"];
const row4 = ["LShift","Z","X","C","V","B","N","M",",",".","/","RShift","Up"];
const row5 = ["LCtrl","LWin","LAlt","Space","Space2","RAlt","Menu","RCtrl","Left","Down","Right"];
const np = [
  "NumLock","Np/","Np*","Np-",
  "Np7","Np8","Np9","Np+",
  "Np4","Np5","Np6",
  "Np1","Np2","Np3","NpEnter",
  "Np0","Np."
];

const keyNames = [...row0, ...row1, ...row2, ...row3, ...row4, ...row5, ...np];
export const vKeys = keyNames.map((_, i) => i);

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

let p0 = placeRow(row0, 0, 0);
let p1 = placeRow(row1, 1, 0);
let p2 = placeRow(row2, 2, 0);
let p3 = placeRow(row3, 3, 0);
let p4 = placeRow(row4, 4, 0);
let p5 = placeRow(row5, 5, 0);

function placeNumpad(baseCol) {
  return [
    [baseCol+0,1],[baseCol+1,1],[baseCol+2,1],[baseCol+3,1],
    [baseCol+0,2],[baseCol+1,2],[baseCol+2,2],[baseCol+3,2.2],
    [baseCol+0,3],[baseCol+1,3],[baseCol+2,3],
    [baseCol+0,4],[baseCol+1,4],[baseCol+2,4],[baseCol+3,4.2],
    [baseCol+0,5],[baseCol+1,5]
  ];
}

let pNP = placeNumpad(17);

// segurança: evita null/undefined quebrando exports
const safe = (arr) => (Array.isArray(arr) ? arr : []);
p0 = safe(p0); p1 = safe(p1); p2 = safe(p2);
p3 = safe(p3); p4 = safe(p4); p5 = safe(p5); pNP = safe(pNP);

console.log("DEBUG: tamanhos p0..pNP:", p0.length, p1.length, p2.length, p3.length, p4.length, p5.length, pNP.length);

let combined = [...p0, ...p1, ...p2, ...p3, ...p4, ...p5, ...pNP];

// fallback se deu algum erro
if (!combined || combined.length === 0) {
  console.warn("⚠️ vKeyPositions vazio — criando grade padrão 22x7...");
  combined = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 22; x++) {
      combined.push([x, y]);
    }
  }
}

export const vKeyPositions = combined;
export function LedNames() { return keyNames; }

console.log(`🧩 GK104 Pro RGB plugin carregado: ${keyNames.length} LEDs, ${vKeyPositions.length} posições.`);
