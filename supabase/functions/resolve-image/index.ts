import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageType = 'city_hero' | 'attraction' | 'seasonal' | 'neighborhood' | 'category';
type ImageSource = 'wikimedia' | 'unsplash' | 'pexels' | 'local' | 'pollinations' | 'google_places';

interface ResolvedImage {
  id: string;
  cacheKey: string;
  imageType: ImageType;
  city: string;
  country: string;
  entityName?: string;
  url: string;
  smallUrl?: string;
  thumbUrl?: string;
  source: ImageSource;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  attributionRequired: boolean;
  width?: number;
  height?: number;
}

interface ResolveImageRequest {
  type: ImageType;
  city: string;
  country: string;
  entityName?: string;
  interestTags?: string[];
  month?: string;
}

// Generate a stable cache key
function generateCacheKey(req: ResolveImageRequest): string {
  const parts = [req.type, req.city.toLowerCase(), req.country.toLowerCase()];
  if (req.entityName) parts.push(req.entityName.toLowerCase());
  if (req.interestTags?.length) parts.push(req.interestTags.sort().join('-'));
  if (req.month) parts.push(req.month.toLowerCase());
  return parts.join(':').replace(/\s+/g, '_');
}

// TTL in days based on image type
function getTTLDays(type: ImageType): number {
  switch (type) {
    case 'city_hero': return 180;
    case 'attraction': return 180;
    case 'neighborhood': return 180;
    case 'seasonal': return 90;
    case 'category': return 120;
    default: return 90;
  }
}

// Build search query based on request
function buildSearchQuery(req: ResolveImageRequest): string {
  const parts: string[] = [];
  
  if (req.entityName) {
    parts.push(req.entityName);
    parts.push(req.city);
  } else if (req.type === 'city_hero') {
    parts.push(req.city);
    parts.push('iconic landmark skyline');
    parts.push(req.country);
  } else if (req.type === 'neighborhood') {
    parts.push(req.city);
    parts.push('neighborhood street');
  } else if (req.type === 'category' && req.interestTags?.length) {
    parts.push(req.city);
    parts.push(req.interestTags[0]);
  } else {
    parts.push(req.city);
    parts.push(req.country);
  }
  
  return parts.join(' ');
}

// Build a monument-focused fallback query for city heroes
function buildHeroFallbackQuery(city: string, country: string): string {
  return `${city} ${country} famous monument architecture`;
}

// Keywords that indicate chaotic/undesirable street-level imagery
const CHAOTIC_IMAGE_KEYWORDS = [
  'wire', 'wires', 'cable', 'cables', 'traffic', 'congestion',
  'crowd', 'crowded', 'rickshaw', 'tuk-tuk', 'auto-rickshaw',
  'street market chaos', 'slum', 'construction site', 'pollution',
];

// Check if an Unsplash/Pexels photo description or tags suggest chaotic imagery
function isChaoticImage(photo: any): boolean {
  const description = (
    (photo.description || '') +
    ' ' + (photo.alt_description || '') +
    ' ' + ((photo.tags || []).map((t: any) => t.title || t).join(' '))
  ).toLowerCase();
  
  return CHAOTIC_IMAGE_KEYWORDS.some(keyword => description.includes(keyword));
}

