// One-time backfill: populates the `uses` (Uses & Benefits) field on existing
// products by category, for catalogs created before this field existed.
// Idempotent - skips any product that already has a non-empty `uses` array,
// so it never clobbers a manual admin edit. Run with: node scripts/backfill-product-uses.js
const path = require("path");
const { MongoClient } = require("mongodb");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(path.join(__dirname, ".."));

const USES_BY_CATEGORY = {
  groundnut: [
    {
      heading: "Rich in vitamin E & healthy fats",
      description: "Composed mainly of monounsaturated and polyunsaturated fats, groundnut oil is a rich source of vitamin E, a natural antioxidant.",
      source_name: "Wikipedia",
      source_url: "https://en.wikipedia.org/wiki/Peanut_oil",
    },
    {
      heading: "Traditional massage oil (Abhyanga)",
      description: "Warmed groundnut oil is used in everyday Ayurvedic massage, traditionally valued for nourishing the skin and easing stiffness after a long day.",
      source_name: "Ayur Times",
      source_url: "https://ayurtimes.com/peanut-groundnut-oil-benefits-uses/",
    },
    {
      heading: "Nourishing for dry skin & hair",
      description: "Unrefined groundnut oil is valued in skincare for its moisturizing properties, and is traditionally massaged into dry hair to condition it and ease split ends.",
      source_name: "Ayur Times",
      source_url: "https://ayurtimes.com/peanut-groundnut-oil-benefits-uses/",
    },
  ],
  coconut: [
    {
      heading: "Cooling scalp massage (Shiro Abhyanga)",
      description: "In Ayurveda, coconut oil is considered cooling in nature and is a traditional choice for scalp massage, believed to balance excess Pitta and calm the mind.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/articles/1186-is-coconut-oil-good-for-hair-ayurvedic-benefits-growth--usage-tips",
    },
    {
      heading: "Conditions hair & scalp",
      description: "Rich in lauric acid, coconut oil penetrates the hair shaft to reduce protein loss and is regularly massaged into the scalp to keep hair conditioned and protected from everyday damage.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/articles/1186-is-coconut-oil-good-for-hair-ayurvedic-benefits-growth--usage-tips",
    },
    {
      heading: "Skin & lip moisturizer",
      description: "Coconut oil is traditionally applied to soften, soothe, and protect dry skin, and used as a natural, hydrating alternative to lip balm.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/wiki/article/916-coconut-in-ayurveda",
    },
  ],
  almond: [
    {
      heading: "Carrier oil for skincare & aromatherapy",
      description: "Sweet almond oil is widely used as a carrier oil in aromatherapy and cosmetic skincare formulations, prized for its light texture.",
      source_name: "Wikipedia",
      source_url: "https://en.wikipedia.org/wiki/Almond_oil",
    },
    {
      heading: "Scalp massage & hair care (Badam Rogan)",
      description: "Warm Badam Rogan scalp massage is a traditional Ayurvedic ritual believed to improve circulation and condition hair over time.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/wiki/article/3366-badam-rogan-sweet-almond-oil",
    },
    {
      heading: "Deep moisturizer for dry skin",
      description: "Rich in oleic acid, almond oil is traditionally used to soothe dry, cracked skin and chapped lips with regular application.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/wiki/article/3366-badam-rogan-sweet-almond-oil",
    },
    {
      heading: "Gentle baby massage oil",
      description: "Cold-pressed, pure almond oil is a traditional, light, non-greasy choice for daily infant massage — always patch-test first and check for nut allergies in the family before use.",
      source_name: "Ask Ayurveda",
      source_url: "https://ask-ayurveda.com/articles/1157-which-oil-is-best-for-baby-massage-ayurvedic-guide-for-parents",
    },
  ],
};

module.exports = { USES_BY_CATEGORY };

async function main() {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const products = await db.collection("products").find({}).toArray();

  let updated = 0;
  let skipped = 0;
  for (const p of products) {
    const uses = USES_BY_CATEGORY[p.category];
    if (!uses) {
      console.log(`- skip "${p.name}" (${p.slug}): no default uses for category "${p.category}"`);
      skipped++;
      continue;
    }
    if (Array.isArray(p.uses) && p.uses.length > 0) {
      console.log(`- skip "${p.name}" (${p.slug}): already has ${p.uses.length} use(s)`);
      skipped++;
      continue;
    }
    await db.collection("products").updateOne({ id: p.id }, { $set: { uses } });
    console.log(`- updated "${p.name}" (${p.slug}): added ${uses.length} use(s) for category "${p.category}"`);
    updated++;
  }

  console.log(`\nDone. ${updated} product(s) updated, ${skipped} skipped.`);
  await client.close();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
