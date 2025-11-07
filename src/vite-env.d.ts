/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_MAPS_API_KEY: string
  readonly PUBLIC_STELLAR_NETWORK: string
  readonly PUBLIC_HORIZON_URL: string
  readonly PUBLIC_CHECKIN_NFT_CONTRACT: string
  readonly PUBLIC_TUR_TOKEN_CONTRACT: string
  readonly PUBLIC_MARKETPLACE_CONTRACT: string
  readonly PUBLIC_MASTER_PUBLIC_KEY: string
  readonly PUBLIC_MERCHANT_1_ADDRESS: string
  readonly PUBLIC_MERCHANT_2_ADDRESS: string
  readonly PUBLIC_MERCHANT_3_ADDRESS: string
  readonly PUBLIC_DEFAULT_DEMO_LAT: string
  readonly PUBLIC_DEFAULT_DEMO_LNG: string
  readonly PUBLIC_CHECKIN_RADIUS_METERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
