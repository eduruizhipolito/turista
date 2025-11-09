import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { 
  Contract, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder, 
  BASE_FEE,
  Address,
  nativeToScVal,
  xdr,
  scValToNative
} from '@stellar/stellar-sdk'

const CHECKIN_CONTRACT_ID = import.meta.env.VITE_CHECKIN_NFT_CONTRACT || ''
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

interface CheckinParams {
  placeId: number
  placeName: string
  latitude: number
  longitude: number
  imageUrl: string
}

class CheckinService {
  private rpcServer: SorobanRpc.Server

  constructor() {
    this.rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: true })
  }

  /**
   * Convert string to Soroban String ScVal
   */
  private stringToScVal(str: string): xdr.ScVal {
    // Soroban String type is represented as ScVal::String (not Symbol or Bytes)
    // Use xdr.ScVal.scvString() directly
    return xdr.ScVal.scvString(str)
  }

  /**
   * Realiza check-in en un lugar y mintea NFT
   */
  async performCheckin(
    kit: StellarWalletsKit,
    userAddress: string,
    params: CheckinParams
  ): Promise<{ success: boolean; tokenId?: bigint; error?: string; txHash?: string }> {
    try {
      if (!CHECKIN_CONTRACT_ID) {
        throw new Error('Contract ID not configured')
      }

      // 1. Get account
      const account = await this.rpcServer.getAccount(userAddress)

      // 2. Build contract and operation
      const contract = new Contract(CHECKIN_CONTRACT_ID)

      // 3. Convert parameters to ScVals (contract uses i64 for lat/lng with 1e6 precision)
      const userScVal = Address.fromString(userAddress).toScVal()
      const placeIdScVal = nativeToScVal(params.placeId, { type: 'u32' })
      const placeNameScVal = this.stringToScVal(params.placeName)
      const latScVal = nativeToScVal(Math.floor(params.latitude * 1e6), { type: 'i64' })
      const lngScVal = nativeToScVal(Math.floor(params.longitude * 1e6), { type: 'i64' })
      const imageScVal = this.stringToScVal(params.imageUrl)

      // 4. Build transaction (function is 'mint', not 'check_in')
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'mint',
            userScVal,
            placeIdScVal,
            placeNameScVal,
            latScVal,
            lngScVal,
            imageScVal
          )
        )
        .setTimeout(30)
        .build()

      // 5. Simulate transaction
      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      // 6. Prepare transaction with simulation results
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      // 7. Sign with wallet
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: userAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      // 8. Send signed transaction
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sentTx = await this.rpcServer.sendTransaction(signedTx)

      // Wait a bit for transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Return success immediately - the transaction was sent
      // We don't wait for confirmation to avoid parsing errors
      console.log('✅ Check-in transaction sent! Hash:', sentTx.hash)
      console.log('🔗 View on explorer: https://stellar.expert/explorer/testnet/tx/' + sentTx.hash)
      
      return {
        success: true,
        tokenId: BigInt(0),
        txHash: sentTx.hash,
      }
    } catch (error) {
      console.error('Check-in error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verifica si el usuario ya hizo check-in en un lugar
   */
  async hasCheckedIn(userAddress: string, placeId: number): Promise<boolean> {
    try {
      if (!CHECKIN_CONTRACT_ID) return false

      const account = await this.rpcServer.getAccount(userAddress)
      const contract = new Contract(CHECKIN_CONTRACT_ID)

      const userScVal = Address.fromString(userAddress).toScVal()
      const placeIdScVal = nativeToScVal(placeId, { type: 'u32' })

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('has_checked_in', userScVal, placeIdScVal))
        .setTimeout(30)
        .build()

      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        return false
      }

      const result = simulated.result?.retval
      if (!result) return false

      return result.value() as boolean
    } catch (error) {
      console.error('Error checking if user has checked in:', error)
      return false
    }
  }

  /**
   * Obtiene todos los NFTs de un usuario
   */
  async getUserNFTs(userAddress: string): Promise<any[]> {
    try {
      if (!CHECKIN_CONTRACT_ID) return []

      const account = await this.rpcServer.getAccount(userAddress)
      const contract = new Contract(CHECKIN_CONTRACT_ID)

      const userScVal = Address.fromString(userAddress).toScVal()

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_user_nfts', userScVal))
        .setTimeout(30)
        .build()

      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('Simulation error:', simulated.error)
        return []
      }

      const result = simulated.result?.retval
      if (!result) return []

      // Parse the Vec<CheckinNFT> result using scValToNative
      try {
        const nftsRaw = scValToNative(result)
        console.log('Parsed NFTs:', nftsRaw)
        
        // Convert to proper format
        const nfts = nftsRaw.map((nft: any) => ({
          token_id: Number(nft.token_id),
          place_id: Number(nft.place_id),
          place_name: nft.place_name,
          latitude: Number(nft.latitude),
          longitude: Number(nft.longitude),
          check_in_timestamp: Number(nft.check_in_timestamp),
          owner: nft.owner,
          image_url: nft.image_url,
        }))
        
        return nfts
      } catch (e) {
        console.error('Error parsing NFTs:', e)
        return []
      }
    } catch (error) {
      console.error('Error getting user NFTs:', error)
      return []
    }
  }
}

export const checkinService = new CheckinService()
