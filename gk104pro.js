// ======================================================
//  Skyloong GK104 Pro RGB — SignalRGB Plugin (v1.1)
//  VendorID: 0x1EA7 | ProductID: 0x0907
//  Author: Felipe Kaique
// ======================================================

// ------------ Identificação e Metadados ------------
export function Name() { return "Skyloong GK104 Pro RGB"; }
export function Publisher() { return "Felipe Kaique"; }
export function VendorId() { return 0x1EA7; }
export function ProductId() { return 0x0907; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [22, 7]; }   // grade lógica (colunas x linhas)
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale() { return 12.0; }

// ------------ Controle e parâmetros de UI ------------
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

/**
 * O SignalRGB varre todos os endpoints HID conectados.
 * Esta função valida qual é o correto (o de LEDs).
 */
export function Validate(endpoint) {
  if (!endpoint) {
    console.warn("⚠️ Validate() chamado sem endpoint!");
    return false;
  }

  console.log(
    `🔍 Verificando endpoint: interface=${endpoint.interface}, usage=0x${endpoint.usage.toString(16)}, usage_page=0x${endpoint.usage_page.toString(16)}`
  );

  // Canal de LEDs é interface 2 / usage 0x80 / usage_page 0x0001
  if (endpoint.interface === 2 && endpoint.usage === 0x80 && endpoint.usage_page === 0x0001) {
    console.log("✅ GK104 Pro RGB endpoint de LEDs detectado:", endpoint.interface);
    return true;
  }
  return false;
}

/**
 * Inicializa a conexão HID.
 * Aqui no futuro podemos adicionar escrita real de pacotes RGB.
 */
export function Initialize(endpoint) {
  if (!endpoint) {
    console.warn("⚠️ Initialize() chamado sem endpoint válido!");
    return false;
  }

  console.log(`🚀 GK104 Pro RGB inicializado (interface ${endpoint.interface})`);

  // placeholder: no futuro enviará pacotes RGB reais
  endpoint.write = (data) => {
    console.log("💡 HID write (mock):", data);
  };

  return true;
}

// ======================================================
//  Layout ANSI 104 (LEDs e posições visuais)
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

/**
 * Define a posição de cada tecla em uma grade lógica
 * (serve apenas para o desenho e animações do SignalRGB)
 */
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

const p0 = placeRow(row0, 0, 0);
const p1 = placeRow(row1, 1, 0);
const p2 = placeRow(row2, 2, 0);
const p3 = placeRow(row3, 3, 0);
const p4 = placeRow(row4, 4, 0);
const p5 = placeRow(row5, 5, 0);

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

console.log("DEBUG: p0..pNP sizes:", 
  p0.length, p1.length, p2.length, p3.length, p4.length, p5.length, pNP.length);

export const vKeyPositions = [...p0, ...p1, ...p2, ...p3, ...p4, ...p5, ...pNP];

console.log("DEBUG: total vKeyPositions =", vKeyPositions.length);

// Exporta nomes e posições
export function LedNames() { return keyNames; }

console.log(`🧩 GK104 Pro RGB plugin carregado: ${keyNames.length} LEDs, ${vKeyPositions.length} posições.`);

// ======================================================
//  Fim do plugin
// ======================================================
