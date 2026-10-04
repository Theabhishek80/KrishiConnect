// Editable content for the Blog and Recipe sliders / pages.
// Add, remove or reword entries here — no other code needs to change.
// "tone" picks one of the gradient colour themes (1-6) defined in ui.css.

export const BLOGS = [
  {
    slug: "soil-health-basics",
    title: "5 simple ways to improve your soil health this season",
    excerpt: "Healthy soil grows healthy crops. Start with these low-cost habits that work on any farm size.",
    category: "Soil & Farming",
    readTime: "4 min read",
    emoji: "🌱",
    tone: 1,
    body: [
      "Soil is a living system. The more life it holds — earthworms, microbes, fungi — the better it holds water and feeds your crop. The good news is that you do not need expensive inputs to improve it.",
      "1. Add organic matter. Compost, farmyard manure and crop residue slowly feed the soil. Even a few tonnes per acre each year makes a visible difference in structure.",
      "2. Rotate your crops. Following a cereal with a legume such as moong, chana or soybean helps put nitrogen back into the soil and breaks pest cycles.",
      "3. Keep the soil covered. Mulch or a short-duration cover crop protects against heat, heavy rain and erosion, and keeps moisture in.",
      "4. Test before you fertilise. A basic soil test tells you what is actually missing, so you stop paying for nutrients your field already has.",
      "5. Reduce deep tillage. Less disturbance means more soil life and less moisture loss, especially in dry spells."
    ]
  },
  {
    slug: "buying-direct-from-farmers",
    title: "Why buying directly from farmers is good for everyone",
    excerpt: "Shorter supply chains mean fresher produce for you and a fairer price for the people who grow it.",
    category: "Marketplace",
    readTime: "3 min read",
    emoji: "🧺",
    tone: 2,
    body: [
      "In a traditional supply chain, produce can pass through several hands before it reaches your kitchen. Each step adds cost and time, while the farmer often receives only a small share of the final price.",
      "When you buy directly, the farmer earns more per kilogram and you get produce that was harvested recently, not days ago.",
      "Direct buying also builds trust. You know who grew your food, how it was grown, and where it came from.",
      "KisanDirect is built to make that connection simple: browse, order and support local growers from one place."
    ]
  },
  {
    slug: "monsoon-vegetable-care",
    title: "Monsoon vegetable care: protect your crop from excess rain",
    excerpt: "Waterlogging and fungal disease are the biggest monsoon risks. Here is how to stay ahead of them.",
    category: "Seasonal Tips",
    readTime: "5 min read",
    emoji: "🌧️",
    tone: 3,
    body: [
      "Heavy rain can damage vegetables quickly. Standing water starves roots of oxygen, and humid weather invites fungal diseases.",
      "Use raised beds or ridges so excess water drains away from the root zone. Dig shallow drainage channels along the field edges before the rains arrive.",
      "Space plants properly so air can move between them. Crowded plants stay wet for longer and get infected faster.",
      "Scout your field every two or three days. Early signs like yellowing leaves or spots are much easier to control than a full outbreak.",
      "Stake climbing crops such as tomato, cucumber and bottle gourd so fruit stays off wet ground."
    ]
  },
  {
    slug: "organic-pest-control",
    title: "Natural pest control you can make at home",
    excerpt: "Neem, garlic and chilli sprays are cheap, easy and effective against many common pests.",
    category: "Organic Farming",
    readTime: "4 min read",
    emoji: "🍃",
    tone: 4,
    body: [
      "You can control many soft-bodied pests such as aphids, whitefly and young caterpillars with simple home-made sprays.",
      "Neem spray: crush neem leaves or use neem oil, mix with water and a little soap, and spray in the evening.",
      "Garlic-chilli spray: blend garlic and green chilli with water, strain it, dilute, and spray on affected leaves.",
      "Always test on a few plants first and spray in the evening to protect bees and avoid leaf burn. Repeat every week during heavy infestation.",
      "Combine sprays with good habits: remove badly infested leaves, keep the field clean, and encourage helpful insects such as ladybirds."
    ]
  },
  {
    slug: "post-harvest-storage",
    title: "Post-harvest storage: keep produce fresh for longer",
    excerpt: "A little care after harvest can cut losses sharply and keep quality high until the produce is sold.",
    category: "Post Harvest",
    readTime: "3 min read",
    emoji: "📦",
    tone: 5,
    body: [
      "A large share of produce is lost after harvest, not before it. Handling and storage matter as much as growing.",
      "Harvest in the cool part of the day and keep produce in the shade. Heat speeds up spoilage.",
      "Sort out damaged or diseased items right away, since one bad piece can spoil the whole lot.",
      "Store onions and potatoes in dry, dark, well-ventilated spaces. Keep leafy vegetables cool and lightly moist.",
      "Use clean, ventilated crates instead of tightly packed sacks to avoid bruising and heat build-up."
    ]
  },
  {
    slug: "water-saving-irrigation",
    title: "Save water, save money: smarter irrigation for small farms",
    excerpt: "Drip lines, mulching and timing your watering can cut water use without cutting yield.",
    category: "Water Management",
    readTime: "4 min read",
    emoji: "💧",
    tone: 6,
    body: [
      "Water is one of a farmer's biggest costs. Using it wisely protects both your budget and the groundwater you depend on.",
      "Drip irrigation delivers water directly to the roots and can reduce water use significantly compared with flooding.",
      "Mulching with straw or dry leaves cuts evaporation and keeps the soil cooler.",
      "Water early in the morning or late in the evening, when less is lost to the sun and wind.",
      "Check soil moisture by hand before irrigating. If the soil a few centimetres down is still damp, wait another day."
    ]
  }
];

