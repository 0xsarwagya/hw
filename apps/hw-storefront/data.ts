import { BundleConfig, ColorOption, Product, Review, User } from "./types";

export const REVIEWS: Review[] = [
  {
    id: "1",
    author: "Rohan M.",
    rating: 5,
    date: "March 11, 2024",
    title: "Best T-shirts Ever!",
    content:
      "The fabric is incredibly soft and the prints super unique. I get compliments every time I wear them. Shipping was fast too!",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtqzGGcnzeljd6JFOPGd0YaJt2xPUtF6-58QAchfa6itnXic6mYlUY2rsDiP6Fgfxr26qV4PI7OxWfjS9r01210mV8tYxdoZbhrdxdZkHqJS5IJUePSdoAe2IOM3FIWvw9h5QzSOHUcfr6P3bdowDxyGJQpPiXmzkHKAFXCwpMKDFD5zPLQn54ARFFmUMjPwUwSZQZsgAASbyi2yPrmR_il6ofjgbxe4ZkSkHOEtLCrgYb-KoDCj9OC-6PHNQ4TXzUgg9IsgiiDaWN",
  },
  {
    id: "2",
    author: "Anjali S.",
    rating: 5,
    date: "January 5, 2024",
    title: "My Go-To For Hoodies",
    content:
      "I practically live in their hoodies now. Warm, stylish, and the black one is a perfect staple. Quality is top-notch.",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcYVEAlHbsMhgw-PDqNf94OR35wOKLo-Rl32YzZBjJ7u2giQlp3lL8XqHx5Y2tXVkRz0V2gkdkVldVLNwjWbPlQ33UXZeLZysQBi6TB86IAwy0QK4uq6qwt460x_vc1yVepRQlzem-v-ZyNYa1av9vbVwBPtqDaDhBxRApboEZf7jqGmmT81Bvon1YyS83wTZIoCCH0f57zrXcYYDYGhb9s0fF5exKiUns8OYkde68eooFNP9jf7k8ng_hg08209c9PMZRnnHZlYuP",
  },
  {
    id: "3",
    author: "Karan L.",
    rating: 5,
    date: "Karan 13, 2024",
    title: "Quality That Lasts",
    content:
      "Bought a few basics months ago and they still look brand new after countless washes. Worth every rupee!",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvdTvwPuE9bZEXCAZFVwphYVWFA0PE-3yPtq8i82hoUOBUnOL_-BiesL5raJ3SSMbvXyVu6VJtAth1GQ991X5oReIzup2ED0-oIEeH82ZzY_74m3qsmIJXVH6XuS59d5eLzU7UEri6iXpOsG7JP-T3eoAlL7-PZMfn37V8srmlS-cBnJzb09V3Zf6CcuJz4D5yw9p8II7CpAbIhom0G2Y3hyR93oAaL-s2shQY1hGe4JXEdsEq1l8OdWxgtBiKJiib0vFWAbKNDhLJ",
  },
  {
    id: "4",
    author: "Aditi K.",
    rating: 4,
    date: "March 11, 2024",
    title: "Stylish & Comfortable!",
    content:
      "Love the unisex designs. Find them fashionable yet incredibly comfortable. Need to get more colors!",
  },
  {
    id: "5",
    author: "Priya L.",
    rating: 5,
    date: "March 14, 2024",
    title: "Exceptional",
    content:
      "My entire casual wardrobe is slowly becoming Hush & Wear. Their stuff just passes the vibe check.",
  },
  {
    id: "6",
    author: "Neha P.",
    rating: 4.5,
    date: "Neha P, 2020",
    title: "New Wardrobe Favorites!",
    content:
      "Love to a few basics months ago still look pristine after comfortable. Need colors!",
  },
];