// Known landmark name variations for better Wikimedia searches
const LANDMARK_SYNONYMS: Record<string, string[]> = {
  // Western Europe
  'eiffel tower': ['Tour Eiffel', 'Eiffel Tower Paris'],
  'colosseum': ['Colosseo', 'Roman Colosseum', 'Flavian Amphitheatre'],
  'sagrada familia': ['Sagrada Família', 'Basílica de la Sagrada Família'],
  'big ben': ['Elizabeth Tower', 'Big Ben London'],
  'notre dame': ['Notre-Dame de Paris', 'Cathédrale Notre-Dame'],
  'louvre': ['Musée du Louvre', 'Louvre Museum Paris', 'Louvre Pyramid'],
  'tower of london': ['Tower of London', 'Her Majesty\'s Royal Palace'],
  'buckingham palace': ['Buckingham Palace London', 'Royal Palace London'],
  'leaning tower': ['Leaning Tower of Pisa', 'Torre pendente di Pisa'],
  'neuschwanstein': ['Neuschwanstein Castle', 'Schloss Neuschwanstein'],
  'brandenburg gate': ['Brandenburger Tor', 'Brandenburg Gate Berlin'],
  'alhambra': ['Alhambra Granada', 'Alhambra Palace'],
  'stonehenge': ['Stonehenge Wiltshire', 'Stonehenge monument'],
  'edinburgh castle': ['Edinburgh Castle Scotland'],
  'mont saint-michel': ['Mont Saint-Michel', 'Le Mont-Saint-Michel'],
  'versailles': ['Palace of Versailles', 'Château de Versailles'],
  'westminster abbey': ['Westminster Abbey London'],
  'arc de triomphe': ['Arc de Triomphe Paris', 'Triumphal Arch Paris'],
  
  // North America
  'statue of liberty': ['Liberty Enlightening the World', 'Statue of Liberty New York'],
  'golden gate': ['Golden Gate Bridge', 'Golden Gate San Francisco'],
  'times square': ['Times Square New York', 'Times Square Manhattan'],
  'grand canyon': ['Grand Canyon Arizona', 'Grand Canyon National Park'],
  'niagara falls': ['Niagara Falls', 'Niagara Falls Canada USA'],
  'empire state': ['Empire State Building', 'Empire State Building New York'],
  'central park': ['Central Park New York', 'Central Park Manhattan'],
  'yellowstone': ['Yellowstone National Park', 'Yellowstone geyser', 'Old Faithful'],
  'monument valley': ['Monument Valley', 'Monument Valley Navajo'],
  'antelope canyon': ['Antelope Canyon Arizona', 'Antelope Canyon slot canyon'],
  
  // South America
  'christ the redeemer': ['Cristo Redentor', 'Christ the Redeemer Rio', 'Cristo Redentor Rio de Janeiro'],
  'corcovado': ['Corcovado Rio de Janeiro', 'Corcovado Cristo Redentor', 'Corcovado mountain'],
  'sugarloaf': ['Sugarloaf Mountain', 'Pão de Açúcar Rio', 'Sugarloaf Rio de Janeiro'],
  'machu picchu': ['Machu Picchu Peru', 'Machupicchu', 'Machu Picchu Cusco'],
  'chichen itza': ['Chichén Itzá', 'El Castillo Chichen Itza', 'Kukulcán Pyramid'],
  'iguazu': ['Iguazu Falls', 'Iguazú Falls', 'Cataratas del Iguazú', 'Iguaçu Falls'],
  'galapagos': ['Galápagos Islands', 'Islas Galápagos', 'Galápagos Ecuador'],
  'galapagos islands': ['Galápagos Islands Ecuador', 'Islas Galápagos', 'Galápagos tortoise'],
  'torres del paine': ['Torres del Paine', 'Torres del Paine National Park', 'Parque Nacional Torres del Paine'],
  'patagonia': ['Patagonia Argentina Chile', 'Patagonia glaciers', 'Patagonia landscape'],
  'perito moreno': ['Perito Moreno Glacier', 'Glaciar Perito Moreno'],
  'salar de uyuni': ['Salar de Uyuni', 'Uyuni Salt Flat Bolivia', 'Salar de Uyuni Bolivia'],
  'titicaca': ['Lake Titicaca', 'Lago Titicaca', 'Titicaca Peru Bolivia'],
  'nazca lines': ['Nazca Lines', 'Líneas de Nazca', 'Nazca Peru geoglyphs'],
  'easter island': ['Easter Island', 'Rapa Nui', 'Isla de Pascua', 'Moai statues'],
  'moai': ['Moai Easter Island', 'Moai Rapa Nui', 'Easter Island statues'],
  'copacabana': ['Copacabana Beach Rio', 'Copacabana Rio de Janeiro'],
  'ipanema': ['Ipanema Beach', 'Ipanema Rio de Janeiro'],
  'el calafate': ['El Calafate Argentina', 'Perito Moreno El Calafate'],
  'atacama': ['Atacama Desert', 'Desierto de Atacama', 'Valle de la Luna Atacama'],
  'cartagena': ['Cartagena Colombia', 'Cartagena walled city', 'Ciudad amurallada Cartagena'],
  'amazon river': ['Amazon River', 'Rio Amazonas', 'Amazon Rainforest'],
  'angel falls': ['Angel Falls Venezuela', 'Salto Ángel', 'Kerepakupai Merú'],
  
  // Central America & Mexico
  'panama canal': ['Panama Canal', 'Canal de Panamá', 'Panama Canal locks'],
  'miraflores locks': ['Miraflores Locks Panama', 'Panama Canal Miraflores'],
  'tikal': ['Tikal Guatemala', 'Tikal Maya ruins', 'Tikal pyramid'],
  'tulum': ['Tulum Mexico', 'Tulum ruins', 'Tulum beach ruins'],
  'palenque': ['Palenque Mexico', 'Palenque Maya ruins', 'Palenque Chiapas'],
  'uxmal': ['Uxmal Mexico', 'Uxmal Maya ruins', 'Pyramid of the Magician'],
  'teotihuacan': ['Teotihuacan', 'Teotihuacán pyramids', 'Pyramid of the Sun'],
  'monte alban': ['Monte Albán', 'Monte Alban Oaxaca', 'Zapotec ruins'],
  'cenote': ['Cenote Mexico', 'Cenote Yucatan', 'Mexican cenote swimming'],
  'xcaret': ['Xcaret Mexico', 'Xcaret Park Riviera Maya'],
  'cozumel': ['Cozumel Mexico', 'Cozumel island', 'Cozumel reef'],
  'arenal volcano': ['Arenal Volcano', 'Volcán Arenal Costa Rica'],
  'monteverde': ['Monteverde Cloud Forest', 'Monteverde Costa Rica'],
  'manuel antonio': ['Manuel Antonio National Park', 'Manuel Antonio Costa Rica'],
  'antigua guatemala': ['Antigua Guatemala', 'Antigua Guatemala colonial'],
  'lake atitlan': ['Lake Atitlán', 'Lago de Atitlán Guatemala'],
  'semuc champey': ['Semuc Champey', 'Semuc Champey Guatemala'],
  'roatan': ['Roatan Honduras', 'Roatan island', 'Roatan beach'],
  'blue hole': ['Great Blue Hole Belize', 'Blue Hole Belize'],
  'belize barrier reef': ['Belize Barrier Reef', 'Belize reef snorkeling'],
  
  // Caribbean
  'havana': ['Havana Cuba', 'La Habana', 'Old Havana'],
  'varadero': ['Varadero Beach Cuba', 'Varadero Cuba'],
  'viñales': ['Viñales Valley Cuba', 'Valle de Viñales'],
  'el morro': ['El Morro', 'Castillo del Morro', 'El Morro Havana'],
  'pitons': ['The Pitons Saint Lucia', 'Gros Piton Petit Piton'],
  'dunn river falls': ['Dunn\'s River Falls Jamaica', 'Dunns River Falls'],
  'seven mile beach': ['Seven Mile Beach', 'Seven Mile Beach Jamaica', 'Seven Mile Beach Grand Cayman'],
  'grace bay': ['Grace Bay Beach', 'Grace Bay Turks Caicos'],
  'el yunque': ['El Yunque Rainforest', 'El Yunque Puerto Rico'],
  'old san juan': ['Old San Juan', 'Viejo San Juan Puerto Rico'],
  'punta cana': ['Punta Cana', 'Punta Cana Dominican Republic', 'Punta Cana beach'],
  'santo domingo': ['Santo Domingo', 'Zona Colonial Santo Domingo'],
  'aruba': ['Aruba beach', 'Aruba Caribbean', 'Eagle Beach Aruba'],
  'curacao': ['Curaçao', 'Willemstad Curacao', 'Curacao colorful buildings'],
  'barbados': ['Barbados beach', 'Barbados Caribbean'],
  'stingray city': ['Stingray City Grand Cayman', 'Stingray City Cayman'],
  'trunk bay': ['Trunk Bay', 'Trunk Bay St John Virgin Islands'],
  'pink sand beach': ['Pink Sand Beach Bahamas', 'Harbour Island pink beach'],
  'bahamas': ['Bahamas beach', 'Nassau Bahamas', 'Exuma Bahamas'],
  'virgin islands': ['Virgin Islands beach', 'US Virgin Islands', 'British Virgin Islands'],

  // Middle East
  'pyramids': ['Pyramids of Giza', 'Great Pyramid of Giza', 'أهرامات الجيزة'],
  'giza': ['Pyramids of Giza', 'Great Sphinx of Giza', 'Giza Necropolis'],
  'sphinx': ['Great Sphinx of Giza', 'Sphinx Egypt'],
  'petra': ['Petra Jordan', 'Al-Khazneh', 'Treasury Petra'],
  'burj khalifa': ['Burj Khalifa Dubai', 'Khalifa Tower', 'برج خليفة'],
  'burj al arab': ['Burj Al Arab Dubai', 'Burj Al Arab Hotel'],
  'hagia sophia': ['Ayasofya', 'Hagia Sophia Istanbul'],
  'blue mosque': ['Sultan Ahmed Mosque', 'Blue Mosque Istanbul'],
  'dead sea': ['Dead Sea', 'Dead Sea Israel Jordan'],
  'wadi rum': ['Wadi Rum Jordan', 'Valley of the Moon Jordan'],
  'jerusalem': ['Jerusalem Old City', 'Temple Mount Jerusalem', 'Western Wall Jerusalem'],
  'dome of the rock': ['Dome of the Rock', 'Qubbat al-Sakhrah'],
  
  // Africa
  'table mountain': ['Table Mountain Cape Town', 'Table Mountain South Africa'],
  'victoria falls': ['Victoria Falls', 'Mosi-oa-Tunya', 'Victoria Falls Zimbabwe Zambia'],
  'serengeti': ['Serengeti National Park', 'Serengeti Tanzania', 'Serengeti wildlife'],
  'masai mara': ['Masai Mara', 'Maasai Mara Kenya', 'Masai Mara safari'],
  'ngorongoro': ['Ngorongoro Crater', 'Ngorongoro Conservation Area Tanzania'],
  'kilimanjaro': ['Mount Kilimanjaro', 'Kilimanjaro Tanzania', 'Uhuru Peak'],
  'kruger': ['Kruger National Park', 'Kruger Park South Africa', 'Kruger safari'],
  'cape of good hope': ['Cape of Good Hope', 'Cape Point South Africa'],
  'robben island': ['Robben Island', 'Robben Island Cape Town'],
  'okavango': ['Okavango Delta', 'Okavango Botswana', 'Okavango Delta safari'],
  'chobe': ['Chobe National Park', 'Chobe Botswana', 'Chobe elephants'],
  'etosha': ['Etosha National Park', 'Etosha Namibia', 'Etosha salt pan'],
  'namib desert': ['Namib Desert', 'Sossusvlei Namibia', 'Namib dunes'],
  'sossusvlei': ['Sossusvlei', 'Sossusvlei Namibia dunes', 'Dead Vlei'],
  'fish river canyon': ['Fish River Canyon Namibia', 'Fish River Canyon'],
  'marrakech': ['Marrakech Morocco', 'Marrakech medina', 'Jemaa el-Fnaa'],
  'sahara': ['Sahara Desert', 'Sahara dunes', 'Erg Chebbi Morocco'],
  'luxor': ['Luxor Egypt', 'Valley of the Kings', 'Karnak Temple'],
  'karnak': ['Karnak Temple', 'Karnak Luxor', 'Temple of Karnak'],
  'abu simbel': ['Abu Simbel', 'Abu Simbel temples Egypt'],
  'zanzibar': ['Zanzibar Tanzania', 'Stone Town Zanzibar', 'Zanzibar beach'],
  'gorilla': ['Mountain gorillas', 'Rwanda gorilla trekking', 'Bwindi gorillas'],
  'bwindi': ['Bwindi Impenetrable Forest', 'Bwindi gorillas Uganda'],
  'amboseli': ['Amboseli National Park', 'Amboseli Kenya Kilimanjaro'],
  'hwange': ['Hwange National Park', 'Hwange Zimbabwe'],
  'south luangwa': ['South Luangwa National Park', 'South Luangwa Zambia'],
  
  // Asia - East Asia
  'taj mahal': ['Taj Mahal Agra', 'ताज महल'],
  'great wall': ['Great Wall of China', 'Chinese Wall', '万里长城', 'Great Wall Badaling'],
  'forbidden city': ['Forbidden City Beijing', 'Imperial Palace Beijing', '故宫'],
  'terracotta army': ['Terracotta Army', 'Terracotta Warriors Xi\'an', '兵马俑'],
  'mount fuji': ['Mount Fuji Japan', 'Fujisan', '富士山'],
  'tokyo tower': ['Tokyo Tower', '東京タワー'],
  'sensoji': ['Sensō-ji Temple', 'Asakusa Temple Tokyo', '浅草寺'],
  'fushimi inari': ['Fushimi Inari Shrine', 'Fushimi Inari Taisha', '伏見稲荷大社'],
  'golden temple': ['Golden Temple Amritsar', 'Harmandir Sahib', 'ਹਰਿਮੰਦਰ ਸਾਹਿਬ'],
  'marina bay sands': ['Marina Bay Sands Singapore'],
  'gardens by the bay': ['Gardens by the Bay Singapore', 'Supertree Grove'],
  'gyeongbokgung': ['Gyeongbokgung Palace', 'Gyeongbokgung Seoul', '경복궁'],
  'bukchon': ['Bukchon Hanok Village', 'Bukchon Seoul traditional'],
  'n seoul tower': ['N Seoul Tower', 'Namsan Tower Seoul', '남산타워'],
  'miyajima': ['Miyajima torii gate', 'Itsukushima Shrine', 'Floating torii'],
  'kinkakuji': ['Kinkaku-ji', 'Golden Pavilion Kyoto', '金閣寺'],
  'arashiyama': ['Arashiyama Bamboo Grove', 'Arashiyama Kyoto'],
  'nara deer': ['Nara deer park', 'Nara Japan deer'],
  'shibuya crossing': ['Shibuya Crossing Tokyo', 'Shibuya scramble'],
  'hong kong skyline': ['Hong Kong skyline', 'Victoria Harbour Hong Kong'],
  'victoria peak': ['Victoria Peak Hong Kong', 'The Peak Hong Kong'],
  'big buddha hong kong': ['Tian Tan Buddha', 'Big Buddha Lantau'],
  'li river': ['Li River Guilin', 'Lijiang River China', '漓江'],
  'zhangjiajie': ['Zhangjiajie National Forest', 'Avatar Mountains China', '张家界'],
  'jiuzhaigou': ['Jiuzhaigou Valley', 'Jiuzhaigou National Park', '九寨沟'],
  'potala palace': ['Potala Palace Lhasa', 'Potala Palace Tibet'],
  
  // Asia - Southeast Asia
  'angkor wat': ['Angkor Wat Cambodia', 'អង្គរវត្ត', 'Angkor Wat sunrise'],
  'angkor thom': ['Angkor Thom', 'Bayon Temple faces', 'Angkor Thom Cambodia'],
  'bayon': ['Bayon Temple', 'Bayon faces Angkor', 'Prasat Bayon'],
  'ta prohm': ['Ta Prohm temple', 'Ta Prohm Angkor', 'Tomb Raider temple'],
  'bagan': ['Bagan Myanmar', 'Bagan temples', 'Bagan pagodas sunrise'],
  'bagan temples': ['Bagan temples Myanmar', 'Old Bagan pagodas', 'Bagan balloon'],
  'shwedagon': ['Shwedagon Pagoda', 'Shwedagon Yangon', 'Golden Pagoda Myanmar'],
  'inle lake': ['Inle Lake Myanmar', 'Inle Lake fishermen'],
  'ha long bay': ['Ha Long Bay Vietnam', 'Vịnh Hạ Long', 'Halong Bay limestone'],
  'halong bay': ['Ha Long Bay Vietnam', 'Halong Bay cruise', 'Vịnh Hạ Long'],
  'hoi an': ['Hoi An Vietnam', 'Hoi An lanterns', 'Hoi An Ancient Town'],
  'sapa': ['Sapa Vietnam', 'Sapa rice terraces', 'Sapa mountains'],
  'phong nha': ['Phong Nha caves', 'Phong Nha-Kẻ Bàng', 'Son Doong cave'],
  'luang prabang': ['Luang Prabang Laos', 'Luang Prabang temples', 'Luang Prabang monks'],
  'kuang si': ['Kuang Si Falls', 'Kuang Si waterfall Laos'],
  'borobudur': ['Borobudur Temple', 'Candi Borobudur', 'Borobudur sunrise'],
  'prambanan': ['Prambanan Temple', 'Candi Prambanan', 'Prambanan Java'],
  'bali temple': ['Tanah Lot', 'Uluwatu Temple Bali', 'Pura Besakih'],
  'tanah lot': ['Tanah Lot Bali', 'Tanah Lot sunset', 'Tanah Lot temple'],
  'uluwatu': ['Uluwatu Temple', 'Pura Luhur Uluwatu', 'Uluwatu cliff'],
  'tegallalang': ['Tegallalang Rice Terraces', 'Tegallalang Bali', 'Ubud rice terraces'],
  'ubud': ['Ubud Bali', 'Ubud monkey forest', 'Ubud rice fields'],
  'komodo': ['Komodo Island', 'Komodo dragons', 'Komodo National Park'],
  'raja ampat': ['Raja Ampat Indonesia', 'Raja Ampat islands', 'Raja Ampat diving'],
  'phi phi': ['Phi Phi Islands', 'Koh Phi Phi Thailand', 'Maya Bay'],
  'maya bay': ['Maya Bay Thailand', 'Maya Bay Phi Phi', 'The Beach Thailand'],
  'james bond island': ['James Bond Island', 'Khao Phing Kan', 'Phang Nga Bay'],
  'wat arun': ['Wat Arun', 'Temple of Dawn Bangkok', 'Wat Arun Ratchawararam'],
  'grand palace bangkok': ['Grand Palace Bangkok', 'Wat Phra Kaew', 'Emerald Buddha Temple'],
  'ayutthaya': ['Ayutthaya ruins', 'Ayutthaya Thailand', 'Ayutthaya temples'],
  'sukhothai': ['Sukhothai Historical Park', 'Sukhothai ruins Thailand'],
  'chiang mai temples': ['Chiang Mai temples', 'Doi Suthep', 'Wat Phra That Doi Suthep'],
  'railay beach': ['Railay Beach Thailand', 'Railay Krabi', 'Railay rock climbing'],
  'el nido': ['El Nido Palawan', 'El Nido Philippines', 'El Nido lagoons'],
  'palawan': ['Palawan Philippines', 'Puerto Princesa', 'Palawan beaches'],
  'chocolate hills': ['Chocolate Hills Bohol', 'Chocolate Hills Philippines'],
  'rice terraces': ['Banaue Rice Terraces', 'Ifugao Rice Terraces Philippines'],
  'petronas towers': ['Petronas Twin Towers', 'Petronas Towers Kuala Lumpur', 'KLCC'],
  'batu caves': ['Batu Caves', 'Batu Caves Kuala Lumpur', 'Lord Murugan statue'],
  'langkawi': ['Langkawi Malaysia', 'Langkawi sky bridge', 'Langkawi beach'],
  'merlion': ['Merlion Singapore', 'Merlion Park'],
  'sentosa': ['Sentosa Singapore', 'Sentosa island'],
  
  // Asia - South Asia
  'varanasi': ['Varanasi Ghats', 'Varanasi Ganges', 'Banaras India'],
  'jaipur': ['Jaipur India', 'Pink City Jaipur', 'Hawa Mahal'],
  'hawa mahal': ['Hawa Mahal', 'Palace of Winds Jaipur', 'Hawa Mahal Jaipur'],
  'amber fort': ['Amber Fort Jaipur', 'Amer Fort', 'Amber Palace'],
  'kerala backwaters': ['Kerala Backwaters', 'Alleppey houseboat', 'Kerala houseboat'],
  'hampi': ['Hampi ruins', 'Hampi Karnataka', 'Vijayanagara ruins'],
  'udaipur': ['Udaipur India', 'City of Lakes', 'Lake Palace Udaipur'],
  'jaisalmer': ['Jaisalmer Fort', 'Golden City India', 'Jaisalmer desert'],
  'darjeeling': ['Darjeeling tea gardens', 'Darjeeling India', 'Tiger Hill Darjeeling'],
  'sigiriya': ['Sigiriya Sri Lanka', 'Sigiriya Rock Fortress', 'Lion Rock'],
  'kandy': ['Temple of the Tooth Kandy', 'Kandy Sri Lanka'],
  'galle fort': ['Galle Fort Sri Lanka', 'Galle Dutch Fort'],
  'kathmandu': ['Kathmandu Nepal', 'Kathmandu Durbar Square', 'Boudhanath Stupa'],
  'everest': ['Mount Everest', 'Everest Base Camp', 'Sagarmatha'],
  'annapurna': ['Annapurna Nepal', 'Annapurna Circuit', 'Annapurna Base Camp'],
  
  // Oceania
  'sydney opera house': ['Sydney Opera House Australia'],
  'uluru': ['Uluru', 'Ayers Rock Australia'],
  'great barrier reef': ['Great Barrier Reef Australia'],
  
  // Eastern Europe & Russia
  'acropolis': ['Acropolis of Athens', 'Parthenon Athens'],
  'santorini': ['Santorini Greece', 'Oia Santorini', 'Santorini caldera'],
  'charles bridge': ['Charles Bridge Prague', 'Karlův most'],
  'st basil': ['Saint Basil\'s Cathedral', 'St Basil\'s Cathedral Moscow', 'Покровский собор'],
  'kremlin': ['Moscow Kremlin', 'Kremlin Russia', 'Московский Кремль'],
  'prague castle': ['Prague Castle', 'Pražský hrad'],
  
  // Natural wonders
  'northern lights': ['Aurora Borealis', 'Northern Lights'],
  'aurora': ['Aurora Borealis', 'Northern Lights Iceland', 'Aurora Norway'],
  'amazon': ['Amazon Rainforest', 'Amazon River', 'Amazonia'],
};


