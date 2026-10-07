/* =====================================================================
   Grillköket – "Se rätten": every dish opens as floating layers.
   ---------------------------------------------------------------------
   EASY TO EDIT (Ayman):
   1. RECIPES  – the layers of a dish, bottom → top. Use keys from ING.
   2. ING      – how each ingredient looks and its Swedish label.
   3. Pizza, sallader, rullar, tallrikar och pita are built automatically
      from the menu text (see TOKENS). Add a RECIPES entry to override.
   ===================================================================== */
(() => {
"use strict";

/* ---------- 1. RECIPES (bottom → top) ---------- */
const RECIPES = {
  // Hamburgare
  "Hamburgare":                ["bunBottom", "dressing", "lettuce", "tomatoSlices", "patty", "redOnion", "ketchup", "bunTop"],
  "Ostburgare":                ["bunBottom", "dressing", "lettuce", "tomatoSlices", "patty", "cheddar", "redOnion", "bunTop"],
  "Ost & baconburgare":        ["bunBottom", "dressing", "lettuce", "tomatoSlices", "patty", "cheddar", "bacon", "bunTop"],
  "Dubbel ost & baconburgare": ["bunBottom", "dressing", "lettuce", "patty", "cheddar", "patty", "cheddar", "bacon", "bunTop"],
  "Halloumiburgare":           ["bunBottom", "dressing", "lettuce", "tomatoSlices", "halloumi", "redOnion", "bunTop"],
  "Fiskburgare":               ["bunBottom", "remoulade", "lettuce", "fishBreaded", "bunTop"],
  "Månadens burgare":          ["bunBottom", "dressing", "lettuce", "redOnion", "patty", "cheddar", "patty", "cheddar", "bunTop"],
  "Kycklingburgare":           ["bunBottom", "dressing", "lettuce", "tomatoSlices", "chickenFillet", "bunTop"],
  // À la carte
  "Oxfiléplanka":    ["board", "mashPiping", "vegMix", "steak", "redWine", "bearnaise"],
  "Fläskfiléplanka": ["board", "mashPiping", "vegMix", "porkSteak", "bearnaise"],
  "Gösplanka":       ["board", "mashPiping", "vegMix", "pikeperch", "shrimpDill"],
  "Black & White":   ["board", "friedPotato", "vegMix", "steak", "porkSteak", "redWine", "bearnaise"],
  "Filé Oscar":      ["board", "friedPotato", "vegMix", "steak", "shrimpTop", "bearnaise"],
  "Kycklingspett":   ["board", "wedges", "vegMix", "skewer", "ajvar", "tzatziki"],
  "Ägg & Bacon":     ["plate", "friedPotato", "bacon", "friedEgg"],
  // Grill
  "Schnitzel":           ["plate", "fries", "schnitzel", "bearnaise"],
  "Grillbiff":           ["plate", "fries", "steak", "bearnaise"],
  "Lövbit":              ["plate", "fries", "thinBeef", "bearnaise"],
  "Pyttipanna":          ["plate", "pytt", "friedEgg", "beets"],
  "Falukorv":            ["plate", "friedPotato", "falukorv", "friedEgg"],
  "Rödspätta":           ["plate", "mash", "fishBreaded", "remoulade"],
  "Tunnbrödsrulle":      ["tunnbrod", "mash", "sausage", "boston", "mustard", "ketchup"],
  "Bamsemeny":           ["plate", "mash", "sausage", "boston", "mustard", "ketchup"],
  "Köttbullar":          ["plate", "mash", "meatballs", "lingon"],
  "Korvmeny":            ["plate", "mash", "sausage", "boston", "mustard", "ketchup"],
  "Chicken Bits":        ["plate", "fries", "nuggets", "dip"],
  "French hot dog-meny": ["frenchBread", "sausage", "dressing"],
  // Barnmeny (key = "barn:" + name)
  "barn:Hamburgare":   ["bunBottomS", "dressing", "lettuce", "pattyS", "ketchup", "bunTopS"],
  "barn:Chicken Bits": ["plate", "fries", "nuggetsS", "dip"],
  "barn:Köttbullar":   ["plate", "mash", "meatballsS", "lingon"],
  "barn:Pannkaka":     ["plate", "pancake", "pancake", "cream", "jam"],
  "barn:Korv":         ["plate", "mash", "sausage", "ketchup"],
  // Tillbehör
  "Dippsås":           ["dipBowl"],
  "Chili cheese":      ["plate", "chiliCheese"],
  "Mozzarella sticks": ["plate", "mozzSticks"],
  "Lökringar":         ["plate", "onionRings"],
  "Hot wings":         ["plate", "wings"],
  "Nuggets":           ["plate", "nuggets"],
  "Pommestallrik":     ["plate", "fries"],
};

/* Realistic exploded photos (AI-generated with Higgsfield, img/exploded/). Key = menu name. */
const EXPLODED = {
  "Hamburgare": "hamburgare", "Ostburgare": "ostburgare", "Ost & baconburgare": "ostbacon", "Dubbel ost & baconburgare": "dubbel",
  "Halloumiburgare": "halloumi", "Fiskburgare": "fisk", "Kycklingburgare": "kyckling-burgare",
  "Oxfiléplanka": "oxfileplanka", "Fläskfiléplanka": "flaskfileplanka", "Gösplanka": "gosplanka", "Black & White": "black-white",
  "Filé Oscar": "file-oscar", "Kycklingspett": "kycklingspett", "Kebabpizza": "kebabpizza", "Vesuvio": "vesuvio", "Hawaii": "hawaii",
  "Kebabrulle": "kebabrulle", "Kebabtallrik": "kebabtallrik", "Kebab i bröd": "kebab-brod", "Kycklingsallad": "kycklingsallad",
  "Grekisk sallad": "grekisk-sallad", "Schnitzel": "schnitzel", "Köttbullar": "kottbullar", "Falafeltallrik": "falafeltallrik",
  "barn:Hamburgare": "hamburgare", "barn:Köttbullar": "kottbullar",
};
/* Fillings we add to rolls, plates and pita (the menu only names the meat). */
const ROLL_FILL  = ["lettuceShred", "tomatoDice", "cucumber", "onionRings2", "sauceCream"];
const PLATE_FILL = ["lettuceShred", "tomatoDice", "sauceCream"];
const SALAD_BASE = ["lettuceShred", "tomatoDice", "cucumber", "corn", "pineapple", "redOnionSmall"];

/* ---------- 2. TOKENS: words in the menu text → ingredient ---------- */
const TOKENS = [
  [/soltorkade tomater/, "sunTomato"], [/kycklingfilé|kyckling/, "chicken"], [/köttfärs/, "mince"],
  [/skinka/, "ham"], [/champinjon/, "mushroom"], [/tonfisk/, "tuna"], [/salami/, "salami"],
  [/scampi/, "scampi"], [/räk/, "shrimp"], [/ananas/, "pineapple"], [/musslor/, "mussels"],
  [/banan/, "banana"], [/curry/, "curry"], [/vitlök/, "garlic"], [/rödlök/, "redOnionSmall"],
  [/(^|[\s,])(gul )?lök/, "onion"], [/jalapeño/, "jalapeno"], [/bacon/, "baconBits"],
  [/kronärtskocka/, "artichoke"], [/oxfilé/, "beef"], [/fläskfilé/, "pork"],
  [/bearnaise/, "bearnaise"], [/tacosås/, "taco"], [/kryddmix/, "spice"], [/gorgonzola/, "gorgonzola"],
  [/santafesås/, "santafe"], [/isbergssallad/, "lettuceShred"], [/valfri sås/, "sauceCream"],
  [/jordnötter/, "peanuts"], [/bbq/, "bbq"], [/kebab/, "kebab"], [/cayenne/, "cayenne"],
  [/gurka/, "cucumber"], [/fefferoni/, "pepperoncini"], [/pommes/, "fries"], [/paprika/, "pepper"],
  [/falafel/, "falafel"], [/fetaost/, "feta"], [/oliver/, "olives"], [/ruccola/, "rocket"],
  [/zucchini/, "zucchini"], [/quorn/, "quorn"], [/mozzarella/, "mozzarella"], [/halloumi/, "halloumiCubes"],
  [/tomat/, "tomatoDice"], [/(^|[\s,])ost/, "cheeseTop"],
];
// layer group: 0 baked toppings, 1 fresh, 2 sauces & spice (drawn last)
const GROUP = { lettuceShred: 1, tomatoDice: 1, cucumber: 1, pepperoncini: 1, rocket: 1, onionRings2: 1, fries: 1,
  bearnaise: 2, taco: 2, santafe: 2, sauceCream: 2, bbq: 2, cayenne: 2, curry: 2, spice: 2 };

/* ---------- 3. ING: look + label ---------- */
const P = (shape, c, c2, extra) => Object.assign({ shape, c, c2 }, extra);
const ING = {
  // bread
  bunTop:     { l: "Hamburgerbröd", k: "dome", rx: 200, dh: 92, h: 10, c: ["#f3cf8a", "#d48b3a", "#93501a"], seeds: 1, th: 60 },
  bunBottom:  { l: "Hamburgerbröd", k: "slab", rx: 200, h: 30, top: ["#f2e0b8", "#e3c590"], side: ["#c97b33", "#9c5518"], sp: [["#d9bd88", "#f8ecd0"], 500, 1, 3, .6], th: 30 },
  bunTopS:    { l: "Hamburgerbröd", k: "dome", rx: 150, dh: 70, h: 8, c: ["#f3cf8a", "#d48b3a", "#93501a"], seeds: 1, th: 46 },
  bunBottomS: { l: "Hamburgerbröd", k: "slab", rx: 150, h: 24, top: ["#f2e0b8", "#e3c590"], side: ["#c97b33", "#9c5518"], th: 24 },
  tunnbrod:   { l: "Tunnbröd", k: "slab", rx: 232, h: 5, amp: .05, top: ["#efdcb1", "#e2c48e"], side: ["#cfa66a", "#b88a4e"], sp: [["#b97a3a", "#8a5222", "#d2a467"], 140, 2, 7, .55], th: 6 },
  pitaBottom: { l: "Pitabröd", k: "slab", rx: 205, h: 12, amp: .03, top: ["#f2dfb5", "#e5c894"], side: ["#d9b479", "#b98d50"], sp: [["#c9935a"], 80, 2, 6, .4], th: 12 },
  pitaTop:    { l: "Pitabröd", k: "dome", rx: 205, dh: 40, h: 6, c: ["#f2dcae", "#ddb57a", "#b98a4e"], spots: 1, th: 30 },
  frenchBread:{ l: "French hot dog-bröd", k: "pieces", n: 1, spread: 0, p: P("bun", "#e9b26a", "#b8742f"), size: [210, 210], th: 40 },
  // burger parts
  patty:      { l: "Nötfärsbiff", k: "slab", rx: 192, h: 34, amp: .03, top: ["#6b3d24", "#4a2816"], side: ["#4a2816", "#2e170c"], sp: [["#2b170c", "#7d4a2a", "#1d0f07", "#8a5634"], 1400, 1, 4, .8], th: 34 },
  pattyS:     { l: "Nötfärsbiff 45 g", k: "slab", rx: 144, h: 22, amp: .03, top: ["#6b3d24", "#4a2816"], side: ["#4a2816", "#2e170c"], sp: [["#2b170c", "#7d4a2a"], 700, 1, 3, .8], th: 22 },
  cheddar:    { l: "Cheddar", k: "cheese", rx: 175, th: 6 },
  lettuce:    { l: "Isbergssallad", k: "slab", rx: 214, h: 12, amp: .09, freq: 3, top: ["#e3f1b9", "#8cc152"], side: ["#a5d36a", "#6aa236"], veins: 1, th: 14 },
  tomatoSlices:{ l: "Tomat", k: "pieces", n: 3, spread: .5, p: P("tomato", "#d9402b", "#a8251a"), size: [62, 70], th: 12 },
  redOnion:   { l: "Rödlök", k: "pieces", n: 6, spread: .62, p: P("ring", "#a4508f", "#f1e2ee"), size: [40, 56], th: 6 },
  bacon:      { l: "Bacon", k: "pieces", n: 3, spread: .45, p: P("strip", "#a33d29", "#f2cfae"), size: [58, 66], th: 8 },
  dressing:   { l: "Dressing", k: "drizzle", rx: 170, c: "#efe4c4", c2: "#fffaf0", w: 11, th: 4 },
  remoulade:  { l: "Remouladsås", k: "drizzle", rx: 160, c: "#e9dda2", c2: "#fbf5d6", w: 11, th: 4 },
  ketchup:    { l: "Ketchup", k: "drizzle", rx: 160, c: "#b3261a", c2: "#e45a43", w: 9, th: 4 },
  mustard:    { l: "Senap", k: "drizzle", rx: 150, c: "#d9a51c", c2: "#f4cf55", w: 8, th: 4 },
  halloumi:   { l: "Grillad halloumi", k: "slab", rx: 170, h: 22, top: ["#f3ead1", "#e3d3a8"], side: ["#efe3c2", "#d9c89a"], grill: "#8a5a2a", th: 22 },
  chickenFillet:{ l: "Kycklingfilé", k: "slab", rx: 180, h: 28, amp: .07, top: ["#d9a056", "#b8742f"], side: ["#c98a40", "#8e5420"], sp: [["#e8b870", "#9a5a22", "#f1cc8a"], 900, 1, 3, .7], th: 28 },
  fishBreaded:{ l: "Panerad fisk", k: "slab", rx: 180, h: 24, amp: .06, top: ["#e0a95c", "#c1803a"], side: ["#c98a40", "#9a5f25"], sp: [["#f1c47a", "#a8692a", "#eab468"], 1100, 1, 3, .8], th: 24 },
  // board / plate
  board:      { l: "Ekplanka", k: "board", rx: 250, h: 22, th: 22 },
  plate:      { l: "Tallrik", k: "plate", rx: 238, th: 10 },
  dipBowl:    { l: "Dippsås i skål", k: "pieces", n: 1, spread: 0, p: P("bowl", "#f2dc8a", "#e6e0d2"), size: [120, 120], th: 50 },
  // plank parts
  mashPiping: { l: "Potatismos", k: "piping", rx: 230, c: "#f6e2a6", th: 22 },
  mash:       { l: "Potatismos", k: "mound", rx: 120, dh: 46, c: ["#fbefc4", "#efd593", "#cfae63"], th: 36 },
  vegMix:     { l: "Stekta grönsaker", k: "pieces", n: 22, spread: .62, mix: [P("floret", "#4f8a2e", "#355f1d"), P("chunk", "#e07a2a", "#b85a16"), P("strip", "#c9302a", "#9e1f19"), P("chunk", "#f1d24a", "#c9a51e")], size: [16, 24], th: 16 },
  steak:      { l: "Oxfilé", k: "slab", rx: 112, h: 44, amp: .08, top: ["#6a3519", "#4a220e"], side: ["#9a4632", "#5a2716"], grill: "#1d0c04", sp: [["#2a1208", "#7a4422"], 400, 1, 3, .7], pink: 1, th: 44 },
  porkSteak:  { l: "Fläskfilé", k: "slab", rx: 104, h: 40, amp: .08, top: ["#c58f5c", "#a0683a"], side: ["#d6a77c", "#9c6538"], grill: "#4a2410", th: 40 },
  pikeperch:  { l: "Gösfilé", k: "slab", rx: 140, h: 22, amp: .1, top: ["#f4ead4", "#e0c890"], side: ["#efe3c6", "#d4bc8a"], flakes: 1, th: 22 },
  thinBeef:   { l: "Lövbiff", k: "slab", rx: 170, h: 10, amp: .12, top: ["#7a4024", "#56290f"], side: ["#8a4026", "#5a2716"], grill: "#24100a", th: 10 },
  schnitzel:  { l: "Schnitzel", k: "slab", rx: 200, h: 14, amp: .12, top: ["#e3ac5e", "#bb7a34"], side: ["#c98a40", "#93561e"], sp: [["#f3c87e", "#9a5c22", "#d39648"], 1600, 1, 3, .8], th: 14 },
  redWine:    { l: "Rödvinssås", k: "drizzle", rx: 120, c: "#5a1a14", c2: "#8e3a2a", w: 10, th: 4 },
  bearnaise:  { l: "Bearnaisesås", k: "drizzle", rx: 130, c: "#efc65a", c2: "#fbe7a0", w: 11, th: 4 },
  shrimpDill: { l: "Räkdillsås", k: "drizzle", rx: 130, c: "#f2c9a8", c2: "#fff0e2", w: 11, dots: "#4f7a2a", th: 4 },
  shrimpTop:  { l: "Räkor", k: "pieces", n: 7, spread: .35, p: P("curl", "#f08a6a", "#fbd0b8"), size: [22, 28], th: 10 },
  friedPotato:{ l: "Stekt potatis", k: "pieces", n: 16, spread: .7, p: P("chunk", "#e9b25a", "#b0702a"), size: [22, 30], th: 18 },
  wedges:     { l: "Klyftpotatis", k: "pieces", n: 9, spread: .68, p: P("wedge", "#e3a34e", "#f5d996"), size: [34, 42], th: 18 },
  skewer:     { l: "Kycklingspett", k: "pieces", n: 1, spread: 0, p: P("skewer", "#d9a056", "#9a5a22"), size: [200, 200], th: 30 },
  ajvar:      { l: "Ajvar", k: "pieces", n: 1, spread: 0, p: P("dollop", "#c2421f", "#e8744a"), size: [42, 42], dx: -90, th: 14 },
  tzatziki:   { l: "Tzatziki", k: "pieces", n: 1, spread: 0, p: P("dollop", "#eef0e2", "#ffffff", { herbs: "#5f8a3a" }), size: [42, 42], dx: 90, th: 14 },
  // grill parts
  fries:      { l: "Pommes frites", k: "pieces", n: 34, spread: .62, p: P("stick", "#f4c95e", "#d79a2e"), size: [40, 56], th: 22 },
  pytt:       { l: "Pyttipanna", k: "pieces", n: 40, spread: .66, mix: [P("cube", "#e3b062", "#a8702e"), P("cube", "#7a3e22", "#4f2412"), P("cube", "#efe2c2", "#c9b088")], size: [14, 18], th: 18 },
  friedEgg:   { l: "Stekt ägg", k: "egg", rx: 96, th: 10 },
  beets:      { l: "Rödbetor", k: "pieces", n: 9, spread: .4, dx: 150, p: P("cube", "#8a1e3a", "#5a0f24"), size: [12, 15], th: 10 },
  falukorv:   { l: "Falukorv", k: "pieces", n: 4, spread: .4, p: P("disc", "#c7735a", "#8e3e2a", { pat: "sausage" }), size: [46, 50], th: 14 },
  sausage:    { l: "Korv", k: "pieces", n: 1, spread: 0, p: P("sausage", "#b4502e", "#7a2a14"), size: [180, 180], th: 26 },
  boston:     { l: "Bostongurka", k: "pieces", n: 26, spread: .4, p: P("cube", "#9fb43a", "#6a7f1e"), size: [7, 10], th: 6 },
  meatballs:  { l: "Köttbullar", k: "pieces", n: 10, spread: .5, p: P("ball", "#7a4022", "#3d1c0c"), size: [20, 24], th: 26 },
  meatballsS: { l: "Köttbullar", k: "pieces", n: 5, spread: .4, p: P("ball", "#7a4022", "#3d1c0c"), size: [20, 24], th: 26 },
  lingon:     { l: "Lingonsylt", k: "pieces", n: 1, spread: 0, dx: 120, p: P("dollop", "#9e1b2a", "#d8455a", { berries: 1 }), size: [36, 36], th: 12 },
  nuggets:    { l: "Chicken nuggets", k: "pieces", n: 6, spread: .45, p: P("nugget", "#d9984a", "#9a5a22"), size: [30, 36], th: 20 },
  nuggetsS:   { l: "Chicken nuggets", k: "pieces", n: 4, spread: .4, p: P("nugget", "#d9984a", "#9a5a22"), size: [30, 36], th: 20 },
  dip:        { l: "Dippsås", k: "pieces", n: 1, spread: 0, dx: 140, p: P("bowl", "#efe4c4", "#e6e0d2"), size: [44, 44], th: 22 },
  pancake:    { l: "Pannkaka", k: "slab", rx: 190, h: 6, amp: .04, top: ["#f3d58f", "#d9a457"], side: ["#e9c27a", "#c99550"], sp: [["#b57a32", "#d9a457"], 160, 3, 9, .45], th: 6 },
  cream:      { l: "Vispgrädde", k: "pieces", n: 1, spread: 0, dx: -40, p: P("dollop", "#fbf6ea", "#ffffff"), size: [48, 48], th: 16 },
  jam:        { l: "Sylt", k: "pieces", n: 1, spread: 0, dx: 70, p: P("dollop", "#a51e2a", "#d8455a"), size: [34, 34], th: 10 },
  chiliCheese:{ l: "Chili cheese", k: "pieces", n: 4, spread: .3, p: P("nugget", "#e09a3a", "#a8601e"), size: [32, 38], th: 22 },
  mozzSticks: { l: "Mozzarella sticks", k: "pieces", n: 4, spread: .3, p: P("stick", "#d98c3a", "#a8601e", { fat: 1 }), size: [90, 100], th: 22 },
  onionRings: { l: "Lökringar", k: "pieces", n: 4, spread: .35, p: P("ring", "#d99a48", "#a8692a", { thick: 1 }), size: [50, 58], th: 20 },
  wings:      { l: "Hot wings", k: "pieces", n: 4, spread: .35, p: P("wing", "#b8461f", "#7a2410"), size: [40, 46], th: 22 },
  // pizza
  dough:      { l: "Pizzadeg", k: "pizzaBase", rx: 232, th: 14 },
  tomatoSauce:{ l: "Tomatsås", k: "slab", rx: 204, h: 3, amp: .03, top: ["#c23a22", "#a32a16"], side: ["#a32a16", "#7a1e10"], sp: [["#8e2210", "#d24e30", "#6e8c2e"], 260, 1, 3, .6], th: 4 },
  cheese:     { l: "Ost", k: "slab", rx: 200, h: 5, amp: .07, freq: 2, top: ["#f5d98a", "#e8bc5c"], side: ["#efc56a", "#d9a245"], sp: [["#f9e7ad", "#d49a43", "#b2702c"], 220, 4, 14, .55], th: 6 },
  cheeseTop:  { l: "Extra ost", k: "pieces", n: 26, spread: .78, p: P("chunk", "#f6dc90", "#e2b35a"), size: [12, 18], th: 6 },
  lid:        { l: "Inbakat deglock", k: "dome", rx: 222, dh: 58, h: 6, c: ["#f0cd8e", "#d9a55c", "#a8692a"], spots: 1, th: 40 },
  ham:        { l: "Skinka", k: "pieces", n: 14, spread: .78, p: P("chunk", "#eaa29e", "#c8746e"), size: [18, 24], th: 6 },
  mushroom:   { l: "Champinjoner", k: "pieces", n: 14, spread: .78, p: P("mushroom", "#dccdb4", "#8a7660"), size: [18, 22], th: 6 },
  tuna:       { l: "Tonfisk", k: "pieces", n: 18, spread: .78, p: P("chunk", "#cdb79a", "#9a8264"), size: [10, 15], th: 6 },
  salami:     { l: "Salami", k: "pieces", n: 11, spread: .78, p: P("disc", "#b3322a", "#7e1d16", { pat: "salami" }), size: [26, 30], th: 6 },
  shrimp:     { l: "Räkor", k: "pieces", n: 14, spread: .76, p: P("curl", "#f08a6a", "#fbd0b8"), size: [14, 18], th: 8 },
  scampi:     { l: "Scampi", k: "pieces", n: 10, spread: .74, p: P("curl", "#e6683e", "#f6b48a"), size: [20, 24], th: 10 },
  pineapple:  { l: "Ananas", k: "pieces", n: 14, spread: .78, p: P("chunk", "#f6d652", "#d9b02a"), size: [13, 17], th: 6 },
  mince:      { l: "Köttfärs", k: "pieces", n: 40, spread: .8, p: P("chunk", "#6b3a22", "#3d1c0c"), size: [7, 11], th: 6 },
  mussels:    { l: "Musslor", k: "pieces", n: 10, spread: .74, p: P("mussel", "#f0a060", "#2a2622"), size: [16, 20], th: 8 },
  banana:     { l: "Banan", k: "pieces", n: 12, spread: .76, p: P("disc", "#f6e7aa", "#e3c870", { pat: "banana" }), size: [15, 18], th: 6 },
  curry:      { l: "Curry", k: "dust", rx: 190, c: ["#d9a21b", "#e8b830", "#b9820e"], th: 2 },
  garlic:     { l: "Färsk vitlök", k: "dust", rx: 180, c: ["#f6f0dc", "#e9dfc2"], big: 1, th: 2 },
  onion:      { l: "Lök", k: "pieces", n: 12, spread: .78, p: P("ring", "#f1e6cc", "#f8f1df"), size: [16, 22], th: 5 },
  onionRings2:{ l: "Lök", k: "pieces", n: 10, spread: .7, p: P("ring", "#f1e6cc", "#f8f1df"), size: [14, 20], th: 5 },
  redOnionSmall:{ l: "Rödlök", k: "pieces", n: 12, spread: .76, p: P("ring", "#a4508f", "#f1e2ee"), size: [14, 20], th: 5 },
  jalapeno:   { l: "Jalapeño", k: "pieces", n: 14, spread: .78, p: P("ring", "#3f8a2e", "#c7e48f", { seedsIn: 1 }), size: [10, 13], th: 5 },
  baconBits:  { l: "Bacon", k: "pieces", n: 14, spread: .78, p: P("strip", "#a33d29", "#f2cfae"), size: [12, 16], th: 6 },
  artichoke:  { l: "Kronärtskocka", k: "pieces", n: 8, spread: .74, p: P("leaf", "#a9b47a", "#7a8650"), size: [20, 24], th: 6 },
  beef:       { l: "Oxfilé", k: "pieces", n: 14, spread: .78, p: P("strip", "#6a3520", "#a8604a"), size: [16, 21], th: 7 },
  pork:       { l: "Fläskfilé", k: "pieces", n: 12, spread: .78, p: P("strip", "#b07a4c", "#d9a87c"), size: [16, 20], th: 7 },
  chicken:    { l: "Kycklingfilé", k: "pieces", n: 14, spread: .78, p: P("chunk", "#e6c088", "#b98446"), size: [15, 20], th: 8 },
  kebab:      { l: "Kebabkött", k: "pieces", n: 22, spread: .8, p: P("strip", "#7a4426", "#a8683e"), size: [14, 19], th: 8 },
  bearnaiseP: { l: "Bearnaisesås", k: "drizzle", rx: 190, c: "#efc65a", c2: "#fbe7a0", w: 9, th: 4 },
  taco:       { l: "Tacosås", k: "drizzle", rx: 185, c: "#b5452a", c2: "#de6d48", w: 8, th: 4 },
  santafe:    { l: "Santafesås", k: "drizzle", rx: 185, c: "#d9762f", c2: "#f2a060", w: 8, th: 4 },
  bbq:        { l: "BBQ-sås", k: "drizzle", rx: 185, c: "#4a170c", c2: "#7a2e18", w: 9, th: 4 },
  sauceCream: { l: "Valfri sås", k: "drizzle", rx: 180, c: "#f1ead6", c2: "#ffffff", w: 9, th: 4 },
  spice:      { l: "Kryddmix", k: "dust", rx: 190, c: ["#a3521f", "#7a3a12", "#c96a2a"], th: 2 },
  cayenne:    { l: "Cayennepeppar", k: "dust", rx: 190, c: ["#c0391b", "#9e2410", "#e05030"], th: 2 },
  gorgonzola: { l: "Gorgonzola", k: "pieces", n: 12, spread: .76, p: P("chunk", "#efe9d6", "#b9c2c9", { veins: "#5a7a96" }), size: [15, 19], th: 6 },
  peanuts:    { l: "Jordnötter", k: "pieces", n: 20, spread: .78, p: P("ball", "#c99252", "#8a5a2a"), size: [6, 8], th: 6 },
  lettuceShred:{ l: "Isbergssallad", k: "shred", rx: 196, th: 10 },
  tomatoDice: { l: "Tomat", k: "pieces", n: 16, spread: .76, p: P("cube", "#d9402b", "#a8251a"), size: [11, 14], th: 6 },
  cucumber:   { l: "Gurka", k: "pieces", n: 12, spread: .76, p: P("disc", "#e8f0c6", "#3d7a2a", { pat: "cucumber" }), size: [16, 19], th: 6 },
  pepperoncini:{ l: "Fefferoni", k: "pieces", n: 10, spread: .74, p: P("ring", "#b9c94a", "#e3ec9a", { seedsIn: 1 }), size: [11, 14], th: 6 },
  pepper:     { l: "Paprika", k: "pieces", n: 14, spread: .78, mix: [P("strip", "#c9302a", "#9e1f19"), P("strip", "#4f8a2e", "#2f5f1a")], size: [15, 19], th: 6 },
  falafel:    { l: "Falafel", k: "pieces", n: 9, spread: .64, p: P("ball", "#8e5e2c", "#4f2f12", { crumbs: 1 }), size: [20, 24], th: 24 },
  feta:       { l: "Fetaost", k: "pieces", n: 14, spread: .76, p: P("cube", "#f6f2e4", "#d9d3bd"), size: [11, 14], th: 8 },
  olives:     { l: "Oliver", k: "pieces", n: 14, spread: .76, p: P("ring", "#2a2420", "#4a3c34"), size: [9, 11], th: 6 },
  rocket:     { l: "Ruccola", k: "pieces", n: 16, spread: .76, p: P("leaf", "#4f7f2a", "#3a6420"), size: [18, 24], th: 6 },
  zucchini:   { l: "Stekt zucchini", k: "pieces", n: 12, spread: .76, p: P("disc", "#dfe6ae", "#3d6a2a", { pat: "zucchini" }), size: [16, 19], th: 6 },
  sunTomato:  { l: "Soltorkade tomater", k: "pieces", n: 10, spread: .74, p: P("leaf", "#8e2a1a", "#5e160c"), size: [16, 20], th: 6 },
  quorn:      { l: "Quornbitar", k: "pieces", n: 16, spread: .76, p: P("chunk", "#ddcba2", "#b49e72"), size: [13, 17], th: 8 },
  mozzarella: { l: "Mozzarella", k: "pieces", n: 9, spread: .7, p: P("disc", "#f8f4e8", "#e2dac4", { pat: "mozz" }), size: [24, 30], th: 6 },
  corn:       { l: "Majs", k: "pieces", n: 40, spread: .78, p: P("ball", "#f5c842", "#c9961a"), size: [5, 6], th: 5 },
  halloumiCubes:{ l: "Halloumi", k: "pieces", n: 12, spread: .7, p: P("cube", "#f2e8cc", "#c99a5a"), size: [14, 17], th: 10 },
  ham2:       null,
};

/* ---------- 4. Build a dish → list of layer keys ---------- */
function tokensFrom(text) {
  const t = " " + text.toLowerCase(), found = [];
  TOKENS.forEach(([re, key]) => { const m = t.match(re); if (m && !found.some((f) => f.key === key)) found.push({ key, at: m.index }); });
  // "rödlök" also matches "lök"; "vitlök" too
  const keys = found.sort((a, b) => a.at - b.at).map((f) => f.key);
  return keys.filter((k) => !(k === "onion" && (/rödlök|vitlök/.test(t) && !/(^|[\s,])(gul )?lök[\s,&]/.test(t.replace(/rödlök|vitlök/g, "")))));
}
const byGroup = (keys) => [...keys].sort((a, b) => (GROUP[a] || 0) - (GROUP[b] || 0));
const uniq = (a) => a.filter((k, i) => k && (a.indexOf(k) === i || ["patty", "cheddar", "pancake"].includes(k)));

function recipeFor(d) {
  const r = RECIPES[d.cat + ":" + d.name] || RECIPES[d.name];
  if (r) return r;
  const t = tokensFrom(d.desc || "");
  if (d.cat === "pizza") {
    const top = byGroup(t.map((k) => (k === "bearnaise" ? "bearnaiseP" : k)).filter((k) => k !== "cheeseTop" || !/^ost/.test(d.desc)));
    const out = ["dough", "tomatoSauce", "cheese", ...top.filter((k) => k !== "cheeseTop")];
    if (/inbakad/.test(d.desc)) out.push("lid");
    return uniq(out);
  }
  if (d.cat === "sallad") return uniq(["plate", ...SALAD_BASE, ...t.filter((k) => !["fries"].includes(k)).map((k) => (k === "baconBits" ? "baconBits" : k)), "sauceCream"]);
  if (d.cat === "kebab") {
    if (d.grp === "Rullar") return uniq(["tunnbrod", ...t.filter((k) => k !== "cheeseTop"), ...(t.includes("cheeseTop") ? ["cheeseTop"] : []), ...ROLL_FILL]);
    if (d.grp === "Tallrikar") return uniq(["plate", "fries", ...t.filter((k) => k !== "fries"), ...PLATE_FILL]);
    if (d.grp === "Pita") return uniq(["pitaBottom", ...t, ...PLATE_FILL, "pitaTop"]);
  }
  return uniq(["plate", ...t]);
}

/* ---------- 5. Painting ---------- */
const TILT = 0.34, CW = 560, CH = 330, AX = 280, AY = 196;
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + rnd() * (b - a);
const pick = (a) => a[(rnd() * a.length) | 0];
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return `rgb(${m(r)},${m(g)},${m(b)})`; }
function wob() { const p = [rr(0, 6.3), rr(0, 6.3), rr(0, 6.3)]; return (t, amp = 0, fr = 1) => 1 + amp * (Math.sin(t * 3 * fr + p[0]) * .5 + Math.sin(t * 7 * fr + p[1]) * .3 + Math.sin(t * 13 * fr + p[2]) * .2); }
function pt(cx, cy, rx, ry, t, f, amp, fr) { const k = f ? f(t, amp, fr) : 1; return [cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]; }
function ellPath(g, cx, cy, rx, ry, f, amp, fr) { g.beginPath(); for (let i = 0; i <= 160; i++) { const [x, y] = pt(cx, cy, rx, ry, (i / 160) * Math.PI * 2, f, amp, fr); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
function shadow(g, cx, cy, rx, a = .45) {
  g.save(); g.translate(cx, cy); g.scale(1, TILT);
  const gr = g.createRadialGradient(0, 0, rx * .2, 0, 0, rx * 1.12); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx * 1.12, 0, 7); g.fill(); g.restore();
}
function specksIn(g, cx, cy, rx, ry, [cols, n, r0, r1, a]) {
  for (let i = 0; i < n; i++) { const t = rr(0, 6.283), d = Math.sqrt(rnd()) * .96; g.globalAlpha = a * rr(.3, 1); g.fillStyle = pick(cols); g.beginPath(); g.ellipse(cx + Math.cos(t) * rx * d, cy + Math.sin(t) * ry * d, rr(r0, r1), rr(r0, r1) * TILT * 1.6, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
function gloss(g, cx, cy, rx, ry, a = .18) {
  const gr = g.createRadialGradient(cx - rx * .35, cy - ry * .5, 2, cx - rx * .35, cy - ry * .5, rx * .7);
  gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fill();
}

function drawSlab(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT, h = o.h, f = wob(), amp = o.amp || 0, fr = o.freq || 1;
  shadow(g, cx, cy + h + 4, rx);
  // side wall (front half)
  g.beginPath();
  for (let i = 0; i <= 80; i++) { const [x, y] = pt(cx, cy, rx, ry, (i / 80) * Math.PI, f, amp, fr); i ? g.lineTo(x, y + h) : g.moveTo(x, y + h); }
  for (let i = 80; i >= 0; i--) { const [x, y] = pt(cx, cy, rx, ry, (i / 80) * Math.PI, f, amp, fr); g.lineTo(x, y); }
  g.closePath();
  const sg = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  sg.addColorStop(0, shade(o.side[1], -.25)); sg.addColorStop(.35, o.side[0]); sg.addColorStop(.7, o.side[1]); sg.addColorStop(1, shade(o.side[1], -.35));
  g.fillStyle = sg; g.fill();
  if (o.pink) { g.save(); g.clip(); g.fillStyle = "rgba(196,92,84,.55)"; g.fillRect(cx - rx, cy + h * .3, rx * 2, h * .5); g.restore(); }
  // top face
  ellPath(g, cx, cy, rx, ry, f, amp, fr);
  const tg = g.createRadialGradient(cx - rx * .2, cy - ry * .2, rx * .05, cx, cy, rx);
  tg.addColorStop(0, o.top[0]); tg.addColorStop(1, o.top[1]); g.fillStyle = tg; g.fill();
  g.save(); g.clip();
  if (o.sp) specksIn(g, cx, cy, rx, ry, o.sp);
  if (o.veins) { g.strokeStyle = "rgba(245,252,225,.6)"; g.lineWidth = 1.6; for (let i = 0; i < 22; i++) { const t = (i / 22) * 6.283; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(t + .25) * rx * .5, cy + Math.sin(t + .25) * ry * .5, cx + Math.cos(t) * rx, cy + Math.sin(t) * ry); g.stroke(); } }
  if (o.grill) { g.strokeStyle = o.grill; g.globalAlpha = .75; g.lineWidth = 7; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 34 - ry, cy - ry); g.lineTo(cx + i * 34 + ry, cy + ry); g.stroke(); } g.globalAlpha = 1; }
  if (o.flakes) { g.strokeStyle = "rgba(200,170,120,.5)"; g.lineWidth = 2; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 22, cy - ry); g.quadraticCurveTo(cx + i * 22 + 18, cy, cx + i * 22, cy + ry); g.stroke(); } }
  ellPath(g, cx, cy, rx, ry, f, amp, fr); gloss(g, cx, cy, rx, ry, .14);
  g.restore();
}
function drawDome(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT, dh = o.dh;
  shadow(g, cx, cy + o.h + 4, rx);
  g.beginPath(); g.moveTo(cx - rx, cy);
  g.bezierCurveTo(cx - rx, cy - dh * 1.3, cx + rx, cy - dh * 1.3, cx + rx, cy);
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false); g.closePath();
  const gr = g.createRadialGradient(cx - rx * .3, cy - dh * .8, 4, cx, cy - dh * .2, rx * 1.15);
  gr.addColorStop(0, o.c[0]); gr.addColorStop(.45, o.c[1]); gr.addColorStop(1, o.c[2]); g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  if (o.seeds) for (let i = 0; i < 70; i++) { const x = rr(-.85, .85), y = cy - dh * .95 * Math.pow(1 - x * x, .7) * rr(.15, .95) + rr(-4, ry * .6); g.save(); g.translate(cx + x * rx, y); g.rotate(rr(-1, 1)); g.fillStyle = "#f7ead0"; g.beginPath(); g.ellipse(0, 0, 5.5, 2.6, 0, 0, 7); g.fill(); g.fillStyle = "rgba(120,70,20,.35)"; g.beginPath(); g.ellipse(1, 1.4, 5, 1.4, 0, 0, 7); g.fill(); g.restore(); }
  if (o.spots) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(140,80,30,${rr(.15, .45)})`; g.beginPath(); g.ellipse(cx + rr(-.85, .85) * rx, cy - rr(0, dh * .9), rr(3, 10), rr(2, 5), rr(0, 3), 0, 7); g.fill(); }
  // rim shadow line at the base
  g.strokeStyle = "rgba(60,25,5,.35)"; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.stroke();
  g.restore();
}
function drawMound(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT, dh = o.dh;
  shadow(g, cx, cy + 4, rx, .3);
  g.beginPath(); g.moveTo(cx - rx, cy);
  for (let i = 0; i <= 40; i++) { const x = -1 + (i / 40) * 2, y = -dh * Math.pow(1 - x * x, .6) * (1 + .08 * Math.sin(i * 1.7)); g.lineTo(cx + x * rx, cy + y); }
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false); g.closePath();
  const gr = g.createRadialGradient(cx - rx * .3, cy - dh * .7, 3, cx, cy - dh * .2, rx * 1.1);
  gr.addColorStop(0, o.c[0]); gr.addColorStop(.6, o.c[1]); gr.addColorStop(1, o.c[2]); g.fillStyle = gr; g.fill();
  g.save(); g.clip(); g.strokeStyle = "rgba(190,150,80,.35)"; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(cx + rr(-30, 30), cy - dh * rr(.1, .7), rr(20, 60), rr(6, 14), 0, 3.4, 6); g.stroke(); }
  g.restore();
}
function drawBoard(g, o, cx = AX, cy = AY) {
  const w = o.rx, d = o.rx * TILT * .78, h = o.h;
  shadow(g, cx, cy + h + 6, w, .5);
  const rect = (y) => { g.beginPath(); g.moveTo(cx - w + 18, y - d); g.lineTo(cx + w - 18, y - d); g.quadraticCurveTo(cx + w, y - d, cx + w, y - d + 10); g.lineTo(cx + w, y + d - 10); g.quadraticCurveTo(cx + w, y + d, cx + w - 18, y + d); g.lineTo(cx - w + 18, y + d); g.quadraticCurveTo(cx - w, y + d, cx - w, y + d - 10); g.lineTo(cx - w, y - d + 10); g.quadraticCurveTo(cx - w, y - d, cx - w + 18, y - d); g.closePath(); };
  rect(cy + h); g.fillStyle = "#4a2c16"; g.fill();
  g.fillStyle = "#6b4222"; g.fillRect(cx - w + 2, cy + d - 2, w * 2 - 4, h);
  rect(cy);
  const gr = g.createLinearGradient(0, cy - d, 0, cy + d); gr.addColorStop(0, "#a06a3a"); gr.addColorStop(1, "#7d4f28"); g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 46; i++) { g.strokeStyle = rnd() < .5 ? "rgba(60,32,14,.35)" : "rgba(210,160,100,.2)"; g.lineWidth = rr(.6, 2.4); const y = cy - d + rnd() * d * 2; g.beginPath(); g.moveTo(cx - w, y); for (let x = -w; x <= w; x += 30) g.lineTo(cx + x, y + Math.sin(x * .02 + i) * 2.5); g.stroke(); }
  g.fillStyle = "rgba(30,14,4,.35)"; g.beginPath(); g.ellipse(cx - w * .7, cy, 9, 5, 0, 0, 7); g.fill(); // knot
  g.restore();
}
function drawPlate(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT;
  shadow(g, cx, cy + 12, rx, .5);
  g.fillStyle = "#c9c0ad"; g.beginPath(); g.ellipse(cx, cy + 8, rx * .98, ry * .98, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7);
  const gr = g.createRadialGradient(cx - rx * .3, cy - ry * .4, 5, cx, cy, rx); gr.addColorStop(0, "#f6f2e8"); gr.addColorStop(1, "#ddd5c4"); g.fillStyle = gr; g.fill();
  g.strokeStyle = "rgba(150,138,115,.45)"; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy + 3, rx * .72, ry * .72, 0, 0, 7); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, rx * .995, ry * .995, 0, 3.4, 6); g.stroke();
}
function drawPizzaBase(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT;
  drawSlab(g, { rx, h: 10, amp: .02, top: ["#ebc98f", "#e1b676"], side: ["#d39a52", "#a8692a"], sp: [["#c9934f", "#f1d6a6"], 300, 1, 4, .5] }, cx, cy);
  // crust rim
  g.save(); g.lineWidth = 26; const f = wob();
  ellPath(g, cx, cy - 3, rx * .93, ry * .93, f, .015, 2);
  const gr = g.createLinearGradient(0, cy - ry, 0, cy + ry); gr.addColorStop(0, "#d99a52"); gr.addColorStop(1, "#b9742f");
  g.strokeStyle = gr; g.stroke();
  g.lineWidth = 8; g.strokeStyle = "rgba(255,230,180,.35)"; ellPath(g, cx, cy - 8, rx * .93, ry * .93, f, .015, 2); g.stroke();
  for (let i = 0; i < 26; i++) { const t = rr(0, 6.28), [x, y] = pt(cx, cy - 3, rx * .93, ry * .93, t); g.fillStyle = `rgba(70,30,8,${rr(.25, .6)})`; g.beginPath(); g.ellipse(x + rr(-6, 6), y + rr(-4, 4), rr(3, 9), rr(2, 4), 0, 0, 7); g.fill(); }
  g.restore();
}
function drawCheese(g, o, cx = AX, cy = AY) {
  const s = o.rx, a = .22, P2 = (x, z) => { const X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a); return [cx + X, cy + Z * TILT]; };
  const c = [P2(-s * .72, -s * .72), P2(s * .72, -s * .72), P2(s * .72, s * .72), P2(-s * .72, s * .72)];
  // drips at the two front corners
  g.fillStyle = "#e39a2c";
  [c[2], c[3]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 26, y - 4); g.quadraticCurveTo(x, y + 34, x + 22, y - 2); g.closePath(); g.fill(); });
  g.beginPath(); g.moveTo(...c[0]); g.quadraticCurveTo(cx, c[0][1] - 6, ...c[1]); g.lineTo(...c[2]); g.quadraticCurveTo(cx, c[2][1] + 10, ...c[3]); g.closePath();
  g.fillStyle = "#d98a1e"; g.save(); g.translate(0, 6); g.fill(); g.restore();
  const gr = g.createLinearGradient(c[0][0], c[0][1], c[2][0], c[2][1]); gr.addColorStop(0, "#f7c25a"); gr.addColorStop(1, "#ee9f2f"); g.fillStyle = gr; g.fill();
  g.save(); g.clip(); gloss(g, cx, cy, s, s * TILT, .22); g.restore();
}
function drawDrizzle(g, o, cx = AX, cy = AY) {
  // a glossy sauce pool with a few drips over the front edge
  const rx = o.rx * .82, ry = rx * TILT, f = wob(), amp = .16, fr = 1.6;
  ellPath(g, cx, cy + 3, rx, ry, f, amp, fr); g.fillStyle = "rgba(0,0,0,.22)"; g.fill();
  g.fillStyle = shade(o.c, -.18);
  for (let i = 0; i < 3; i++) { const t = rr(.5, 2.6), [x, y] = pt(cx, cy, rx, ry, t, f, amp, fr), L = rr(4, 11);
    g.beginPath(); g.moveTo(x - 5, y - 2); g.quadraticCurveTo(x - 5, y + L, x, y + L + 4); g.quadraticCurveTo(x + 5, y + L, x + 5, y - 2); g.fill(); }
  ellPath(g, cx, cy, rx, ry, f, amp, fr);
  const gr = g.createRadialGradient(cx - rx * .25, cy - ry * .3, 2, cx, cy, rx);
  gr.addColorStop(0, o.c2); gr.addColorStop(.35, o.c); gr.addColorStop(1, shade(o.c, -.12));
  g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(cx - rx * .3, cy - ry * .35, rx * .22, ry * .12, -.1, 0, 7); g.fill();
  if (o.dots) for (let i = 0; i < 40; i++) { g.fillStyle = o.dots; g.beginPath(); g.ellipse(cx + rr(-rx, rx) * .85, cy + rr(-ry, ry) * .8, 2.2, 1, rr(0, 3), 0, 7); g.fill(); }
  g.restore();
}
function drawDust(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT;
  for (let i = 0; i < (o.big ? 90 : 420); i++) { const t = rr(0, 6.283), d = Math.sqrt(rnd()) * .95; g.fillStyle = pick(o.c); g.globalAlpha = rr(.5, 1); g.beginPath(); g.ellipse(cx + Math.cos(t) * rx * d, cy + Math.sin(t) * ry * d, o.big ? rr(2.5, 4.5) : rr(.8, 2), o.big ? rr(1.5, 2.5) : rr(.6, 1.4), rr(0, 3), 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
function drawShred(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT; g.lineCap = "round";
  for (let i = 0; i < 160; i++) { const t = rr(0, 6.283), d = Math.sqrt(rnd()) * .92, x = cx + Math.cos(t) * rx * d, y = cy + Math.sin(t) * ry * d, a = rr(0, 6.28), L = rr(14, 30);
    g.strokeStyle = pick(["#cfe89a", "#a9d46a", "#e6f3c4", "#8cc152"]); g.lineWidth = rr(3, 6);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * .5 + 4, y + Math.sin(a) * L * .2 - 4, x + Math.cos(a) * L, y + Math.sin(a) * L * TILT); g.stroke(); }
}
function drawPiping(g, o, cx = AX, cy = AY) {
  const rx = o.rx * .8, ry = rx * TILT * .9, pts = [];
  for (let i = 0; i < 26; i++) { const t = (i / 26) * 6.283; pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); }
  pts.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => {
    g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(x, y + 8, 22, 9, 0, 0, 7); g.fill();
    for (let k = 0; k < 3; k++) { const r = 20 - k * 6, yy = y - k * 8; const gr = g.createRadialGradient(x - r * .4, yy - r * .5, 1, x, yy, r * 1.2); gr.addColorStop(0, "#fff6d8"); gr.addColorStop(1, shade(o.c, -.12)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, yy, r, r * .62, 0, 0, 7); g.fill(); }
  });
}
function drawEgg(g, o, cx = AX, cy = AY) {
  const rx = o.rx, ry = rx * TILT, f = wob();
  shadow(g, cx, cy + 5, rx, .25);
  ellPath(g, cx, cy, rx, ry, f, .12, 1.4); g.fillStyle = "#fbf8ee"; g.fill();
  g.strokeStyle = "rgba(200,140,60,.6)"; g.lineWidth = 4; g.stroke();
  const gr = g.createRadialGradient(cx - 8, cy - 12, 2, cx, cy - 6, 30); gr.addColorStop(0, "#ffd96a"); gr.addColorStop(1, "#e89a12");
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx + 6, cy - 6, 30, 22, 0, 0, 7); g.fill();
}

/* pieces */
function piece(g, x, y, s, a, p) {
  const flat = (fn, th = 4) => {
    g.save(); g.translate(x, y + th); g.scale(1, TILT); g.rotate(a); fn(true); g.restore();
    g.save(); g.translate(x, y); g.scale(1, TILT); g.rotate(a); fn(false); g.restore();
  };
  const fill = (under, c) => { g.fillStyle = under ? shade(c, -.35) : c; g.fill(); };
  switch (p.shape) {
    case "disc": flat((u) => {
      g.beginPath(); g.arc(0, 0, s, 0, 7); fill(u, p.pat === "cucumber" || p.pat === "zucchini" ? p.c2 : p.c);
      if (u) return;
      if (p.pat === "cucumber" || p.pat === "zucchini") { g.fillStyle = p.c; g.beginPath(); g.arc(0, 0, s * .82, 0, 7); g.fill(); g.fillStyle = "rgba(170,190,110,.6)"; for (let i = 0; i < 7; i++) { const t = i / 7 * 6.28; g.beginPath(); g.ellipse(Math.cos(t) * s * .4, Math.sin(t) * s * .4, s * .12, s * .06, t, 0, 7); g.fill(); } }
      if (p.pat === "salami") { g.fillStyle = "rgba(250,220,210,.75)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(rr(-.6, .6) * s, rr(-.6, .6) * s, rr(1.5, 3.5), 0, 7); g.fill(); } }
      if (p.pat === "banana") { g.fillStyle = "rgba(160,130,60,.45)"; g.beginPath(); g.arc(0, 0, s * .25, 0, 7); g.fill(); }
      if (p.pat === "sausage") { g.fillStyle = "#e9b6a0"; g.beginPath(); g.arc(0, 0, s * .82, 0, 7); g.fill(); g.fillStyle = "rgba(200,120,100,.4)"; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(rr(-.6, .6) * s, rr(-.6, .6) * s, 1.4, 0, 7); g.fill(); } }
      if (p.pat === "mozz") { g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(-s * .25, -s * .25, s * .4, 0, 7); g.fill(); }
    }, p.pat === "mozz" ? 3 : 5); break;
    case "tomato": flat((u) => {
      g.beginPath(); g.arc(0, 0, s, 0, 7); fill(u, p.c2); if (u) return;
      g.fillStyle = p.c; g.beginPath(); g.arc(0, 0, s * .9, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) { const t = i / 4 * 6.28 + .4; g.fillStyle = "#ef7558"; g.beginPath(); g.ellipse(Math.cos(t) * s * .5, Math.sin(t) * s * .5, s * .3, s * .19, t, 0, 7); g.fill(); g.fillStyle = "#f5d47a"; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(Math.cos(t) * s * rr(.38, .62), Math.sin(t) * s * rr(.38, .62), 3, 1.8, t, 0, 7); g.fill(); } }
      g.fillStyle = "#d9442e"; g.beginPath(); g.arc(0, 0, s * .2, 0, 7); g.fill();
    }, 8); break;
    case "ring": flat((u) => { g.beginPath(); g.arc(0, 0, s, 0, 7); g.arc(0, 0, s * (p.thick ? .5 : .7), 0, 7, true); fill(u, p.c);
      if (!u && p.c2 && !p.thick) { g.strokeStyle = p.c2; g.lineWidth = s * .08; g.beginPath(); g.arc(0, 0, s * .82, 0, 7); g.stroke(); }
      if (!u && p.thick) { g.fillStyle = "rgba(255,220,150,.35)"; g.beginPath(); g.arc(-s * .2, -s * .3, s * .25, 0, 7); g.fill(); }
      if (!u && p.seedsIn) { g.fillStyle = "rgba(250,240,200,.9)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(rr(-.3, .3) * s, rr(-.3, .3) * s, 1.4, 0, 7); g.fill(); } } }, p.thick ? 9 : 3); break;
    case "strip": flat((u) => { g.beginPath(); g.roundRect ? g.roundRect(-s * 1.2, -s * .35, s * 2.4, s * .7, s * .2) : g.rect(-s * 1.2, -s * .35, s * 2.4, s * .7); fill(u, p.c);
      if (!u && p.c2) { g.strokeStyle = p.c2; g.globalAlpha = .7; g.lineWidth = s * .12; g.beginPath(); g.moveTo(-s * 1.1, 0); for (let i = 0; i <= 8; i++) g.lineTo(-s * 1.1 + i * s * .275, Math.sin(i) * s * .1); g.stroke(); g.globalAlpha = 1; } }, 4); break;
    case "chunk": flat((u) => { g.beginPath(); for (let i = 0; i < 7; i++) { const t = i / 7 * 6.28, r = s * rr(.7, 1.05); i ? g.lineTo(Math.cos(t) * r, Math.sin(t) * r) : g.moveTo(Math.cos(t) * r, Math.sin(t) * r); } g.closePath(); fill(u, p.c);
      if (!u) { g.fillStyle = p.c2; g.globalAlpha = .45; g.beginPath(); g.arc(s * .25, s * .2, s * .45, 0, 7); g.fill(); g.globalAlpha = 1; if (p.veins) { g.strokeStyle = p.veins; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-s * .5, 0); g.lineTo(s * .4, s * .3); g.stroke(); } } }, 6); break;
    case "cube": { const t = s * .55; g.fillStyle = shade(p.c, -.3); g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y + s * .5 * TILT * 2); g.lineTo(x, y + s * .5 * TILT * 2 + t); g.lineTo(x - s, y + t); g.closePath(); g.fill();
      g.fillStyle = shade(p.c, -.15); g.beginPath(); g.moveTo(x + s, y); g.lineTo(x, y + s * TILT); g.lineTo(x, y + s * TILT + t); g.lineTo(x + s, y + t); g.closePath(); g.fill();
      g.fillStyle = p.c; g.beginPath(); g.moveTo(x, y - s * TILT); g.lineTo(x + s, y); g.lineTo(x, y + s * TILT); g.lineTo(x - s, y); g.closePath(); g.fill(); break; }
    case "ball": case "nugget": { const rX = p.shape === "nugget" ? s * 1.25 : s, rY = s * (p.shape === "nugget" ? .72 : .95);
      g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(x, y + rY * .8, rX, rX * TILT, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(x - rX * .35, y - rY * .4, 1, x, y, rX * 1.1); gr.addColorStop(0, shade(p.c, .35)); gr.addColorStop(.6, p.c); gr.addColorStop(1, p.c2);
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rX, rY, 0, 0, 7); g.fill();
      if (p.shape === "nugget" || p.crumbs) { for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${rnd() < .5 ? "255,220,150" : "90,45,15"},.5)`; g.beginPath(); g.arc(x + rr(-.8, .8) * rX, y + rr(-.7, .7) * rY, 1.4, 0, 7); g.fill(); } } break; }
    case "stick": { const L = s, w = p.fat ? 13 : 7, ang = a; g.save(); g.translate(x, y); g.rotate(ang * .6); g.scale(1, .7);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(-L / 2, w * .6, L, w * .8);
      const gr = g.createLinearGradient(0, -w, 0, w); gr.addColorStop(0, shade(p.c, .3)); gr.addColorStop(1, p.c2); g.fillStyle = gr;
      g.beginPath(); g.roundRect ? g.roundRect(-L / 2, -w, L, w * 2, 3) : g.rect(-L / 2, -w, L, w * 2); g.fill();
      if (p.fat) for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(${rnd() < .5 ? "255,220,150" : "90,45,15"},.5)`; g.beginPath(); g.arc(rr(-L / 2, L / 2), rr(-w, w), 1.5, 0, 7); g.fill(); }
      g.restore(); break; }
    case "sausage": { const L = s, w = 22; g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(x, y + 18, L * .55, 12, 0, 0, 7); g.fill();
      const gr = g.createLinearGradient(0, y - w, 0, y + w); gr.addColorStop(0, shade(p.c, .3)); gr.addColorStop(.5, p.c); gr.addColorStop(1, p.c2);
      g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x - L / 2, y - w, L, w * 2, w) : g.rect(x - L / 2, y - w, L, w * 2); g.fill();
      g.strokeStyle = "rgba(60,20,8,.5)"; g.lineWidth = 3; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * 22 - 6, y - w * .6); g.lineTo(x + i * 22 + 6, y + w * .6); g.stroke(); } break; }
    case "bun": { const L = s * 1.15, w = 34; g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(x, y + 26, L * .55, 14, 0, 0, 7); g.fill();
      const gr = g.createLinearGradient(0, y - w, 0, y + w); gr.addColorStop(0, "#f3cf8a"); gr.addColorStop(.6, p.c); gr.addColorStop(1, p.c2);
      g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x - L / 2, y - w, L, w * 2, w) : g.rect(x - L / 2, y - w, L, w * 2); g.fill();
      g.fillStyle = "#f2e0b8"; g.beginPath(); g.ellipse(x + L / 2 - 8, y, 8, w * .7, 0, 0, 7); g.fill(); break; }
    case "bowl": { const r = s; g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(x, y + r * .75, r, r * TILT, 0, 0, 7); g.fill();
      g.fillStyle = shade(p.c2, -.15); g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x - r * .9, y + r * .7, x, y + r * .72); g.quadraticCurveTo(x + r * .9, y + r * .7, x + r, y); g.closePath(); g.fill();
      g.fillStyle = p.c2; g.beginPath(); g.ellipse(x, y, r, r * TILT, 0, 0, 7); g.fill();
      g.fillStyle = p.c; g.beginPath(); g.ellipse(x, y + 2, r * .84, r * TILT * .8, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.ellipse(x - r * .3, y, r * .2, r * TILT * .25, 0, 0, 7); g.fill(); break; }
    case "dollop": { const r = s; g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(x, y + 6, r, r * TILT, 0, 0, 7); g.fill();
      for (let k = 0; k < 3; k++) { const rk = r * (1 - k * .28), yk = y - k * r * .22; const gr = g.createRadialGradient(x - rk * .3, yk - rk * .3, 1, x, yk, rk); gr.addColorStop(0, p.c2); gr.addColorStop(1, p.c); g.fillStyle = gr; g.beginPath(); g.ellipse(x, yk, rk, rk * .5, 0, 0, 7); g.fill(); }
      if (p.herbs) for (let i = 0; i < 16; i++) { g.fillStyle = p.herbs; g.beginPath(); g.arc(x + rr(-.7, .7) * r, y + rr(-.6, .2) * r * .5, 1.3, 0, 7); g.fill(); }
      if (p.berries) for (let i = 0; i < 10; i++) { g.fillStyle = "#c2283a"; g.beginPath(); g.arc(x + rr(-.6, .6) * r, y - rr(0, .4) * r, 3.4, 0, 7); g.fill(); } break; }
    case "curl": g.save(); g.translate(x, y); g.scale(1, .75); g.rotate(a); g.lineCap = "round";
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = s * .62; g.beginPath(); g.arc(0, 4, s * .7, .5, 4.6); g.stroke();
      g.strokeStyle = p.c; g.lineWidth = s * .6; g.beginPath(); g.arc(0, 0, s * .7, .5, 4.6); g.stroke();
      g.strokeStyle = p.c2; g.lineWidth = s * .14; for (let i = 0; i < 5; i++) { const t = .7 + i * .75; g.beginPath(); g.arc(0, 0, s * .7, t, t + .18); g.stroke(); }
      g.restore(); break;
    case "leaf": flat((u) => { g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s * .2, -s * .7, s, 0); g.quadraticCurveTo(-s * .2, s * .7, -s, 0); fill(u, p.c);
      if (!u) { g.strokeStyle = shade(p.c, .25); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-s * .9, 0); g.lineTo(s * .9, 0); g.stroke(); } }, 2); break;
    case "mushroom": flat((u) => { g.beginPath(); g.arc(0, -s * .15, s * .85, Math.PI, 0); g.lineTo(s * .3, -s * .1); g.lineTo(s * .3, s * .7); g.lineTo(-s * .3, s * .7); g.lineTo(-s * .3, -s * .1); g.closePath(); fill(u, p.c);
      if (!u) { g.strokeStyle = p.c2; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -s * .15, s * .7, Math.PI + .2, -.2); g.stroke(); } }, 3); break;
    case "mussel": flat((u) => { g.beginPath(); g.ellipse(0, 0, s, s * .55, 0, 0, 7); fill(u, p.c2); if (!u) { g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, s * .72, s * .38, 0, 0, 7); g.fill(); } }, 4); break;
    case "floret": { for (let i = 0; i < 6; i++) { const gr = g.createRadialGradient(x, y, 1, x, y, s); gr.addColorStop(0, shade(p.c, .2)); gr.addColorStop(1, p.c2); g.fillStyle = gr; g.beginPath(); g.arc(x + rr(-.5, .5) * s, y + rr(-.4, .2) * s, s * .5, 0, 7); g.fill(); } g.fillStyle = "#9ab86a"; g.fillRect(x - 2, y, 4, s * .6); break; }
    case "wedge": flat((u) => { g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * .9, s, 0); g.closePath(); fill(u, p.c); if (!u) { g.fillStyle = p.c2; g.beginPath(); g.moveTo(-s * .8, -2); g.quadraticCurveTo(0, -s * .6, s * .8, -2); g.closePath(); g.fill(); } }, 10); break;
    case "wing": flat((u) => { g.beginPath(); g.ellipse(0, 0, s, s * .5, 0, 0, 7); g.ellipse(s * .9, 0, s * .4, s * .3, 0, 0, 7); fill(u, p.c);
      if (!u) { g.fillStyle = "rgba(255,170,90,.35)"; g.beginPath(); g.ellipse(-s * .2, -s * .15, s * .5, s * .2, 0, 0, 7); g.fill(); } }, 12); break;
    case "skewer": { g.strokeStyle = "#c9a06a"; g.lineWidth = 5; g.beginPath(); g.moveTo(x - s, y + 10); g.lineTo(x + s, y - 10); g.stroke();
      for (let i = 0; i < 7; i++) { const u = -.75 + i * .25, px = x + u * s, py = y - u * 10, col = i % 3 === 2 ? "#c9302a" : (i % 3 === 1 ? "#e9d6a0" : p.c);
        const gr = g.createRadialGradient(px - 6, py - 8, 1, px, py, 22); gr.addColorStop(0, shade(col, .3)); gr.addColorStop(1, shade(col, -.25)); g.fillStyle = gr; g.beginPath(); g.ellipse(px, py, 20, 18, 0, 0, 7); g.fill(); } break; }
  }
}
function drawPieces(g, o, cx = AX, cy = AY) {
  const rx = 210 * o.spread, ry = rx * TILT, list = [];
  for (let i = 0; i < o.n; i++) {
    let x = cx + (o.dx || 0), y = cy;
    if (o.n > 1) { // even-ish scatter
      const t = i * 2.39996 + rr(-.3, .3), d = Math.sqrt((i + .5) / o.n);
      x += Math.cos(t) * rx * d; y += Math.sin(t) * ry * d;
    }
    list.push({ x, y, s: rr(o.size[0], o.size[1]) / (o.n > 1 ? 1 : 1), a: rr(0, 6.28), p: o.mix ? pick(o.mix) : o.p });
  }
  list.sort((a, b) => a.y - b.y).forEach((q) => piece(g, q.x, q.y, q.s, q.a, q.p));
}
const DRAW = { slab: drawSlab, dome: drawDome, mound: drawMound, board: drawBoard, plate: drawPlate, pizzaBase: drawPizzaBase, cheese: drawCheese,
  drizzle: drawDrizzle, dust: drawDust, shred: drawShred, piping: drawPiping, egg: drawEgg, pieces: drawPieces };

/* ---------- 6. Popup ---------- */
const $ = (s, el = document) => el.querySelector(s);
const dlg = $("#dish-dlg"), stage = $("#dl-stage"), inner = $("#dl-inner");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const LW = 800; // logical stage width; labels live on the right
let cur = null, open = false, exploded = false;

function hashSeed(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483647; return h || 7; }

function build(d) {
  const keys = recipeFor(d).filter((k) => ING[k]);
  const n = keys.length, ths = keys.map((k) => ING[k].th || 10);
  const GAP = Math.max(40, Math.min(92, 560 / Math.max(1, n - 1)));
  const stackH = ths.reduce((a, b) => a + b, 0);
  const H = (n - 1) * GAP + stackH + 300;
  const baseY = H - 120; // anchor y of bottom layer
  const w = stage.clientWidth || 360, vh = innerHeight;
  const sc = Math.min(1, w / LW, (vh * .64) / H);
  inner.style.width = LW + "px"; inner.style.height = H + "px"; inner.style.transform = `translateX(${Math.max(0, (w - LW * sc) / 2)}px) scale(${sc})`;
  stage.style.height = H * sc + "px";
  const q = Math.max(.7, Math.min(2, (devicePixelRatio || 1) * sc));
  inner.innerHTML = "";
  let acc = 0;
  keys.forEach((k, i) => {
    const o = ING[k]; seed = hashSeed(d.name + k + i);
    const c = document.createElement("canvas"); c.width = Math.round(CW * q); c.height = Math.round(CH * q);
    c.style.width = CW + "px"; c.style.height = CH + "px";
    const g = c.getContext("2d"); g.scale(q, q);
    try { DRAW[o.k](g, o); } catch (e) { /* keep going if one layer fails */ }
    const wrap = document.createElement("div"); wrap.className = "dl-layer";
    const closedY = baseY - acc, openY = baseY - acc - i * GAP;
    wrap.style.cssText = `left:20px;top:${closedY - AY}px;z-index:${i + 1};--lift:${openY - closedY}px;--i:${i};--n:${n}`;
    wrap.append(c);
    const lab = document.createElement("span"); lab.className = "dl-label";
    lab.style.cssText = `top:${openY}px;--i:${i}`;
    lab.innerHTML = `<i></i>${o.l}`;
    inner.append(wrap, lab);
    acc += ths[i];
  });
  // ingredient list for screen readers / quick reading
  $("#dl-list").innerHTML = [...keys].reverse().map((k) => `<li>${ING[k].l}</li>`).join("");
}
function setExploded(v) {
  exploded = v; inner.classList.toggle("open", v);
  $("#dl-toggle").textContent = v ? "Stapla ihop" : "Dela upp";
  $("#dl-toggle").setAttribute("aria-pressed", String(v));
}
/* Where each real layer sits in the photo (fractions of the height), found from the gaps between layers.
   cuts = band edges top→bottom, shift = how far each band moves to stack tight before it opens. */
const CUTS = {"black-white": {"cuts": [0.0, 0.205, 0.2992, 0.4358, 0.5667, 0.6892, 1.0], "shift": [0.1004, 0.0454, 0.0004, -0.0388, -0.0721, -0.1088]}, "dubbel": {"cuts": [0.0, 0.2025, 0.275, 0.37, 0.4492, 0.535, 0.6125, 0.6942, 0.7775, 1.0], "shift": [0.1188, 0.0804, 0.0446, 0.0188, -0.0071, -0.0388, -0.0646, -0.0904, -0.1221]}, "falafeltallrik": {"cuts": [0.0, 0.2458, 0.4242, 0.5875, 1.0], "shift": [0.0538, 0.0046, -0.0321, -0.0729]}, "file-oscar": {"cuts": [0.0, 0.1883, 0.3642, 0.5242, 0.6792, 1.0], "shift": [0.0658, 0.0183, -0.0225, -0.0667, -0.0925]}, "fisk": {"cuts": [0.0, 0.2883, 0.4633, 0.6125, 1.0], "shift": [0.0446, 0.0088, -0.0171, -0.0429]}, "flaskfileplanka": {"cuts": [0.0, 0.2667, 0.4333, 0.5933, 0.6883, 1.0], "shift": [0.0862, 0.0296, -0.0312, -0.0838, -0.1096]}, "gosplanka": {"cuts": [0.0, 0.2433, 0.4067, 0.5808, 0.7267, 1.0], "shift": [0.095, 0.0425, -0.0067, -0.055, -0.1042]}, "grekisk-sallad": {"cuts": [0.0, 0.2358, 0.3125, 0.3992, 0.4725, 0.5325, 0.6017, 0.6792, 1.0], "shift": [0.0833, 0.0575, 0.0225, -0.0092, -0.0408, -0.0725, -0.1033, -0.1292]}, "halloumi": {"cuts": [0.0, 0.2325, 0.3358, 0.4733, 0.5842, 0.6792, 0.7192, 1.0], "shift": [0.0804, 0.0454, 0.0154, -0.0104, -0.0362, -0.0621, -0.0879]}, "hamburgare": {"cuts": [0.0, 0.2475, 0.335, 0.4108, 0.5375, 0.7283, 1.0], "shift": [0.0771, 0.0379, 0.0121, -0.0179, -0.0529, -0.0788]}, "hawaii": {"cuts": [0.0, 0.2783, 0.4375, 1.0], "shift": [0.0192, -0.0067, -0.0325]}, "kebab-brod": {"cuts": [0.0, 0.23, 0.3508, 0.43, 0.5642, 0.6642, 1.0], "shift": [0.0667, 0.0267, 0.0008, -0.025, -0.0508, -0.0767]}, "kebabpizza": {"cuts": [0.0, 0.2033, 0.3333, 0.495, 1.0], "shift": [0.0162, -0.0146, -0.0404, -0.0662]}, "kebabrulle": {"cuts": [0.0, 0.2117, 0.3125, 0.45, 0.5283, 0.645, 1.0], "shift": [0.0892, 0.0467, 0.0083, -0.03, -0.0658, -0.0925]}, "kebabtallrik": {"cuts": [0.0, 0.1983, 0.335, 0.5142, 0.6767, 1.0], "shift": [0.0854, 0.0288, -0.0154, -0.0571, -0.0962]}, "kottbullar": {"cuts": [0.0, 0.2225, 0.34, 0.4683, 0.6, 0.7617, 1.0], "shift": [0.0946, 0.0446, 0.0004, -0.0254, -0.0612, -0.1029]}, "kyckling-burgare": {"cuts": [0.0, 0.275, 0.4625, 0.5758, 0.7092, 0.7942, 1.0], "shift": [0.0788, 0.0362, -0.0021, -0.0312, -0.0654, -0.1013]}, "kycklingsallad": {"cuts": [0.0, 0.195, 0.3242, 0.4083, 0.5242, 0.6383, 1.0], "shift": [0.0558, 0.03, -0.005, -0.0442, -0.075, -0.1008]}, "kycklingspett": {"cuts": [0.0, 0.2017, 0.3367, 0.5258, 0.6758, 0.7917, 1.0], "shift": [0.0833, 0.0275, 0.0017, -0.0242, -0.0608, -0.0867]}, "ostbacon": {"cuts": [0.0, 0.2367, 0.3325, 0.4317, 0.5417, 0.6308, 0.7317, 0.7983, 1.0], "shift": [0.1054, 0.0712, 0.0454, 0.0138, -0.0221, -0.0512, -0.0838, -0.1179]}, "ostburgare": {"cuts": [0.0, 0.31, 0.3517, 0.5542, 1.0], "shift": [0.0383, 0.0125, -0.0133, -0.0392]}, "oxfileplanka": {"cuts": [0.0, 0.2317, 0.3375, 0.5075, 0.6342, 0.7608, 1.0], "shift": [0.0879, 0.0412, -0.0088, -0.0546, -0.0921, -0.1204]}, "schnitzel": {"cuts": [0.0, 0.2242, 0.35, 0.4775, 0.655, 1.0], "shift": [0.0558, 0.0175, -0.0167, -0.0542, -0.0908]}, "vesuvio": {"cuts": [0.0, 0.345, 0.5442, 0.7025, 1.0], "shift": [0.0421, -0.0029, -0.0388, -0.0838]}};
function playPhotoLayers(d, file) {
  inner.classList.remove("open"); inner.innerHTML = "";
  const w = Math.min(stage.clientWidth || 360, 560), h = Math.min(w * 4 / 3, innerHeight * .62), ww = h * .75;
  stage.style.height = h + "px";
  inner.style.cssText = `width:${ww}px;height:${h}px;left:50%;transform:translateX(-50%)`;
  inner.className = "dl-inner real";
  const src = `img/exploded/${file}.webp?v=2`, cut = CUTS[file] || { cuts: [0, 1], shift: [0] };
  const n = cut.cuts.length - 1;
  for (let k = 0; k < n; k++) {
    const y0 = cut.cuts[k] * h, y1 = cut.cuts[k + 1] * h, el = document.createElement("div");
    el.className = "strip";
    el.style.cssText = `top:${y0}px;height:${y1 - y0 + 1}px;background-image:url("${src}");background-size:${ww}px ${h}px;background-position:0 ${-y0}px;--sq:${(cut.shift[k] || 0) * h}px;--i:${Math.abs((n - 1) / 2 - k)};z-index:${n - k}`;
    inner.append(el);
  }
  const keys = recipeFor(d).filter((k) => ING[k]);
  $("#dl-list").innerHTML = [...keys].reverse().map((k) => `<li>${ING[k].l}</li>`).join("");
  const im = new Image(); im.onload = () => setTimeout(() => open && cur === d && setExploded(true), reduce ? 0 : 450); im.src = src;
  $("#dl-note").textContent = "Bild skapad med AI för att visa rättens delar. Riktiga rätten kan se lite annorlunda ut.";
  $("#dl-chips").innerHTML = [...new Set([...keys].reverse().map((k) => ING[k].l))].map((l) => `<span>${l}</span>`).join("");
}
function playLayers(d) {
  const file = EXPLODED[d.cat + ":" + d.name] || (d.cat === "barn" ? null : EXPLODED[d.name]);
  if (file) return playPhotoLayers(d, file);
  inner.className = "dl-inner"; inner.style.cssText = ""; $("#dl-chips").innerHTML = "";
  $("#dl-note").textContent = "Illustration av rättens lager. Riktiga rätten kan se lite annorlunda ut.";
  setExploded(false); inner.classList.add("drop");
  build(d);
  requestAnimationFrame(() => { inner.classList.remove("drop"); setTimeout(() => open && cur === d && setExploded(true), reduce ? 0 : 650); });
}
function setMode(m) {
  dlg.classList.toggle("mode-photo", m === "photo"); dlg.classList.toggle("mode-layers", m === "layers");
  $("#dl-m-photo").setAttribute("aria-selected", String(m === "photo")); $("#dl-m-layers").setAttribute("aria-selected", String(m === "layers"));
  if (m === "layers") playLayers(cur);
}
function show(d) {
  cur = d;
  $("#dl-name").textContent = d.name;
  $("#dl-price").textContent = d.price;
  $("#dl-desc").textContent = d.desc || "";
  const ph = $("#dl-photo"), im = $("#dl-img");
  ph.classList.remove("ready", "burst"); ph.classList.toggle("crop", d.crop === "1");
  dlg.classList.toggle("nophoto", !d.photo);
  if (!dlg.open) dlg.showModal();
  open = true;
  if (d.photo) {
    im.onload = () => ph.classList.add("ready");
    im.onerror = () => { dlg.classList.add("nophoto"); setMode("layers"); };
    im.alt = d.name; im.src = d.photo; if (im.complete && im.naturalWidth) ph.classList.add("ready");
    setMode("photo");
  } else setMode("layers");
}
function readItem(el) {
  return { cat: el.dataset.cat, grp: el.dataset.grp || "", name: el.dataset.name, desc: el.dataset.desc || "", price: el.dataset.price || "", photo: el.dataset.photo || "", crop: el.dataset.crop || "0" };
}
$("#dl-m-photo").addEventListener("click", () => setMode("photo"));
$("#dl-m-layers").addEventListener("click", () => {
  if (dlg.classList.contains("mode-layers")) return;
  const ph = $("#dl-photo"); if (reduce || !ph.classList.contains("ready")) return setMode("layers");
  ph.classList.add("burst"); setTimeout(() => { ph.classList.remove("burst"); setMode("layers"); }, 480);
});
document.addEventListener("click", (e) => {
  const it = e.target.closest(".item[data-name]"); if (!it) return;
  show(readItem(it));
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".item[data-name]")) { e.preventDefault(); show(readItem(e.target)); }
});
$("#dl-toggle").addEventListener("click", () => setExploded(!exploded));
$("#dl-close").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener("close", () => { open = false; });
let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (dlg.open && cur && dlg.classList.contains("mode-layers")) playLayers(cur); }, 200); });

// for testing in the console: GKLayers.show({cat:"pizza",name:"Kebabpizza",desc:"kebab, bearnaisesås i ugn & cayenne",price:"125 kr"})
window.GKLayers = { show, recipeFor, ING, RECIPES };
})();
