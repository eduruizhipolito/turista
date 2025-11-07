import { IProduct } from '@/types'

export const PRODUCTS: IProduct[] = [
  {
    id: 1,
    name: "Tour Guiado Machu Picchu",
    description: "Tour de día completo con guía certificado, incluye transporte y almuerzo",
    image: "/marketplace-tour.jpg",
    merchantAddress: "GMERCHANT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Inca Tours SAC",
    priceXLM: 50,
    priceDiscountXLM: 30,
    priceDiscountTUR: 5000,
    category: "tours"
  },
  {
    id: 2,
    name: "Artesanía de Alpaca",
    description: "Poncho tejido a mano con lana de alpaca 100% natural, diseño tradicional cusqueño",
    image: "/marketplace-poncho.jpg",
    merchantAddress: "GMERCHANT2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Artesanías del Valle",
    priceXLM: 20,
    priceDiscountXLM: 12,
    priceDiscountTUR: 2000,
    category: "crafts"
  },
  {
    id: 3,
    name: "Cena en Restaurante Local",
    description: "Menú degustación de comida cusqueña: ceviche, lomo saltado, chicha morada y postre",
    image: "/marketplace-food.jpg",
    merchantAddress: "GMERCHANT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Restaurante Pachapapa",
    priceXLM: 15,
    priceDiscountXLM: 10,
    priceDiscountTUR: 1500,
    category: "food"
  }
]
