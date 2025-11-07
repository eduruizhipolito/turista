import { IPlace } from '@/types'

export const PLACES: IPlace[] = [
  {
    id: 1,
    name: "Plaza de Armas de Cusco",
    description: "Corazón histórico de la ciudad imperial, rodeada de arquitectura colonial",
    lat: -13.516754,
    lng: -71.978516,
    imageNFT: "/nft-plaza-armas.png",
    radius: 200,
    category: "historical"
  },
  {
    id: 2,
    name: "Qoricancha - Templo del Sol",
    description: "Templo inca más importante dedicado al dios Sol, con impresionante arquitectura",
    lat: -13.519722,
    lng: -71.975556,
    imageNFT: "/nft-qoricancha.png",
    radius: 200,
    category: "historical"
  }
]
