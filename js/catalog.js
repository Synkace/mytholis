/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - CATALOG DATA
   Sequence: 1. King Scar, 2. Petralux, 3. Oud Rion, 4. Spark, 5. Wood Sera, 6. Ash, 7. The Sixth Sense
   Brand tagline: "Wear Your Legend."
   Collection line: "Six elements. Six legends. One sanctuary."
   Formulated in Mayfair, London UK · Handcrafted & Bottled in Ahmedabad, India
   Standard Architecture: 100ml Default Grand Flacon + 50ml Signature Flacon
   ========================================================================== */

const MYTHOLIS_CATALOG = [
  {
    id: "king-scar",
    sku: "MYTH-EDP-KS-100",
    name: "King Scar <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Aromatic · Men",
    collection: "Aromatic · Men",
    tagline: "A commanding presence forged in spices and absinthe.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 5999,
    salePrice: 5999,
    compareAtPrice: 7499,
    mrp: 7499,
    pricing: {
      salePrice: 5999,
      mrp: 7499,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-KS-100", volumeMl: 100, salePrice: 5999, mrp: 7499, stock: 50, mythosReward: 180 },
      "50ml": { sku: "MYTH-EDP-KS-50", volumeMl: 50, salePrice: 3499, mrp: 4399, stock: 50, mythosReward: 105 }
    },
    sizes: [
      { ml: 100, price: 5999, mrp: 7499, sku: "MYTH-EDP-KS-100", stock: 50 },
      { ml: 50, price: 3499, mrp: 4399, sku: "MYTH-EDP-KS-50", stock: 50 }
    ],
    rating: 5.0,
    reviewsCount: 178,
    image: "assets/product/1kingscar.webp",
    media: {
      bottleImage: "assets/product/1kingscar.webp",
      cardImage: "assets/product/1kingscarbox.webp",
      backgroundImage: "assets/hero/kingscarbg.webp",
      gallery: [
        "assets/product/1kingscar.webp",
        "assets/product/1kingscarbox.webp",
        "assets/product/1-1.webp",
        "assets/product/1-2.webp",
        "assets/hero/kingscarcard.webp",
        "assets/hero/kingscarbg.webp"
      ]
    },
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
    }
  },
  {
    id: "petralux",
    sku: "MYTH-EDP-PX-100",
    name: "Petralux <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Fruity · Unisex",
    collection: "Fruity · Unisex",
    tagline: "Luminous luxury and royal fruit trapped in stone.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 4999,
    salePrice: 4999,
    compareAtPrice: 6249,
    mrp: 6249,
    pricing: {
      salePrice: 4999,
      mrp: 6249,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-PX-100", volumeMl: 100, salePrice: 4999, mrp: 6249, stock: 50, mythosReward: 150 },
      "50ml": { sku: "MYTH-EDP-PX-50", volumeMl: 50, salePrice: 2799, mrp: 3499, stock: 50, mythosReward: 84 }
    },
    sizes: [
      { ml: 100, price: 4999, mrp: 6249, sku: "MYTH-EDP-PX-100", stock: 50 },
      { ml: 50, price: 2799, mrp: 3499, sku: "MYTH-EDP-PX-50", stock: 50 }
    ],
    rating: 5.0,
    reviewsCount: 194,
    image: "assets/product/2petralux.webp",
    media: {
      bottleImage: "assets/product/2petralux.webp",
      cardImage: "assets/product/2petraluxbox.webp",
      backgroundImage: "assets/product/2petraluxbox.webp",
      gallery: [
        "assets/product/2petralux.webp",
        "assets/product/2petraluxbox.webp",
        "assets/product/2-1.webp",
        "assets/product/2-2.webp"
      ]
    },
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
    }
  },
  {
    id: "oud-rion",
    sku: "MYTH-EDP-OR-100",
    name: "Oud Rion <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Men",
    collection: "Woody · Men",
    tagline: "The king of woods, crowned in gold and smoke.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 6999,
    salePrice: 6999,
    compareAtPrice: 8749,
    mrp: 8749,
    pricing: {
      salePrice: 6999,
      mrp: 8749,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-OR-100", volumeMl: 100, salePrice: 6999, mrp: 8749, stock: 50, mythosReward: 210 },
      "50ml": { sku: "MYTH-EDP-OR-50", volumeMl: 50, salePrice: 4099, mrp: 5149, stock: 50, mythosReward: 123 }
    },
    sizes: [
      { ml: 100, price: 6999, mrp: 8749, sku: "MYTH-EDP-OR-100", stock: 50 },
      { ml: 50, price: 4099, mrp: 5149, sku: "MYTH-EDP-OR-50", stock: 50 }
    ],
    rating: 5.0,
    reviewsCount: 215,
    image: "assets/product/3oudrion.webp",
    media: {
      bottleImage: "assets/product/3oudrion.webp",
      cardImage: "assets/product/3oudrionbox.webp",
      backgroundImage: "assets/hero/oudrionbg.webp",
      gallery: [
        "assets/product/3oudrion.webp",
        "assets/product/3oudrionbox.webp",
        "assets/product/3-1.webp",
        "assets/product/3-2.webp",
        "assets/hero/oudrioncard.webp",
        "assets/hero/oudrionbg.webp"
      ]
    },
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
    }
  },
  {
    id: "spark",
    sku: "MYTH-EDP-SP-100",
    name: "Spark <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Aromatic · Unisex",
    collection: "Aromatic · Unisex",
    tagline: "The electrifying flash of clarity and fire.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 5499,
    salePrice: 5499,
    compareAtPrice: 6874,
    mrp: 6874,
    pricing: {
      salePrice: 5499,
      mrp: 6874,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-SP-100", volumeMl: 100, salePrice: 5499, mrp: 6874, stock: 50, mythosReward: 165 },
      "50ml": { sku: "MYTH-EDP-SP-50", volumeMl: 50, salePrice: 3199, mrp: 2999, stock: 50, mythosReward: 96 }
    },
    sizes: [
      { ml: 100, price: 5499, mrp: 6874, sku: "MYTH-EDP-SP-100", stock: 50 },
      { ml: 50, price: 3199, mrp: 2999, sku: "MYTH-EDP-SP-50", stock: 50 }
    ],
    rating: 4.9,
    reviewsCount: 128,
    image: "assets/product/4spark.webp",
    media: {
      bottleImage: "assets/product/4spark.webp",
      cardImage: "assets/product/4sparkbox.webp",
      backgroundImage: "assets/hero/sparkbg.webp",
      gallery: [
        "assets/product/4spark.webp",
        "assets/product/4sparkbox.webp",
        "assets/product/4-1.webp",
        "assets/product/4-2.webp",
        "assets/hero/sparkcard.webp",
        "assets/hero/sparkbg.webp"
      ]
    },
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
    }
  },
  {
    id: "wood-sera",
    sku: "MYTH-EDP-WS-100",
    name: "Wood Sera <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Unisex",
    collection: "Woody · Unisex",
    tagline: "The forest at golden hour, draped in velvet and oud.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 4999,
    salePrice: 4999,
    compareAtPrice: 6249,
    mrp: 6249,
    pricing: {
      salePrice: 4999,
      mrp: 6249,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-WS-100", volumeMl: 100, salePrice: 4999, mrp: 6249, stock: 50, mythosReward: 150 },
      "50ml": { sku: "MYTH-EDP-WS-50", volumeMl: 50, salePrice: 2799, mrp: 3499, stock: 50, mythosReward: 84 }
    },
    sizes: [
      { ml: 100, price: 4999, mrp: 6249, sku: "MYTH-EDP-WS-100", stock: 50 },
      { ml: 50, price: 2799, mrp: 3499, sku: "MYTH-EDP-WS-50", stock: 50 }
    ],
    rating: 4.9,
    reviewsCount: 142,
    image: "assets/product/5woodsera.webp",
    media: {
      bottleImage: "assets/product/5woodsera.webp",
      cardImage: "assets/product/5woodserabox.webp",
      backgroundImage: "assets/product/5woodserabox.webp",
      gallery: [
        "assets/product/5woodsera.webp",
        "assets/product/5woodserabox.webp",
        "assets/product/5-1.webp",
        "assets/product/5-2.webp"
      ]
    },
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
    }
  },
  {
    id: "ash",
    sku: "MYTH-EDP-AS-100",
    name: "Ash <br><span class=\"product-concentration-sub\">Extrait de Parfum</span>",
    subtitle: "Woody · Unisex",
    collection: "Woody · Unisex",
    tagline: "Smouldering embers and sacred woods born from the fire.",
    defaultSize: "100ml",
    volume: 100,
    volumeMl: 100,
    price: 5999,
    salePrice: 5999,
    compareAtPrice: 7499,
    mrp: 7499,
    pricing: {
      salePrice: 5999,
      mrp: 7499,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "100ml": { sku: "MYTH-EDP-AS-100", volumeMl: 100, salePrice: 5999, mrp: 7499, stock: 50, mythosReward: 180 },
      "50ml": { sku: "MYTH-EDP-AS-50", volumeMl: 50, salePrice: 3499, mrp: 4399, stock: 50, mythosReward: 105 }
    },
    sizes: [
      { ml: 100, price: 5999, mrp: 7499, sku: "MYTH-EDP-AS-100", stock: 50 },
      { ml: 50, price: 3499, mrp: 4399, sku: "MYTH-EDP-AS-50", stock: 50 }
    ],
    rating: 5.0,
    reviewsCount: 168,
    image: "assets/product/6ash.webp",
    media: {
      bottleImage: "assets/product/6ash.webp",
      cardImage: "assets/product/6ashbox.webp",
      backgroundImage: "assets/product/6ashbox.webp",
      gallery: [
        "assets/product/6ash.webp",
        "assets/product/6ashbox.webp",
        "assets/product/6-1.webp",
        "assets/product/6-2.webp"
      ]
    },
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
    }
  },
  {
    id: "mytholis-discovery-set",
    sku: "MYTH-SET-6S-48",
    name: "Sixth Sense",
    subtitle: "Sixth Sense",
    collection: "Sixth Sense",
    tagline: "Awaken your Sixth Sense — experience all six master extraits in deluxe 8ml flacons.",
    defaultSize: "48ml",
    volume: 48,
    volumeMl: 48,
    price: 2999,
    salePrice: 2999,
    compareAtPrice: 4999,
    mrp: 4999,
    pricing: {
      salePrice: 2999,
      mrp: 4999,
      currency: "INR"
    },
    stock: 50,
    inventory: { stock: 50 },
    variants: {
      "48ml": { sku: "MYTH-SET-6S-48", volumeMl: 48, salePrice: 2999, mrp: 4999, stock: 50, mythosReward: 150 }
    },
    sizes: [
      { ml: 48, price: 2999, mrp: 4999, sku: "MYTH-SET-6S-48", stock: 50 }
    ],
    rating: 5.0,
    reviewsCount: 240,
    image: "assets/product/sixthsense.webp",
    media: {
      bottleImage: "assets/product/sixthsense.webp",
      cardImage: "assets/product/sixthsense.webp",
      backgroundImage: "assets/product/sixthsense.webp",
      gallery: [
        "assets/product/sixthsense.webp",
        "assets/product/7-1.webp",
        "assets/product/7-2.webp",
        "assets/product/1kingscar.webp",
        "assets/product/2petralux.webp",
        "assets/product/3oudrion.webp",
        "assets/product/4spark.webp",
        "assets/product/5woodsera.webp",
        "assets/product/6ash.webp"
      ]
    },
    tag: "Sixth Sense",
    gender: "Unisex",
    scentFamily: "Complete Olfactory Wardrobe",
    concentration: "Extrait de Parfum (6 × 8ml Deluxe Vials • 40% Concentration)",
    longevityHours: 12,
    sillageRating: 96,
    accords: ["Sixth Sense Master Set", "All 6 Signature Extraits", "6 × 8ml Deluxe Sprays", "₹1,000 Flacon Voucher"],
    description: "The complete Mytholis master collection in one curated luxury vault — Sixth Sense. Contains deluxe 8ml travel flacons of King Scar, Petralux, Oud Rion, Spark, Wood Sera, and Ash, plus a complimentary ₹1,000 voucher redeemable toward your first full flacon.",
    notes: {
      top: ["Aromatic Spices & Absinthe (King Scar 8ml)", "Italian Bergamot & Black Currant (Petralux 8ml)"],
      heart: ["Smoked Saffron & Cambodian Agarwood (Oud Rion 8ml)", "Sicilian Mandarin & Sparkling Ginger (Spark 8ml)"],
      base: ["Mysore Sandalwood & Bourbon Cedar (Wood Sera 8ml)", "Birch Embers & Frankincense (Ash 8ml)"]
    }
  }
];

if (typeof window !== 'undefined') {
  window.MYTHOLIS_CATALOG = MYTHOLIS_CATALOG;
}
