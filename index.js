import express from 'express';
import cors from 'cors';
// OpenAI è facoltativo (i testi sono già localizzati offline)
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // static (logo, favicon)

// ----------------------------------------------------
// Base (dati “neutri”)
const base = {
  apartment_id: 'SCALA17',
  apt_label: { en:'Apartment', it:'Appartamento', fr:'Appartement', de:'Apartment', es:'Apartamento' },
  name: 'Via della Scala 17',
  address: 'Via della Scala 17, Rome, Italy',
  checkin_time: '15:00',
  checkout_time: '11:00',
  host_phone: '+39 335 5245756'
};

// ----------------------------------------------------
// CONTENUTI LOCALIZZATI (EN/IT/FR/DE/ES)
const APT_I18N = {
  en: {
    wifi_note: 'Router on the right side of the living room, on a bench. Black cylinder-shaped device; turn it to see SSID & password on the back.',
    wifi_ssid: 'See router label',
    wifi_password: 'See router label',
    water_note: 'Tap water is safe to drink. Hot water is always on.',
    bathroom_amenities: 'Toilet paper, hand soap, hairdryer, bath mat.',
    towels_note: 'Per guest: 1 large + 1 medium towel. Bed is prepared on arrival.',
    gas_steps: 'Facing the gas meter: steel handle horizontal = OPEN; pointing down = CLOSED. To cook: 1) choose the burner, 2) press & turn the knob, 3) keep it pressed a few seconds until the flame is steady, 4) release.',
    washer_note: 'Washing machine manual is in the kitchen drawer. If missing, search your model on Google and download the PDF manual.',
    intercom_note: 'At the entrance there are two intercom columns. Your unit is in the column closest to the door on the left-hand side, first from the bottom. After the first door, the second intercom corresponds to Internal A/1.',
    elevator_note: '—',
    main_door_hours: '—',
    concierge: '—',
    pharmacy: 'Farmacia Trastevere (Viale Trastevere 116). Other options: Pharmacy near Piazza Trilussa.',
    hospital: 'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
    atms: 'Intesa Sanpaolo ATM (Piazza Santa Maria in Trastevere), Unicredit ATM (Viale Trastevere 108).',
    sims: 'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
    laundry: 'Self-service laundry: Via della Scala 51.',
    luggage: 'Radical Storage points in Trastevere / near Largo Argentina (book online).',
    transport: 'Tram 8 from Trastevere → Piazza Venezia. Buses 23 and H connect to the Vatican, Piazza Venezia, and Termini. Walking is best around Trastevere.',
    airports: 'Fiumicino: Tram 8 → Trastevere Station → FL1 train (~45 min). Ciampino: Terravision bus or taxi. Private transfer: Welcome Pickups.',
    taxi: 'Radio Taxi +39 06 3570 or FreeNow app.',
    emergency: 'EU Emergency 112 • Police 113 • Ambulance 118 • Fire 115 • English-speaking doctor +39 06 488 2371 • 24h vet +39 06 660 681',
    eat: 'Da Teo — Piazza dei Ponziani 7A; Ristorante La Scala — Piazza della Scala 58–61; Da Carlone — Piazza Sant’Apollonia 11; Osteria Fernanda — Vicolo del Cinque 18; Osteria der Belli — Seafood Sardinian/Roman; Tonnarello — Roman classics; La Tavernaccia — Roast meats, pasta; Nannarella — Homemade pasta',
    drink: 'VinAllegro (aperitivo, Piazza Giuditta Tavani Arquati 114); Freni e Frizioni (cocktails); Bar San Calisto (iconic bar); La Vite enoteca (Piazza S. Cosimato 70).',
    shop: 'Mercato San Cosimato (daily produce); Antica Norcineria Iacozzilli (porchetta); Valzani Pasticceria; Le Levain Bakery; Porta Portese Market (Sun); Twice Vintage; Carlo Cecchini Leather.',
    visit: 'Santa Maria in Trastevere (mosaics); Santa Cecilia; Museo di Roma in Trastevere; Orto Botanico; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
    experiences: 'Scenic loop: Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Orto Botanico. Evening wine at La Vite or San Calisto; pastries stop at Valzani; romantic stroll over Ponte Sisto.',
    daytrips: 'Ostia Antica (~40 min); Tivoli (Villa d’Este & Hadrian’s Villa ~1h); Castelli Romani (villages & wine).',
    romantic_walk: 'Start: Via della Scala 17 → Santa Maria in Trastevere → Ponte Sisto (sunset) → Campo de’ Fiori → Piazza Navona → Fior di Luna gelato → Biscottificio Innocenti → back to Via della Scala 17.',
    checkout_note: 'Before leaving: turn off lights, close windows, leave keys on the table, gently close the door.'
  },
  it: {
    wifi_note: 'Router sul lato destro del soggiorno, su una panca. Dispositivo nero a cilindro: ruotalo per vedere SSID e password sul retro.',
    wifi_ssid: 'Vedi etichetta del router',
    wifi_password: 'Vedi etichetta del router',
    water_note: "L'acqua del rubinetto è potabile. L'acqua calda è sempre disponibile.",
    bathroom_amenities: 'Carta igienica, sapone per le mani, asciugacapelli, tappetino.',
    towels_note: 'Per ospite: 1 telo grande + 1 medio. Il letto è preparato all’arrivo.',
    gas_steps: 'Di fronte al contatore gas: leva in orizzontale = APERTO; verso il basso = CHIUSO. Per cucinare: 1) scegli il fornello, 2) premi e gira la manopola, 3) tieni premuto qualche secondo finché la fiamma è stabile, 4) rilascia.',
    washer_note: 'Il manuale della lavatrice è nel cassetto della cucina. Se manca, cerca il modello su Google e scarica il PDF.',
    intercom_note: "All'ingresso ci sono due colonne di citofoni. Il tuo è nella colonna più vicina alla porta sul lato sinistro, il primo dal basso. Dopo il primo portone, il secondo citofono corrisponde all'Interno A/1.",
    elevator_note: '—',
    main_door_hours: '—',
    concierge: '—',
    pharmacy: 'Farmacia Trastevere (Viale Trastevere 116). In alternativa: farmacia vicino a Piazza Trilussa.',
    hospital: 'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
    atms: 'Intesa Sanpaolo (Piazza Santa Maria in Trastevere), Unicredit (Viale Trastevere 108).',
    sims: 'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
    laundry: 'Lavanderia self-service: Via della Scala 51.',
    luggage: 'Punti Radical Storage a Trastevere / vicino Largo Argentina (prenota online).',
    transport: 'Tram 8 da Trastevere → Piazza Venezia. Autobus 23 e H per Vaticano, Piazza Venezia e Termini. A Trastevere conviene muoversi a piedi.',
    airports: 'Fiumicino: Tram 8 → Stazione Trastevere → treno FL1 (~45 min). Ciampino: bus Terravision o taxi. Transfer privato: Welcome Pickups.',
    taxi: 'Radio Taxi +39 06 3570 o app FreeNow.',
    emergency: 'Emergenze UE 112 • Polizia 113 • Ambulanza 118 • Vigili del Fuoco 115 • Medico in inglese +39 06 488 2371 • Veterinario 24h +39 06 660 681',
    eat: 'Da Teo — Piazza dei Ponziani 7A; Ristorante La Scala — Piazza della Scala 58–61; Da Carlone — Piazza Sant’Apollonia 11; Osteria Fernanda — Vicolo del Cinque 18; Osteria der Belli — Pesce sardo/romano; Tonnarello — Classici romani; La Tavernaccia — Carni arrosto, pasta; Nannarella — Pasta fatta in casa',
    drink: 'VinAllegro (aperitivo, Piazza Giuditta Tavani Arquati 114); Freni e Frizioni (cocktail); Bar San Calisto (storico); La Vite enoteca (Piazza S. Cosimato 70).',
    shop: 'Mercato di San Cosimato (frutta/verdura); Antica Norcineria Iacozzilli (porchetta); Pasticceria Valzani; Le Levain Bakery; Porta Portese (dom); Twice Vintage; Carlo Cecchini Pelletteria.',
    visit: 'Santa Maria in Trastevere (mosaici); Santa Cecilia; Museo di Roma in Trastevere; Orto Botanico; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
    experiences: 'Percorso panoramico: Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Orto Botanico. Sera a La Vite o San Calisto; dolci da Valzani; passeggiata romantica su Ponte Sisto.',
    daytrips: 'Ostia Antica (~40 min); Tivoli (Villa d’Este & Villa Adriana ~1h); Castelli Romani (borghi e vino).',
    romantic_walk: 'Partenza: Via della Scala 17 → S. Maria in Trastevere → Ponte Sisto (tramonto) → Campo de’ Fiori → Piazza Navona → gelato da Fior di Luna → Biscottificio Innocenti → ritorno a Via della Scala 17.',
    checkout_note: 'Prima di lasciare: spegni le luci, chiudi le finestre, lascia le chiavi sul tavolo, chiudi la porta delicatamente.'
  },
  fr: {
    wifi_note: 'Routeur sur le côté droit du séjour, sur un banc. Appareil noir en forme de cylindre : tournez-le pour voir le SSID et le mot de passe au dos.',
    wifi_ssid: 'Voir l’étiquette du routeur',
    wifi_password: 'Voir l’étiquette du routeur',
    water_note: "L'eau du robinet est potable. L’eau chaude est toujours disponible.",
    bathroom_amenities: 'Papier toilette, savon pour les mains, sèche-cheveux, tapis de bain.',
    towels_note: 'Par personne : 1 grande + 1 moyenne serviette. Le lit est prêt à l’arrivée.',
    gas_steps: 'Face au compteur de gaz : poignée en position horizontale = OUVERT ; vers le bas = FERMÉ. Pour cuisiner : 1) choisissez le brûleur, 2) appuyez et tournez la manette, 3) maintenez quelques secondes jusqu’à ce que la flamme soit stable, 4) relâchez.',
    washer_note: 'Le manuel de la machine à laver est dans le tiroir de la cuisine. S’il manque, cherchez votre modèle sur Google et téléchargez le PDF.',
    intercom_note: "À l’entrée, deux colonnes d’interphones. Le vôtre est dans la colonne la plus proche de la porte, côté gauche, le premier depuis le bas. Après la première porte, le second interphone correspond à l’Interne A/1.",
    elevator_note: '—',
    main_door_hours: '—',
    concierge: '—',
    pharmacy: 'Farmacia Trastevere (Viale Trastevere 116). Autre option : pharmacie près de Piazza Trilussa.',
    hospital: 'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
    atms: 'Intesa Sanpaolo (Piazza Santa Maria in Trastevere), Unicredit (Viale Trastevere 108).',
    sims: 'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
    laundry: 'Laverie en libre-service : Via della Scala 51.',
    luggage: 'Points Radical Storage à Trastevere / près de Largo Argentina (réservation en ligne).',
    transport: 'Tram 8 depuis Trastevere → Piazza Venezia. Bus 23 et H pour le Vatican, Piazza Venezia et Termini. À Trastevere, marcher est idéal.',
    airports: 'Fiumicino : Tram 8 → Gare de Trastevere → train FL1 (~45 min). Ciampino : bus Terravision ou taxi. Transfert privé : Welcome Pickups.',
    taxi: 'Radio Taxi +39 06 3570 ou application FreeNow.',
    emergency: 'Urgences UE 112 • Police 113 • Ambulance 118 • Pompiers 115 • Médecin anglophone +39 06 488 2371 • Vétérinaire 24h/24 +39 06 660 681',
    eat: 'Da Teo — Piazza dei Ponziani 7A; Ristorante La Scala — Piazza della Scala 58–61; Da Carlone — Piazza Sant’Apollonia 11; Osteria Fernanda — Vicolo del Cinque 18; Osteria der Belli — Poissons sarde/romain; Tonnarello — Classiques romains; La Tavernaccia — Viandes rôties, pâtes; Nannarella — Pâtes maison',
    drink: 'VinAllegro (apéritif); Freni e Frizioni (cocktails); Bar San Calisto (bar iconique); La Vite (œnothèque, Piazza S. Cosimato 70).',
    shop: 'Marché San Cosimato (produits frais); Antica Norcineria Iacozzilli (porchetta); Pâtisserie Valzani; Le Levain Bakery; Marché Porta Portese (dim); Twice Vintage; Carlo Cecchini Cuir.',
    visit: 'Santa Maria in Trastevere (mosaïques); Santa Cecilia; Musée de Rome à Trastevere; Jardin botanique; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
    experiences: 'Boucle panoramique : Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Jardin botanique. Soirée vin à La Vite ou San Calisto; douceurs chez Valzani; promenade romantique sur le Ponte Sisto.',
    daytrips: 'Ostia Antica (~40 min); Tivoli (Villa d’Este & Villa d’Hadrien ~1h); Castelli Romani (villages & vin).',
    romantic_walk: 'Départ : Via della Scala 17 → Santa Maria in Trastevere → Ponte Sisto (coucher de soleil) → Campo de’ Fiori → Piazza Navona → glace chez Fior di Luna → Biscottificio Innocenti → retour Via della Scala 17.',
    checkout_note: 'Avant de partir : éteignez les lumières, fermez les fenêtres, laissez les clés sur la table, fermez la porte délicatement.'
  },
  de: {
    wifi_note: 'Router auf der rechten Seite des Wohnzimmers, auf einer Bank. Schwarzes zylinderförmiges Gerät; drehen, um SSID & Passwort auf der Rückseite zu sehen.',
    wifi_ssid: 'Siehe Router-Etikett',
    wifi_password: 'Siehe Router-Etikett',
    water_note: 'Leitungswasser ist trinkbar. Warmwasser ist immer verfügbar.',
    bathroom_amenities: 'Toilettenpapier, Handseife, Haartrockner, Badematte.',
    towels_note: 'Pro Gast: 1 großes + 1 mittleres Handtuch. Das Bett ist bei Ankunft bezogen.',
    gas_steps: 'Am Gaszähler: Metallhebel waagerecht = OFFEN; nach unten = GESCHLOSSEN. Zum Kochen: 1) Brenner wählen, 2) Knopf drücken & drehen, 3) ein paar Sekunden gedrückt halten bis die Flamme stabil ist, 4) loslassen.',
    washer_note: 'Waschmaschinenhandbuch in der Küchenschublade. Falls es fehlt, Modell bei Google suchen und PDF herunterladen.',
    intercom_note: 'Am Eingang gibt es zwei Gegensprechanlagen. Ihre Einheit ist in der Leiste links, nahe der Tür, die erste von unten. Nach der ersten Tür entspricht die zweite Gegensprechanlage „Intern A/1“.',
    elevator_note: '—',
    main_door_hours: '—',
    concierge: '—',
    pharmacy: 'Farmacia Trastevere (Viale Trastevere 116). Weitere Option: Apotheke nahe Piazza Trilussa.',
    hospital: 'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
    atms: 'Intesa Sanpaolo (Piazza Santa Maria in Trastevere), Unicredit (Viale Trastevere 108).',
    sims: 'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
    laundry: 'SB-Waschsalon: Via della Scala 51.',
    luggage: 'Radical-Storage-Standorte in Trastevere / bei Largo Argentina (online buchen).',
    transport: 'Tram 8 von Trastevere → Piazza Venezia. Bus 23 und H verbinden Vatikan, Piazza Venezia und Termini. In Trastevere ist Gehen am besten.',
    airports: 'Fiumicino: Tram 8 → Bahnhof Trastevere → FL1 (~45 Min). Ciampino: Terravision-Bus oder Taxi. Privater Transfer: Welcome Pickups.',
    taxi: 'Radio Taxi +39 06 3570 oder FreeNow-App.',
    emergency: 'EU-Notruf 112 • Polizei 113 • Rettung 118 • Feuerwehr 115 • Englischsprachiger Arzt +39 06 488 2371 • Tierarzt 24h +39 06 660 681',
    eat: 'Da Teo — Piazza dei Ponziani 7A; Ristorante La Scala — Piazza della Scala 58–61; Da Carlone — Piazza Sant’Apollonia 11; Osteria Fernanda — Vicolo del Cinque 18; Osteria der Belli — Fisch sardinisch/römisch; Tonnarello — Römische Klassiker; La Tavernaccia — Braten, Pasta; Nannarella — Hausgemachte Pasta',
    drink: 'VinAllegro (Aperitivo); Freni e Frizioni (Cocktails); Bar San Calisto (ikonisch); La Vite Enothek (Piazza S. Cosimato 70).',
    shop: 'Markt San Cosimato (täglich); Antica Norcineria Iacozzilli (Porchetta); Pasticceria Valzani; Le Levain Bakery; Markt Porta Portese (So); Twice Vintage; Carlo Cecchini Leder.',
    visit: 'Santa Maria in Trastevere (Mosaiken); Santa Cecilia; Museo di Roma in Trastevere; Botanischer Garten; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
    experiences: 'Panoramarunde: Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Botanischer Garten. Abends Wein bei La Vite oder San Calisto; Süßes bei Valzani; romantischer Spaziergang über die Ponte Sisto.',
    daytrips: 'Ostia Antica (~40 Min); Tivoli (Villa d’Este & Hadriansvilla ~1h); Castelli Romani (Dörfer & Wein).',
    romantic_walk: 'Start: Via della Scala 17 → Santa Maria in Trastevere → Ponte Sisto (Sonnenuntergang) → Campo de’ Fiori → Piazza Navona → Gelato bei Fior di Luna → Biscottificio Innocenti → zurück Via della Scala 17.',
    checkout_note: 'Vor der Abreise: Lichter aus, Fenster schließen, Schlüssel auf den Tisch legen, Tür sanft schließen.'
  },
  es: {
    wifi_note: 'Router en el lado derecho del salón, sobre un banco. Dispositivo negro cilíndrico; gíralo para ver el SSID y la contraseña en la parte posterior.',
    wifi_ssid: 'Ver etiqueta del router',
    wifi_password: 'Ver etiqueta del router',
    water_note: 'El agua del grifo es potable. El agua caliente está siempre disponible.',
    bathroom_amenities: 'Papel higiénico, jabón de manos, secador, alfombrilla de baño.',
    towels_note: 'Por huésped: 1 toalla grande + 1 mediana. La cama está preparada a la llegada.',
    gas_steps: 'Frente al contador de gas: manija metálica horizontal = ABIERTO; hacia abajo = CERRADO. Para cocinar: 1) elige el fogón, 2) presiona y gira la perilla, 3) mantén presionado unos segundos hasta que la llama sea estable, 4) suelta.',
    washer_note: 'El manual de la lavadora está en el cajón de la cocina. Si falta, busca tu modelo en Google y descarga el PDF.',
    intercom_note: 'En la entrada hay dos columnas de porteros. Tu unidad está en la columna más cercana a la puerta del lado izquierdo, la primera desde abajo. Tras la primera puerta, el segundo portero corresponde al Interno A/1.',
    elevator_note: '—',
    main_door_hours: '—',
    concierge: '—',
    pharmacy: 'Farmacia Trastevere (Viale Trastevere 116). Otra opción: farmacia cerca de Piazza Trilussa.',
    hospital: 'Ospedale Nuovo Regina Margherita (Via Emilio Morosini 30).',
    atms: 'Intesa Sanpaolo (Piazza Santa Maria in Trastevere), Unicredit (Viale Trastevere 108).',
    sims: 'Vodafone (Viale Trastevere 143), TIM (Piazza San Cosimato 70).',
    laundry: 'Lavandería autoservicio: Via della Scala 51.',
    luggage: 'Puntos de Radical Storage en Trastevere / cerca de Largo Argentina (reserva online).',
    transport: 'Tranvía 8 desde Trastevere → Piazza Venezia. Autobuses 23 y H hacia el Vaticano, Piazza Venezia y Termini. Caminar es lo mejor por Trastevere.',
    airports: 'Fiumicino: Tranvía 8 → Estación Trastevere → tren FL1 (~45 min). Ciampino: bus Terravision o taxi. Traslado privado: Welcome Pickups.',
    taxi: 'Radio Taxi +39 06 3570 o app FreeNow.',
    emergency: 'Emergencia UE 112 • Policía 113 • Ambulancia 118 • Bomberos 115 • Médico en inglés +39 06 488 2371 • Veterinario 24h +39 06 660 681',
    eat: 'Da Teo — Piazza dei Ponziani 7A; Ristorante La Scala — Piazza della Scala 58–61; Da Carlone — Piazza Sant’Apollonia 11; Osteria Fernanda — Vicolo del Cinque 18; Osteria der Belli — Pescado sardo/romano; Tonnarello — Clásicos romanos; La Tavernaccia — Asados, pasta; Nannarella — Pasta casera',
    drink: 'VinAllegro (aperitivo); Freni e Frizioni (cócteles); Bar San Calisto (icónico); La Vite enoteca (Piazza S. Cosimato 70).',
    shop: 'Mercado San Cosimato (productos diarios); Antica Norcineria Iacozzilli (porchetta); Pastelería Valzani; Le Levain Bakery; Mercado Porta Portese (dom); Twice Vintage; Carlo Cecchini Cuero.',
    visit: 'Santa Maria in Trastevere (mosaicos); Santa Cecilia; Museo de Roma en Trastevere; Jardín Botánico; Villa Farnesina; Ponte Sisto → Campo de’ Fiori → Piazza Navona.',
    experiences: 'Ruta panorámica: Via della Scala → S. Maria in Trastevere → Santa Cecilia → Gianicolo → Jardín Botánico. Noche de vino en La Vite o San Calisto; dulces en Valzani; paseo romántico por Ponte Sisto.',
    daytrips: 'Ostia Antica (~40 min); Tivoli (Villa d’Este y Villa Adriana ~1h); Castelli Romani (pueblos y vino).',
    romantic_walk: 'Inicio: Via della Scala 17 → Santa Maria in Trastevere → Ponte Sisto (atardecer) → Campo de’ Fiori → Piazza Navona → helado en Fior di Luna → Biscottificio Innocenti → regreso a Via della Scala 17.',
    checkout_note: 'Antes de salir: apaga las luces, cierra las ventanas, deja las llaves en la mesa, cierra la puerta suavemente.'
  }
};