// Festival-specific search terms for better results
const FESTIVAL_KEYWORDS: Record<string, string[]> = {
  // Major carnivals & parades
  'carnival': ['carnival parade', 'carnival celebration', 'carnival costume'],
  'rio carnival': ['Carnaval do Rio', 'Rio de Janeiro Carnival samba', 'Rio Carnival parade'],
  'venice carnival': ['Carnival of Venice', 'Carnevale di Venezia', 'Venice masks'],
  'mardi gras': ['Mardi Gras New Orleans', 'Fat Tuesday parade', 'Mardi Gras beads'],
  'notting hill': ['Notting Hill Carnival', 'Notting Hill Carnival London'],
  
  // Asian festivals
  'chinese new year': ['Chinese New Year celebration', 'Spring Festival China', 'Lunar New Year parade'],
  'diwali': ['Diwali festival', 'Diwali lights', 'Deepavali celebration', 'Festival of Lights India'],
  'holi': ['Holi festival colors', 'Holi celebration India', 'Festival of Colors'],
  'cherry blossom': ['Hanami', 'Sakura festival', 'Cherry blossom Japan'],
  'lantern festival': ['Yuan Xiao', 'Lantern Festival China', 'Sky lantern festival'],
  'songkran': ['Songkran Thailand', 'Thai New Year water festival'],
  'loy krathong': ['Loy Krathong Thailand', 'Yi Peng lantern festival'],
  'obon': ['Obon festival Japan', 'Bon Festival', 'お盆'],
  
  // European festivals
  'oktoberfest': ['Oktoberfest Munich', 'Oktoberfest beer festival', 'Wiesn Munich'],
  'la tomatina': ['La Tomatina Buñol', 'Tomato Festival Spain', 'Tomatina Valencia'],
  'running of the bulls': ['San Fermín', 'Encierro Pamplona', 'Running of the Bulls Pamplona'],
  'san fermin': ['San Fermín Pamplona', 'Encierro', 'Running of the Bulls Spain'],
  'st patrick': ['St Patrick\'s Day', 'Saint Patrick\'s Day parade', 'St Patrick Dublin'],
  'edinburgh festival': ['Edinburgh Festival Fringe', 'Edinburgh International Festival'],
  'bastille day': ['Bastille Day Paris', '14 July France', 'Fête nationale française'],
  'christmas market': ['Christkindlmarkt', 'Christmas market Germany', 'Weihnachtsmarkt'],
  
  // Latin American festivals
  'day of the dead': ['Día de los Muertos', 'Day of the Dead Mexico', 'Día de Muertos'],
  'inti raymi': ['Inti Raymi', 'Festival of the Sun Peru', 'Inti Raymi Cusco'],
  
  // Middle Eastern festivals
  'eid': ['Eid al-Fitr', 'Eid al-Adha', 'Eid celebration'],
  'ramadan': ['Ramadan', 'Ramadan iftar', 'Ramadan celebration'],
  
  // Music & arts festivals
  'burning man': ['Burning Man', 'Burning Man Nevada', 'Black Rock City'],
  'coachella': ['Coachella Festival', 'Coachella Valley Music'],
  'glastonbury': ['Glastonbury Festival', 'Glastonbury UK'],
  'tomorrowland': ['Tomorrowland festival', 'Tomorrowland Belgium'],
  
  // Light festivals
  'vivid sydney': ['Vivid Sydney', 'Vivid Sydney lights'],
  'festival of lights': ['Festival of Lights', 'Berlin Festival of Lights', 'Lyon Fête des Lumières'],
};