export const RECIPES = [
  {
    slug: "aloo-gobi",
    title: "Aloo Gobi",
    excerpt: "A dry, homestyle potato and cauliflower curry with simple spices.",
    category: "Main Course",
    readTime: "35 min",
    serves: "4 servings",
    level: "Easy",
    emoji: "🥔",
    tone: 1,
    ingredients: ["2 medium potatoes, cubed", "1 small cauliflower, florets", "1 onion, chopped", "2 tomatoes, chopped", "1 tsp cumin seeds", "1 tsp turmeric", "1 tbsp coriander powder", "1 tsp garam masala", "3 tbsp oil", "Salt and fresh coriander"],
    steps: [
      "Heat oil, add cumin seeds and let them crackle.",
      "Add onion and cook until golden, then add tomatoes and cook until soft.",
      "Stir in turmeric, coriander powder and salt.",
      "Add potatoes and cauliflower, mix well, cover and cook on low heat for 15-20 minutes, stirring now and then.",
      "Finish with garam masala and fresh coriander."
    ]
  },
  {
    slug: "palak-paneer",
    title: "Palak Paneer",
    excerpt: "Creamy spinach gravy with soft paneer cubes, rich in iron and flavour.",
    category: "Main Course",
    readTime: "40 min",
    serves: "3 servings",
    level: "Medium",
    emoji: "🥬",
    tone: 2,
    ingredients: ["2 bunches spinach", "200 g paneer, cubed", "1 onion", "2 tomatoes", "4 garlic cloves", "1 inch ginger", "1 tsp cumin", "2 tbsp cream (optional)", "2 tbsp oil or ghee", "Salt, garam masala"],
    steps: [
      "Blanch spinach in hot water for 2 minutes, then cool and blend into a smooth puree.",
      "Heat oil, add cumin, then ginger, garlic and onion. Cook until soft.",
      "Add tomatoes and cook until they break down.",
      "Pour in the spinach puree, add salt and garam masala and simmer for 8 minutes.",
      "Add paneer and cream, simmer 3 more minutes, and serve hot."
    ]
  },
  {
    slug: "tomato-rasam",
    title: "Tomato Rasam",
    excerpt: "A light, tangy South Indian soup that is perfect with rice or on its own.",
    category: "Soup",
    readTime: "25 min",
    serves: "4 servings",
    level: "Easy",
    emoji: "🍅",
    tone: 3,
    ingredients: ["3 ripe tomatoes", "1 tbsp tamarind pulp", "2 tbsp cooked toor dal water", "1 tsp rasam powder", "1 tsp mustard seeds", "2 dried red chillies", "Curry leaves, coriander", "1 tsp ghee", "Salt"],
    steps: [
      "Crush the tomatoes and boil them with tamarind pulp, rasam powder and salt for 8 minutes.",
      "Add the dal water and simmer gently, without a hard boil.",
      "In a small pan heat ghee, add mustard seeds, red chillies and curry leaves.",
      "Pour the tempering into the rasam, add fresh coriander, and serve hot."
    ]
  },
  {
    slug: "vegetable-khichdi",
    title: "Vegetable Khichdi",
    excerpt: "One-pot comfort food made with rice, moong dal and seasonal vegetables.",
    category: "One Pot",
    readTime: "30 min",
    serves: "4 servings",
    level: "Easy",
    emoji: "🍚",
    tone: 4,
    ingredients: ["1 cup rice", "1/2 cup yellow moong dal", "1 cup chopped vegetables (carrot, peas, beans)", "1 tsp cumin", "1/2 tsp turmeric", "1 tbsp ghee", "Salt", "4 cups water"],
    steps: [
      "Wash rice and dal together and drain.",
      "In a pressure cooker heat ghee and add cumin seeds.",
      "Add vegetables, turmeric and salt, then the rice and dal.",
      "Pour in water, close the lid and cook for 3-4 whistles.",
      "Mash lightly and serve with curd, pickle or a spoon of ghee."
    ]
  },
  {
    slug: "carrot-halwa",
    title: "Gajar Ka Halwa",
    excerpt: "Winter's favourite dessert made from fresh carrots, milk and dry fruits.",
    category: "Dessert",
    readTime: "50 min",
    serves: "5 servings",
    level: "Medium",
    emoji: "🥕",
    tone: 5,
    ingredients: ["500 g grated carrots", "500 ml full-fat milk", "1/3 cup sugar", "2 tbsp ghee", "4 cardamom pods, crushed", "Chopped almonds and cashews"],
    steps: [
      "Cook the grated carrots in ghee for 5 minutes.",
      "Add milk and cook on medium heat, stirring often, until it reduces and thickens.",
      "Add sugar and cardamom and cook until the halwa turns glossy and leaves the sides of the pan.",
      "Top with nuts and serve warm."
    ]
  },
  {
    slug: "masala-chaas",
    title: "Masala Chaas",
    excerpt: "Cooling spiced buttermilk, a simple summer drink that aids digestion.",
    category: "Drinks",
    readTime: "5 min",
    serves: "2 glasses",
    level: "Easy",
    emoji: "🥛",
    tone: 6,
    ingredients: ["1 cup fresh curd", "2 cups cold water", "1/2 tsp roasted cumin powder", "1/4 tsp black salt", "Mint leaves, chopped", "1 green chilli (optional)"],
    steps: [
      "Whisk curd and water together until smooth.",
      "Add cumin powder, black salt, mint and chilli.",
      "Chill and serve over ice."
    ]
  }
];

export const getBlog = slug => BLOGS.find(b => b.slug === slug);
export const getRecipe = slug => RECIPES.find(r => r.slug === slug);
