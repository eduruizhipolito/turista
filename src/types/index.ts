export interface IPlace {
  id: number
  name: string
  description: string
  lat: number
  lng: number
  imageNFT: string
  radius: number
  category: string
}

export interface ICheckinNFT {
  token_id: bigint
  place_id: number
  place_name: string
  latitude: bigint
  longitude: bigint
  check_in_timestamp: bigint
  owner: string
  image_url: string
}

export interface IProduct {
  id: number
  name: string
  description: string
  image: string
  merchantAddress: string
  merchantName: string
  priceXLM: number
  priceDiscountXLM: number
  priceDiscountTUR: number
  category: string
}

export interface IUserStats {
  checkinsCount: number
  nftsCount: number
  purchasesCount: number
}

export interface IWalletState {
  publicKey: string | null
  isConnected: boolean
  balanceXLM: number
  balanceTUR: number
}
