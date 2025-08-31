import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve static files (logo, favicon)

// ---------- Apartment data (SCALA 17) ----------
const apartment = {
  apartment_id: 'SCALA17',
  name: 'Via della Scala 17',
  address: 'Via della Scala 17, Rome, Italy',
  checkin_time: '15:00',
  checkout_time: '11:00',

  // Wi-Fi
  wifi_note:
    'Router on the right side of the living room, on a bench. Black cylinder-shaped device; turn it to see SSID & password on the back.',
  wifi_ssid: 'See router label',
  wifi_password: 'See router label',

  // Water / Bathroom
  water_note: 'Tap water is safe to drink. Hot water is always on.',
  bathroom_amenities: 'Toilet paper, hand soap, hairdryer, bath mat.',
  towels_note: 'Per guest: 1 large + 1 medium towel. Bed is prepared on arrival.',

  // Gas / kitchen
  gas_steps:
    'Facing the gas meter: steel handle horizontal = OPEN; pointing down = CLOSED. To cook: 1) choose the burner, 2) press & turn the knob, 3) keep it pressed a few seconds until the flame is steady, 4) release.',
  washer_note:
    'Washing machine manual is in the kitchen drawer. If missing, search your model on Google and download the PDF manual.',

  // Building / Intercom
  intercom_note:
    'At the entrance there are two intercom columns. Your unit is in the column closest to the door on the left-hand side, first from the bottom. After the first door, the second intercom corresponds to Internal A/1.',
  elevator_note: '—',
  main_door_hours: '—',
  concierge: '—',

  // Services nearby
  pharmacy:
    'Farmacia Trastevere (Viale Trastevere 116). Other options: Pharmacy near Piazza Trilussa.',
  hospital:
    'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
  atms:
    'Intesa Sanpaolo ATM (Piazza Santa Maria in Trastevere), Unicredit ATM (Viale Trastevere 108).',
  sims:
    'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
  laundry:
    'Self-service laundry: Via della Scala 51.',
  luggage:
    'Radical Storage points in Trastevere / near Largo Argentina (book online).',

  // Transport
  transport:
    'Tram 8 from Trastevere → Piazza Venezia. Buses 23 and H connect to the Vatican, Piazza Venezia, and Termini. Walking is best around Trastevere.',
  airports:
    'Fiumicino: Tram 8 → Trastevere Station → FL1 train (~45 min). Ciampino: Terravision bus or taxi. Private transfer: Welcome Pickups.',
  taxi: 'Radio Taxi +39 06 3570 or FreeNow app.',

  // Safety & useful numbers
  emergency:
    'EU Emergency 112 • Police 113 • Ambulance 118 • Fire 115 • English-speaking doctor +39 06 488 2371 • 24h vet +39 06 660 681',

  // Eat / Drink / Shop / Visit / Experiences / Day trips
  eat: [
    'Da Teo — Piazza dei Ponziani 7A',
    'Ristorante La Scala — Piazza della Scala 58–61',
    'Da Carlone — Piazza Sant’Apollonia 11',
    'Osteria Fernanda — Vicolo del Cinque 18',
    'Osteria der Belli — Seafood Sardinian/Roman',
    'Tonnarello — Roman classics',
    'La Tavernaccia — Roast meats, pasta',
    'Nannarella — Homemade pasta'
  ].join('; '),

  drink:
    'VinAllegro (aperitivo, Piazza Giuditta Tavani Arquati 114); Freni e Frizioni (cocktails); Bar San Calisto (iconic bar); La Vite enoteca (Piazza S. Cosimato 70).',
  shop:
    'Mercato San Cosimato (daily produce); Antica Norcineria Iacozzilli (porchetta); Valzani Pasticceria; Le Levain Bakery; Porta Portese Market (Sun); Twice Vintage; Carlo Cecchini Leather.',
  visit:
    'Santa Maria in Trastevere (mosaics); Santa Cecilia; Museo di Roma in Trastevere; Orto Botanico; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
  experiences:
    'Scenic loop: Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Orto Botanico. Evening wine at La Vite or San Calisto; pastries stop at Valzani; romantic stroll over Ponte Sisto.',
  daytrips:
    'Ostia Antica (~40 min); Tivoli (Villa d’Este & Hadrian’s Villa ~1h); Castelli Romani (villages & wine).',
  romantic_walk:
    'Start: Via della Scala 17 → Santa Maria in Trastevere → Ponte Sisto (sunset) → Campo de’ Fiori → Piazza Navona → Fior di Luna gelato → Biscottificio Innocenti → back to Via della Scala 17.',

  // Check-out
  checkout_note:
    'Before leaving: turn off lights, close windows, leave keys on the table, gently close the door.',

  // Host
  host_phone: '+39 335 5245756'
};

