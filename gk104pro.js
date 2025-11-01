// ======================================================
// Skyloong GK104 Pro (SEMITE) — SignalRGB Addon (single-file)
// Compatível com Validate/validate + Initialize/initialize + Render/render
// VID: 0x1EA7 | PID: 0x0907
// ======================================================

export function Name()            { return "Skyloong GK104 Pro (SEMITE)"; }
export function Publisher()       { return "Felipe Kaique"; }
export function DeviceType()      { return "keyboard"; }   // <- algumas builds exigem
export function Size()            { return [22, 7]; }
export function DefaultPosition() { return [0, 0]; }
export function DefaultScale()    { return 12.0; }
export function VendorId()        { return 0x1ea7; }
export function ProductId()       { return 0x0907; }

// ------- Parâmetros -------
let LightingMode = "Canvas";
let forcedColor  = "009bde";
let DelayMs      = "0";
let RgbOrder     = "RGB";
let ChunkLeds    = "16";
let HeaderType   = "0x04/0x20";
let ForceList    = false;  // quando true, tenta listar mesmo sem bater endpoint (debug)

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
      type: "combobox", values: ["0x04/0x20","0x04/0x02","None"], default: "0x04/0x20" },
    { property: "ForceList", group: "debug", label: "Force List (no-VID/PID)",
      type: "boolean", default: false }
  ];
}
export function SetControllableParameter(k,v){ setParam(k,v); }
export function SetProperty(k,v){ setParam(k,v); }
function setParam(k,v){
  if(k==="forcedColor") v = (v||"").replace(/^#/,"");
  ({LightingMode,forcedColor:forcedColor,DelayMs,RgbOrder,ChunkLeds,HeaderType,ForceList} = 
    {...{LightingMode,forcedColor,DelayMs,RgbOrder,ChunkLeds,HeaderType,ForceList}, [k]: v});
}

// ------- Layout (grid simples 22x7) -------
const LED_COUNT = 104;
export const vKeys = Array.from({length: LED_COUNT}, (_,i)=>i);
const vKeyPositions = (()=>{ const p=[]; for(let y=0;y<7;y++) for(let x=0;x<22;x++) p.push([x,y]); return p.slice(0,LED_COUNT);})();
const vKeyNames = vKeys.map(i=>`LED ${i+1}`);
export function LedNames(){ return vKeyNames; }
export function LedPositions(){ return vKeyPositions; }
export const lednames = LedNames;          // compat minúsculo
export const ledpositions = LedPositions;

// ------- Validate / Initialize -------
export function Validate(endpoint){ return _validate(endpoint); }
export const validate = Validate;          // compat

function _validate(endpoint){
  try{
    if(ForceList) { console.log("[GK104Pro][Validate] ForceList=ON -> true"); return true; }
    if(!endpoint) return false;

    const vid  = endpoint.vendor_id  ?? endpoint.vendorId  ?? 0;
    const pid  = endpoint.product_id ?? endpoint.productId ?? 0;
    const mfr  = (endpoint.manufacturer ?? endpoint.manufacturer_name ?? "").toLowerCase();
    const prod = (endpoint.product_name ?? endpoint.product ?? "").toLowerCase();

    const idMatch   = (vid===0x1EA7 && pid===0x0907);
    const nameMatch = mfr.includes("semite") || prod.includes("usb-hid gaming keyboar") || prod.includes("gk104");

    const ok = idMatch || nameMatch;
    console.log(`[GK104Pro][Validate] vid=0x${(vid||0).toString(16)} pid=0x${(pid||0).toString(16)} mfr="${mfr}" prod="${prod}" -> ${ok?"MATCH":"skip"}`);
    return ok;
  }catch(e){ console.warn("[GK104Pro][Validate] error", e); return false; }
}

export function Initialize(){ console.log("[GK104Pro] Initialize()"); return true; }
export const initialize = Initialize;      // compat
export function Shutdown(){ console.log("[GK104Pro] Shutdown()"); }
export const shutdown = Shutdown;          // compat

// ------- Render -------
export function Render(){ sendColors(); }
export const render = Render;              // compat

// ------- Envio -------
function rgbOrderSwap([r,g,b]){
  switch(RgbOrder){ case"RBG":return[r,b,g]; case"GRB":return[g,r,b]; case"GBR":return[g,b,r]; case"BRG":return[b,r,g]; case"BGR":return[b,g,r]; default:return[r,g,b]; }
}
function grabColors(){
  const out=[];
  if(LightingMode==="Forced"){
    const hex=(forcedColor||"009bde").padEnd(6,"0");
    const r=parseInt(hex.slice(0,2),16)|0, g=parseInt(hex.slice(2,4),16)|0, b=parseInt(hex.slice(4,6),16)|0;
    for(let i=0;i<vKeys.length;i++){ const [R,G,B]=rgbOrderSwap([r,g,b]); out.push(R,G,B); }
  }else{
    for(let i=0;i<vKeys.length;i++){ const [r,g,b]=device.color(vKeys[i]); const [R,G,B]=rgbOrderSwap([r,g,b]); out.push(R,G,B); }
  }
  return out;
}
function refresh(){
  const d=+DelayMs||0, pkt=new Array(65).fill(0);
  device.send_report(pkt,65); device.pause(d);
  if(HeaderType==="0x04/0x02"){ pkt[1]=0x04; pkt[2]=0x02; device.send_report(pkt,65); device.pause(d); const resp=new Array(65).fill(0); device.get_report(resp,65); device.pause(d); }
}
function start_refresh(){
  const d=+DelayMs||0; if(HeaderType!=="0x04/0x20") return;
  const pkt=new Array(65).fill(0); pkt[1]=0x04; pkt[2]=0x20; pkt[9]=0x08; device.send_report(pkt,65); device.pause(d);
  const resp=new Array(65).fill(0); device.get_report(resp,65); device.pause(d);
}
function sendColors(){
  const d=+DelayMs||0, data=grabColors(), per=+ChunkLeds||16, total=vKeys.length;
  if((Date.now()&0xff)===0){ refresh(); start_refresh(); }
  let led=0;
  while(led<total){
    const pkt=new Array(65).fill(0);
    if(HeaderType==="0x04/0x20"){ pkt[1]=0x04; pkt[2]=0x20; pkt[3]= led & 0xff; pkt[4]= (led>>8)&0xff; }
    else if(HeaderType==="0x04/0x02"){ pkt[1]=0x04; pkt[2]=0x02; }
    let out=5, lim=Math.min(per,total-led);
    for(let i=0;i<lim && out+2<65;i++){ const idx=(led+i)*3; pkt[out++]=data[idx]; pkt[out++]=data[idx+1]; pkt[out++]=data[idx+2]; }
    device.send_report(pkt,65); device.pause(d); led+=lim;
  }
}