// Base Images
const IMG_BLACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAwtWCY54CXmOUIOHfFP7sD3Trcv4t4opLRf57cYVo_9_8S1aPznYTjbyVnvdct35Mz5Ym7KDIGwV4SqA-XPidyLKhBTwbasdNMJpbmVWiWJ06DO1bwVbumheGirYncMM0Qe-7M0rT9COGFgpQGNrm1vMaYUEjeTj6rel67Ca6_OMoZIC0GpqNXRwTv3WxKMd6q2TdNKa4rYsUQiRNo1blvlzYmNnIKv0Q0CRDMlJ1nQ0_LQp8yqopMV6Zg586sM3XMBa0Txvb6EOHb";
const IMG_WHITE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMglxaFopmL6YgyCjspxzriwqdygMEx7qE39y0jqOeX8UgBfWia19fRiQxUC3JpLAlCK3X3JUTLbkWLPfw6WZheXUnCZQ5VbwmHvyO484Tqq9uyZ0WfKOfJmpy-tY7nKFI6h81uVfLd7stZ14aYUYHCU32Nc0hmiR-xusnf--mHyQzqwOiQgun7FbCzr4667pWMLSJ5U3Hi2GYe3OHuDQlw-uH-JZyAWsrazhBL-4jQbTk002Z59WL8ZpyERSbix0FiV7_0rdfBDji";
const IMG_GREY =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB0Hk6e41DM6PrKQ1Wh7qj13YQwk_OMAQN45ufI8T9QBGrpHTf8DgN0rpZGhWyQS3Wo16cxpo_765Jxc3IjCtDF4naVRLn8Y6S674thYqN_k3SbOa6JDHeJyUUJl8ETzC8kRYcV-G3S7Hqp84P1loOQi6GO5jM2mYw9VJAk__tuVHi6Dczm2braypPXji8XD3fMPX__4vXmzqP1ryeubBFeMtiyD0eCk8U_N9ioI9mR5qh-ysIx7qM8BaSr7Aq0PCXsU5aTaPUXP7lA";
const IMG_OLIVE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAc2ImU_J89-DyvGLeiHwIKF5m22ow8P-4R9QFiyFmHiUnCWnCRfb9ePmNfVP59mQ5ti_3-u85s4zsHKyLZLkeW-K0WKp5ioZ2S95kEicaKG37suA76CDt0vtf7NVgEj1E5HNDTVpzq-mYSzw2h0zWq9SUhicAEL-k2Wma_HLBrpJleShVekavBcOZAIV8aaVqF8SE1WU4fKepEf5d4YBgO6LcD0OOP1rjiHR4BZ52BGe11dXPwA5F1fDxFNSKiOO1W6q8uvOWFAvbA";

// Expanding to 20 Colors
export const TSHIRT_COLORS: ColorOption[] = [
  { name: "Black", hex: "#000000", image: IMG_BLACK },
  { name: "White", hex: "#FFFFFF", image: IMG_WHITE },
  { name: "Grey", hex: "#808080", image: IMG_GREY },
  { name: "Olive", hex: "#556B2F", image: IMG_OLIVE },
  { name: "Navy", hex: "#000080", image: IMG_BLACK }, // Reusing Black image
  { name: "Red", hex: "#FF0000", image: IMG_BLACK }, // Reusing Black image for silhouette
  { name: "Maroon", hex: "#800000", image: IMG_BLACK },
  { name: "Royal Blue", hex: "#4169E1", image: IMG_BLACK },
  { name: "Sky Blue", hex: "#87CEEB", image: IMG_WHITE }, // Reusing White image
  { name: "Forest Green", hex: "#228B22", image: IMG_OLIVE },
  { name: "Beige", hex: "#F5F5DC", image: IMG_WHITE },
  { name: "Charcoal", hex: "#36454F", image: IMG_GREY },
  { name: "Mustard", hex: "#FFDB58", image: IMG_WHITE },
  { name: "Orange", hex: "#FFA500", image: IMG_WHITE },
  { name: "Yellow", hex: "#FFFF00", image: IMG_WHITE },
  { name: "Purple", hex: "#800080", image: IMG_BLACK },
  { name: "Lavender", hex: "#E6E6FA", image: IMG_WHITE },
  { name: "Pink", hex: "#FFC0CB", image: IMG_WHITE },
  { name: "Teal", hex: "#008080", image: IMG_OLIVE },
  { name: "Brown", hex: "#A52A2A", image: IMG_BLACK },
];

export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"];