// Detect if entity is likely a festival
function isFestivalEntity(entityName: string): boolean {
  const festivalKeywords = ['festival', 'carnival', 'celebration', 'parade', 'feast', 'fiesta', 
    'diwali', 'holi', 'oktoberfest', 'eid', 'christmas market', 'new year', 'mardi gras',
    'running of the bulls', 'san fermin', 'tomatina', 'burning man', 'coachella', 'vivid'];
  const lowerName = entityName.toLowerCase();
  return festivalKeywords.some(keyword => lowerName.includes(keyword)) ||
    Object.keys(FESTIVAL_KEYWORDS).some(festival => lowerName.includes(festival));
}

// Detect if entity is likely a landmark
function isLandmarkEntity(entityName: string): boolean {
  const landmarkKeywords = ['tower', 'temple', 'palace', 'castle', 'cathedral', 'church', 'mosque',
    'monument', 'statue', 'bridge', 'museum', 'gate', 'wall', 'ruins', 'fort', 'basilica', 'abbey',
    'pyramid', 'sphinx', 'falls', 'canyon', 'reef', 'mountain', 'bay'];
  const lowerName = entityName.toLowerCase();
  return landmarkKeywords.some(keyword => lowerName.includes(keyword)) ||
    Object.keys(LANDMARK_SYNONYMS).some(landmark => lowerName.includes(landmark));
}