// ---------- FAQ (keyword → template) ----------
const faqs = [
  { intent: 'wifi', utterances: ['wifi','wi-fi','internet','password','router'],
    answer_template: `Wi-Fi: {wifi_note}\nNetwork: {wifi_ssid}. Password: {wifi_password}.` },
  { intent: 'check in', utterances: ['check in','arrival','access','intercom','doorbell','code'],
    answer_template: `Check-in from {checkin_time}. Intercom: {intercom_note}\nNeed help? Call {host_phone}.` },
  { intent: 'check out', utterances: ['check out','leave','departure'],
    answer_template: `{checkout_note}` },
  { intent: 'water', utterances: ['water','hot water','drinkable','tap'],
    answer_template: `{water_note}` },
  { intent: 'bathroom', utterances: ['bathroom','hairdryer','soap','towels','amenities'],
    answer_template: `Bathroom: {bathroom_amenities}\nTowels: {towels_note}` },
  { intent: 'gas', utterances: ['gas','kitchen','cook','flame','burner'],
    answer_template: `Gas use: {gas_steps}\nWasher: {washer_note}` },
  { intent: 'building', utterances: ['building','elevator','door','hours','concierge','intercom'],
    answer_template: `Intercom: {intercom_note}\nElevator: {elevator_note}\nMain door: {main_door_hours}\nConcierge: {concierge}` },
  { intent: 'services', utterances: ['services','pharmacy','hospital','atm','sim','laundry','luggage','numbers'],
    answer_template: `Pharmacy: {pharmacy}\nHospital: {hospital}\nATMs: {atms}\nSIMs: {sims}\nLaundry: {laundry}\nLuggage: {luggage}` },
  { intent: 'transport', utterances: ['transport','tram','bus','taxi','airport','train'],
    answer_template: `{transport}\nAirports: {airports}\nTaxi: {taxi}` },
  { intent: 'eat', utterances: ['eat','restaurant','dinner','lunch','food'],
    answer_template: `{eat}` },
  { intent: 'drink', utterances: ['drink','bar','wine','cocktail','aperitivo'],
    answer_template: `{drink}` },
  { intent: 'shop', utterances: ['shop','market','shopping','boutique'],
    answer_template: `{shop}` },
  { intent: 'visit', utterances: ['visit','what to visit','see','sight','attraction','museum'],
    answer_template: `{visit}` },
  { intent: 'experience', utterances: ['experience','walk','tour','itinerary','sunset','romantic'],
    answer_template: `{experiences}\nRomantic route: {romantic_walk}` },
  { intent: 'day trips', utterances: ['day trip','tivoli','ostia','castelli','excursion'],
    answer_template: `{daytrips}` },
  { intent: 'emergency', utterances: ['emergency','police','ambulance','fire','doctor','vet'],
    answer_template: `{emergency}` }
];

// ---------- OpenAI polish (multilingual) ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const LANG_NAME = { en:'English', it:'Italian', fr:'French', de:'German', es:'Spanish' };

function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function detectIntent(msg){
  const t = norm(msg); let best=null, scoreBest=0;
  for (const f of faqs){ let s=0; for (const u of f.utterances){ if (t.includes(norm(u))) s++; }
    if (s>scoreBest){ best=f; scoreBest=s; }
  }
  return scoreBest>0 ? best : null;
}
function fill(tpl, obj){ return tpl.replace(/\{(\w+)\}/g,(_,k)=>obj[k] ?? `{${k}}`); }