// Bundle Configuration - Updated to match request (3, 4, 5, 7, 9)
export const BUNDLES: BundleConfig[] = [
  {
    count: 3,
    price: 999,
    originalPrice: 1499,
    savings: "33%",
    image: TSHIRT_COLORS[0].image,
  },
  {
    count: 4,
    price: 1299,
    originalPrice: 1999,
    savings: "35%",
    image: TSHIRT_COLORS[1].image,
  },
  {
    count: 5,
    price: 1599,
    originalPrice: 2499,
    savings: "36%",
    image: TSHIRT_COLORS[2].image,
  },
  {
    count: 7,
    price: 1999,
    originalPrice: 3499,
    savings: "43%",
    image: TSHIRT_COLORS[3].image,
  },
  {
    count: 9,
    price: 2499,
    originalPrice: 4499,
    savings: "45%",
    image: TSHIRT_COLORS[4].image,
  },
];

// --- Product Generation Logic ---

const PLAIN_STYLES = [
  "Classic Crew",
  "Heavyweight Boxy",
  "Soft Spun",
  "Vintage Wash",
  "Organic Cotton",
  "Performance Tee",
  "Slub Knit",
  "Mercerized",
  "Drop Shoulder",
  "Essential V-Neck",
];

const PRINTED_NAMES = [
  "Urban Jungle",
  "Geo Print",
  "Abstract Lines",
  "Retro Wave",
  "City Lights",
  "Mountain Peak",
  "Ocean Vibes",
  "Desert Dust",
  "Neon Nights",
  "Cyber Punk",
  "Graffiti Soul",
  "Floral Haze",
  "Geometric Pulse",
  "Tribal Mark",
  "Space Cadet",
  "Pixel Art",
  "Glitch Mode",
  "Street Rhythm",
  "Sonic Boom",
  "Future Tech",
];

const HOODIE_NAMES = [
  "Minimalist Hoodie",
  "Statement Hoodie",
  "Zip Up Fleece",
  "Oversized Pullover",
  "Tech Fleece",
  "Vintage Wash Hoodie",
  "Graphic Back-Print",
  "Essential Hoodie",
  "Streetwear Hoodie",
  "Cozy Fleece",
  "Performance Hoodie",
  "Urban Zip",
  "Relaxed Fit Hoodie",
  "Logo Hoodie",
  "Premium Cotton Hoodie",
];

const IMG_PRINTED_TEE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2wEOkzRKOSQCVmqyRV_fsDmM8EmMOByLrZE5Rz1zF9PBfupEvHkogfAB3Ez0Je3PjnAe1MRRdCdcYxYR_TNuZI4TRcb1W-BHWWMJr-i49wdylbwBsNUJXahyRcVAIdac6BS-CVqiyiRMVOrMxi0IMC-Mo6ghKAVezcZ4oUY4OAZ5sFlvh3OL4sHHUhJK4TDGu-fy6DmW8DmOtKshhS3TzDO90CZy0LOq7AK2JNU33jp1AfJwcZTpUzJy4gJ0b5nL16C8YQshCL4Kr";
const IMG_HOODIE_BLACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFEC38fU-fBmMkF4VqHhVBXu7qsAML8JaB09H8ASNnmzPUrklCA512RUbdxbXP_2R6AAuiI7_NFCgZ7ngjueJvUv1R5Lnnooho_slMagc3s-LSmwo2vLXvkfbuSqWqDAaA7XdHaTJ0RsdzDLizLrYXZyDVvkbUXnh3izP1nGxFsAreK2-TT4NC0Dk7oosuNNev7BK8Rp8dHTc7I6bIP8XwL-H1lDiTwQQL2ycZizUpAV5BhpXGHN1bRfVmeXHWpddn_0DNjIs_AiR_";
const IMG_HOODIE_WHITE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuADmZLHzXq_ahkOxXQMM7q9WWX30VD63PtaJ7IBnLBPBZdOFB7Udd1lTITvNMlSchvGuosgkH6fHeygzw20Aq-zKSVJK1PYUtnSCvKXCl9ArDOmwMuWDT9SYXYTDzScXpNf7ULbJdzDwD_1h0Rm56TqJY8evGKfW1fhCPjnX9BLzzuAyzVK_24tmgqR_nPAPU9lah_la2IVfji6tPfvY9mcmNGRMPD1wkAWN9BQG6x81Eyb7i-ZxQc6gDixL8fyMZlZEwqdb35sDUmH";
const IMG_JOGGERS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDkOWosVi1ErOJ9jUk9YsfwNsecOdKePWP7U1t2esLHBgJmMfH_FGoZgX7_TsENPvokqciHZnVPmdSSiARamarYSit51SB32sl88XmZra9vUskylVLsRa6VSdAy8awObO_yX0R2AAeNY8sw_nJkcPO4LSH0bVw_fwybeyRSbmd5CR1Dlr7YJrWnHUYyQeIsuwajT0lQ_ubdgAkxm6H2W1-atIiTGQRlIm21N-BnX_mSRalAeH24W5UplfGncv3tusJQ5_eLMV1g-qQc";

