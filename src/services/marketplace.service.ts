import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { 
  Contract, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder, 
  BASE_FEE,
  Address,
  nativeToScVal,
  Operation,
  Asset
} from '@stellar/stellar-sdk'

const MARKETPLACE_CONTRACT_ID = import.meta.env.VITE_MARKETPLACE_CONTRACT || ''
const TUR_CONTRACT_ID = import.meta.env.VITE_TUR_TOKEN_CONTRACT || ''
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

class MarketplaceService {
  private rpcServer: SorobanRpc.Server

  constructor() {
    this.rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: true })
  }

  /**
   * Compra con XLM solamente
   */
  async purchaseWithXLM(
    kit: StellarWalletsKit,
    buyerAddress: string,
    merchantAddress: string,
    amountXLM: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!MARKETPLACE_CONTRACT_ID) {
        throw new Error('Marketplace contract ID not configured')
      }

      const account = await this.rpcServer.getAccount(buyerAddress)
      const contract = new Contract(MARKETPLACE_CONTRACT_ID)

      // Convert parameters
      const buyerScVal = Address.fromString(buyerAddress).toScVal()
      const merchantScVal = Address.fromString(merchantAddress).toScVal()
      const amountScVal = nativeToScVal(Math.floor(amountXLM * 1e7), { type: 'i128' })

      // Build transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call('purchase_with_xlm', buyerScVal, merchantScVal, amountScVal)
        )
        .setTimeout(30)
        .build()

      // Simulate
      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      // Prepare
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      // Sign
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      // Send
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sentTx = await this.rpcServer.sendTransaction(signedTx)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('✅ Marketplace contract called! Hash:', sentTx.hash)
      
      // Now transfer XLM from buyer to merchant
      console.log('💰 Transferring XLM to merchant...')
      const paymentAccount = await this.rpcServer.getAccount(buyerAddress)
      
      const paymentTx = new TransactionBuilder(paymentAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: merchantAddress,
            asset: Asset.native(),
            amount: amountXLM.toString(),
          })
        )
        .setTimeout(30)
        .build()

      const { signedTxXdr: paymentSignedXdr } = await kit.signTransaction(paymentTx.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      const paymentSignedTx = TransactionBuilder.fromXDR(paymentSignedXdr, NETWORK_PASSPHRASE)
      const paymentResult = await this.rpcServer.sendTransaction(paymentSignedTx)
      
      console.log('✅ Payment successful! Hash:', paymentResult.hash)
      
      return { success: true }
    } catch (error) {
      console.error('Purchase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Compra con descuento usando TUR tokens
   */
  async purchaseWithDiscount(
    kit: StellarWalletsKit,
    buyerAddress: string,
    merchantAddress: string,
    amountXLM: number,
    amountTUR: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!MARKETPLACE_CONTRACT_ID) {
        throw new Error('Marketplace contract ID not configured')
      }

      const account = await this.rpcServer.getAccount(buyerAddress)
      const contract = new Contract(MARKETPLACE_CONTRACT_ID)

      // Convert parameters
      const buyerScVal = Address.fromString(buyerAddress).toScVal()
      const merchantScVal = Address.fromString(merchantAddress).toScVal()
      const amountXLMScVal = nativeToScVal(Math.floor(amountXLM * 1e7), { type: 'i128' })
      const amountTURScVal = nativeToScVal(Math.floor(amountTUR * 1e7), { type: 'i128' })

      // Build transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'purchase_with_discount',
            buyerScVal,
            merchantScVal,
            amountXLMScVal,
            amountTURScVal
          )
        )
        .setTimeout(30)
        .build()

      // Simulate
      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      // Prepare
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      // Sign
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      // Send
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sentTx = await this.rpcServer.sendTransaction(signedTx)

      // Wait for contract execution
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('✅ Contract call successful! Hash:', sentTx.hash)
      
      // Now execute the actual XLM transfer and TUR burn
      console.log('💸 Transferring XLM to merchant...')
      
      // 1. Transfer XLM to merchant
      const xlmAccount = await this.rpcServer.getAccount(buyerAddress)
      const xlmTransaction = new TransactionBuilder(xlmAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: merchantAddress,
            asset: Asset.native(),
            amount: amountXLM.toString(), // Amount in XLM
          })
        )
        .setTimeout(30)
        .build()

      const { signedTxXdr: xlmSignedXdr } = await kit.signTransaction(xlmTransaction.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      const xlmSignedTx = TransactionBuilder.fromXDR(xlmSignedXdr, NETWORK_PASSPHRASE)
      await this.rpcServer.sendTransaction(xlmSignedTx)
      
      console.log('✅ XLM transferred')

      // 2. Burn TUR tokens
      console.log('🔥 Burning TUR tokens...')
      console.log('💰 Amount to burn:', amountTUR, 'TUR')
      console.log('💰 Amount in raw units:', Math.floor(amountTUR * 1e7))
      
      const turContract = new Contract(TUR_CONTRACT_ID)
      const turAccount = await this.rpcServer.getAccount(buyerAddress)
      
      const turTransaction = new TransactionBuilder(turAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          turContract.call(
            'burn',
            Address.fromString(buyerAddress).toScVal(),
            nativeToScVal(Math.floor(amountTUR * 1e7), { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build()

      console.log('🔍 Simulating TUR burn transaction...')
      const turSimulated = await this.rpcServer.simulateTransaction(turTransaction)
      
      if (SorobanRpc.Api.isSimulationError(turSimulated)) {
        console.error('❌ TUR burn simulation failed:', turSimulated.error)
        throw new Error('Failed to burn TUR tokens')
      }

      console.log('✅ Simulation successful, preparing transaction...')
      const turPrepared = SorobanRpc.assembleTransaction(turTransaction, turSimulated).build()

      console.log('✍️ Requesting signature for TUR burn...')
      const { signedTxXdr: turSignedXdr } = await kit.signTransaction(turPrepared.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      console.log('📤 Sending TUR burn transaction...')
      const turSignedTx = TransactionBuilder.fromXDR(turSignedXdr, NETWORK_PASSPHRASE)
      const turResult = await this.rpcServer.sendTransaction(turSignedTx)
      
      console.log('✅ TUR burn transaction sent! Hash:', turResult.hash)
      console.log('🎉 Purchase with discount completed successfully!')
      
      return { success: true }
    } catch (error) {
      console.error('Purchase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const marketplaceService = new MarketplaceService()
