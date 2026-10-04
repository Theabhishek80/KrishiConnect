-- Recipes are now stored in the database so they can be added / edited by an admin.
-- The six recipes that used to be hard-coded in the frontend are seeded below,
-- so nothing disappears from the website.

CREATE TABLE IF NOT EXISTS recipes (
    id          BIGSERIAL PRIMARY KEY,
    slug        VARCHAR(180) NOT NULL UNIQUE,
    title       VARCHAR(160) NOT NULL,
    excerpt     VARCHAR(500),
    category    VARCHAR(60),
    read_time   VARCHAR(40),
    serves      VARCHAR(40),
    level       VARCHAR(20),
    emoji       VARCHAR(16),
    tone        INTEGER NOT NULL DEFAULT 1,
    image_url   TEXT,
    ingredients TEXT NOT NULL,
    steps       TEXT NOT NULL,
    published   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_recipes_published_order
ON recipes(published, sort_order, id);

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$aloo-gobi$$, $$Aloo Gobi$$, $$A dry, homestyle potato and cauliflower curry with simple spices.$$, $$Main Course$$, $$35 min$$, $$4 servings$$, $$Easy$$, $$🥔$$, 1,
 $$2 medium potatoes, cubed
1 small cauliflower, florets
1 onion, chopped
2 tomatoes, chopped
1 tsp cumin seeds
1 tsp turmeric
1 tbsp coriander powder
1 tsp garam masala
3 tbsp oil
Salt and fresh coriander$$,
 $$Heat oil, add cumin seeds and let them crackle.
Add onion and cook until golden, then add tomatoes and cook until soft.
Stir in turmeric, coriander powder and salt.
Add potatoes and cauliflower, mix well, cover and cook on low heat for 15-20 minutes, stirring now and then.
Finish with garam masala and fresh coriander.$$,
 TRUE, 100
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$palak-paneer$$, $$Palak Paneer$$, $$Creamy spinach gravy with soft paneer cubes, rich in iron and flavour.$$, $$Main Course$$, $$40 min$$, $$3 servings$$, $$Medium$$, $$🥬$$, 2,
 $$2 bunches spinach
200 g paneer, cubed
1 onion
2 tomatoes
4 garlic cloves
1 inch ginger
1 tsp cumin
2 tbsp cream (optional)
2 tbsp oil or ghee
Salt, garam masala$$,
 $$Blanch spinach in hot water for 2 minutes, then cool and blend into a smooth puree.
Heat oil, add cumin, then ginger, garlic and onion. Cook until soft.
Add tomatoes and cook until they break down.
Pour in the spinach puree, add salt and garam masala and simmer for 8 minutes.
Add paneer and cream, simmer 3 more minutes, and serve hot.$$,
 TRUE, 101
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$tomato-rasam$$, $$Tomato Rasam$$, $$A light, tangy South Indian soup that is perfect with rice or on its own.$$, $$Soup$$, $$25 min$$, $$4 servings$$, $$Easy$$, $$🍅$$, 3,
 $$3 ripe tomatoes
1 tbsp tamarind pulp
2 tbsp cooked toor dal water
1 tsp rasam powder
1 tsp mustard seeds
2 dried red chillies
Curry leaves, coriander
1 tsp ghee
Salt$$,
 $$Crush the tomatoes and boil them with tamarind pulp, rasam powder and salt for 8 minutes.
Add the dal water and simmer gently, without a hard boil.
In a small pan heat ghee, add mustard seeds, red chillies and curry leaves.
Pour the tempering into the rasam, add fresh coriander, and serve hot.$$,
 TRUE, 102
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$vegetable-khichdi$$, $$Vegetable Khichdi$$, $$One-pot comfort food made with rice, moong dal and seasonal vegetables.$$, $$One Pot$$, $$30 min$$, $$4 servings$$, $$Easy$$, $$🍚$$, 4,
 $$1 cup rice
1/2 cup yellow moong dal
1 cup chopped vegetables (carrot, peas, beans)
1 tsp cumin
1/2 tsp turmeric
1 tbsp ghee
Salt
4 cups water$$,
 $$Wash rice and dal together and drain.
In a pressure cooker heat ghee and add cumin seeds.
Add vegetables, turmeric and salt, then the rice and dal.
Pour in water, close the lid and cook for 3-4 whistles.
Mash lightly and serve with curd, pickle or a spoon of ghee.$$,
 TRUE, 103
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$carrot-halwa$$, $$Gajar Ka Halwa$$, $$Winter's favourite dessert made from fresh carrots, milk and dry fruits.$$, $$Dessert$$, $$50 min$$, $$5 servings$$, $$Medium$$, $$🥕$$, 5,
 $$500 g grated carrots
500 ml full-fat milk
1/3 cup sugar
2 tbsp ghee
4 cardamom pods, crushed
Chopped almonds and cashews$$,
 $$Cook the grated carrots in ghee for 5 minutes.
Add milk and cook on medium heat, stirring often, until it reduces and thickens.
Add sugar and cardamom and cook until the halwa turns glossy and leaves the sides of the pan.
Top with nuts and serve warm.$$,
 TRUE, 104
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes
 (slug, title, excerpt, category, read_time, serves, level, emoji, tone, ingredients, steps, published, sort_order)
VALUES (
 $$masala-chaas$$, $$Masala Chaas$$, $$Cooling spiced buttermilk, a simple summer drink that aids digestion.$$, $$Drinks$$, $$5 min$$, $$2 glasses$$, $$Easy$$, $$🥛$$, 6,
 $$1 cup fresh curd
2 cups cold water
1/2 tsp roasted cumin powder
1/4 tsp black salt
Mint leaves, chopped
1 green chilli (optional)$$,
 $$Whisk curd and water together until smooth.
Add cumin powder, black salt, mint and chilli.
Chill and serve over ice.$$,
 TRUE, 105
) ON CONFLICT (slug) DO NOTHING;


