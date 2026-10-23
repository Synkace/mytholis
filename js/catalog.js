/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - CATALOG DATA
   Sequence: 1. King Scar, 2. Petralux, 3. Oud Rion, 4. Spark, 5. Wood Sera, 6. Ash, 7. The Sixth Sense
   Brand tagline: "Wear Your Legend."
   Collection line: "Six elements. Six legends. One house."
   Formulated in Mayfair, London UK · Handcrafted & Bottled in Ahmedabad, India
   ========================================================================== */

const MYTHOLIS_CATALOG = [
  {
    id: "king-scar",
    name: "King Scar <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Aromatic · Men",
    collection: "Aromatic · Men",
    tagline: "A commanding presence forged in spices and absinthe.",
    price: 5999,
    rating: 5.0,
    reviewsCount: 178,
    image: "assets/product/1kingscar.webp",
    tag: "Aromatic Luxe",
    gender: "Masculine",
    scentFamily: "Aromatic Spicy",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 12,
    sillageRating: 97,
    accords: ["Aromatic", "Spicy", "Lavender", "Absinthe", "Vetiver"],
    description: "Commanding, sharp and regal. King Scar opens with an intoxicating rush of pink pepper, peppermint, crisp bergamot and absinthe before descending into a royal heart of lavender, Bulgarian rose, allspice and orris root. A lasting base of Haitian vetiver, cedar, white musk and tonka bean seals your legend.",
    notes: {
      top: ["Pink Pepper", "Peppermint", "Bergamot", "Lemon", "Absinthe", "Orange"],
      heart: ["Lavender", "Bulgarian Rose", "Clove", "Allspice", "Orris Root", "Jasmine"],
      base: ["Vetiver", "Cedar", "White Musk", "Tonka Bean"]
    },
    sizes: [
      { ml: 50, price: 3999 },
      { ml: 100, price: 5999 }
    ]
  },
  {
    id: "petralux",
    name: "Petralux <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Fruity · Unisex",
    collection: "Fruity · Unisex",
    tagline: "Luminous luxury and royal fruit trapped in stone.",
    price: 4999,
    rating: 5.0,
    reviewsCount: 194,
    image: "assets/product/2petralux.webp",
    tag: "Opulent Fruity",
    gender: "Unisex",
    scentFamily: "Fruity Chypre Amber",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 11,
    sillageRating: 96,
    accords: ["Fruity", "Amber", "Pineapple", "Black Currant", "Birch"],
    description: "Our most radiant composition. Crisp Italian bergamot, black currant, juicy apple and pink pepper ignite a luminous heart of golden pineapple, Indonesian patchouli and Moroccan rose. Resting upon smoked birch, crystalline musk, oakmoss and golden amber accord.",
    notes: {
      top: ["Bergamot", "Black Currant", "Apple", "Lemon", "Pink Pepper"],
      heart: ["Pineapple", "Patchouli", "Moroccan Rose", "Jasmine"],
      base: ["Birch", "Musk", "Oakmoss", "Cedarwood", "Amber"]
    },
    sizes: [
      { ml: 50, price: 3299 },
      { ml: 100, price: 4999 }
    ]
  },
  {
    id: "oud-rion",
    name: "Oud Rion <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Men",
    collection: "Woody · Men",
    tagline: "The king of woods, crowned in gold and smoke.",
    price: 6999,
    rating: 5.0,
    reviewsCount: 215,
    image: "assets/product/3oudrion.webp",
    tag: "Crown Reserve",
    gender: "Masculine",
    scentFamily: "Resinous Royal Oud",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 14,
    sillageRating: 99,
    accords: ["Woody", "Resinous", "Agarwood Oud", "Smoky Incense", "Amberwood"],
    description: "Rich, resinous and supreme. Oud Rion opens with opulent Bulgarian rose and saffron, yielding to a smouldering heart of vintage Assam agarwood oud, smoky incense and benzoin balm. The drydown reveals wild raspberry, silver birch, geranium and deep amberwood.",
    notes: {
      top: ["Rose", "Saffron"],
      heart: ["Agarwood Oud", "Smoky Incense", "Benzoin Balm"],
      base: ["Raspberry", "Birch & Geranium", "Amberwood"]
    },
    sizes: [
      { ml: 50, price: 4599 },
      { ml: 100, price: 6999 }
    ]
  },
  {
    id: "spark",
    name: "Spark <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Aromatic · Unisex",
    collection: "Aromatic · Unisex",
    tagline: "The electrifying flash of clarity and fire.",
    price: 5499,
    rating: 4.9,
    reviewsCount: 128,
    image: "assets/product/4spark.webp",
    tag: "Electric Aromatic",
    gender: "Unisex",
    scentFamily: "Aromatic Fresh Leather",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 10,
    sillageRating: 92,
    accords: ["Aromatic", "Fresh", "Neroli", "Black Pepper", "Juniper"],
    description: "Clean, magnetic and vibrant. Spark crackles with sparkling neroli, Calabrian bergamot, crushed black pepper and petitgrain, leading into lavender, green cardamom, juniper berries and wild clary sage. Settles into noble Florentine iris, oakmoss, supple leather and smoky agarwood.",
    notes: {
      top: ["Neroli", "Bergamot", "Black Pepper", "Petitgrain"],
      heart: ["Black Pepper", "Lavender", "Cardamom", "Juniper Berries", "Sage"],
      base: ["Vetiver", "Oakmoss", "Iris", "Leather", "Agarwood (Oud)"]
    },
    sizes: [
      { ml: 50, price: 3699 },
      { ml: 100, price: 5499 }
    ]
  },
  {
    id: "wood-sera",
    name: "Wood Sera <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Unisex",
    collection: "Woody · Unisex",
    tagline: "The forest at golden hour, draped in velvet and oud.",
    price: 4999,
    rating: 4.9,
    reviewsCount: 142,
    image: "assets/product/5woodsera.webp",
    tag: "Evening Woods",
    gender: "Unisex",
    scentFamily: "Warm Woody Amber Rose",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 11,
    sillageRating: 94,
    accords: ["Woody", "Velvet Rose", "Oud", "Praline Accord", "Guaiac Wood"],
    description: "Warm, opulent and deeply seductive. Wood Sera pairs velvety Bulgarian rose and royal saffron with a dark heart of agarwood oud, Indonesian patchouli and geranium. The lingering drydown enchants with sweet praline accord, Madagascar vanilla, smoked guaiac wood, and resinous copaiba balm.",
    notes: {
      top: ["Velvet Rose", "Saffron"],
      heart: ["Oud", "Patchouli", "Geranium"],
      base: ["Praline Accord", "Vanilla", "Guaiac Wood", "Copahu Balm (Copaiba)"]
    },
    sizes: [
      { ml: 50, price: 3299 },
      { ml: 100, price: 4999 }
    ]
  },
  {
    id: "ash",
    name: "Ash <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Unisex",
    collection: "Woody · Unisex",
    tagline: "Smouldering embers and sacred woods born from the fire.",
    price: 5999,
    rating: 5.0,
    reviewsCount: 168,
    image: "assets/product/6ash.webp",
    tag: "Obsidian Reserve",
    gender: "Unisex",
    scentFamily: "Smoky Woody Mineral",
    concentration: "Extrait de Parfum (40% Concentration)",
    longevityHours: 12,
    sillageRating: 96,
    accords: ["Woody", "Mineral", "Sandalwood", "Patchouli", "Amber"],
    description: "Grounded, mystical and intense. Ash opens with creamy Australian sandalwood, Virginia cedarwood and cool Haitian vetiver. Its smouldering heart unfolds with dark Indonesian patchouli, damask rose and warm piquant spices, before resting on a sacred bed of golden amber accord, bourbon vanilla and velvet crystalline musk.",
    notes: {
      top: ["Sandalwood", "Cedar", "Vetiver"],
      heart: ["Patchouli", "Rose", "Spices"],
      base: ["Amber", "Vanilla", "Musk"]
    },
    sizes: [
      { ml: 50, price: 3999 },
      { ml: 100, price: 5999 }
    ]
  },
  {
    id: "mytholis-discovery-set",
    name: "Sixth Sense",
    subtitle: "Sixth Sense",
    collection: "Sixth Sense",
    tagline: "Awaken your Sixth Sense — experience all six master extraits in deluxe 8ml flacons.",
    price: 3999,
    rating: 5.0,
    reviewsCount: 240,
    image: "assets/coffret_banner.webp",
    tag: "Sixth Sense",
    gender: "Unisex",
    scentFamily: "Complete Olfactory Wardrobe",
    concentration: "Extrait de Parfum (6 × 8ml Deluxe Vials • 40% Concentration)",
    longevityHours: 12,
    sillageRating: 96,
    accords: ["Sixth Sense Master Set", "All 6 Signature Extraits", "6 × 8ml Deluxe Sprays", "₹1,000 Flacon Voucher"],
    description: "The complete Mytholis master collection in one curated luxury vault — Sixth Sense. Contains deluxe 8ml travel flacons of King Scar, Petralux, Oud Rion, Spark, Wood Sera, and Ash, plus a complimentary ₹1,000 voucher redeemable toward your first full 100ml flacon.",
    notes: {
      top: ["Aromatic Spices & Absinthe (King Scar 8ml)", "Italian Bergamot & Black Currant (Petralux 8ml)"],
      heart: ["Smoked Saffron & Cambodian Agarwood (Oud Rion 8ml)", "Sicilian Mandarin & Sparkling Ginger (Spark 8ml)"],
      base: ["Mysore Sandalwood & Bourbon Cedar (Wood Sera 8ml)", "Birch Embers & Frankincense (Ash 8ml)"]
    },
    sizes: [
      { ml: 48, price: 3999 }
    ]
  }
];

if (typeof window !== 'undefined') {
  window.MYTHOLIS_CATALOG = MYTHOLIS_CATALOG;
}
