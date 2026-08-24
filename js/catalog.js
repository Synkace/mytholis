/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - CATALOG DATA
   Sequence: 1. Terra Petra, 2. Oud Rion, 3. Petralux, 4. White Spark, 5. Smoky Musk, 6. Wood Sera, 7. Discovery Coffret
   Brand tagline: "Wear Your Legend."
   Collection line: "Six elements. Six legends. One house."
   Formulated in Mayfair, London UK · Handcrafted & Bottled in Ahmedabad, India
   ========================================================================== */

const MYTHOLIS_CATALOG = [
  {
    id: "terra-petra",
    name: "Terra Petra Extrait de Parfum",
    subtitle: "Woody · Mineral",
    collection: "Woody · Mineral",
    tagline: "The scent of ancient stone after rain.",
    price: 3299,
    rating: 5.0,
    reviewsCount: 154,
    image: "assets/product/1.png",
    tag: "Mineral Reserve",
    gender: "Unisex",
    scentFamily: "Woody Mineral",
    concentration: "Extrait de Parfum (28% Concentration)",
    longevityHours: 10,
    sillageRating: 92,
    accords: ["Woody", "Mineral", "Cardamom", "Vetiver", "Wet Stone"],
    description: "Grounded and elemental, Terra Petra opens with cool Italian bergamot and green cardamom before settling into a heart of Haitian vetiver and Virginia cedar. A base of oakmoss, golden amber accord and soft musk leaves the quiet strength of rain-soaked petrichor on your skin.",
    notes: {
      top: ["Italian Bergamot", "Green Cardamom"],
      heart: ["Haitian Vetiver", "Virginia Cedarwood"],
      base: ["Golden Amber Accord", "Oakmoss", "White Musk"]
    },
    sizes: [
      { ml: 50, price: 2199 },
      { ml: 100, price: 3299 }
    ]
  },
  {
    id: "oud-rion",
    name: "Oud Rion Extrait de Parfum",
    subtitle: "Oud · Royal",
    collection: "Oud · Royal",
    tagline: "The king of woods, crowned in gold.",
    price: 3999,
    rating: 5.0,
    reviewsCount: 165,
    image: "assets/product/5.png",
    tag: "Royal Extrait",
    gender: "Masculine / Unisex",
    scentFamily: "Resinous Royal Oud",
    concentration: "Extrait de Parfum (30% Concentration)",
    longevityHours: 12,
    sillageRating: 98,
    accords: ["Oud", "Royal", "Saffron", "Patchouli", "Leather"],
    description: "Rich, resinous and commanding. Oud Rion layers sustainably cultivated Assam agarwood and saffron over a heart of dark Bulgarian rose and Indonesian patchouli, anchored by golden amber accord and polished leather.",
    notes: {
      top: ["Assam Agarwood Accord", "Golden Saffron"],
      heart: ["Bulgarian Rose", "Indonesian Patchouli"],
      base: ["Amber Resin Accord", "Russian Leather", "Sandalwood"]
    },
    sizes: [
      { ml: 50, price: 2599 },
      { ml: 100, price: 3999 }
    ]
  },
  {
    id: "petralux",
    name: "Petralux Extrait de Parfum",
    subtitle: "Amber · Opulent",
    collection: "Amber · Opulent",
    tagline: "Light trapped in stone.",
    price: 3699,
    rating: 5.0,
    reviewsCount: 186,
    image: "assets/product/3.png",
    tag: "Opulent Amber",
    gender: "Unisex",
    scentFamily: "Solar Amber Rose",
    concentration: "Extrait de Parfum (30% Concentration)",
    longevityHours: 11,
    sillageRating: 96,
    accords: ["Amber", "Opulent", "Saffron", "Rose", "Sandalwood"],
    description: "Our most radiant composition. Kashmiri saffron and pink pepper ignite a luminous heart of Taif rose and warm amber resin accord, resting on Mysore sandalwood and bourbon vanilla. Petralux is luxury you can wear — radiant, rich, regal.",
    notes: {
      top: ["Kashmiri Saffron", "Pink Pepper"],
      heart: ["Taif Rose", "Amber Resin Accord"],
      base: ["Mysore Sandalwood", "Bourbon Vanilla", "Crystal Musk"]
    },
    sizes: [
      { ml: 50, price: 2399 },
      { ml: 100, price: 3699 }
    ]
  },
  {
    id: "white-spark",
    name: "White Spark Extrait de Parfum",
    subtitle: "Fresh · Electric",
    collection: "Fresh · Electric",
    tagline: "The first flash of light.",
    price: 2999,
    rating: 4.8,
    reviewsCount: 92,
    image: "assets/product/4.png",
    tag: "Electric Fresh",
    gender: "Unisex",
    scentFamily: "Aquatic Citrus Neroli",
    concentration: "Extrait de Parfum (26% Concentration)",
    longevityHours: 9,
    sillageRating: 88,
    accords: ["Fresh", "Electric", "Lemon", "Sea Notes", "Neroli"],
    description: "Clean, luminous and vibrant. White Spark crackles with sparkling Amalfi lemon and marine ozone accords, softens into silver needle white tea and Moroccan neroli, and settles into crisp white musk and cedarwood. The scent of absolute clarity.",
    notes: {
      top: ["Amalfi Lemon", "Marine Ozone Accord"],
      heart: ["Silver Needle White Tea", "Moroccan Neroli"],
      base: ["Crisp White Musk", "Atlas Cedar"]
    },
    sizes: [
      { ml: 50, price: 1999 },
      { ml: 100, price: 2999 }
    ]
  },
  {
    id: "smoky-musk",
    name: "Smoky Musk Extrait de Parfum",
    subtitle: "Smoky · Sensual",
    collection: "Smoky · Sensual",
    tagline: "Embers and skin. A fire that never dies.",
    price: 3499,
    rating: 4.9,
    reviewsCount: 138,
    image: "assets/product/2.png",
    tag: "Nocturnal Luxe",
    gender: "Unisex",
    scentFamily: "Smoky Amber Leather",
    concentration: "Extrait de Parfum (30% Concentration)",
    longevityHours: 10,
    sillageRating: 95,
    accords: ["Smoky", "Sensual", "Black Pepper", "Leather", "Oud Accord"],
    description: "Dark and magnetic, Smoky Musk wraps crushed black pepper and frankincense around a smouldering heart of artisanal leather and charred woods. Velveteen musk, Madagascar vanilla and cultivated Assam oud accord keep it close, warm and unforgettable.",
    notes: {
      top: ["Black Pepper", "Frankincense"],
      heart: ["Artisanal Leather", "Smoked Guaiac"],
      base: ["Velvet Musk", "Madagascar Vanilla", "Assam Oud Accord"]
    },
    sizes: [
      { ml: 50, price: 2299 },
      { ml: 100, price: 3499 }
    ]
  },
  {
    id: "wood-sera",
    name: "Wood Sera Extrait de Parfum",
    subtitle: "Woody · Evening",
    collection: "Woody · Evening",
    tagline: "The forest at dusk.",
    price: 3499,
    rating: 4.9,
    reviewsCount: 114,
    image: "assets/product/6.png",
    tag: "Evening Woods",
    gender: "Unisex",
    scentFamily: "Warm Woody Amber",
    concentration: "Extrait de Parfum (28% Concentration)",
    longevityHours: 10,
    sillageRating: 92,
    accords: ["Woody", "Evening", "Nutmeg", "Guaiac Wood", "Tonka"],
    description: "Warm, quiet and contemplative. Wood Sera blends Calabrian bergamot and Ceylon nutmeg with a rich heart of Australian sandalwood and guaiac wood, finishing in roasted tonka bean and warm vegetal amber. The scent of golden hour, bottled.",
    notes: {
      top: ["Calabrian Bergamot", "Ceylon Nutmeg"],
      heart: ["Australian Sandalwood", "Guaiac Wood"],
      base: ["Roasted Tonka", "Amber Accord", "Clean Musk"]
    },
    sizes: [
      { ml: 50, price: 2299 },
      { ml: 100, price: 3499 }
    ]
  },
  {
    id: "mytholis-discovery-set",
    name: "Mytholis Vault Discovery Coffret (6 × 10ml)",
    subtitle: "Complete Collection Reserve",
    collection: "Discovery Edition",
    tagline: "Experience all six legends before choosing your signature.",
    price: 1999,
    rating: 5.0,
    reviewsCount: 240,
    image: "assets/product/1.png",
    tag: "Discovery Set",
    gender: "Unisex",
    scentFamily: "Complete Olfactory Wardrobe",
    concentration: "Extrait de Parfum (6 × 10ml Luxury Vials)",
    longevityHours: 10,
    sillageRating: 95,
    accords: ["All 6 Signature Extraits", "10ml Deluxe Sprays", "Vault Coffret Box", "Complimentary Voucher"],
    description: "The complete Mytholis master collection in one curated luxury vault coffret. Contains deluxe 10ml travel atomizers of Terra Petra, Smoky Musk, Petralux, White Spark, Oud Rion, and Wood Sera, plus a ₹1,000 voucher redeemable toward your first full 100ml flacon.",
    notes: {
      top: ["Terra Petra (10ml)", "White Spark (10ml)"],
      heart: ["Smoky Musk (10ml)", "Petralux (10ml)"],
      base: ["Oud Rion (10ml)", "Wood Sera (10ml)"]
    },
    sizes: [
      { ml: 60, price: 1999 }
    ]
  }
];
