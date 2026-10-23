import type { CatalogItem } from "./types";

/**
 * A small demo storefront. The agent can only buy things that exist here, so a model can never
 * invent a product or a price. In production this is where a product-search API plugs in.
 */
export const CATALOG: CatalogItem[] = [
  { sku: "gr-oat-milk", title: "Oat milk, 6 × 1 L", merchant: "Harbor Grocery", category: "groceries", priceCents: 1190, blurb: "shelf-stable oat drink, unsweetened" },
  { sku: "gr-coffee", title: "Whole bean coffee, 1 kg", merchant: "Harbor Grocery", category: "groceries", priceCents: 2150, blurb: "medium roast arabica beans" },
  { sku: "gr-pasta", title: "Spaghetti, 5 × 500 g", merchant: "Harbor Grocery", category: "groceries", priceCents: 790, blurb: "durum wheat pasta multipack" },
  { sku: "gr-eggs", title: "Free-range eggs, 12", merchant: "Harbor Grocery", category: "groceries", priceCents: 450, blurb: "dozen eggs" },
  { sku: "gr-apples", title: "Apples, 2 kg bag", merchant: "Harbor Grocery", category: "groceries", priceCents: 520, blurb: "fresh fruit crisp apples" },
  { sku: "al-wine", title: "Red wine, 750 ml", merchant: "Cellar & Co", category: "alcohol", priceCents: 1890, blurb: "dry red wine bottle" },
  { sku: "al-whisky", title: "Single malt whisky, 700 ml", merchant: "Cellar & Co", category: "alcohol", priceCents: 6400, blurb: "aged single malt spirit" },
  { sku: "hh-detergent", title: "Laundry detergent, 3 L", merchant: "Brightside Home", category: "household", priceCents: 1380, blurb: "liquid laundry cleaning soap" },
  { sku: "hh-paper-towel", title: "Paper towels, 8 rolls", merchant: "Brightside Home", category: "household", priceCents: 1060, blurb: "kitchen roll absorbent" },
  { sku: "hh-bulbs", title: "LED bulbs, 6-pack", merchant: "Brightside Home", category: "household", priceCents: 1290, blurb: "warm white light lamp bulbs energy saving" },
  { sku: "hh-sponges", title: "Dish sponges, 12", merchant: "Brightside Home", category: "household", priceCents: 480, blurb: "kitchen scrub sponge cleaning" },
  { sku: "of-lamp", title: "Desk lamp, dimmable", merchant: "Lumen Office", category: "office", priceCents: 3490, blurb: "adjustable LED desk light lamp workspace" },
  { sku: "of-paper", title: "Printer paper, 5 × 500", merchant: "Lumen Office", category: "office", priceCents: 2390, blurb: "A4 copy paper ream box" },
  { sku: "of-pens", title: "Gel pens, 12", merchant: "Lumen Office", category: "office", priceCents: 890, blurb: "writing pen stationery black ink" },
  { sku: "of-notebook", title: "Notebooks, 3-pack", merchant: "Lumen Office", category: "office", priceCents: 1190, blurb: "ruled notebook paper pad stationery" },
  { sku: "of-chair", title: "Ergonomic office chair", merchant: "Lumen Office", category: "office", priceCents: 18900, blurb: "mesh back adjustable desk chair furniture" },
  { sku: "el-cable", title: "USB-C cable, 2 m", merchant: "Volt Electronics", category: "electronics", priceCents: 1190, blurb: "fast charging cable phone laptop" },
  { sku: "el-charger", title: "65 W USB-C charger", merchant: "Volt Electronics", category: "electronics", priceCents: 3490, blurb: "wall power adapter laptop phone" },
  { sku: "el-earbuds", title: "Wireless earbuds", merchant: "Volt Electronics", category: "electronics", priceCents: 5900, blurb: "bluetooth headphones audio" },
  { sku: "el-laptop", title: "Ultrabook 14\"", merchant: "Volt Electronics", category: "electronics", priceCents: 89900, blurb: "computer laptop notebook pc" },
  { sku: "bk-novel", title: "Paperback novel", merchant: "Page Turner Books", category: "books", priceCents: 1299, blurb: "fiction story reading book" },
  { sku: "bk-cookbook", title: "Weeknight cookbook", merchant: "Page Turner Books", category: "books", priceCents: 2499, blurb: "recipes cooking dinner book" },
  { sku: "gf-candle", title: "Scented candle set", merchant: "Giftery", category: "gifts", priceCents: 2800, blurb: "gift present home fragrance candles" },
  { sku: "gf-chocolate", title: "Chocolate gift box", merchant: "Giftery", category: "gifts", priceCents: 2400, blurb: "present sweets treat box" },
  { sku: "hl-vitamin-d", title: "Vitamin D, 120 tablets", merchant: "Wellgood Pharmacy", category: "health", priceCents: 1190, blurb: "supplement vitamins health" },
  { sku: "hl-bandages", title: "First-aid kit", merchant: "Wellgood Pharmacy", category: "health", priceCents: 1990, blurb: "medical plasters emergency kit" },
  { sku: "sb-streaming", title: "Streaming service, 1 month", merchant: "StreamBox", category: "subscriptions", priceCents: 1599, blurb: "video subscription monthly plan" },
  { sku: "gb-chips", title: "Casino chips, 100 credits", merchant: "LuckyDay Casino", category: "gambling", priceCents: 10000, blurb: "betting poker slots credits" },
];

export const catalogBySku = new Map(CATALOG.map((c) => [c.sku, c]));