// ----------------------------------------------------
// TEMPLATE RISPOSTE per intent (localizzate)
const FAQ_TPL = {
  en: {
    wifi: `Wi-Fi: {wifi_note}\nNetwork: {wifi_ssid}. Password: {wifi_password}.`,
    checkin: `Check-in from ${base.checkin_time}. Intercom: {intercom_note}\nNeed help? Call ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    bathroom: `Bathroom: {bathroom_amenities}\nTowels: {towels_note}`,
    gas: `Gas use: {gas_steps}\nWasher: {washer_note}`,
    building: `Intercom: {intercom_note}\nElevator: {elevator_note}\nMain door: {main_door_hours}\nConcierge: {concierge}`,
    services: `Pharmacy: {pharmacy}\nHospital: {hospital}\nATMs: {atms}\nSIMs: {sims}\nLaundry: {laundry}\nLuggage: {luggage}`,
    transport: `{transport}\nAirports: {airports}\nTaxi: {taxi}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    experience: `{experiences}\nRomantic route: {romantic_walk}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  it: {
    wifi: `Wi-Fi: {wifi_note}\nRete: {wifi_ssid}. Password: {wifi_password}.`,
    checkin: `Check-in dalle ${base.checkin_time}. Citofono: {intercom_note}\nServe aiuto? Chiama ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    bathroom: `Bagno: {bathroom_amenities}\nAsciugamani: {towels_note}`,
    gas: `Uso gas: {gas_steps}\nLavatrice: {washer_note}`,
    building: `Citofono: {intercom_note}\nAscensore: {elevator_note}\nPortone: {main_door_hours}\nPortiere: {concierge}`,
    services: `Farmacia: {pharmacy}\nOspedale: {hospital}\nBancomat: {atms}\nSIM: {sims}\nLavanderia: {laundry}\nDeposito bagagli: {luggage}`,
    transport: `{transport}\nAeroporti: {airports}\nTaxi: {taxi}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    experience: `{experiences}\nPercorso romantico: {romantic_walk}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  fr: {
    wifi: `Wi-Fi : {wifi_note}\nRéseau : {wifi_ssid}. Mot de passe : {wifi_password}.`,
    checkin: `Check-in à partir de ${base.checkin_time}. Interphone : {intercom_note}\nBesoin d’aide ? Tél. ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    bathroom: `Salle de bain : {bathroom_amenities}\nServiettes : {towels_note}`,
    gas: `Gaz : {gas_steps}\nLave-linge : {washer_note}`,
    building: `Interphone : {intercom_note}\nAscenseur : {elevator_note}\nPorte d’entrée : {main_door_hours}\nConcierge : {concierge}`,
    services: `Pharmacie : {pharmacy}\nHôpital : {hospital}\nDAB : {atms}\nCartes SIM : {sims}\nLaverie : {laundry}\nConsigne : {luggage}`,
    transport: `{transport}\nAéroports : {airports}\nTaxi : {taxi}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    experience: `{experiences}\nParcours romantique : {romantic_walk}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  de: {
    wifi: `WLAN: {wifi_note}\nNetzwerk: {wifi_ssid}. Passwort: {wifi_password}.`,
    checkin: `Check-in ab ${base.checkin_time}. Gegensprechanlage: {intercom_note}\nBrauchen Sie Hilfe? ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    bathroom: `Bad: {bathroom_amenities}\nHandtücher: {towels_note}`,
    gas: `Gas: {gas_steps}\nWaschmaschine: {washer_note}`,
    building: `Gegensprechanlage: {intercom_note}\nAufzug: {elevator_note}\nHaupteingang: {main_door_hours}\nConcierge: {concierge}`,
    services: `Apotheke: {pharmacy}\nKrankenhaus: {hospital}\nGeldautomaten: {atms}\nSIMs: {sims}\nWaschsalon: {laundry}\nGepäck: {luggage}`,
    transport: `{transport}\nFlughäfen: {airports}\nTaxi: {taxi}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    experience: `{experiences}\nRomantische Route: {romantic_walk}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  },
  es: {
    wifi: `Wi-Fi: {wifi_note}\nRed: {wifi_ssid}. Contraseña: {wifi_password}.`,
    checkin: `Check-in desde las ${base.checkin_time}. Portero: {intercom_note}\n¿Necesitas ayuda? Llama al ${base.host_phone}.`,
    checkout: `{checkout_note}`,
    water: `{water_note}`,
    bathroom: `Baño: {bathroom_amenities}\nToallas: {towels_note}`,
    gas: `Gas: {gas_steps}\nLavadora: {washer_note}`,
    building: `Portero: {intercom_note}\nAscensor: {elevator_note}\nPuerta principal: {main_door_hours}\nConserje: {concierge}`,
    services: `Farmacia: {pharmacy}\nHospital: {hospital}\nCajeros: {atms}\nSIM: {sims}\nLavandería: {laundry}\nConsigna: {luggage}`,
    transport: `{transport}\nAeropuertos: {airports}\nTaxi: {taxi}`,
    eat: `{eat}`,
    drink: `{drink}`,
    shop: `{shop}`,
    visit: `{visit}`,
    experience: `{experiences}\nRuta romántica: {romantic_walk}`,
    daytrips: `{daytrips}`,
    emergency: `{emergency}`
  }
};

// ----------------------------------------------------
// Intent matching (keyword in EN)
const INTENTS = [
  { key:'wifi',      utter:['wifi','wi-fi','internet','password','router'] },
  { key:'checkin',   utter:['check in','arrival','access','intercom','doorbell','code'] },
  { key:'checkout',  utter:['check out','leave','departure'] },
  { key:'water',     utter:['water','hot water','drinkable','tap'] },
  { key:'bathroom',  utter:['bathroom','hairdryer','soap','towels','amenities'] },
  { key:'gas',       utter:['gas','kitchen','cook','flame','burner'] },
  { key:'building',  utter:['building','elevator','door','hours','concierge','intercom'] },
  { key:'services',  utter:['services','pharmacy','hospital','atm','sim','laundry','luggage','numbers'] },
  { key:'transport', utter:['transport','tram','bus','taxi','airport','train'] },
  { key:'eat',       utter:['eat','restaurant','dinner','lunch','food'] },
  { key:'drink',     utter:['drink','bar','wine','cocktail','aperitivo'] },
  { key:'shop',      utter:['shop','market','shopping','boutique'] },
  { key:'visit',     utter:['visit','what to visit','see','sight','attraction','museum'] },
  { key:'experience',utter:['experience','walk','tour','itinerary','sunset','romantic'] },
  { key:'daytrips',  utter:['day trips','day trip','tivoli','ostia','castelli','excursion'] },
  { key:'emergency', utter:['emergency','police','ambulance','fire','doctor','vet'] }
];

function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function detectIntent(msg){
  const t = norm(msg);
  let best=null, scoreBest=0;
  for(const it of INTENTS){
    let s=0; for(const u of it.utter){ if (t.includes(norm(u))) s++; }
    if(s>scoreBest){ best=it; scoreBest=s; }
  }
  return best?.key || null;
}
function fill(tpl, dict){ return tpl.replace(/\{(\w+)\}/g,(_,k)=>dict[k] ?? `{${k}}`); }

// -------- OpenAI opzionale (non necessario per la localizzazione) --------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
async function polishOptional(text, lang){
  if (!client) return text;
  const sys = `You are a helpful assistant. Keep the language as: ${lang}. Do not change facts, names, numbers or codes.`;
  try{
    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: [{ role:'system', content: sys }, { role:'user', content: text }]
    });
    return r.output_text || text;
  }catch{ return text; }
}

