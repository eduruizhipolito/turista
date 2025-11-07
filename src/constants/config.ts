export const CONFIG = {
  STELLAR_NETWORK: import.meta.env.PUBLIC_STELLAR_NETWORK || 'testnet',
  HORIZON_URL: import.meta.env.PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  
  CONTRACTS: {
    CHECKIN_NFT: import.meta.env.PUBLIC_CHECKIN_NFT_CONTRACT || '',
    TUR_TOKEN: import.meta.env.PUBLIC_TUR_TOKEN_CONTRACT || '',
    MARKETPLACE: import.meta.env.PUBLIC_MARKETPLACE_CONTRACT || '',
  },
  
  ACCOUNTS: {
    MASTER: import.meta.env.PUBLIC_MASTER_PUBLIC_KEY || '',
    MERCHANT_1: import.meta.env.PUBLIC_MERCHANT_1_ADDRESS || '',
    MERCHANT_2: import.meta.env.PUBLIC_MERCHANT_2_ADDRESS || '',
    MERCHANT_3: import.meta.env.PUBLIC_MERCHANT_3_ADDRESS || '',
  },
  
  DEMO: {
    DEFAULT_LAT: parseFloat(import.meta.env.PUBLIC_DEFAULT_DEMO_LAT || '-13.5165'),
    DEFAULT_LNG: parseFloat(import.meta.env.PUBLIC_DEFAULT_DEMO_LNG || '-71.9786'),
    CHECKIN_RADIUS_METERS: parseInt(import.meta.env.PUBLIC_CHECKIN_RADIUS_METERS || '200'),
  },
  
  GOOGLE_MAPS_API_KEY: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY || '',
}
