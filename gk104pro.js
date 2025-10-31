// Skyloong GK104 Pro RGB — SignalRGB custom plugin (base)
// Vendor: 0x1EA7, Product: 0x0907

export function Name()            { return "Skyloong GK104 Pro RGB"; }
export function VendorId()        { return 0x1EA7; }
export function ProductId()       { return 0x0907; }
export function Publisher()       { return "Felipe (custom)"; }
export function Size()            { return [22, 7]; }     // grade lógica (colunas x linhas)
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }        // zoom padrão no canvas

// Painel de opções no SignalRGB (pode expandir depois)
export function ControlTableParameters() {
  return [
    { "property":"shutdownColor", "group":"Lighting", "Label":"Shutdown Color", "type":"color", "default":"#009bde" },
    { "property":"mode",          "group":"Lighting", "Label":"Lighting Mode", "type":"combobox",
      "values":["Static","Breathing","Wave"], "default":"Static" },
    { "property":"forcedColor",   "group":"Lighting", "Label":"Forced Color", "type":"color", "default":"#009bde" }
  ];
}

/**
 * vKeys: índices lógicos dos LEDs/teclas (0..N)
 * vKeyPositions: posições na grade [col, row] para desenho no canvas do SignalRGB
 *
 * OBS:
 * - Este mapeamento segue um ANSI 104 clássico com numpad.
 * - Se alguma tecla acender fora do lugar, a gente só rearranja a ordem aqui.
 */

// Linha de funções (ESC F1..F12 PrtSc/ScrLk/Pause)
const row0 = [
  "Esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","PrtSc","ScrLk","Pause"
];

// Linha numérica + Insert/Home/PageUp
const row1 = [
  "`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Ins","Home","PgUp"
];

// Tab + Q..] + \ + Del/End/PgDn
const row2 = [
  "Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Del","End","PgDn"
];

// Caps + A..' + Enter
const row3 = [
  "Caps","A","S","D","F","G","H","J","K","L",";","'","Enter"
];

// LShift + Z../ + RShift + Setas cima
const row4 = [
  "LShift","Z","X","C","V","B","N","M",",",".","/","RShift","Up"
];

// LCtrl/Win/LAlt/Space/RAlt/Menu/RCtrl + Setas esq/baixo/dir
const row5 = [
  "LCtrl","LWin","LAlt","Space","Space2","RAlt","Menu","RCtrl","Left","Down","Right"
];

// Numpad (coluna separada)
const np = [
  "NumLock","Np/","Np*","Np-",
  "Np7","Np8","Np9","Np+",
  "Np4","Np5","Np6",
  "Np1","Np2","Np3","NpEnter",
  "Np0","Np."
];

// Constrói o array de chaves em ordem (sequência = ordem de envio/canvas)
const keyNames = [
  ...row0, ...row1, ...row2, ...row3, ...row4, ...row5, ...np
];

// Índices lógicos para todas as teclas
export const vKeys = keyNames.map((_, i) => i);

// Grade: 22 colunas x 7 linhas (aprox. espaçamento de 1 unidade; teclas largas ocupam mesma célula visual)
function placeRow(names, row, startCol) {
  const positions = [];
  let c = startCol;
  for (const n of names) {
    positions.push([c, row]);
    // avança com heurística simples; teclas largas pulam 2
    if (["Backspace","Enter","RShift"].includes(n)) c += 2;
    else if (["Tab","Caps","LShift"].includes(n))   c += 1.5;
    else if (["Space","Space2"].includes(n))        c += 3.5;
    else                                            c += 1;
  }
  return positions;
}

const p0 = placeRow(row0, 0, 0);
const p1 = placeRow(row1, 1, 0);
const p2 = placeRow(row2, 2, 0);
const p3 = placeRow(row3, 3, 0);
const p4 = placeRow(row4, 4, 0);
const p5 = placeRow(row5, 5, 0);

// Numpad alinhado à direita (começa na coluna 17)
function placeNumpad(baseCol) {
  return [
    [baseCol+0,1],[baseCol+1,1],[baseCol+2,1],[baseCol+3,1],
    [baseCol+0,2],[baseCol+1,2],[baseCol+2,2],[baseCol+3,2.2],
    [baseCol+0,3],[baseCol+1,3],[baseCol+2,3],
    [baseCol+0,4],[baseCol+1,4],[baseCol+2,4],[baseCol+3,4.2],
    [baseCol+0,5],[baseCol+1,5]
  ];
}
const pNP = placeNumpad(17);

// Posições finais na mesma ordem dos nomes
export const vKeyPositions = [
  ...p0, ...p1, ...p2, ...p3, ...p4, ...p5, ...pNP
];

// Opcional: dica de nomes (usado por alguns temas)
export function LedNames() { return keyNames; }

// ----------- Notas -----------
// 1) Este plugin usa o pipeline HID padrão do SignalRGB para teclados genéricos.
// 2) Se algumas teclas parecerem “trocadas”, ajuste apenas a ordem de keyNames
//    (reordene itens ou acrescente/remova onde precisar) e mantenha vKeys = index.
// 3) Se o seu firmware tiver modos proprietários, depois dá para expor via ControlTableParameters.
// ------------------------------
