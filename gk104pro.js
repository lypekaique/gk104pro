// ======================================================
//  Skyloong GK104 Pro RGB — SignalRGB Plugin (v1.5)
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

let globalEndpoint = null;

export function Validate(endpoint) {
  if (!endpoint) return false;

  console.log(
    `🔍 Endpoint detectado: interface=${endpoint.interface}, usage=0x${endpoint.usage.toString(
      16
    )}, usage_page=0x${endpoint.usage_page.toString(16)}`
  );

  if (
    endpoint.interface === 2 &&
    endpoint.usage === 0x80 &&
    endpoint.usage_page === 0x0001
  ) {
    console.log("✅ GK104 Pro RGB endpoint de LEDs detectado:", endpoint.interface);
    globalEndpoint = endpoint;
    return true;
  }
  return false;
}

export function Initialize(endpoint) {
  if (!endpoint && globalEndpoint) endpoint = globalEndpoint;
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
//  Layout ANSI 104 (LEDs e posições visuais)
// ======================================================

function placeRow(names, row, startCol) {
  const positions = [];
  let c = startCol;
  for (const n of names) {
    positions.push([c, row]);
    if (["Backspace", "Enter", "RShift"].includes(n)) c += 2;
    else if (["Tab", "Caps", "LShift"].includes(n)) c += 1.5;
    else if (["Space", "Space2"].includes(n)) c += 3.5;
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
  np: ["NumLock","Np/","Np*","Np-","Np7","Np8","Np9","Np+","Np4","Np5","Np6","Np1","Np2","Np3","NpEnter","Np0","Np."]
};

const keyNames = [
  ...layout.row0, ...layout.row1, ...layout.row2,
  ...layout.row3, ...layout.row4, ...layout.row5, ...layout.np
];
export const vKeys = keyNames.map((_, i) => i);

let vKeyPositions = [
  ...placeRow(layout.row0, 0, 0),
  ...placeRow(layout.row1, 1, 0),
  ...placeRow(layout.row2, 2, 0),
  ...placeRow(layout.row3, 3, 0),
  ...placeRow(layout.row4, 4, 0),
  ...placeRow(layout.row5, 5, 0),
];

// Numpad (coluna lateral)
const npBase = 17;
layout.np.forEach((_, i) => {
  const x = npBase + (i % 4);
  const y = 1 + Math.floor(i / 4);
  vKeyPositions.push([x, y]);
});

// ======================================================
//  Correção de exportação e fallback
// ======================================================

if (!vKeyPositions || vKeyPositions.length === 0) {
  console.warn("⚠️ Nenhuma posição detectada — criando grade 22x7 padrão.");
  vKeyPositions = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 22; x++) {
      vKeyPositions.push([x, y]);
    }
  }
}

if (vKeyPositions.length !== keyNames.length) {
  console.warn(`⚠️ Corrigindo discrepância: Names=${keyNames.length}, Positions=${vKeyPositions.length}`);
  const diff = keyNames.length - vKeyPositions.length;
  for (let i = 0; i < diff; i++) {
    vKeyPositions.push([i % 22, Math.floor(i / 22)]);
  }
}

// ✅ O SignalRGB espera funções, não constantes
export function LedNames() { return keyNames; }
export function LedPositions() { return vKeyPositions; }

console.log(`🧩 GK104 Pro RGB plugin carregado: ${keyNames.length} LEDs, ${vKeyPositions.length} posições.`);
