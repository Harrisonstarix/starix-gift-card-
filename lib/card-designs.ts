// ============================================================
// GIFT CARD DESIGNS - BMW SERIES COLLECTION
// Latest 30 BMW models for premium gift card designs
// ============================================================

export type CardCategory = "bmw"

export interface CardDesignConfig {
  id: string
  name: string
  category: CardCategory
  image: string
  gradient: string
  textColor: "light" | "dark"
  accentColor: string
  description: string
}

export interface DesignCategory {
  id: CardCategory
  name: string
}

export const CARD_CATEGORIES: CardCategory[] = ["bmw"]

export const DESIGN_CATEGORIES: DesignCategory[] = [{ id: "bmw", name: "BMW Series" }]

export const CARD_DESIGNS: CardDesignConfig[] = [
  {
    id: "bmw-m5-f90",
    name: "BMW M5 F90",
    category: "bmw",
    image: "/bmw-m5-f90-dark-blue-luxury-sedan-professional-pho.jpg",
    gradient: "from-slate-900 via-slate-800 to-slate-900",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW M5 Competition",
  },
  {
    id: "bmw-m8-gran-coupe",
    name: "BMW M8 Gran Coupe",
    category: "bmw",
    image: "/bmw-m8-gran-coupe-black-luxury-sports-car-professi.jpg",
    gradient: "from-zinc-900 via-zinc-800 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW M8 Gran Coupe",
  },
  {
    id: "bmw-i7-xdrive60",
    name: "BMW i7 xDrive60",
    category: "bmw",
    image: "/bmw-i7-electric-luxury-sedan-silver-futuristic-pro.jpg",
    gradient: "from-blue-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW i7 Electric Flagship",
  },
  {
    id: "bmw-xm",
    name: "BMW XM",
    category: "bmw",
    image: "/bmw-xm-suv-red-luxury-performance-vehicle-professi.jpg",
    gradient: "from-red-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#C41E3A",
    description: "2024 BMW XM Hybrid SUV",
  },
  {
    id: "bmw-m4-csl",
    name: "BMW M4 CSL",
    category: "bmw",
    image: "/bmw-m4-csl-yellow-racing-coupe-track-car-professio.jpg",
    gradient: "from-yellow-600 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#F59E0B",
    description: "2024 BMW M4 CSL Limited",
  },
  {
    id: "bmw-x7-m60i",
    name: "BMW X7 M60i",
    category: "bmw",
    image: "/bmw-x7-m60i-large-luxury-suv-black-professional-ph.jpg",
    gradient: "from-slate-800 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW X7 M60i",
  },
  {
    id: "bmw-7-series-g70",
    name: "BMW 7 Series G70",
    category: "bmw",
    image: "/bmw-7-series-g70-flagship-sedan-gray-luxury-profes.jpg",
    gradient: "from-gray-900 via-gray-800 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW 7 Series Flagship",
  },
  {
    id: "bmw-m3-touring",
    name: "BMW M3 Touring",
    category: "bmw",
    image: "/bmw-m3-touring-wagon-green-isle-of-man-professiona.jpg",
    gradient: "from-green-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#10B981",
    description: "2024 BMW M3 Competition Touring",
  },
  {
    id: "bmw-ix-m60",
    name: "BMW iX M60",
    category: "bmw",
    image: "/bmw-ix-m60-electric-suv-blue-modern-professional-p.jpg",
    gradient: "from-cyan-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#06B6D4",
    description: "2024 BMW iX M60 Electric",
  },
  {
    id: "bmw-8-series-coupe",
    name: "BMW 8 Series Coupe",
    category: "bmw",
    image: "/bmw-8-series-coupe-purple-luxury-grand-tourer-prof.jpg",
    gradient: "from-purple-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#9333EA",
    description: "2024 BMW 8 Series Coupe",
  },
  {
    id: "bmw-x6-m",
    name: "BMW X6 M",
    category: "bmw",
    image: "/bmw-x6-m-performance-suv-orange-sporty-professiona.jpg",
    gradient: "from-orange-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#F97316",
    description: "2024 BMW X6 M Competition",
  },
  {
    id: "bmw-z4-m40i",
    name: "BMW Z4 M40i",
    category: "bmw",
    image: "/bmw-z4-m40i-roadster-red-convertible-sports-car-pr.jpg",
    gradient: "from-red-800 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#DC2626",
    description: "2024 BMW Z4 M40i Roadster",
  },
  {
    id: "bmw-x5-m60i",
    name: "BMW X5 M60i",
    category: "bmw",
    image: "/bmw-x5-m60i-luxury-suv-dark-green-professional-pho.jpg",
    gradient: "from-emerald-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#10B981",
    description: "2024 BMW X5 M60i",
  },
  {
    id: "bmw-m2-g87",
    name: "BMW M2 G87",
    category: "bmw",
    image: "/bmw-m2-g87-compact-sports-car-blue-zandvoort-profe.jpg",
    gradient: "from-blue-800 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#2563EB",
    description: "2024 BMW M2 Coupe",
  },
  {
    id: "bmw-i5-m60",
    name: "BMW i5 M60",
    category: "bmw",
    image: "/bmw-i5-m60-electric-sedan-teal-modern-professional.jpg",
    gradient: "from-teal-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#14B8A6",
    description: "2024 BMW i5 M60 Electric",
  },
  {
    id: "bmw-x4-m40i",
    name: "BMW X4 M40i",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-indigo-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#6366F1",
    description: "2024 BMW X4 M40i",
  },
  {
    id: "bmw-5-series-g60",
    name: "BMW 5 Series G60",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-slate-700 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW 5 Series",
  },
  {
    id: "bmw-x3-m40i",
    name: "BMW X3 M40i",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-amber-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#F59E0B",
    description: "2024 BMW X3 M40i",
  },
  {
    id: "bmw-4-series-gran-coupe",
    name: "BMW 4 Series Gran Coupe",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-rose-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#F43F5E",
    description: "2024 BMW 4 Series Gran Coupe",
  },
  {
    id: "bmw-x1-m35i",
    name: "BMW X1 M35i",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-sky-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#0EA5E9",
    description: "2024 BMW X1 M35i",
  },
  {
    id: "bmw-3-series-g20",
    name: "BMW 3 Series G20",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-zinc-800 via-zinc-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW 3 Series",
  },
  {
    id: "bmw-2-series-coupe",
    name: "BMW 2 Series Coupe",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-violet-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#8B5CF6",
    description: "2024 BMW 2 Series Coupe",
  },
  {
    id: "bmw-ix1-xdrive30",
    name: "BMW iX1 xDrive30",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-lime-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#84CC16",
    description: "2024 BMW iX1 Electric",
  },
  {
    id: "bmw-i4-m50",
    name: "BMW i4 M50",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-blue-950 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW i4 M50 Electric",
  },
  {
    id: "bmw-x2-m35i",
    name: "BMW X2 M35i",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-fuchsia-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#D946EF",
    description: "2024 BMW X2 M35i",
  },
  {
    id: "bmw-x5-xdrive50e",
    name: "BMW X5 xDrive50e",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-green-800 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#22C55E",
    description: "2024 BMW X5 Plug-in Hybrid",
  },
  {
    id: "bmw-8-series-convertible",
    name: "BMW 8 Series Convertible",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-pink-900 via-slate-900 to-black",
    textColor: "light",
    accentColor: "#EC4899",
    description: "2024 BMW 8 Series Convertible",
  },
  {
    id: "bmw-m340i-xdrive",
    name: "BMW M340i xDrive",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-stone-800 via-stone-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW M340i xDrive",
  },
  {
    id: "bmw-alpina-b8",
    name: "BMW Alpina B8",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-blue-950 via-blue-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW Alpina B8 Gran Coupe",
  },
  {
    id: "bmw-m760e-xdrive",
    name: "BMW M760e xDrive",
    category: "bmw",
    image: "/placeholder.svg?height=400&width=600",
    gradient: "from-neutral-800 via-neutral-900 to-black",
    textColor: "light",
    accentColor: "#0066B1",
    description: "2024 BMW M760e Plug-in Hybrid",
  },
]

export function getDesignById(id: string): CardDesignConfig | undefined {
  return CARD_DESIGNS.find((design) => design.id === id)
}

export function getDesignsByCategory(category: CardCategory | string): CardDesignConfig[] {
  return CARD_DESIGNS.filter((design) => design.category === category)
}

export function getRandomDesign(): CardDesignConfig {
  return CARD_DESIGNS[Math.floor(Math.random() * CARD_DESIGNS.length)]
}

export function getDefaultDesign(): CardDesignConfig {
  return CARD_DESIGNS[0]
}

export function getCategoryLabel(category: CardCategory | string): string {
  const cat = DESIGN_CATEGORIES.find((c) => c.id === category)
  return cat?.name || category.charAt(0).toUpperCase() + category.slice(1)
}