async function polish(raw, userMsg, lang='en'){
  if (!client) return raw;
  const target = LANG_NAME[lang] || LANG_NAME.en;
  const sys = `You are a concise hotel/apartment assistant. ALWAYS answer in ${target}.
Keep facts exactly as given; do not invent; keep names, codes and numbers unchanged.`;
  try{
    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role:'system', content: sys },
        { role:'developer', content: `Apartment data: ${JSON.stringify(apartment)}` },
        { role:'user', content: `Guest asked: ${userMsg}\nDraft answer:\n${raw}` }
      ]
    });
    return r.output_text || raw;
  }catch{ return raw; }
}

// ---------- API ----------
app.post('/api/message', async (req,res)=>{
  const { message='', lang='en' } = req.body || {};
  const m = detectIntent(message);
  let raw = m ? fill(m.answer_template, apartment)
              : 'I did not find a direct answer. Try a button or use keywords (wifi, gas, transport, eat…).';
  const text = await polish(raw, message, lang);
  res.json({ text, intent: m?.intent || null });
});

// ---------- UI ----------
app.get('/', (_req,res)=>{
  // keys = intent keywords in EN (stay as is for matching)
  const BUTTON_KEYS = [
    'wifi','check in','check out','water','bathroom','gas',
    'eat','drink','shop','visit','experience','day trips',
    'transport','services','emergency'
  ];

  // UI translations (labels only)
  const UI_I18N = {
    en:{ welcome:'Hi, I am Samantha, your virtual assistant. Tap a button to get a quick answer.',
         placeholder:'Type a message… e.g., wifi, gas, transport',
         buttons:{
           wifi:'wifi','check in':'check in','check out':'check out','water':'water','bathroom':'bathroom','gas':'gas',
           eat:'eat','drink':'drink','shop':'shop','visit':'visit','experience':'experience','day trips':'day trips',
           transport:'transport','services':'services','emergency':'emergency'
         },
         voice_on:'🔊 Voice: On', voice_off:'🔇 Voice: Off', apt_label:'Apartment' },
    it:{ welcome:'Ciao, sono Samantha, la tua guida virtuale. Tocca un pulsante per una risposta rapida.',
         placeholder:'Scrivi un messaggio… es. wifi, gas, trasporti',
         buttons:{
           wifi:'wifi','check in':'check in','check out':'check out','water':'acqua','bathroom':'bagno','gas':'gas',
           eat:'mangiare','drink':'bere','shop':'shopping','visit':'visitare','experience':'esperienze','day trips':'gite di un giorno',
           transport:'trasporti','services':'servizi','emergency':'emergenza'
         },
         voice_on:'🔊 Voce: On', voice_off:'🔇 Voce: Off', apt_label:'Appartamento' },
    fr:{ welcome:'Bonjour, je suis Samantha, votre guide virtuel. Touchez un bouton pour une réponse rapide.',
         placeholder:'Écrivez un message… ex. wifi, gaz, transport',
         buttons:{
           wifi:'wifi','check in':'check in','check out':'check out','water':'eau','bathroom':'salle de bain','gas':'gaz',
           eat:'manger','drink':'boire','shop':'shopping','visit':'visiter','experience':'expériences','day trips':'excursions',
           transport:'transports','services':'services','emergency':'urgence'
         },
         voice_on:'🔊 Voix : Activée', voice_off:'🔇 Voix : Désactivée', apt_label:'Appartement' },
    de:{ welcome:'Hallo, ich bin Samantha, dein virtueller Guide. Tippe auf einen Button für eine schnelle Antwort.',
         placeholder:'Nachricht eingeben… z. B. WLAN, Gas, Verkehr',
         buttons:{
           wifi:'WLAN','check in':'check in','check out':'check out','water':'Wasser','bathroom':'Bad','gas':'Gas',
           eat:'Essen','drink':'Trinken','shop':'Shopping','visit':'Sehenswürdigkeiten','experience':'Erlebnisse','day trips':'Tagesausflüge',
           transport:'Verkehr','services':'Services','emergency':'Notfall'
         },
         voice_on:'🔊 Stimme: An', voice_off:'🔇 Stimme: Aus', apt_label:'Apartment' },
    es:{ welcome:'Hola, soy Samantha, tu guía virtual. Toca un botón para una respuesta rápida.',
         placeholder:'Escribe un mensaje… p. ej., wifi, gas, transporte',
         buttons:{
           wifi:'wifi','check in':'check in','check out':'check out','water':'agua','bathroom':'baño','gas':'gas',
           eat:'comer','drink':'beber','shop':'compras','visit':'visitar','experience':'experiencias','day trips':'excursiones',
           transport:'transporte','services':'servicios','emergency':'emergencia'
         },
         voice_on:'🔊 Voz: Activada', voice_off:'🔇 Voz: Desactivada', apt_label:'Apartamento' }
  };

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guest Help — Via della Scala 17</title>
<link rel="icon" type="image/png" href="logo.png">
<style>
*{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6}
.wrap{max-width:760px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e0e0e0;padding:10px 14px}
.h-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.h-left{display:flex;align-items:center;gap:10px}
.brand{font-weight:700;color:#a33}
.apt{margin-left:auto;opacity:.75}
img.logo{height:36px;width:auto;display:block}
.controls{display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap}
.lang{display:flex;gap:6px;margin-left:auto}
.lang button{border:1px solid #ddd;background:#fff;padding:6px 8px;border-radius:10px;cursor:pointer;font-size:13px}
.lang button[aria-current="true"]{background:#2b2118;color:#fff;border-color:#2b2118}
#voiceBtn{padding:8px 10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer;font-size:14px}
#voiceBtn[aria-pressed="true"]{background:#2b2118;color:#fff;border-color:#2b2118}
main{flex:1;padding:12px}
.msg{max-width:85%;line-height:1.35;border-radius:12px;padding:10px 12px;margin:8px 0;white-space:pre-wrap}
.msg.wd{background:#fff;border:1px solid #e0e0e0}
.msg.me{background:#e8f0fe;border:1px solid #c5d5ff;margin-left:auto}
.quick{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.quick button{border:1px solid #d6c5b8;background:#fff;color:#333;padding:6px 10px;border-radius:12px;cursor:pointer}
.quick button:active{transform:translateY(1px)}
footer{position:sticky;bottom:0;background:#fff;display:flex;gap:8px;padding:10px;border-top:1px solid #e0e0e0}
input{flex:1;padding:12px;border:1px solid #cbd5e1;border-radius:10px;outline:none}
#sendBtn{padding:12px 14px;border:1px solid #2b2118;background:#2b2118;color:#fff;border-radius:10px;cursor:pointer}
</style></head>
<body>
<div class="wrap">
  <header>
    <div class="h-row">
      <div class="h-left">
        <img class="logo" src="logo-niceflatinrome.jpg" alt="NiceFlatInRome">
        <div class="brand">niceflatinrome.com</div>
      </div>
      <div class="apt"><span id="aptLabel">Apartment</span>: SCALA17</div>
    </div>
    <div class="controls">
      <button id="voiceBtn" aria-pressed="false" title="Toggle voice">🔇 Voice: Off</button>
      <nav class="lang" aria-label="Language">
        <button data-lang="en" aria-current="true">EN</button>
        <button data-lang="it">IT</button>
        <button data-lang="fr">FR</button>
        <button data-lang="de">DE</button>
        <button data-lang="es">ES</button>
      </nav>
    </div>
  </header>

  <main id="chat" aria-live="polite"></main>

  <footer>
    <input id="input" placeholder="Type a message… e.g., wifi, gas, transport" autocomplete="off">
    <button id="sendBtn">Send</button>
  </footer>
</div>
<script>
const UI_I18N = ${JSON.stringify(UI_I18N)};
const BUTTON_KEYS = ${JSON.stringify(BUTTON_KEYS)};
const chatEl = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// Lang init (URL ?lang=xx -> localStorage -> navigator)
const url = new URL(location);
let lang = (url.searchParams.get('lang') || localStorage.getItem('lang') || (navigator.language||'en').slice(0,2)).toLowerCase();
if(!UI_I18N[lang]) lang='en';
url.searchParams.set('lang', lang); history.replaceState(null,'',url);
localStorage.setItem('lang', lang);

function applyUI(){
  const t = UI_I18N[lang] || UI_I18N.en;
  document.getElementById('aptLabel').textContent = t.apt_label;
  document.getElementById('voiceBtn').textContent = voiceOn ? t.voice_on : t.voice_off;
  input.placeholder = t.placeholder;
  // lang pills
  document.querySelectorAll('.lang [data-lang]').forEach(b=>{
    b.setAttribute('aria-current', b.getAttribute('data-lang')===lang ? 'true':'false');
  });
}

let voiceOn = false, pick = null;
function pickSamantha(){
  const all = window.speechSynthesis ? (speechSynthesis.getVoices()||[]) : [];
  const en = all.filter(v=>/en-/i.test(v.lang));
  pick = en.find(v=>/samantha/i.test(v.name)) || en[0] || all[0] || null;
}
if ('speechSynthesis' in window){
  pickSamantha(); window.speechSynthesis.onvoiceschanged = pickSamantha;
}
function warm(){ if(lang!=='en') return; try{ const u=new SpeechSynthesisUtterance('Voice enabled.'); if(pick) u.voice=pick; u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }
function speak(t){ if(lang!=='en'||!voiceOn||!('speechSynthesis'in window))return; try{ const u=new SpeechSynthesisUtterance(t); if(pick) u.voice=pick; u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }

document.getElementById('voiceBtn').addEventListener('click',e=>{
  voiceOn=!voiceOn; e.currentTarget.setAttribute('aria-pressed',String(voiceOn));
  applyUI(); if (voiceOn) warm();
});

// Language switcher
document.querySelector('.lang').addEventListener('click',e=>{
  const btn = e.target.closest('[data-lang]'); if(!btn) return;
  lang = btn.getAttribute('data-lang');
  localStorage.setItem('lang', lang);
  const u = new URL(location); u.searchParams.set('lang', lang); history.replaceState(null,'',u);
  applyUI();
  // re-render welcome in new language
  chatEl.innerHTML=''; welcome();
});

function add(type, txt){
  const d=document.createElement('div');
  d.className='msg '+(type==='me'?'me':'wd');
  d.textContent=txt;
  chatEl.appendChild(d);
  chatEl.scrollTop=chatEl.scrollHeight;
}

function welcome(){
  const t = UI_I18N[lang] || UI_I18N.en;
  add('wd', t.welcome);
  const q=document.createElement('div'); q.className='quick';
  // show translated labels, but send EN keywords for matching
  for(const key of BUTTON_KEYS){
    const label = t.buttons[key] || key;
    const b=document.createElement('button'); b.textContent=label;
    b.onclick=()=>{ input.value=key; send(); }; // send EN keyword
    q.appendChild(b);
  }
  chatEl.appendChild(q);
}

async function send(){
  const text=(input.value||'').trim(); if(!text) return;
  add('me', text); input.value='';
  try{
    const r=await fetch('/api/message',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text, lang})
    });
    const data=await r.json(); const bot=data.text||'Sorry, something went wrong.';
    add('wd',bot); speak(bot);
  }catch{
    add('wd','Network error. Please try again.');
  }
}
sendBtn.addEventListener('click',send);
input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });

applyUI();
welcome();
</script>
</body></html>`;
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(html);
});

// ---------- Start ----------
const port = process.env.PORT || 8787;
app.listen(port, ()=>console.log('Guest assistant up on http://localhost:'+port));