// Generate enhanced search queries for Wikimedia
function generateWikimediaSearchQueries(entityName: string, city: string): string[] {
  const queries: string[] = [];
  const lowerName = entityName.toLowerCase();
  
  // Check for known landmark synonyms
  for (const [landmark, synonyms] of Object.entries(LANDMARK_SYNONYMS)) {
    if (lowerName.includes(landmark)) {
      queries.push(...synonyms);
    }
  }
  
  // Check for festival-specific terms
  for (const [festival, terms] of Object.entries(FESTIVAL_KEYWORDS)) {
    if (lowerName.includes(festival)) {
      queries.push(...terms);
    }
  }
  
  // Add the exact entity name
  queries.push(entityName);
  
  // Add entity + city combination
  queries.push(`${entityName} ${city}`);
  
  // For landmarks, add "exterior" or "view" suffixes
  if (isLandmarkEntity(entityName)) {
    queries.push(`${entityName} exterior`);
    queries.push(`${entityName} panorama`);
  }
  
  // For festivals, add "celebration" suffix
  if (isFestivalEntity(entityName)) {
    queries.push(`${entityName} celebration`);
    queries.push(`${entityName} crowd`);
  }
  
  // Deduplicate
  return [...new Set(queries)];
}

// Try to get image from Wikipedia article's main image
async function tryWikipediaImage(entityName: string, city: string): Promise<ResolvedImage | null> {
  try {
    // Search Wikipedia for the article
    const searchTerms = [`${entityName}`, `${entityName} ${city}`];
    
    for (const searchTerm of searchTerms) {
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=3&format=json&origin=*`;
      const searchResponse = await fetch(wikiSearchUrl);
      if (!searchResponse.ok) continue;
      
      const searchData = await searchResponse.json();
      const results = searchData.query?.search || [];
      
      for (const result of results) {
        const title = result.title;
        
        // Get the page's main image
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json&origin=*`;
        const pageResponse = await fetch(pageUrl);
        if (!pageResponse.ok) continue;
        
        const pageData = await pageResponse.json();
        const pages = pageData.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        
        if (!page?.original?.source) continue;
        
        const imageUrl = page.original.source;
        const width = page.original.width || 0;
        const height = page.original.height || 0;
        
        // Quality filters - prefer landscape, decent size
        if (width < 1200 || width < height * 1.1) continue;
        
        // Get image info from Commons for attribution
        const filename = imageUrl.split('/').pop();
        const commonsInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
        
        let photographer = 'Wikipedia';
        let attributionRequired = true;
        
        try {
          const commonsResponse = await fetch(commonsInfoUrl);
          if (commonsResponse.ok) {
            const commonsData = await commonsResponse.json();
            const commonsPages = commonsData.query?.pages || {};
            const commonsPage = Object.values(commonsPages)[0] as any;
            const extmetadata = commonsPage?.imageinfo?.[0]?.extmetadata || {};
            
            photographer = extmetadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikipedia';
            const license = extmetadata.LicenseShortName?.value || '';
            attributionRequired = !license.includes('Public domain') && !license.includes('CC0');
          }
        } catch {
          // Use defaults
        }
        
        console.log(`Found Wikipedia image for "${entityName}": ${width}x${height}`);
        
        return {
          id: `wp-${page.pageid}`,
          cacheKey: '',
          imageType: 'attraction',
          city: '',
          country: '',
          url: imageUrl,
          smallUrl: imageUrl.replace(/\/\d+px-/, '/800px-'),
          thumbUrl: imageUrl.replace(/\/\d+px-/, '/300px-'),
          source: 'wikimedia',
          photographer: photographer.substring(0, 100),
          photographerUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          attributionRequired,
          width,
          height,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Wikipedia image search error:', error);
    return null;
  }
}

// Score a Wikimedia image based on quality indicators
function scoreWikimediaImage(result: any, imageInfo: any, entityName: string): number {
  let score = 0;
  const title = result.title.toLowerCase();
  const lowerEntity = entityName.toLowerCase();
  
  // Size scoring
  const width = imageInfo.width || 0;
  if (width >= 2000) score += 30;
  else if (width >= 1600) score += 20;
  else if (width >= 1200) score += 10;
  
  // Aspect ratio - prefer landscape
  const aspectRatio = width / (imageInfo.height || 1);
  if (aspectRatio >= 1.5 && aspectRatio <= 2.0) score += 20; // Ideal landscape
  else if (aspectRatio >= 1.2 && aspectRatio < 1.5) score += 10;
  
  // Title relevance
  if (title.includes(lowerEntity.split(' ')[0])) score += 15;
  
  // Prefer "panorama", "view", "exterior" in title
  if (title.includes('panorama') || title.includes('view') || title.includes('exterior')) score += 10;
  
  // Penalize "interior", "detail", "map", "diagram", "plan"
  if (title.includes('interior') || title.includes('detail')) score -= 10;
  if (title.includes('map') || title.includes('diagram') || title.includes('plan')) score -= 30;
  if (title.includes('logo') || title.includes('icon') || title.includes('flag')) score -= 30;
  // Penalize chaotic street-level imagery
  if (title.includes('traffic') || title.includes('congestion') || title.includes('wires') || title.includes('cables')) score -= 25;
  if (title.includes('crowd') || title.includes('crowded') || title.includes('rickshaw')) score -= 15;
  
  // Penalize night shots slightly (often harder to see)
  if (title.includes('night')) score -= 5;
  
  // Prefer Featured or Quality images (indicated by categories sometimes in title)
  if (title.includes('featured') || title.includes('quality')) score += 15;
  
  return score;
}

// Try Wikimedia Commons for named entities with enhanced search
async function tryWikimedia(query: string, entityName?: string, city?: string): Promise<ResolvedImage | null> {
  if (!entityName) return null;
  
  try {
    // First, try Wikipedia's main image for famous landmarks/festivals
    if (isLandmarkEntity(entityName) || isFestivalEntity(entityName)) {
      console.log(`Trying Wikipedia main image for: ${entityName}`);
      const wikiImage = await tryWikipediaImage(entityName, city || '');
      if (wikiImage) return wikiImage;
    }
    
    // Generate multiple search queries
    const searchQueries = generateWikimediaSearchQueries(entityName, city || '');
    console.log(`Wikimedia search queries: ${searchQueries.slice(0, 3).join(', ')}...`);
    
    interface ScoredImage {
      result: any;
      imageInfo: any;
      score: number;
    }
    
    const candidates: ScoredImage[] = [];
    
    // Try multiple queries
    for (const searchQuery of searchQueries.slice(0, 5)) {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=8&format=json&origin=*`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) continue;
      
      const searchData = await searchResponse.json();
      const results = searchData.query?.search || [];
      
      for (const result of results) {
        const title = result.title;
        
        // Get image info
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
        const infoResponse = await fetch(infoUrl);
        if (!infoResponse.ok) continue;
        
        const infoData = await infoResponse.json();
        const pages = infoData.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        const imageInfo = page?.imageinfo?.[0];
        
        if (!imageInfo) continue;
        
        // Basic quality filters
        const width = imageInfo.width || 0;
        const height = imageInfo.height || 0;
        
        // Skip if too small
        if (width < 1000) continue;
        
        // Check if it's a photo (not illustration/diagram)
        const mime = imageInfo.mime || '';
        if (!mime.includes('jpeg') && !mime.includes('jpg') && !mime.includes('png')) continue;
        
        const extmetadata = imageInfo.extmetadata || {};
        const license = extmetadata.LicenseShortName?.value || '';
        
        // Prefer Creative Commons or public domain
        const isPermissive = license.includes('CC') || license.includes('Public domain') || license.includes('PD');
        if (!isPermissive) continue;
        
        // Score this image
        const score = scoreWikimediaImage(result, imageInfo, entityName);
        candidates.push({ result, imageInfo, score });
      }
    }
    
    // Sort by score and return best
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0) return null;
    
    const best = candidates[0];
    const imageInfo = best.imageInfo;
    const title = best.result.title;
    
    const extmetadata = imageInfo.extmetadata || {};
    const artist = extmetadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Commons';
    const license = extmetadata.LicenseShortName?.value || '';
    
    console.log(`Best Wikimedia image: "${title}" (score: ${best.score}, size: ${imageInfo.width}x${imageInfo.height})`);
    
    // Generate thumbnail URLs
    const filename = title.replace('File:', '');
    const thumbBase = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    
    return {
      id: `wm-${Object.keys(best.result)[0] || Date.now()}`,
      cacheKey: '',
      imageType: 'attraction',
      city: '',
      country: '',
      url: imageInfo.url,
      smallUrl: `${thumbBase}?width=800`,
      thumbUrl: `${thumbBase}?width=300`,
      source: 'wikimedia',
      photographer: artist.substring(0, 100),
      photographerUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      sourceUrl: imageInfo.descriptionurl,
      attributionRequired: !license.includes('Public domain') && !license.includes('CC0'),
      width: imageInfo.width,
      height: imageInfo.height,
    };
  } catch (error) {
    console.error('Wikimedia search error:', error);
    return null;
  }
}

// Try Unsplash API
async function tryUnsplash(query: string, rejectChaotic = false): Promise<ResolvedImage | null> {
  const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("Unsplash API key not configured");
    return null;
  }
  
  try {
    const params = new URLSearchParams({
      query,
      per_page: '10',
      orientation: 'landscape',
    });
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const photos = data.results || [];
    
    for (const photo of photos) {
      const width = photo.width || 0;
      const height = photo.height || 0;
      
      // Quality filter: prefer landscape, decent size
      if (width < 1600 || width < height * 1.2) continue;
      
      // Reject chaotic street-level imagery for hero shots
      if (rejectChaotic && isChaoticImage(photo)) {
        console.log(`Rejected chaotic Unsplash image: ${photo.alt_description || photo.id}`);
        continue;
      }
      
      return {
        id: `us-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.urls.regular,
        smallUrl: photo.urls.small,
        thumbUrl: photo.urls.thumb,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        sourceUrl: photo.links.html,
        attributionRequired: true, // Unsplash requires attribution
        width,
        height,
      };
    }
    
    // If no landscape photos found, take the first non-chaotic one
    for (const photo of photos) {
      if (rejectChaotic && isChaoticImage(photo)) continue;
      return {
        id: `us-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.urls.regular,
        smallUrl: photo.urls.small,
        thumbUrl: photo.urls.thumb,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        sourceUrl: photo.links.html,
        attributionRequired: true,
        width: photo.width,
        height: photo.height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Unsplash search error:', error);
    return null;
  }
}

// Try Pexels API
async function tryPexels(query: string): Promise<ResolvedImage | null> {
  const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
  if (!PEXELS_API_KEY) {
    console.log("Pexels API key not configured");
    return null;
  }
  
  try {
    const params = new URLSearchParams({
      query,
      per_page: '5',
      orientation: 'landscape',
    });
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const photos = data.photos || [];
    
    for (const photo of photos) {
      const width = photo.width || 0;
      const height = photo.height || 0;
      
      // Quality filter
      if (width < 1600 || width < height * 1.2) continue;
      
      return {
        id: `px-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.src.large2x || photo.src.large,
        smallUrl: photo.src.medium,
        thumbUrl: photo.src.small,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        attributionRequired: true, // Pexels requires attribution
        width,
        height,
      };
    }
    
    // Take first if no ideal match
    if (photos.length > 0) {
      const photo = photos[0];
      return {
        id: `px-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.src.large2x || photo.src.large,
        smallUrl: photo.src.medium,
        thumbUrl: photo.src.small,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        attributionRequired: true,
        width: photo.width,
        height: photo.height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Pexels search error:', error);
    return null;
  }
}

// Try Google Places API (New) - fetches real photos and stores in Supabase Storage
async function getGooglePlacesPhoto(
  supabase: any,
  query: string,
  maxWidthPx = 1200
): Promise<ResolvedImage | null> {
  const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return null;
  }

  try {
    // Step 1: Search for the place
    const searchResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: query }),
      }
    );

    if (!searchResponse.ok) {
      console.error(`Google Places search failed: ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();
    const photoName = searchData?.places?.[0]?.photos?.[0]?.name;

    if (!photoName) {
      console.log(`No Google Places photos found for: ${query}`);
      return null;
    }

    console.log(`Google Places photo found: ${photoName}`);

    // Step 2: Get the photo media URL (follows redirect to actual image)
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
    const mediaResponse = await fetch(mediaUrl);

    if (!mediaResponse.ok) {
      console.error(`Google Places media fetch failed: ${mediaResponse.status}`);
      return null;
    }

    const mediaData = await mediaResponse.json();
    const photoUri = mediaData?.photoUri;

    if (!photoUri) {
      console.error("No photoUri in Google Places media response");
      return null;
    }

    console.log(`Google Places photoUri obtained, downloading for storage...`);

    // Step 3: Download the actual image bytes
    const imageResponse = await fetch(photoUri);
    if (!imageResponse.ok) {
      console.error(`Failed to download Google Places image: ${imageResponse.status}`);
      return null;
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBlob = await imageResponse.arrayBuffer();

    // Step 4: Upload to Supabase Storage for permanent URL
    const fileExt = contentType.includes("png") ? "png" : "jpg";
    const storagePath = `google-places/${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 80)}-${maxWidthPx}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("travel-images")
      .upload(storagePath, imageBlob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("travel-images")
      .getPublicUrl(storagePath);

    const permanentUrl = publicUrlData?.publicUrl;
    if (!permanentUrl) {
      console.error("Failed to get public URL from storage");
      return null;
    }

    console.log(`Google Places image stored at: ${permanentUrl}`);

    // Also get a smaller version for thumbnails
    let smallUrl = permanentUrl;
    let thumbUrl = permanentUrl;

    if (maxWidthPx > 400) {
      // Fetch a smaller version for thumb/small
      const smallMediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
      try {
        const smallMediaResp = await fetch(smallMediaUrl);
        if (smallMediaResp.ok) {
          const smallMediaData = await smallMediaResp.json();
          if (smallMediaData?.photoUri) {
            const smallImgResp = await fetch(smallMediaData.photoUri);
            if (smallImgResp.ok) {
              const smallBlob = await smallImgResp.arrayBuffer();
              const smallPath = `google-places/${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 80)}-400.${fileExt}`;
              await supabase.storage.from("travel-images").upload(smallPath, smallBlob, { contentType, upsert: true });
              const { data: smallPubData } = supabase.storage.from("travel-images").getPublicUrl(smallPath);
              if (smallPubData?.publicUrl) {
                smallUrl = smallPubData.publicUrl;
                thumbUrl = smallPubData.publicUrl;
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to get small Google Places image, using full size", e);
      }
    }

    return {
      id: `gp-${photoName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}`,
      cacheKey: '',
      imageType: 'city_hero',
      city: '',
      country: '',
      url: permanentUrl,
      smallUrl,
      thumbUrl,
      source: 'google_places',
      photographer: 'Google',
      photographerUrl: undefined,
      sourceUrl: undefined,
      attributionRequired: true,
      width: maxWidthPx,
      height: undefined,
    };
  } catch (error) {
    console.error("Google Places photo error:", error);
    return null;
  }
}

// Derive a consistent seed from a string by summing char codes
function stableCharCodeSum(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum;
}

// Try Pollinations AI image generation, download + persist to Supabase Storage
async function tryPollinations(
  supabase: any,
  entityName: string,
  city: string,
  options?: { promptSuffix?: string; width?: number; height?: number; imageType?: ImageType },
): Promise<ResolvedImage | null> {
  try {
    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      console.warn("POLLINATIONS_API_KEY not set, skipping Pollinations");
      return null;
    }

    const suffix = options?.promptSuffix ?? "atmospheric travel photography cinematic";
    const width = options?.width ?? 1200;
    const height = options?.height ?? 800;
    const prompt = `${entityName} ${city} ${suffix}`;
    const seed = stableCharCodeSum(entityName);
    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&key=${apiKey}`;

    console.log(`Pollinations: fetching image for "${entityName}" in ${city} (${width}x${height}, seed=${seed})`);

    // 20-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(pollinationsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Pollinations returned ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      console.error(`Pollinations returned non-image content-type: ${contentType}`);
      return null;
    }

    // Download image bytes and persist to Supabase Storage
    const imageBytes = new Uint8Array(await response.arrayBuffer());
    const ext = contentType.includes("png") ? "png" : "jpg";
    const slug = `${entityName}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 80);
    const storagePath = `pollinations/${slug}-${seed}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("travel-images")
      .upload(storagePath, imageBytes, {
        contentType: contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Pollinations storage upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("travel-images")
      .getPublicUrl(storagePath);

    const permanentUrl = urlData?.publicUrl;
    if (!permanentUrl) {
      console.error("Could not get public URL for pollinations image");
      return null;
    }

    console.log(`Pollinations image stored: ${permanentUrl}`);

    return {
      id: `pollinations-${seed}`,
      cacheKey: "",
      imageType: options?.imageType ?? "attraction",
      city,
      country: "",
      url: permanentUrl,
      smallUrl: permanentUrl,
      thumbUrl: permanentUrl,
      source: "pollinations",
      photographer: "Pollinations AI",
      attributionRequired: false,
      width,
      height,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Pollinations request timed out after 20s");
    } else {
      console.error("Pollinations error:", error);
    }
    return null;
  }
}

// Try local storage fallback
async function tryLocalStorage(supabase: any, city: string, type: ImageType): Promise<ResolvedImage | null> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    
    // Try city-specific fallback first
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const paths = [
      `fallbacks/${citySlug}-hero.jpg`,
      `fallbacks/${type}-default.jpg`,
      `fallbacks/travel-default.jpg`,
    ];
    
    for (const path of paths) {
      const { data } = await supabase.storage.from('travel-images').getPublicUrl(path);
      
      if (data?.publicUrl) {
        // Verify the file exists
        const checkResponse = await fetch(data.publicUrl, { method: 'HEAD' });
        if (checkResponse.ok) {
          return {
            id: `local-${path.replace(/[/\.]/g, '-')}`,
            cacheKey: '',
            imageType: type,
            city,
            country: '',
            url: data.publicUrl,
            smallUrl: data.publicUrl,
            thumbUrl: data.publicUrl,
            source: 'local',
            photographer: 'Stock Photo',
            attributionRequired: false,
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Local storage fallback error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const request: ResolveImageRequest = await req.json();
    
    if (!request.type || !request.city) {
      return new Response(
        JSON.stringify({ error: "type and city are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Default country to city name for search if not provided
    if (!request.country) {
      request.country = request.city;
    }

    const cacheKey = generateCacheKey(request);
    console.log(`Resolving image for: ${cacheKey}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('image_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached && !cacheError) {
      console.log(`Cache hit for: ${cacheKey}`);
      
      // Increment hit count
      await supabase
        .from('image_cache')
        .update({ hit_count: (cached.hit_count || 0) + 1 })
        .eq('id', cached.id);
      
      const image: ResolvedImage = {
        id: cached.id,
        cacheKey: cached.cache_key,
        imageType: cached.image_type,
        city: cached.city,
        country: cached.country,
        entityName: cached.entity_name,
        url: cached.image_url,
        smallUrl: cached.small_url,
        thumbUrl: cached.thumb_url,
        source: cached.source,
        photographer: cached.photographer,
        photographerUrl: cached.photographer_url,
        sourceUrl: cached.source_url,
        attributionRequired: cached.attribution_required,
        width: cached.width,
        height: cached.height,
      };
      
      return new Response(
        JSON.stringify({ image, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query
    const searchQuery = buildSearchQuery(request);
    const isHero = request.type === 'city_hero';
    console.log(`Searching for: ${searchQuery}${isHero ? ' (hero mode, chaotic rejection ON)' : ''}`);

    let image: ResolvedImage | null = null;

    // Resolution order depends on image type
    if (request.type === 'seasonal') {
      // Seasonal: Wikimedia (with non-photo filter) → Unsplash → Pollinations → Pexels → Storage
      const NON_PHOTO_PATTERNS = /\.(svg|SVG)|manuscript|painting|score|sheet_music|artwork|illustration|drawing|engraving|lithograph/i;
      if (request.entityName) {
        console.log('Trying Wikimedia Commons (seasonal)...');
        image = await tryWikimedia(searchQuery, request.entityName, request.city);
        if (image && NON_PHOTO_PATTERNS.test(image.url)) {
          console.log(`Wikimedia result appears non-photographic (${image.url}), skipping`);
          image = null;
        }
      }
      if (!image) {
        console.log('Trying Unsplash (seasonal)...');
        image = await tryUnsplash(searchQuery, false);
      }
      if (!image && request.entityName) {
        console.log('Trying Pollinations (seasonal)...');
        const PERFORMANCE_KEYWORDS = /concert|recital|performance|opera|symphony|philharmonic|orchestra|music\s*festival|live\s*music|gig|sonata|choir|choral/i;
        const isPerformance = PERFORMANCE_KEYWORDS.test(request.entityName);
        const seasonalSuffix = isPerformance
          ? `${request.country} concert performance audience evening atmospheric photography`
          : `${request.country} festival celebration crowd street photography atmospheric`;
        image = await tryPollinations(supabase, request.entityName, request.city, {
          promptSuffix: seasonalSuffix,
          width: 800,
          height: 600,
          imageType: "seasonal",
        });
      }
      if (!image) {
        console.log('Trying Pexels (seasonal)...');
        image = await tryPexels(searchQuery);
      }
    } else if (request.type === 'city_hero') {
      // City Hero: Google Places ("{city} {country} cityscape") → Unsplash → Pexels → monument fallback → Storage
      const heroQuery = `${request.city} ${request.country} cityscape`;
      console.log(`Trying Google Places (city_hero): "${heroQuery}"`);
      image = await getGooglePlacesPhoto(supabase, heroQuery);

      if (!image) {
        console.log('Trying Unsplash (city_hero)...');
        image = await tryUnsplash(searchQuery, true);
      }
      if (!image) {
        console.log('Trying Pexels (city_hero)...');
        image = await tryPexels(searchQuery);
      }
      // Hero fallback: monument-focused query
      if (!image) {
        const fallbackQuery = buildHeroFallbackQuery(request.city, request.country);
        console.log(`Hero fallback query: ${fallbackQuery}`);
        image = await getGooglePlacesPhoto(supabase, fallbackQuery);
        if (!image) image = await tryUnsplash(fallbackQuery, false);
        if (!image) image = await tryPexels(fallbackQuery);
      }
    } else if (request.type === 'attraction') {
      // Attraction: Pollinations → Google Places → Unsplash (no Pexels)
      if (request.entityName) {
        console.log('Trying Pollinations (attraction)...');
        image = await tryPollinations(supabase, request.entityName, request.city, {
          promptSuffix: `${request.country} travel photography atmospheric cinematic landmark`,
        });
      }
      if (!image) {
        const gpQuery = request.entityName
          ? `${request.entityName} ${request.city}`
          : searchQuery;
        console.log(`Trying Google Places (attraction): "${gpQuery}"`);
        image = await getGooglePlacesPhoto(supabase, gpQuery);
      }
      if (!image) {
        console.log('Trying Unsplash (attraction)...');
        image = await tryUnsplash(searchQuery, false);
      }
    } else if (request.type === 'neighborhood') {
      // Neighborhood: Google Places ("{name} {city} neighbourhood street") → Unsplash → Pexels → Storage
      const neighQuery = request.entityName
        ? `${request.entityName} neighbourhood ${request.city} ${request.country} street architecture`
        : `${request.city} ${request.country} neighbourhood street architecture`;
      console.log(`Trying Google Places (neighborhood): "${neighQuery}"`);
      image = await getGooglePlacesPhoto(supabase, neighQuery);

      if (!image) {
        console.log('Trying Unsplash (neighborhood)...');
        image = await tryUnsplash(searchQuery, false);
      }
      if (!image) {
        console.log('Trying Pexels (neighborhood)...');
        image = await tryPexels(searchQuery);
      }
    } else {
      // Category / other: Google Places → Unsplash → Pexels → Storage
      const catQuery = request.entityName
        ? `${request.entityName} ${request.city}`
        : searchQuery;
      console.log(`Trying Google Places (category): "${catQuery}"`);
      image = await getGooglePlacesPhoto(supabase, catQuery);

      if (!image) {
        console.log('Trying Unsplash (category)...');
        image = await tryUnsplash(searchQuery, false);
      }
      if (!image) {
        console.log('Trying Pexels (category)...');
        image = await tryPexels(searchQuery);
      }
    }

    // Try local storage fallback
    if (!image) {
      console.log('Trying local storage fallback...');
      image = await tryLocalStorage(supabase, request.city, request.type);
    }

    if (!image) {
      return new Response(
        JSON.stringify({ image: null, fromCache: false, error: "No image found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Complete the image data
    image.cacheKey = cacheKey;
    image.imageType = request.type;
    image.city = request.city;
    image.country = request.country;
    image.entityName = request.entityName;

    // Cache the result
    const ttlDays = getTTLDays(request.type);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const { error: insertError } = await supabase
      .from('image_cache')
      .upsert({
        cache_key: cacheKey,
        image_type: request.type,
        city: request.city,
        country: request.country,
        entity_name: request.entityName,
        image_url: image.url,
        small_url: image.smallUrl,
        thumb_url: image.thumbUrl,
        source: image.source,
        photographer: image.photographer,
        photographer_url: image.photographerUrl,
        source_url: image.sourceUrl,
        attribution_required: image.attributionRequired,
        width: image.width,
        height: image.height,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      }, {
        onConflict: 'cache_key',
      });

    if (insertError) {
      console.error('Cache insert error:', insertError);
    } else {
      console.log(`Cached image for ${ttlDays} days: ${cacheKey}`);
    }

    return new Response(
      JSON.stringify({ image, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resolve-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to resolve image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
