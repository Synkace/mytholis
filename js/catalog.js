/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - CATALOG DATA
   Sequence: 1. Terra Petra, 2. Smoky Musk, 3. Petralux, 4. White Spark, 5. Oud Rion, 6. Wood Sera
   Brand tagline: "Wear Your Legend."
   Collection line: "Six elements. Six legends. One house."
   ========================================================================== */

const MYTHOLIS_CATALOG = [
  {
    id: "terra-petra",
    name: "Terra Petra",
    subtitle: "Woody · Mineral",
    collection: "Woody · Mineral",
    tagline: "The scent of ancient stone after rain.",
    price: 340,
    rating: 5.0,
    reviewsCount: 154,
    image: "assets/product/1.png",
    tag: "Mineral Reserve",
    gender: "Unisex",
    scentFamily: "Woody Mineral",
    concentration: "Extrait de Parfum (34%)",
    longevityHours: 16,
    sillageRating: 95,
    accords: ["Woody", "Mineral", "Cardamom", "Vetiver", "Wet Stone"],
    description: "Grounded and elemental, Terra Petra opens with cool bergamot and cardamom before settling into a heart of vetiver and cedar. A base of moss, amber and musk leaves the quiet strength of wet stone on your skin.",
    notes: {
      top: ["Bergamot", "Cardamom"],
      heart: ["Vetiver", "Cedarwood"],
      base: ["Amber", "Moss", "Musk"]
    },
    sizes: [
      { ml: 50, price: 240 },
      { ml: 100, price: 340 },
      { ml: 200, price: 580 }
    ]
  },
  {
    id: "smoky-musk",
    name: "Smoky Musk",
    subtitle: "Smoky · Sensual",
    collection: "Smoky · Sensual",
    tagline: "Embers and skin. A fire that never dies.",
    price: 385,
    rating: 4.9,
    reviewsCount: 138,
    image: "assets/product/2.png",
    tag: "Nocturnal Luxe",
    gender: "Unisex",
    scentFamily: "Smoky Amber Leather",
    concentration: "Extrait de Parfum (35%)",
    longevityHours: 18,
    sillageRating: 98,
    accords: ["Smoky", "Sensual", "Black Pepper", "Leather", "Oud"],
    description: "Dark and magnetic, Smoky Musk wraps black pepper and incense around a smouldering heart of leather and smoked woods. Soft musk and vanilla keep it close, warm and unforgettable.",
    notes: {
      top: ["Black Pepper", "Incense"],
      heart: ["Leather", "Smoked Woods"],
      base: ["Musk", "Vanilla", "Oud"]
    },
    sizes: [
      { ml: 50, price: 275 },
      { ml: 100, price: 385 },
      { ml: 200, price: 650 }
    ]
  },
  {
    id: "petralux",
    name: "Petralux",
    subtitle: "Amber · Opulent",
    collection: "Amber · Opulent",
    tagline: "Light trapped in stone.",
    price: 420,
    rating: 5.0,
    reviewsCount: 186,
    image: "assets/product/3.png",
    tag: "Opulent Amber",
    gender: "Unisex",
    scentFamily: "Solar Amber Rose",
    concentration: "Grand Extrait de Parfum (38%)",
    longevityHours: 18,
    sillageRating: 99,
    accords: ["Amber", "Opulent", "Saffron", "Rose", "Sandalwood"],
    description: "Our most opulent composition. Saffron and pink pepper ignite a golden heart of rose and amber, resting on sandalwood and vanilla. Petralux is luxury you can wear — radiant, rich, regal.",
    notes: {
      top: ["Saffron", "Pink Pepper"],
      heart: ["Rose", "Amber"],
      base: ["Sandalwood", "Vanilla", "Musk"]
    },
    sizes: [
      { ml: 50, price: 295 },
      { ml: 100, price: 420 },
      { ml: 200, price: 720 }
    ]
  },
  {
    id: "white-spark",
    name: "White Spark",
    subtitle: "Fresh · Electric",
    collection: "Fresh · Electric",
    tagline: "The first flash of light.",
    price: 295,
    rating: 4.8,
    reviewsCount: 92,
    image: "assets/product/4.png",
    tag: "Electric Fresh",
    gender: "Unisex",
    scentFamily: "Aquatic Citrus Neroli",
    concentration: "Extrait de Parfum (30%)",
    longevityHours: 14,
    sillageRating: 90,
    accords: ["Fresh", "Electric", "Lemon", "Sea Notes", "Neroli"],
    description: "Clean, bright and alive. White Spark crackles with lemon and sea notes, softens into white tea and neroli, and dries down to a crisp white musk. The scent of a brand-new beginning.",
    notes: {
      top: ["Lemon", "Sea Notes"],
      heart: ["White Tea", "Neroli"],
      base: ["White Musk", "Cedar"]
    },
    sizes: [
      { ml: 50, price: 210 },
      { ml: 100, price: 295 },
      { ml: 200, price: 490 }
    ]
  },
  {
    id: "oud-rion",
    name: "Oud Rion",
    subtitle: "Oud · Royal",
    collection: "Oud · Royal",
    tagline: "The king of woods, crowned in gold.",
    price: 460,
    rating: 5.0,
    reviewsCount: 165,
    image: "assets/product/5.png",
    tag: "Royal Extrait",
    gender: "Masculine / Unisex",
    scentFamily: "Resinous Royal Oud",
    concentration: "Pure Extrait Reserve (40%)",
    longevityHours: 20,
    sillageRating: 100,
    accords: ["Oud", "Royal", "Saffron", "Patchouli", "Leather"],
    description: "Rich, resinous and commanding. Oud Rion layers precious oud and saffron over a heart of rose and patchouli, deepened by amber and leather. A fragrance that enters the room before you do.",
    notes: {
      top: ["Oud", "Saffron"],
      heart: ["Rose", "Patchouli"],
      base: ["Amber", "Leather", "Sandal"]
    },
    sizes: [
      { ml: 50, price: 320 },
      { ml: 100, price: 460 },
      { ml: 200, price: 790 }
    ]
  },
  {
    id: "wood-sera",
    name: "Wood Sera",
    subtitle: "Woody · Evening",
    collection: "Woody · Evening",
    tagline: "The forest at dusk.",
    price: 390,
    rating: 4.9,
    reviewsCount: 114,
    image: "assets/product/6.png",
    tag: "Evening Woods",
    gender: "Unisex",
    scentFamily: "Warm Woody Amber",
    concentration: "Extrait de Parfum (33%)",
    longevityHours: 16,
    sillageRating: 94,
    accords: ["Woody", "Evening", "Nutmeg", "Guaiac Wood", "Tonka"],
    description: "Warm, quiet and contemplative. Wood Sera blends bergamot and nutmeg with a heart of sandalwood and guaiac, finishing in tonka and amber. The scent of golden hour, bottled.",
    notes: {
      top: ["Bergamot", "Nutmeg"],
      heart: ["Sandalwood", "Guaiac Wood"],
      base: ["Tonka", "Amber", "Musk"]
    },
    sizes: [
      { ml: 50, price: 280 },
      { ml: 100, price: 390 },
      { ml: 200, price: 660 }
    ]
  }
];