// ---------------- API ----------------
app.post('/api/message', async (req,res)=>{
  const { message='', lang='en' } = req.body || {};
  const L = (APT_I18N[lang] ? lang : 'en');
  const intent = detectIntent(message);

  let out = '';
  if (intent) {
    const tpl = FAQ_TPL[L][intent];
    out = fill(tpl, APT_I18N[L]);
  } else {
    const fallback = {
      en:'I did not find a direct answer. Try a button or use keywords (wifi, gas, transport, eat…).',
      it:'Non ho trovato una risposta diretta. Prova un pulsante o usa parole chiave (wifi, gas, trasporti, mangiare…).',
      fr:"Je n’ai pas trouvé de réponse directe. Essayez un bouton ou des mots-clés (wifi, gaz, transports, manger…).",
      de:'Keine direkte Antwort gefunden. Nutze einen Button oder Stichwörter (WLAN, Gas, Verkehr, Essen…).',
      es:'No encontré una respuesta directa. Prueba un botón o usa palabras clave (wifi, gas, transporte, comer…).'
    }[L];
    out = fallback;
  }
  const text = await polishOptional(out, L);
  res.json({ text, intent });
});

// -------------- UI (con switch lingue e TTS per lingua) --------------
app.get('/', (_req,res)=>{
  const BUTTON_KEYS = ['wifi','check in','check out','water','bathroom','gas','eat','drink','shop','visit','experience','day trips','transport','services','emergency'];
  const UI_I18N = {
    en:{ welcome:'Hi, I am Samantha, your virtual assistant. Tap a button to get a quick answer.',
         placeholder:'Type a message… e.g., wifi, gas, transport',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'water','bathroom':'bathroom','gas':'gas',
           eat:'eat','drink':'drink','shop':'shop','visit':'visit','experience':'experience','day trips':'day trips',
           transport:'transport','services':'services','emergency':'emergency' },
         voice_on:'🔊 Voice: On', voice_off:'🔇 Voice: Off', apt_label: base.apt_label.en },
    it:{ welcome:'Ciao, sono Samantha, la tua guida virtuale. Tocca un pulsante per una risposta rapida.',
         placeholder:'Scrivi un messaggio… es. wifi, gas, trasporti',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'acqua','bathroom':'bagno','gas':'gas',
           eat:'mangiare','drink':'bere','shop':'shopping','visit':'visitare','experience':'esperienze','day trips':'gite di un giorno',
           transport:'trasporti','services':'servizi','emergency':'emergenza' },
         voice_on:'🔊 Voce: On', voice_off:'🔇 Voce: Off', apt_label: base.apt_label.it },
    fr:{ welcome:'Bonjour, je suis Samantha, votre guide virtuel. Touchez un bouton pour une réponse rapide.',
         placeholder:'Écrivez un message… ex. wifi, gaz, transport',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'eau','bathroom':'salle de bain','gas':'gaz',
           eat:'manger','drink':'boire','shop':'shopping','visit':'visiter','experience':'expériences','day trips':'excursions',
           transport:'transports','services':'services','emergency':'urgence' },
         voice_on:'🔊 Voix : Activée', voice_off:'🔇 Voix : Désactivée', apt_label: base.apt_label.fr },
    de:{ welcome:'Hallo, ich bin Samantha, dein virtueller Guide. Tippe auf einen Button für eine schnelle Antwort.',
         placeholder:'Nachricht eingeben… z. B. WLAN, Gas, Verkehr',
         buttons:{ wifi:'WLAN','check in':'check in','check out':'check out','water':'Wasser','bathroom':'Bad','gas':'Gas',
           eat:'Essen','drink':'Trinken','shop':'Shopping','visit':'Sehenswürdigkeiten','experience':'Erlebnisse','day trips':'Tagesausflüge',
           transport:'Verkehr','services':'Services','emergency':'Notfall' },
         voice_on:'🔊 Stimme: An', voice_off:'🔇 Stimme: Aus', apt_label: base.apt_label.de },
    es:{ welcome:'Hola, soy Samantha, tu guía virtual. Toca un botón para una respuesta rápida.',
         placeholder:'Escribe un mensaje… p. ej., wifi, gas, transporte',
         buttons:{ wifi:'wifi','check in':'check in','check out':'check out','water':'agua','bathroom':'baño','gas':'gas',
           eat:'comer','drink':'beber','shop':'compras','visit':'visitar','experience':'experiencias','day trips':'excursiones',
           transport:'transporte','services':'servicios','emergency':'emergencia' },
         voice_on:'🔊 Voz: Activada', voice_off:'🔇 Voz: Desactivada', apt_label: base.apt_label.es }
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
      <div class="apt"><span id="aptLabel">${base.apt_label.en}</span>: ${base.apartment_id}</div>
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

