import { 
  Contract, 
  Networks, 
  SorobanRpc, 
  TransactionBuilder, 
  BASE_FEE,
  Address,
  Horizon
} from '@stellar/stellar-sdk'

const TUR_CONTRACT_ID = import.meta.env.VITE_TUR_TOKEN_CONTRACT || ''
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

class BalanceService {
  private rpcServer: SorobanRpc.Server
  private horizonServer: Horizon.Server

  constructor() {
    this.rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: true })
    this.horizonServer = new Horizon.Server(HORIZON_URL)
  }

  /**
   * Obtiene el balance de XLM de una cuenta
   */
  async getXLMBalance(address: string): Promise<number> {
    try {
      const account = await this.horizonServer.loadAccount(address)
      const xlmBalance = account.balances.find(
        (balance) => balance.asset_type === 'native'
      )
      return xlmBalance ? parseFloat(xlmBalance.balance) : 0
    } catch (error) {
      console.error('Error getting XLM balance:', error)
      return 0
    }
  }

  /**
   * Obtiene el balance de TUR tokens de una cuenta
   */
  async getTURBalance(address: string): Promise<number> {
    try {
      console.log('🔍 Getting TUR balance for:', address)
      console.log('📝 TUR Contract ID:', TUR_CONTRACT_ID)
      
      if (!TUR_CONTRACT_ID) {
        console.error('❌ TUR_CONTRACT_ID is empty')
        return 0
      }

      const account = await this.rpcServer.getAccount(address)
      const contract = new Contract(TUR_CONTRACT_ID)

      const addressScVal = Address.fromString(address).toScVal()

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('balance', addressScVal))
        .setTimeout(30)
        .build()

      const simulated = await this.rpcServer.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationError(simulated)) {
        console.error('❌ Simulation error:', simulated.error)
        return 0
      }

      const result = simulated.result?.retval
      if (!result) {
        console.error('❌ No result from simulation')
        return 0
      }

      // El balance está en i128 con 7 decimales
      // Soroban devuelve i128 como un ScVal que necesitamos decodificar
      const scVal = simulated.result?.retval
      if (!scVal) {
        console.error('❌ No scVal in result')
        return 0
      }
      
      // Extraer el valor i128 usando scValToBigInt de stellar-sdk
      const { scValToBigInt } = await import('@stellar/stellar-sdk')
      const balanceRaw = scValToBigInt(scVal)
      
      console.log('✅ Balance raw (BigInt):', balanceRaw)
      console.log('✅ Balance formatted:', Number(balanceRaw) / 1e7)
      return Number(balanceRaw) / 1e7
    } catch (error) {
      console.error('❌ Error getting TUR balance:', error)
      return 0
    }
  }

  /**
   * Obtiene ambos balances
   */
  async getBalances(address: string): Promise<{ xlm: number; tur: number }> {
    const [xlm, tur] = await Promise.all([
      this.getXLMBalance(address),
      this.getTURBalance(address),
    ])

    return { xlm, tur }
  }

  /**
   * Obtiene el historial de pagos (compras) realizados por el usuario
   */
  async getPurchaseHistory(address: string): Promise<any[]> {
    try {
      // Obtener todas las operaciones de la cuenta
      const operations = await this.horizonServer
        .operations()
        .forAccount(address)
        .order('desc')
        .limit(100)
        .call()

      // Agrupar operaciones por transacción
      const transactionMap = new Map<string, any[]>()
      
      for (const op of operations.records) {
        const txHash = op.transaction_hash
        if (!transactionMap.has(txHash)) {
          transactionMap.set(txHash, [])
        }
        transactionMap.get(txHash)!.push(op)
      }

      const purchases: any[] = []

      // Analizar cada transacción para detectar compras
      for (const [txHash, ops] of transactionMap.entries()) {
        // Buscar pago XLM enviado
        const xlmPayment = ops.find(
          (op: any) => 
            op.type === 'payment' && 
            op.from === address &&
            op.asset_type === 'native'
        )

        if (xlmPayment) {
          const xlmAmount = parseFloat(xlmPayment.amount)
          
          // Buscar si hay un invoke_host_function en la misma transacción (indica uso de contrato)
          const contractCalls = ops.filter((op: any) => op.type === 'invoke_host_function')
          
          let turAmount = 0
          let purchaseType = 'xlm_only'
          let hasDiscount = false

          // Detectar si es compra con descuento basándose en los montos conocidos
          // Mapeo de montos XLM de descuento a TUR
          const discountPrices: Record<number, number> = {
            30: 500,  // Tour Machu Picchu
            25: 400,  // Tour Valle Sagrado
            15: 250,  // Cena
            20: 350,  // Experiencia Gastronómica
            10: 150,  // Artesanía Andina
            40: 600   // Textil Alpaca
          }

          // Si el monto coincide con un precio de descuento, es compra con descuento
          if (discountPrices[xlmAmount]) {
            hasDiscount = true
            turAmount = discountPrices[xlmAmount]
            purchaseType = 'xlm_tur_discount'
          }
          
          // Verificación adicional: si hay llamadas a contrato, definitivamente es con descuento
          if (contractCalls.length > 0 && !hasDiscount) {
            hasDiscount = true
            purchaseType = 'xlm_tur_discount'
            // Intentar estimar TUR si no se detectó antes
            if (turAmount === 0 && discountPrices[xlmAmount]) {
              turAmount = discountPrices[xlmAmount]
            }
          }

          purchases.push({
            id: xlmPayment.id,
            created_at: xlmPayment.created_at,
            amountXLM: xlmAmount,
            amountTUR: turAmount,
            to: xlmPayment.to,
            transaction_hash: txHash,
            type: purchaseType,
            hasDiscount: hasDiscount
          })
        }
      }

      return purchases
    } catch (error) {
      console.error('Error getting purchase history:', error)
      return []
    }
  }
}

export const balanceService = new BalanceService()