const getProductImages = (mainImg: string, category: string): string[] => {
  const images = [mainImg];
  // Add variety based on category to reach min 4
  if (category === "Tees") {
    if (mainImg !== IMG_WHITE) images.push(IMG_WHITE);
    if (mainImg !== IMG_BLACK) images.push(IMG_BLACK);
    if (mainImg !== IMG_GREY) images.push(IMG_GREY);
    if (mainImg !== IMG_OLIVE) images.push(IMG_OLIVE);
  } else if (category === "Hoodies") {
    if (mainImg !== IMG_HOODIE_BLACK) images.push(IMG_HOODIE_BLACK);
    if (mainImg !== IMG_HOODIE_WHITE) images.push(IMG_HOODIE_WHITE);
    // Re-use some tee images as "detail" shots or generic styling shots since we lack unique hoodie angles
    images.push(IMG_GREY);
    images.push(IMG_BLACK);
  } else {
    // Unisex / Printed
    if (mainImg !== IMG_JOGGERS) images.push(IMG_JOGGERS);
    images.push(IMG_BLACK, IMG_WHITE);
  }

  // Fill if still short (e.g. unique constraints removed too many)
  const pool = [IMG_BLACK, IMG_WHITE, IMG_GREY, IMG_OLIVE, IMG_HOODIE_BLACK];
  let i = 0;
  while (images.length < 4) {
    if (!images.includes(pool[i])) images.push(pool[i]);
    i = (i + 1) % pool.length;
    if (i === 0 && images.length < 4) images.push(mainImg); // duplicate as last resort
  }

  return images.slice(0, 5);
};

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;

  // 1. Generate 40 Plain Tees
  for (let i = 0; i < 40; i++) {
    const style = PLAIN_STYLES[i % PLAIN_STYLES.length];
    const baseColor = TSHIRT_COLORS[i % TSHIRT_COLORS.length]; // Just for initial image/name

    products.push({
      id: `plain-${idCounter++}`,
      name: `${style} ${baseColor.name}`,
      price: 499 + Math.floor(Math.random() * 500),
      image: baseColor.image,
      category: "Tees",
      rating: 4 + Math.random(),
      reviews: Math.floor(Math.random() * 500) + 10,
      description: `Our ${style} is a wardrobe essential. Now available in 20 vibrant colors. Made from premium materials for lasting comfort.`,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: TSHIRT_COLORS.map((c) => c.name), // All 20 colors available
      images: getProductImages(baseColor.image, "Tees"),
    });
  }

  // 2. Generate 20 Printed Tees
  PRINTED_NAMES.forEach((name, idx) => {
    const mainImg = idx % 2 === 0 ? IMG_PRINTED_TEE : IMG_BLACK;
    products.push({
      id: `printed-${idCounter++}`,
      name: `${name} Graphic Tee`,
      price: 699 + Math.floor(Math.random() * 300),
      image: mainImg,
      category: "Tees",
      rating: 4.2 + Math.random() * 0.8,
      reviews: Math.floor(Math.random() * 200) + 5,
      description: `Express yourself with the ${name} tee. High-quality print on our signature soft cotton fabric.`,
      sizes: ["S", "M", "L", "XL"],
      images: getProductImages(mainImg, "Tees"),
    });
  });

  // 3. Generate Hoodies & Unisex (Fill rest to reach 100)

  // 20 Hoodies
  for (let i = 0; i < 20; i++) {
    const name = HOODIE_NAMES[i % HOODIE_NAMES.length];
    const colorVar = i % 3 === 0 ? "Black" : i % 3 === 1 ? "White" : "Grey";
    const img =
      i % 3 === 0
        ? IMG_HOODIE_BLACK
        : i % 3 === 1
          ? IMG_HOODIE_WHITE
          : IMG_GREY;

    products.push({
      id: `hoodie-${idCounter++}`,
      name: `${name} (${colorVar})`,
      price: 1499 + Math.floor(Math.random() * 1000),
      image: img,
      category: "Hoodies",
      rating: 4.5 + Math.random() * 0.5,
      reviews: Math.floor(Math.random() * 1000) + 50,
      description: "Stay warm and stylish with our premium hoodie collection.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: getProductImages(img, "Hoodies"),
    });
  }

  // 20 Unisex / Joggers
  for (let i = 0; i < 20; i++) {
    products.push({
      id: `unisex-${idCounter++}`,
      name: i % 2 === 0 ? "Premium Comfort Joggers" : "Everyday Lounge Pants",
      price: 999 + Math.floor(Math.random() * 500),
      image: IMG_JOGGERS,
      category: "Unisex",
      rating: 4 + Math.random(),
      reviews: Math.floor(Math.random() * 300),
      description:
        "Versatile comfort for everyone. Perfect for lounging or hitting the streets.",
      sizes: ["S", "M", "L", "XL"],
      images: getProductImages(IMG_JOGGERS, "Unisex"),
    });
  }

  return products;
};

