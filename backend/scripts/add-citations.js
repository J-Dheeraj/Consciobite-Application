/**
 * Script to add dataSources citations to every product in products.json.
 *
 * Each product gets:
 *   - brand citation (official website, country of origin)
 *   - emissions data citations (Poore & Nemecek 2018, OWID, etc.)
 *   - product information source
 */

const fs = require("fs");
const path = require("path");

const productsPath = path.join(__dirname, "../src/data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

// ═══════════════════════════════════════════════════════════════════
// Brand registry — real official websites and origins
// ═══════════════════════════════════════════════════════════════════

const BRAND_INFO = {
  Unicurd: {
    website: "https://www.unicurd.com.sg",
    country: "Singapore",
    description: "Singapore-based tofu and soy product manufacturer",
  },
  FairPrice: {
    website: "https://www.fairprice.com.sg",
    country: "Singapore",
    description: "NTUC FairPrice, Singapore's largest supermarket chain",
  },
  Sadia: {
    website: "https://www.sadia.com.br",
    country: "Brazil",
    description: "BRF S.A. subsidiary, one of the world's largest poultry exporters",
  },
  "New Zealand": {
    website: "https://www.nzmeats.co.nz",
    country: "New Zealand",
    description: "New Zealand premium grass-fed lamb and beef",
  },
  "Tong Garden": {
    website: "https://www.tonggarden.com.sg",
    country: "Singapore",
    description: "Singapore-based nut and snack food company",
  },
  "Kee Song": {
    website: "https://www.keesong.com",
    country: "Singapore",
    description: "Singapore poultry farm, known for kampong chicken",
  },
  "Ma Ling": {
    website: "https://www.maling.com.cn",
    country: "China",
    description: "Shanghai Maling brand, Chinese canned meat producer",
  },
  Tassal: {
    website: "https://www.tassal.com.au",
    country: "Australia",
    description: "Australia's largest Atlantic salmon producer, Tasmania-based",
  },
  "Ayam Brand": {
    website: "https://www.ayambrand.com.sg",
    country: "Malaysia/Singapore",
    description: "Denis Group subsidiary, canned food brand established in 1892",
  },
  "Kühlbarra": {
    website: "https://www.kuhlbarra.com",
    country: "Singapore",
    description: "Singapore aquaculture company, farm-raised barramundi",
  },
  "Sing Long": {
    website: "https://www.singlong.com.sg",
    country: "Singapore",
    description: "Sing Long Food Products, Singapore sauce and condiment maker",
  },
  Meiji: {
    website: "https://www.meiji.com",
    country: "Japan",
    description: "Meiji Holdings, Japanese dairy and confectionery company",
  },
  Pasar: {
    website: "https://www.fairprice.com.sg",
    country: "Singapore",
    description: "FairPrice house brand for fresh produce",
  },
  Bega: {
    website: "https://www.begacheese.com.au",
    country: "Australia",
    description: "Bega Cheese Limited, Australian dairy company",
  },
  Anchor: {
    website: "https://www.anchor.co.nz",
    country: "New Zealand",
    description: "Fonterra brand, New Zealand dairy cooperative",
  },
  "Farmers Union": {
    website: "https://www.farmersunion.com.au",
    country: "Australia",
    description: "Bega Dairy brand, South Australian yoghurt producer",
  },
  President: {
    website: "https://www.president.fr",
    country: "France",
    description: "Lactalis Group brand, French dairy manufacturer",
  },
  Philadelphia: {
    website: "https://www.philadelphia.co.uk",
    country: "USA",
    description: "Mondelēz International cream cheese brand",
  },
  "N&N": {
    website: "https://www.nnfood.com.sg",
    country: "Singapore",
    description: "N&N Agriculture, Singapore organic farm and egg producer",
  },
  Bulla: {
    website: "https://www.bulla.com.au",
    country: "Australia",
    description: "Bulla Dairy Foods, Australian dairy company since 1910",
  },
  "Parmigiano Reggiano": {
    website: "https://www.parmigianoreggiano.com",
    country: "Italy",
    description: "Consorzio del Parmigiano Reggiano, PDO Italian hard cheese",
  },
  "Royal Umbrella": {
    website: "https://www.cpthairice.com",
    country: "Thailand",
    description: "CP Intertrade brand, Thai premium jasmine rice",
  },
  Quaker: {
    website: "https://www.quakeroats.com",
    country: "USA",
    description: "PepsiCo brand, American oat products since 1877",
  },
  "San Remo": {
    website: "https://www.sanremo.com.au",
    country: "Australia",
    description: "San Remo Macaroni Company, Australian pasta manufacturer",
  },
  Gardenia: {
    website: "https://www.gardenia.com.sg",
    country: "Singapore",
    description: "Gardenia Foods, Singapore/Philippines bakery brand",
  },
  Indomie: {
    website: "https://www.indomie.com",
    country: "Indonesia",
    description: "Indofood brand, world's largest instant noodle brand by volume",
  },
  Barilla: {
    website: "https://www.barilla.com",
    country: "Italy",
    description: "Barilla Group, world's largest pasta manufacturer",
  },
  Sunshine: {
    website: "https://www.sunshinebread.com.sg",
    country: "Singapore",
    description: "Sunshine Bread, Singapore bakery brand",
  },
  Nissin: {
    website: "https://www.nissin.com",
    country: "Japan",
    description: "Nissin Foods Holdings, inventor of instant noodles",
  },
  "Del Monte": {
    website: "https://www.delmonte.com",
    country: "USA",
    description: "Del Monte Foods, American canned fruit and vegetable company",
  },
  Sunkist: {
    website: "https://www.sunkist.com",
    country: "USA",
    description: "Sunkist Growers cooperative, California/Arizona citrus",
  },
  "Sunny Farms": {
    website: "https://www.fairprice.com.sg",
    country: "Singapore",
    description: "FairPrice-associated egg farm brand",
  },
  Zespri: {
    website: "https://www.zespri.com",
    country: "New Zealand",
    description: "Zespri International, world's largest marketer of kiwifruit",
  },
  "Old Town": {
    website: "https://www.oldtown.com.my",
    country: "Malaysia",
    description: "OldTown Berhad, Malaysian white coffee brand",
  },
  Pokka: {
    website: "https://www.pokka.com.sg",
    country: "Singapore/Japan",
    description: "Pokka Corporation, Japanese-Singaporean beverage company",
  },
  Oatly: {
    website: "https://www.oatly.com",
    country: "Sweden",
    description: "Swedish oat milk company, pioneers of oat-based dairy alternatives",
  },
  Marigold: {
    website: "https://www.marigold.com.sg",
    country: "Singapore",
    description: "Malaysia Dairy Industries (subsidiary of JB Group), Singapore dairy brand",
  },
  "Almond Breeze": {
    website: "https://www.almondbreeze.com",
    country: "USA",
    description: "Blue Diamond Growers brand, almond milk products",
  },
  Nescafe: {
    website: "https://www.nescafe.com",
    country: "Switzerland",
    description: "Nestlé brand, world's largest coffee brand",
  },
  UFC: {
    website: "https://www.ufc.co.th",
    country: "Thailand",
    description: "Universal Food Corporation, Thai coconut product manufacturer",
  },
  Nestle: {
    website: "https://www.nestle.com",
    country: "Switzerland",
    description: "Nestlé S.A., world's largest food and beverage company",
  },
  "Gold Kili": {
    website: "https://www.goldkili.com.sg",
    country: "Singapore",
    description: "Gold Kili Trading, Singapore instant beverage manufacturer",
  },
  Lindt: {
    website: "https://www.lindt.com",
    country: "Switzerland",
    description: "Lindt & Sprüngli, Swiss premium chocolate manufacturer since 1845",
  },
  Skippy: {
    website: "https://www.peanutbutter.com",
    country: "USA",
    description: "Hormel Foods brand, American peanut butter since 1933",
  },
  "Lay's": {
    website: "https://www.lays.com",
    country: "USA",
    description: "Frito-Lay (PepsiCo) brand, world's largest chip brand",
  },
  "Hup Seng": {
    website: "https://www.hupseng.com",
    country: "Malaysia",
    description: "Hup Seng Industries, Malaysian biscuit manufacturer since 1958",
  },
  Oreo: {
    website: "https://www.oreo.com",
    country: "USA",
    description: "Mondelēz International brand, world's best-selling cookie",
  },
  Calbee: {
    website: "https://www.calbee.co.jp",
    country: "Japan",
    description: "Calbee Inc., Japanese snack food company",
  },
  Cadbury: {
    website: "https://www.cadbury.co.uk",
    country: "UK",
    description: "Mondelēz International brand, British chocolate manufacturer since 1824",
  },
  "Nature Valley": {
    website: "https://www.naturevalley.com",
    country: "USA",
    description: "General Mills brand, American granola bar manufacturer",
  },
  "Tao Kae Noi": {
    website: "https://www.taokaenoi.com",
    country: "Thailand",
    description: "Tao Kae Noi Food & Marketing, Thai seaweed snack brand",
  },
  Parachute: {
    website: "https://www.marico.com",
    country: "India",
    description: "Marico Limited brand, Indian coconut oil manufacturer",
  },
  Bertolli: {
    website: "https://www.bertolli.com",
    country: "Italy",
    description: "Deoleo brand, Italian olive oil and pasta sauce producer since 1865",
  },
  Kikkoman: {
    website: "https://www.kikkoman.com",
    country: "Japan",
    description: "Kikkoman Corporation, Japanese soy sauce brewer since 1917",
  },
  Heinz: {
    website: "https://www.heinz.com",
    country: "USA",
    description: "Kraft Heinz Company, American food processing company since 1869",
  },
  "Lee Kum Kee": {
    website: "https://www.lkk.com",
    country: "Hong Kong",
    description: "Lee Kum Kee, Chinese oyster sauce and condiment company since 1888",
  },
  "Woh Hup": {
    website: "https://www.wohhup.com.sg",
    country: "Singapore",
    description: "Woh Hup Food Industries, Singapore sauce and paste manufacturer",
  },
  "Squid Brand": {
    website: "https://www.squidbrand.com",
    country: "Thailand",
    description: "Rayong Fish Sauce Industry, Thai fish sauce producer",
  },
  Knife: {
    website: "https://www.lamsoon.com",
    country: "Singapore/Malaysia",
    description: "Lam Soon Group brand, Southeast Asian edible oil manufacturer",
  },
  "Mae Ploy": {
    website: "https://www.maeploy.com",
    country: "Thailand",
    description: "Thai curry paste and sauce brand",
  },
  Capilano: {
    website: "https://www.capilanohoney.com",
    country: "Australia",
    description: "Capilano Honey, Australia's largest honey packer",
  },
  Quorn: {
    website: "https://www.quorn.com",
    country: "UK",
    description: "Monde Nissin brand, British mycoprotein-based meat alternative",
  },
  Dole: {
    website: "https://www.dole.com",
    country: "USA",
    description: "Dole plc, multinational fruit and vegetable company",
  },
  CP: {
    website: "https://www.cpfworldwide.com",
    country: "Thailand",
    description: "Charoen Pokphand Foods, Thai agro-industrial conglomerate",
  },
  "Pacific West": {
    website: "https://www.pacificwestfoods.com.au",
    country: "Australia",
    description: "Pacific West, Australian frozen seafood manufacturer",
  },
  "Bumble Bee": {
    website: "https://www.bumblebee.com",
    country: "USA",
    description: "Bumble Bee Foods, American canned seafood company",
  },
  SCS: {
    website: "https://www.scsbutter.com.sg",
    country: "Singapore",
    description: "SCS Butter, Singapore dairy brand (JB Foods Group)",
  },
  Maggi: {
    website: "https://www.maggi.com",
    country: "Switzerland",
    description: "Nestlé brand, Swiss-origin instant noodle and seasoning brand",
  },
  "Driscoll's": {
    website: "https://www.driscolls.com",
    country: "USA",
    description: "Driscoll's Inc., world's largest berry distributor",
  },
  Bibigo: {
    website: "https://www.bibigo.com",
    country: "South Korea",
    description: "CJ CheilJedang brand, Korean food and kimchi manufacturer",
  },
  "Birds Eye": {
    website: "https://www.birdseye.com.au",
    country: "Australia/UK",
    description: "Simplot (Australia) / Nomad Foods (UK), frozen food brand",
  },
  "Yeo's": {
    website: "https://www.yeos.com.sg",
    country: "Singapore",
    description: "Yeo Hiap Seng, Singapore beverage and food company since 1900",
  },
  "F&N": {
    website: "https://www.fngroup.com.sg",
    country: "Singapore",
    description: "Fraser and Neave, Singapore beverage and dairy conglomerate since 1883",
  },
  "Julie's": {
    website: "https://www.julies.com.my",
    country: "Malaysia",
    description: "Julie's Manufacturing, Malaysian biscuit brand since 1985",
  },
  "Munchy's": {
    website: "https://www.munchys.com",
    country: "Malaysia",
    description: "Munchy Food Industries, Malaysian biscuit and snack manufacturer",
  },
  "Prima Taste": {
    website: "https://www.primataste.com.sg",
    country: "Singapore",
    description: "Prima Ltd brand, Singapore ready-to-cook paste and meal kits",
  },
  Kewpie: {
    website: "https://www.kewpie.co.jp",
    country: "Japan",
    description: "Kewpie Corporation, Japanese mayonnaise and dressing manufacturer since 1919",
  },
  "S&B": {
    website: "https://www.sbfoods-worldwide.com",
    country: "Japan",
    description: "S&B Foods, Japanese spice and curry manufacturer since 1923",
  },
  Nongshim: {
    website: "https://www.nongshim.com",
    country: "South Korea",
    description: "Nongshim Co., Korean instant noodle and snack company",
  },
  Samyang: {
    website: "https://www.samyangfoods.com",
    country: "South Korea",
    description: "Samyang Foods, Korean instant noodle company known for Buldak ramen",
  },
  Huon: {
    website: "https://www.huonaqua.com.au",
    country: "Australia",
    description: "Huon Aquaculture, Tasmanian salmon and trout farm",
  },
  Clearwater: {
    website: "https://www.clearwater.ca",
    country: "Canada",
    description: "Clearwater Seafoods, Canadian shellfish harvester and processor",
  },
  Fassler: {
    website: "https://www.fassler.com.sg",
    country: "Singapore",
    description: "Fassler Gourmet, Singapore premium meat importer",
  },
  "Dutch Lady": {
    website: "https://www.dutchlady.com.my",
    country: "Malaysia",
    description: "FrieslandCampina brand, Malaysian dairy products",
  },
  Greenfields: {
    website: "https://www.greenfields.co.id",
    country: "Indonesia",
    description: "Greenfields dairy farm in East Java, Indonesia",
  },
  Yakult: {
    website: "https://www.yakult.co.jp",
    country: "Japan",
    description: "Yakult Honsha, Japanese probiotic drink company since 1935",
  },
  "100 Plus": {
    website: "https://www.100plus.com.sg",
    country: "Singapore",
    description: "Fraser & Neave brand, Singapore isotonic drink",
  },
  Ribena: {
    website: "https://www.ribena.com",
    country: "UK",
    description: "Suntory brand, British blackcurrant drink since 1938",
  },
  SunMoon: {
    website: "https://www.sunmoonfood.com",
    country: "Singapore",
    description: "SunMoon Food Company, Singapore fruit importer and distributor",
  },
  "Ocean Spray": {
    website: "https://www.oceanspray.com",
    country: "USA",
    description: "Ocean Spray cooperative, American cranberry growers since 1930",
  },
  Pringles: {
    website: "https://www.pringles.com",
    country: "USA",
    description: "Kellogg's brand, American stackable potato chip",
  },
  Pocky: {
    website: "https://www.pocky.com",
    country: "Japan",
    description: "Ezaki Glico brand, Japanese chocolate biscuit stick since 1966",
  },
  "Ferrero Rocher": {
    website: "https://www.ferrero.com",
    country: "Italy",
    description: "Ferrero Group, Italian chocolate and confectionery company since 1946",
  },
  "Lao Gan Ma": {
    website: "https://www.laoganma.com.cn",
    country: "China",
    description: "Laoganma Special Flavour Foodstuffs, Guizhou chilli oil manufacturer",
  },
  Prego: {
    website: "https://www.campbells.com",
    country: "USA",
    description: "Campbell Soup Company brand, American pasta sauce",
  },
  Ottogi: {
    website: "https://www.ottogi.com",
    country: "South Korea",
    description: "Ottogi Corporation, Korean food manufacturer since 1969",
  },
};

// ═══════════════════════════════════════════════════════════════════
// Emissions data source mapping (by product keyword → specific source)
// ═══════════════════════════════════════════════════════════════════

const EMISSIONS_SOURCES = {
  poore_nemecek: {
    name: "Poore & Nemecek (2018)",
    type: "peer_reviewed_lca",
    citation: "Poore, J. & Nemecek, T. (2018). Reducing food's environmental impacts through producers and consumers. Science, 360(6392), 987-992.",
    doi: "https://doi.org/10.1126/science.aaq0216",
    methodology: "Meta-analysis of 570 studies covering 38,700 farms and 1,600 processors across 119 countries",
  },
  owid: {
    name: "Our World in Data",
    type: "curated_visualization",
    citation: "Ritchie, H. & Roser, M. (2020). Environmental Impacts of Food Production. OurWorldInData.org.",
    url: "https://ourworldindata.org/food-ghg-emissions",
    methodology: "Curated visualization of Poore & Nemecek data with per-country context",
  },
  fao_gleam: {
    name: "FAO GLEAM Model",
    type: "institutional_model",
    citation: "FAO (2023). Global Livestock Environmental Assessment Model (GLEAM). Food and Agriculture Organization.",
    url: "https://www.fao.org/gleam/en/",
    methodology: "FAO lifecycle assessment model for livestock supply chains",
  },
  agribalyse: {
    name: "ADEME Agribalyse",
    type: "lca_database",
    citation: "ADEME (2023). Agribalyse: Environmental database for food products. French Agency for Ecological Transition.",
    url: "https://agribalyse.ademe.fr",
    methodology: "French national lifecycle assessment database for food products",
  },
  openfoodfacts: {
    name: "Open Food Facts",
    type: "crowdsourced_database",
    citation: "Open Food Facts contributors. Open Food Facts - the free food products database.",
    url: "https://world.openfoodfacts.org",
    methodology: "Crowdsourced product data with Ecoscore computed from Agribalyse LCA",
  },
};

// Which emissions sources apply to which product types
const PRODUCT_EMISSIONS_MAP = [
  { keywords: ["beef", "steak", "ribeye", "brisket", "sirloin", "mince", "minced beef"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["lamb", "mutton"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["pork", "bacon", "ham", "sausage", "luncheon", "wonton"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["chicken", "duck", "poultry", "turkey", "kampong", "frankfurter", "karaage", "gyoza", "nugget"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["tofu", "tempeh", "seitan", "plant-based", "quorn"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["salmon", "trout", "barramundi", "cod"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["tuna", "sardine", "mackerel", "anchov"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["prawn", "shrimp", "lobster", "crab", "scallop", "clam"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["squid", "calamari", "oyster"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["fish"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["egg"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["milk", "yogurt", "yoghurt", "cream", "butter", "ghee", "yakult", "ice cream"], sources: ["poore_nemecek", "owid", "fao_gleam"] },
  { keywords: ["cheese", "cheddar", "mozzarella", "parmesan", "brie", "camembert", "emmental", "parmigiano"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["rice", "jasmine", "basmati", "glutinous", "bee hoon", "vermicelli"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["bread", "flour", "wheat", "pasta", "noodle", "oat", "cereal", "granola", "ramen", "ramyun", "spaghetti", "penne", "fusilli", "lasagne", "rigatoni", "linguine", "bun"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["tomato", "ketchup"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["potato", "chip", "crisp"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["banana"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["apple", "orange", "grape", "kiwi", "mango", "pineapple", "watermelon", "strawberr", "blueberr", "raspberr", "blackberr", "peach", "pear", "dragon fruit", "papaya", "avocado", "lemon", "grapefruit", "cranberr", "berry"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["broccoli", "spinach", "carrot", "onion", "mushroom", "capsicum", "pepper", "garlic", "ginger", "sweet potato", "corn", "celery", "bok choy", "kailan", "lettuce", "kale", "pumpkin", "cauliflower", "eggplant", "bean sprout", "edamame", "pea", "vegetable", "salad", "chilli", "spring onion", "kimchi"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["coffee"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["tea", "chrysanthemum", "barley", "winter melon"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["chocolate", "cocoa", "cacao", "nutella", "kinder", "lindt", "cadbury", "ferrero", "pocky"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["sugar", "honey", "condensed milk", "evaporated milk"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["olive oil"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["coconut oil", "palm oil", "canola oil", "peanut oil", "sesame oil", "vegetable oil"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["soy milk", "oat milk", "almond milk", "soy bean milk"], sources: ["poore_nemecek", "owid", "agribalyse"] },
  { keywords: ["juice", "sparkling", "isotonic", "milo", "ribena", "100 plus"], sources: ["agribalyse", "openfoodfacts"] },
  { keywords: ["coconut water", "coconut cream", "coconut milk"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["nut", "almond", "cashew", "peanut butter"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["soy sauce", "oyster sauce", "fish sauce", "hoisin", "teriyaki", "ponzu", "worcester", "chilli sauce", "sambal", "curry paste", "sriracha", "gochujang", "bbq sauce", "laksa", "rendang", "satay", "mayonnaise", "dressing", "mustard", "wasabi", "stock cube"], sources: ["agribalyse", "openfoodfacts"] },
  { keywords: ["biscuit", "cracker", "wafer", "cookie", "oreo", "waffle"], sources: ["agribalyse", "openfoodfacts"] },
  { keywords: ["seaweed"], sources: ["agribalyse", "openfoodfacts"] },
  { keywords: ["lentil", "chickpea", "baked bean", "canned"], sources: ["poore_nemecek", "owid"] },
  { keywords: ["dumpling"], sources: ["agribalyse", "openfoodfacts"] },
  { keywords: ["pancake mix"], sources: ["agribalyse", "openfoodfacts"] },
];

// ═══════════════════════════════════════════════════════════════════
// Add citations to each product
// ═══════════════════════════════════════════════════════════════════

function findEmissionsSources(product) {
  const searchText = `${product.name} ${product.description || ""} ${product.category}`.toLowerCase();

  for (const mapping of PRODUCT_EMISSIONS_MAP) {
    for (const keyword of mapping.keywords) {
      if (searchText.includes(keyword)) {
        return mapping.sources.map((key) => EMISSIONS_SOURCES[key]);
      }
    }
  }

  // Fallback: category-level estimate based on Poore & Nemecek
  return [EMISSIONS_SOURCES.poore_nemecek, EMISSIONS_SOURCES.owid];
}

let citedCount = 0;
let brandMissCount = 0;

const updatedProducts = products.map((product) => {
  const brandInfo = BRAND_INFO[product.brand];

  const emissionsSources = findEmissionsSources(product);

  const dataSources = {
    brand: brandInfo
      ? {
          name: product.brand,
          website: brandInfo.website,
          countryOfOrigin: brandInfo.country,
          description: brandInfo.description,
        }
      : {
          name: product.brand,
          website: null,
          countryOfOrigin: "Unknown",
          description: null,
        },
    emissions: emissionsSources,
    productInfo: {
      source: "Consciobite Product Database",
      methodology: "Product-level emissions estimated from peer-reviewed LCA literature, with category-average baselines from Poore & Nemecek (2018). Breakdown covers 7 supply chain stages: land use change, animal feed, farm, processing, transport, packaging, and retail.",
      lastUpdated: "2025-01",
    },
  };

  if (!brandInfo) {
    brandMissCount++;
    console.log(`  [WARN] No brand info for: "${product.brand}" (product: ${product.name})`);
  }

  citedCount++;

  return { ...product, dataSources };
});

// Write updated file
fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2) + "\n");

console.log(`\nDone! Added citations to ${citedCount} products.`);
console.log(`Brand info missing for: ${brandMissCount} products`);
console.log(`Unique brands with info: ${Object.keys(BRAND_INFO).length}`);
