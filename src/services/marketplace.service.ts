import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { 
  Contract, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder, 
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative
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
   * Wait for transaction confirmation
   */
  private async waitForTransaction(txHash: string, maxAttempts = 30): Promise<boolean> {
    console.log('⏳ Waiting for transaction confirmation...')
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const txResponse = await this.rpcServer.getTransaction(txHash)
        
        if (txResponse.status === 'SUCCESS') {
          console.log('✅ Transaction confirmed!')
          return true
        }
        
        if (txResponse.status === 'FAILED') {
          console.error('❌ Transaction failed:', txResponse)
          return false
        }
        
        // Transaction is still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        // Transaction not found yet, continue waiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.error('⏰ Transaction confirmation timeout')
    return false
  }

  /**
   * Compra con XLM solamente - Llama al contrato marketplace
   */
  async purchaseWithXLM(
    kit: StellarWalletsKit,
    buyerAddress: string,
    merchantAddress: string,
    amountXLM: number
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      if (!MARKETPLACE_CONTRACT_ID) {
        throw new Error('Marketplace contract ID not configured')
      }

      console.log('🛒 Calling marketplace contract for XLM purchase...')
      console.log('💰 XLM amount:', amountXLM, '(raw:', Math.floor(amountXLM * 1e7), ')')
      
      const account = await this.rpcServer.getAccount(buyerAddress)
      const marketplaceContract = new Contract(MARKETPLACE_CONTRACT_ID)
      
      // Build transaction calling purchase_with_xlm
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          marketplaceContract.call(
            'purchase_with_xlm',
            Address.fromString(buyerAddress).toScVal(),
            Address.fromString(merchantAddress).toScVal(),
            nativeToScVal(Math.floor(amountXLM * 1e7), { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build()

      console.log('🔍 Simulating marketplace transaction...')
      const simulated = await this.rpcServer.simulateTransaction(transaction)
      
      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('❌ Simulation failed:', simulated.error)
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      console.log('✅ Simulation successful, preparing transaction...')
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      console.log('✍️ Requesting signature...')
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      console.log('📤 Sending transaction...')
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sendResult = await this.rpcServer.sendTransaction(signedTx)
      
      console.log('✅ Transaction sent! Hash:', sendResult.hash)
      console.log('🔗 View on explorer: https://stellar.expert/explorer/testnet/tx/' + sendResult.hash)
      
      return { 
        success: true,
        txHash: sendResult.hash
      }
    } catch (error) {
      console.error('Purchase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Compra con descuento usando TUR tokens - Llama al contrato marketplace
   */
  async purchaseWithDiscount(
    kit: StellarWalletsKit,
    buyerAddress: string,
    merchantAddress: string,
    amountXLM: number,
    amountTUR: number
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      if (!MARKETPLACE_CONTRACT_ID) {
        throw new Error('Marketplace contract ID not configured')
      }

      console.log('🛒 Calling marketplace contract for purchase with discount...')
      console.log('💰 XLM amount:', amountXLM, '(raw:', Math.floor(amountXLM * 1e7), ')')
      console.log('🔥 TUR to burn:', amountTUR, '(raw:', Math.floor(amountTUR * 1e7), ')')
      
      const account = await this.rpcServer.getAccount(buyerAddress)
      const marketplaceContract = new Contract(MARKETPLACE_CONTRACT_ID)
      
      // Build transaction calling purchase_with_discount
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          marketplaceContract.call(
            'purchase_with_discount',
            Address.fromString(buyerAddress).toScVal(),
            Address.fromString(merchantAddress).toScVal(),
            nativeToScVal(Math.floor(amountXLM * 1e7), { type: 'i128' }),
            nativeToScVal(Math.floor(amountTUR * 1e7), { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build()

      console.log('🔍 Simulating marketplace transaction...')
      const simulated = await this.rpcServer.simulateTransaction(transaction)
      
      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('❌ Simulation failed:', simulated.error)
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      console.log('✅ Simulation successful, preparing transaction...')
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      console.log('✍️ Requesting signature...')
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: buyerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      console.log('📤 Sending transaction...')
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sendResult = await this.rpcServer.sendTransaction(signedTx)
      
      console.log('✅ Transaction sent! Hash:', sendResult.hash)
      console.log('🔗 View on explorer: https://stellar.expert/explorer/testnet/tx/' + sendResult.hash)
      
      return { 
        success: true,
        txHash: sendResult.hash
      }
    } catch (error) {
      console.error('Purchase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Aprobar al marketplace para quemar tokens TUR
   */
  async approveTUR(
    kit: StellarWalletsKit,
    ownerAddress: string,
    amount: number
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      if (!TUR_CONTRACT_ID || !MARKETPLACE_CONTRACT_ID) {
        throw new Error('TUR or Marketplace contract ID not configured')
      }

      console.log('✅ Approving marketplace to burn TUR tokens...')
      console.log('💰 Amount to approve:', amount, '(raw:', Math.floor(amount * 1e7), ')')
      
      const account = await this.rpcServer.getAccount(ownerAddress)
      const turContract = new Contract(TUR_CONTRACT_ID)
      
      // Build transaction calling approve
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          turContract.call(
            'approve',
            Address.fromString(ownerAddress).toScVal(),
            Address.fromString(MARKETPLACE_CONTRACT_ID).toScVal(),
            nativeToScVal(Math.floor(amount * 1e7), { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build()

      console.log('🔍 Simulating approve transaction...')
      const simulated = await this.rpcServer.simulateTransaction(transaction)
      
      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('❌ Simulation failed:', simulated.error)
        throw new Error(`Simulation failed: ${simulated.error}`)
      }

      console.log('✅ Simulation successful, preparing transaction...')
      const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build()

      console.log('✍️ Requesting signature...')
      const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
        address: ownerAddress,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      console.log('📤 Sending transaction...')
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const sendResult = await this.rpcServer.sendTransaction(signedTx)
      
      console.log('✅ Approval transaction sent! Hash:', sendResult.hash)
      
      // Wait for confirmation
      const confirmed = await this.waitForTransaction(sendResult.hash)
      
      if (!confirmed) {
        throw new Error('Approval transaction failed or timed out')
      }
      
      return { 
        success: true,
        txHash: sendResult.hash
      }
    } catch (error) {
      console.error('Approval error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verificar allowance actual
   */
  async checkAllowance(
    ownerAddress: string
  ): Promise<number> {
    try {
      if (!TUR_CONTRACT_ID || !MARKETPLACE_CONTRACT_ID) {
        throw new Error('TUR or Marketplace contract ID not configured')
      }

      const turContract = new Contract(TUR_CONTRACT_ID)
      const account = await this.rpcServer.getAccount(ownerAddress)
      
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          turContract.call(
            'allowance',
            Address.fromString(ownerAddress).toScVal(),
            Address.fromString(MARKETPLACE_CONTRACT_ID).toScVal()
          )
        )
        .setTimeout(30)
        .build()

      const simulated = await this.rpcServer.simulateTransaction(transaction)
      
      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('❌ Failed to check allowance:', simulated.error)
        return 0
      }

      // Parse the result - ScVal i128
      const result = simulated.result?.retval
      if (result) {
        try {
          // Use scValToNative to convert ScVal to native JavaScript value
          const allowanceRaw = scValToNative(result)
          const allowance = Number(allowanceRaw) / 1e7
          console.log('📊 Current allowance:', allowance, 'TUR (raw:', allowanceRaw.toString(), ')')
          return allowance
        } catch (e) {
          console.error('Error parsing allowance:', e, 'Result:', result)
          return 0
        }
      }

      return 0
    } catch (error) {
      console.error('Error checking allowance:', error)
      return 0
    }
  }
}

export const marketplaceService = new MarketplaceService()