export const PRODUCTS = generateProducts();

export const MAIN_PRODUCT: Product = PRODUCTS[0];

export const FREQUENTLY_BOUGHT: Product[] = [
  PRODUCTS[1],
  PRODUCTS[40], // A printed one
  PRODUCTS[60], // A hoodie
];

export const MOCK_USER: User = {
  name: "Arjun Kumar",
  email: "arjun.kumar@example.com",
  phone: "+91 98765 43210",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDtqzGGcnzeljd6JFOPGd0YaJt2xPUtF6-58QAchfa6itnXic6mYlUY2rsDiP6Fgfxr26qV4PI7OxWfjS9r01210mV8tYxdoZbhrdxdZkHqJS5IJUePSdoAe2IOM3FIWvw9h5QzSOHUcfr6P3bdowDxyGJQpPiXmzkHKAFXCwpMKDFD5zPLQn54ARFFmUMjPwUwSZQZsgAASbyi2yPrmR_il6ofjgbxe4ZkSkHOEtLCrgYb-KoDCj9OC-6PHNQ4TXzUgg9IsgiiDaWN",
  addresses: [
    {
      id: "addr_1",
      type: "Home",
      name: "Arjun Kumar",
      street: "123, Green Park Main Road",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560001",
      phone: "+91 98765 43210",
      isDefault: true,
    },
    {
      id: "addr_2",
      type: "Work",
      name: "Arjun Kumar",
      street: "Tech Hub, Building 4",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560103",
      phone: "+91 98765 43210",
      isDefault: false,
    },
  ],
  orders: [
    {
      id: "ORD-7782-9012",
      date: "March 1, 2024",
      status: "Delivered",
      total: 2499,
      shippingAddress: {
        id: "addr_1",
        type: "Home",
        name: "Arjun Kumar",
        street: "123, Green Park Main Road",
        city: "Bangalore",
        state: "Karnataka",
        zip: "560001",
        phone: "+91 98765 43210",
        isDefault: true,
      },
      items: [
        {
          productId: "hoodie-61",
          name: "Minimalist Hoodie (White)",
          price: 1899,
          quantity: 1,
          image: IMG_HOODIE_WHITE,
          selectedSize: "L",
        },
        {
          productId: "plain-3",
          name: "Classic Crew - Grey",
          price: 600,
          quantity: 1,
          image: IMG_GREY,
          selectedSize: "M",
        },
      ],
    },
  ],
  wishlist: [],
};