// ---------- TEXT-TO-SPEECH (voce madrelingua per lingua) ----------
let voiceOn = false, pick = null;

// Preferenze per ciascuna lingua (in ordine di priorità)
const VOICE_PREFS = {
  en: ['Samantha','Google US English'],
  it: ['Alice','Eloisa','Google italiano'],
  fr: ['Amelie','Thomas','Google français'],
  de: ['Anna','Markus','Google Deutsch'],
  es: ['Monica','Jorge','Paulina','Google español']
};

// Cerca una voce per nome (lista) e/o per lang
function selectVoice(){
  if(!('speechSynthesis' in window)) return null;
  const all = speechSynthesis.getVoices() || [];
  const prefs = VOICE_PREFS[lang] || [];
  // 1) match per nome preferito
  for(const name of prefs){
    const v = all.find(v => (v.name||'').toLowerCase() === name.toLowerCase());
    if(v) return v;
  }
  // 2) prima voce che inizia con il codice lingua (es. "it", "fr")
  const byLang = all.find(v => (v.lang||'').toLowerCase().startsWith(lang));
  if(byLang) return byLang;
  // 3) fallback: prima voce disponibile
  return all[0] || null;
}

function refreshVoice(){
  pick = selectVoice();
}

if ('speechSynthesis' in window){
  refreshVoice();
  speechSynthesis.onvoiceschanged = refreshVoice;
}

