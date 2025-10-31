// ======================================================
//  Skyloong GK104 Pro RGB — Custom SignalRGB Plugin
//  Autor: Felipe Kaique (custom build)
//  VendorID: 0x1EA7 | ProductID: 0x0907
// ======================================================

// ----------- Identificação e metadados -----------

export function Name() {
  return "Skyloong GK104 Pro RGB";
}
export function VendorId() {
  return 0x1ea7;
}
export function ProductId() {
  return 0x0907;
}
export function Publisher() {
  return "Felipe Kaique";
}
export function DeviceType() {
  return "keyboard";
}
export function Size() {
  return [22, 7];
} // grade lógica (colunas x linhas)
export function DefaultPosition() {
  return [0, 0];
}
export function DefaultScale() {
  return 12.0;
}

// ----------- Parâmetros no painel do SignalRGB -----------

export function ControlTableParameters() {
  return [
    {
      property: "shutdownColor",
      group: "Lighting",
      Label: "Shutdown Color",
      type: "color",
      default: "#009bde",
    },
    {
      property: "mode",
      group: "Lighting",
      Label: "Lighting Mode",
      type: "combobox",
      values: ["Static", "Breathing", "Wave"],
      default: "Static",
    },
    {
      property: "forcedColor",
      group: "Lighting",
      Label: "Forced Color",
      type: "color",
      default: "#009bde",
    },
  ];
}

// ======================================================
//   Funções obrigatórias para inicialização do HID
// ======================================================

export function validate(device) {
  // Confirma que o dispositivo conectado é o GK104 Pro
  return device.vendorId === 0x1ea7 && device.productId === 0x0907;
}

export function initialize(device) {
  // Inicialização básica: placeholder
  device.setFeatureReport = () => {};
  console.log("GK104 Pro inicializado (placeholder HID).");
  return true;
}

// ======================================================
//   Layout de teclas (ANSI 104) — LEDs e posições
// ======================================================

// Linha de funções (ESC, F1..F12, Print, Scroll, Pause)
const row0 = [
  "Esc",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "PrtSc",
  "ScrLk",
  "Pause",
];

// Linha numérica
const row1 = [
  "`",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "=",
  "Backspace",
  "Ins",
  "Home",
  "PgUp",
];

// Linha QWERTY
const row2 = [
  "Tab",
  "Q",
  "W",
  "E",
  "R",
  "T",
  "Y",
  "U",
  "I",
  "O",
  "P",
  "[",
  "]",
  "\\",
  "Del",
  "End",
  "PgDn",
];

// Linha ASDF
const row3 = [
  "Caps",
  "A",
  "S",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  ";",
  "'",
  "Enter",
];

// Linha ZXCV
const row4 = [
  "LShift",
  "Z",
  "X",
  "C",
  "V",
  "B",
  "N",
  "M",
  ",",
  ".",
  "/",
  "RShift",
  "Up",
];

// Linha espaço e controladores
const row5 = [
  "LCtrl",
  "LWin",
  "LAlt",
  "Space",
  "Space2",
  "RAlt",
  "Menu",
  "RCtrl",
  "Left",
  "Down",
  "Right",
];

// Numpad
const np = [
  "NumLock",
  "Np/",
  "Np*",
  "Np-",
  "Np7",
  "Np8",
  "Np9",
  "Np+",
  "Np4",
  "Np5",
  "Np6",
  "Np1",
  "Np2",
  "Np3",
  "NpEnter",
  "Np0",
  "Np.",
];

// Junta todos os nomes
const keyNames = [...row0, ...row1, ...row2, ...row3, ...row4, ...row5, ...np];

// Índices lógicos
export const vKeys = keyNames.map((_, i) => i);

// Função que posiciona as teclas numa grade lógica
function placeRow(names, row, startCol) {
  const positions = [];
  let c = startCol;
  for (const n of names) {
    positions.push([c, row]);
    // Espaçamentos especiais para teclas largas
    if (["Backspace", "Enter", "RShift"].includes(n)) c += 2;
    else if (["Tab", "Caps", "LShift"].includes(n)) c += 1.5;
    else if (["Space", "Space2"].includes(n)) c += 3.5;
    else c += 1;
  }
  return positions;
}

// Monta linhas principais
const p0 = placeRow(row0, 0, 0);
const p1 = placeRow(row1, 1, 0);
const p2 = placeRow(row2, 2, 0);
const p3 = placeRow(row3, 3, 0);
const p4 = placeRow(row4, 4, 0);
const p5 = placeRow(row5, 5, 0);

// Numpad alinhado à direita (coluna base = 17)
function placeNumpad(baseCol) {
  return [
    [baseCol + 0, 1],
    [baseCol + 1, 1],
    [baseCol + 2, 1],
    [baseCol + 3, 1],
    [baseCol + 0, 2],
    [baseCol + 1, 2],
    [baseCol + 2, 2],
    [baseCol + 3, 2.2],
    [baseCol + 0, 3],
    [baseCol + 1, 3],
    [baseCol + 2, 3],
    [baseCol + 0, 4],
    [baseCol + 1, 4],
    [baseCol + 2, 4],
    [baseCol + 3, 4.2],
    [baseCol + 0, 5],
    [baseCol + 1, 5],
  ];
}
const pNP = placeNumpad(17);

// Exporta posições finais
export const vKeyPositions = [...p0, ...p1, ...p2, ...p3, ...p4, ...p5, ...pNP];

// Função obrigatória — retorna nomes das teclas
export function LedNames() {
  return keyNames;
}

// Função obrigatória — retorna posições dos LEDs
export function LedPositions() {
  return vKeyPositions;
}

// Log opcional para debug
console.log(
  "Loaded GK104 layout:",
  keyNames.length,
  "keys, positions:",
  vKeyPositions.length
);

// ======================================================
// Fim do plugin
// ======================================================
