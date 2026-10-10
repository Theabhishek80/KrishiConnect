-- Blogs are now stored in the database so an admin can add / edit / hide / delete them
-- and attach photos. The six blogs that used to be hard-coded in the frontend
-- (data/content.js) are seeded below, so nothing disappears from the website.

CREATE TABLE IF NOT EXISTS blogs (
    id          BIGSERIAL PRIMARY KEY,
    slug        VARCHAR(180) NOT NULL UNIQUE,
    title       VARCHAR(160) NOT NULL,
    excerpt     VARCHAR(500),
    category    VARCHAR(60),
    read_time   VARCHAR(40),
    emoji       VARCHAR(16),
    tone        INTEGER NOT NULL DEFAULT 1,
    image_url   TEXT,
    body        TEXT NOT NULL,
    published   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_blogs_published_order
ON blogs(published, sort_order, id);

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$soil-health-basics$$, $$5 simple ways to improve your soil health this season$$, $$Healthy soil grows healthy crops. Start with these low-cost habits that work on any farm size.$$, $$Soil & Farming$$, $$4 min read$$, $$🌱$$, 1,
 $$Soil is a living system. The more life it holds — earthworms, microbes, fungi — the better it holds water and feeds your crop. The good news is that you do not need expensive inputs to improve it.
1. Add organic matter. Compost, farmyard manure and crop residue slowly feed the soil. Even a few tonnes per acre each year makes a visible difference in structure.
2. Rotate your crops. Following a cereal with a legume such as moong, chana or soybean helps put nitrogen back into the soil and breaks pest cycles.
3. Keep the soil covered. Mulch or a short-duration cover crop protects against heat, heavy rain and erosion, and keeps moisture in.
4. Test before you fertilise. A basic soil test tells you what is actually missing, so you stop paying for nutrients your field already has.
5. Reduce deep tillage. Less disturbance means more soil life and less moisture loss, especially in dry spells.$$,
 TRUE, 100
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$buying-direct-from-farmers$$, $$Why buying directly from farmers is good for everyone$$, $$Shorter supply chains mean fresher produce for you and a fairer price for the people who grow it.$$, $$Marketplace$$, $$3 min read$$, $$🧺$$, 2,
 $$In a traditional supply chain, produce can pass through several hands before it reaches your kitchen. Each step adds cost and time, while the farmer often receives only a small share of the final price.
When you buy directly, the farmer earns more per kilogram and you get produce that was harvested recently, not days ago.
Direct buying also builds trust. You know who grew your food, how it was grown, and where it came from.
KisanDirect is built to make that connection simple: browse, order and support local growers from one place.$$,
 TRUE, 101
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$monsoon-vegetable-care$$, $$Monsoon vegetable care: protect your crop from excess rain$$, $$Waterlogging and fungal disease are the biggest monsoon risks. Here is how to stay ahead of them.$$, $$Seasonal Tips$$, $$5 min read$$, $$🌧️$$, 3,
 $$Heavy rain can damage vegetables quickly. Standing water starves roots of oxygen, and humid weather invites fungal diseases.
Use raised beds or ridges so excess water drains away from the root zone. Dig shallow drainage channels along the field edges before the rains arrive.
Space plants properly so air can move between them. Crowded plants stay wet for longer and get infected faster.
Scout your field every two or three days. Early signs like yellowing leaves or spots are much easier to control than a full outbreak.
Stake climbing crops such as tomato, cucumber and bottle gourd so fruit stays off wet ground.$$,
 TRUE, 102
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$organic-pest-control$$, $$Natural pest control you can make at home$$, $$Neem, garlic and chilli sprays are cheap, easy and effective against many common pests.$$, $$Organic Farming$$, $$4 min read$$, $$🍃$$, 4,
 $$You can control many soft-bodied pests such as aphids, whitefly and young caterpillars with simple home-made sprays.
Neem spray: crush neem leaves or use neem oil, mix with water and a little soap, and spray in the evening.
Garlic-chilli spray: blend garlic and green chilli with water, strain it, dilute, and spray on affected leaves.
Always test on a few plants first and spray in the evening to protect bees and avoid leaf burn. Repeat every week during heavy infestation.
Combine sprays with good habits: remove badly infested leaves, keep the field clean, and encourage helpful insects such as ladybirds.$$,
 TRUE, 103
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$post-harvest-storage$$, $$Post-harvest storage: keep produce fresh for longer$$, $$A little care after harvest can cut losses sharply and keep quality high until the produce is sold.$$, $$Post Harvest$$, $$3 min read$$, $$📦$$, 5,
 $$A large share of produce is lost after harvest, not before it. Handling and storage matter as much as growing.
Harvest in the cool part of the day and keep produce in the shade. Heat speeds up spoilage.
Sort out damaged or diseased items right away, since one bad piece can spoil the whole lot.
Store onions and potatoes in dry, dark, well-ventilated spaces. Keep leafy vegetables cool and lightly moist.
Use clean, ventilated crates instead of tightly packed sacks to avoid bruising and heat build-up.$$,
 TRUE, 104
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs
 (slug, title, excerpt, category, read_time, emoji, tone, body, published, sort_order)
VALUES (
 $$water-saving-irrigation$$, $$Save water, save money: smarter irrigation for small farms$$, $$Drip lines, mulching and timing your watering can cut water use without cutting yield.$$, $$Water Management$$, $$4 min read$$, $$💧$$, 6,
 $$Water is one of a farmer's biggest costs. Using it wisely protects both your budget and the groundwater you depend on.
Drip irrigation delivers water directly to the roots and can reduce water use significantly compared with flooding.
Mulching with straw or dry leaves cuts evaporation and keeps the soil cooler.
Water early in the morning or late in the evening, when less is lost to the sun and wind.
Check soil moisture by hand before irrigating. If the soil a few centimetres down is still damp, wait another day.$$,
 TRUE, 105
) ON CONFLICT (slug) DO NOTHING;