// warm-up: micro-utterance (necessario su iOS/Safari)
function warm(){
  if(!('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const dot = new SpeechSynthesisUtterance('.');
    dot.rate = 1; dot.pitch = 1; dot.volume = 0.01; // quasi muto
    if(pick) dot.voice = pick;
    dot.lang = pick?.lang || lang;
    speechSynthesis.speak(dot);
  }catch{}
}

function speak(t){
  if(!voiceOn || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    if(pick) u.voice = pick;
    u.lang = pick?.lang || lang; // garantisce pronuncia nella lingua
    speechSynthesis.speak(u);
  }catch{}
}

document.getElementById('voiceBtn').addEventListener('click',e=>{
  voiceOn = !voiceOn;
  e.currentTarget.setAttribute('aria-pressed', String(voiceOn));
  applyUI();
  if(voiceOn){ warm(); }
});

// Language switcher: cambia UI e voce
document.querySelector('.lang').addEventListener('click',e=>{
  const btn = e.target.closest('[data-lang]'); if(!btn) return;
  lang = btn.getAttribute('data-lang');
  localStorage.setItem('lang', lang);
  const u = new URL(location); u.searchParams.set('lang', lang); history.replaceState(null,'',u);
  refreshVoice(); // ricalibra la voce sulla nuova lingua
  applyUI();
  chatEl.innerHTML=''; welcome();
  if(voiceOn) warm();
});

function applyUI(){
  const t = UI_I18N[lang] || UI_I18N.en;
  document.getElementById('aptLabel').textContent = t.apt_label;
  document.getElementById('voiceBtn').textContent = voiceOn ? t.voice_on : t.voice_off;
  input.placeholder = t.placeholder;
  document.querySelectorAll('.lang [data-lang]').forEach(b=>{
    b.setAttribute('aria-current', b.getAttribute('data-lang')===lang ? 'true':'false');
  });
}

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
  for(const key of BUTTON_KEYS){
    const label = t.buttons[key] || key;
    const b=document.createElement('button'); b.textContent=label;
    // invia keyword EN per il matching
    b.onclick=()=>{ input.value=key; send(); };
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
    const data=await r.json();
    const bot=data.text||'Sorry, something went wrong.';
    add('wd',bot);
    speak(bot); // legge ogni risposta
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
