// Shared Mytholis Catalog formatted for Fastrr / Shiprocket Checkout Engine

export const FASTRR_COLLECTIONS = [
  {
    id: 101,
    title: "Signature Extraits",
    handle: "signature-extraits",
    body_html: "<p>House Mytholis Signature High-Concentration Extrait de Parfum Collection.</p>",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    image: {
      src: "https://mytholis.com/assets/product/2petralux.webp"
    }
  },
  {
    id: 102,
    title: "Masculine & Regal",
    handle: "masculine-regal",
    body_html: "<p>Commanding aromatic & woody extraits forged in spices, absinthe and smoke.</p>",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    image: {
      src: "https://mytholis.com/assets/product/1kingscar.webp"
    }
  },
  {
    id: 103,
    title: "Discovery & Coffrets",
    handle: "discovery-coffrets",
    body_html: "<p>Sample the entire olfactory pantheon with our handcrafted discovery coffrets.</p>",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    image: {
      src: "https://mytholis.com/assets/product/coffret.webp"
    }
  }
];

export const FASTRR_PRODUCTS = [
  {
    id: 1001,
    handle: "king-scar",
    title: "King Scar Extrait de Parfum",
    body_html: "<p>Commanding, sharp and regal. King Scar opens with an intoxicating rush of pink pepper, peppermint, crisp bergamot and absinthe before descending into a royal heart of lavender, Bulgarian rose, allspice and orris root. A lasting base of Haitian vetiver, cedar, white musk and tonka bean seals your legend.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Aromatic, Spicy, Lavender, Absinthe, Vetiver, Luxury",
    status: "active",
    collection_id: 102,
    image: {
      src: "https://mytholis.com/assets/product/1kingscar.webp"
    },
    variants: [
      {
        id: 10011,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-KS-8ML",
        quantity: 100,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      },
      {
        id: 10012,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-KS-50ML",
        quantity: 150,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      },
      {
        id: 10013,
        title: "100ml Sovereign Flacon",
        price: "5999.00",
        sku: "MYTH-KS-100ML",
        quantity: 80,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      }
    ]
  },
  {
    id: 1002,
    handle: "petralux",
    title: "Petralux Extrait de Parfum",
    body_html: "<p>Luminous luxury and royal fruit trapped in stone. A dazzling opening of passionfruit, white peach, raspberry and cassis rests on lily-of-the-valley, warmed by patchouli, heliotrope, sandalwood and seductive amber.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Fruity, Amber, Passionfruit, Peach, Sandalwood, Unisex",
    status: "active",
    collection_id: 101,
    image: {
      src: "https://mytholis.com/assets/product/2petralux.webp"
    },
    variants: [
      {
        id: 10021,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-PL-8ML",
        quantity: 120,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/2petralux.webp" }
      },
      {
        id: 10022,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-PL-50ML",
        quantity: 200,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/2petralux.webp" }
      },
      {
        id: 10023,
        title: "100ml Sovereign Flacon",
        price: "4999.00",
        sku: "MYTH-PL-100ML",
        quantity: 100,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/2petralux.webp" }
      }
    ]
  },
  {
    id: 1003,
    handle: "oud-rion",
    title: "Oud Rion Extrait de Parfum",
    body_html: "<p>A regal collision of rare Cambodian Agarwood, rich saffron, midnight damascena rose, and charred birchwood, leaving an immortal sillage.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Oud, Saffron, Rose, Amber, Oriental, Royale",
    status: "active",
    collection_id: 101,
    image: {
      src: "https://mytholis.com/assets/product/3oudrion.webp"
    },
    variants: [
      {
        id: 10031,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-OR-8ML",
        quantity: 90,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/3oudrion.webp" }
      },
      {
        id: 10032,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-OR-50ML",
        quantity: 130,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/3oudrion.webp" }
      },
      {
        id: 10033,
        title: "100ml Sovereign Flacon",
        price: "5499.00",
        sku: "MYTH-OR-100ML",
        quantity: 75,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/3oudrion.webp" }
      }
    ]
  },
  {
    id: 1004,
    handle: "spark",
    title: "Spark Extrait de Parfum",
    body_html: "<p>Electrifying amber and crystalline citruses that ignite the senses with fiery pink pepper and golden benzoin.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Amber, Citrus, Pink Pepper, Benzoin, Warm",
    status: "active",
    collection_id: 101,
    image: {
      src: "https://mytholis.com/assets/product/4spark.webp"
    },
    variants: [
      {
        id: 10041,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-SP-8ML",
        quantity: 80,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      },
      {
        id: 10042,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-SP-50ML",
        quantity: 110,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      },
      {
        id: 10043,
        title: "100ml Sovereign Flacon",
        price: "4999.00",
        sku: "MYTH-SP-100ML",
        quantity: 60,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      }
    ]
  },
  {
    id: 1005,
    handle: "wood-sera",
    title: "Wood Sera Extrait de Parfum",
    body_html: "<p>Deep mystical cedarwood, sandalwood, and dark vetiver veiled in smoky incense and sacred benzoin resin.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Woody, Cedar, Sandalwood, Incense, Deep",
    status: "active",
    collection_id: 102,
    image: {
      src: "https://mytholis.com/assets/product/1kingscar.webp"
    },
    variants: [
      {
        id: 10051,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-WS-8ML",
        quantity: 70,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      },
      {
        id: 10052,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-WS-50ML",
        quantity: 90,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      },
      {
        id: 10053,
        title: "100ml Sovereign Flacon",
        price: "5499.00",
        sku: "MYTH-WS-100ML",
        quantity: 50,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/1kingscar.webp" }
      }
    ]
  },
  {
    id: 1006,
    handle: "ash",
    title: "Ash Extrait de Parfum",
    body_html: "<p>Smoky birch tar, blackened leather, and white pepper rising like a phoenix from ceremonial woods.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Extrait de Parfum",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Smoky, Leather, Birch Tar, Incense, Dark",
    status: "active",
    collection_id: 102,
    image: {
      src: "https://mytholis.com/assets/product/4spark.webp"
    },
    variants: [
      {
        id: 10061,
        title: "8ml Pocket Flacon",
        price: "899.00",
        sku: "MYTH-ASH-8ML",
        quantity: 80,
        taxable: true,
        grams: 120,
        weight: 0.12,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      },
      {
        id: 10062,
        title: "50ml Grand Flacon",
        price: "3999.00",
        sku: "MYTH-ASH-50ML",
        quantity: 100,
        taxable: true,
        grams: 350,
        weight: 0.35,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      },
      {
        id: 10063,
        title: "100ml Sovereign Flacon",
        price: "4999.00",
        sku: "MYTH-ASH-100ML",
        quantity: 60,
        taxable: true,
        grams: 550,
        weight: 0.55,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/4spark.webp" }
      }
    ]
  },
  {
    id: 1007,
    handle: "mytholis-discovery-set",
    title: "The Pantheon Discovery Coffret (7x5ml)",
    body_html: "<p>Experience the entire olfactory pantheon of House Mytholis. Features all seven extraits presented in a bespoke black lacquer presentation box with tasting blotters.</p>",
    vendor: "Mytholis Luxury Parfums",
    product_type: "Discovery Set",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: "Discovery Set, Samples, Coffret, Luxury Gift",
    status: "active",
    collection_id: 103,
    image: {
      src: "https://mytholis.com/assets/product/coffret.webp"
    },
    variants: [
      {
        id: 10071,
        title: "7 x 5ml Coffret Box",
        price: "1499.00",
        sku: "MYTH-COFFRET-7X5",
        quantity: 250,
        taxable: true,
        grams: 300,
        weight: 0.3,
        weight_unit: "kg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        image: { src: "https://mytholis.com/assets/product/coffret.webp" }
      }
    ]
  }
];
