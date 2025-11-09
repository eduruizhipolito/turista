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
      console.log('🔍 Obteniendo historial de compras para:', address)
      
      // Obtener transacciones de la cuenta
      const transactions = await this.horizonServer
        .transactions()
        .forAccount(address)
        .order('desc')
        .limit(50)
        .call()

      const purchases: any[] = []

      console.log('📋 Total transacciones encontradas:', transactions.records.length)

      for (const tx of transactions.records) {
        try {
          // Obtener operaciones de esta transacción
          const operations = await this.horizonServer
            .operations()
            .forTransaction(tx.hash)
            .call()

          // Buscar invoke_host_function (llamadas a contratos)
          const contractCalls = operations.records.filter(
            (op: any) => op.type === 'invoke_host_function'
          )

          // Buscar pagos XLM directos (compras sin contrato)
          const xlmPayments = operations.records.filter(
            (op: any): op is Horizon.ServerApi.PaymentOperationRecord => 
              op.type === 'payment' && 
              op.from === address &&
              op.asset_type === 'native' &&
              op.to !== address // No contar transferencias a uno mismo
          )

          // Procesar compras a través del marketplace contract
          if (contractCalls.length > 0) {
            console.log('📦 Transacción con contrato encontrada:', tx.hash)
            
            // Obtener los efectos de la transacción para ver los pagos XLM
            const effects = await this.horizonServer
              .effects()
              .forTransaction(tx.hash)
              .call()

            // Buscar débitos de XLM del usuario (lo que realmente pagó)
            const xlmDebits = effects.records.filter(
              (effect: any) => 
                effect.type === 'account_debited' &&
                effect.asset_type === 'native' &&
                effect.account === address
            )

            // Buscar créditos de XLM a merchants (para identificar el merchant principal)
            const xlmCredits = effects.records.filter(
              (effect: any) => 
                effect.type === 'account_credited' &&
                effect.asset_type === 'native' &&
                effect.account !== address
            )

            // Solo mostrar UNA entrada por transacción, usando el débito total del usuario
            if (xlmDebits.length > 0) {
              // Sumar todos los débitos (puede haber fees, etc.)
              const totalDebited = xlmDebits.reduce(
                (sum: number, debit: any) => sum + parseFloat(debit.amount),
                0
              )
              
              // Identificar el merchant principal (el que recibe más XLM)
              let merchantAddress = ''
              if (xlmCredits.length > 0) {
                const sortedCredits = xlmCredits.sort(
                  (a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount)
                )
                merchantAddress = sortedCredits[0].account
              }
              
              // Mapeo de montos XLM a TUR para detectar descuentos
              // Solo incluimos los precios CON descuento (los que requieren TUR)
              const discountPrices: Record<number, number> = {
                30: 500,  // Tour Machu Picchu con descuento
                25: 400,  // Tour Valle Sagrado con descuento
                15: 250,  // Cena con descuento
                20: 350,  // Experiencia Gastronómica con descuento
                10: 150,  // Artesanía Andina con descuento
                40: 600   // Textil Alpaca con descuento
              }

              const turAmount = discountPrices[totalDebited] || 0
              const hasDiscount = turAmount > 0

              console.log('✅ Compra detectada:', {
                totalDebited,
                turAmount,
                hasDiscount,
                merchant: merchantAddress,
                txHash: tx.hash
              })

              purchases.push({
                id: tx.id,
                created_at: tx.created_at,
                amountXLM: totalDebited,
                amountTUR: turAmount,
                to: merchantAddress,
                transaction_hash: tx.hash,
                type: hasDiscount ? 'xlm_tur_discount' : 'xlm_only',
                hasDiscount: hasDiscount
              })
            }
          }
          // Procesar pagos XLM directos (sin contrato)
          else if (xlmPayments.length > 0) {
            console.log('💸 Pago XLM directo encontrado:', tx.hash)
            
            for (const payment of xlmPayments) {
              const xlmAmount = parseFloat(payment.amount)
              
              console.log('✅ Pago directo detectado:', {
                xlmAmount,
                merchant: payment.to,
                txHash: tx.hash
              })

              purchases.push({
                id: payment.id,
                created_at: payment.created_at,
                amountXLM: xlmAmount,
                amountTUR: 0,
                to: payment.to,
                transaction_hash: tx.hash,
                type: 'xlm_only',
                hasDiscount: false
              })
            }
          }
        } catch (error) {
          console.error('❌ Error procesando transacción:', tx.hash, error)
        }
      }

      console.log('📊 Total compras encontradas:', purchases.length)
      return purchases
    } catch (error) {
      console.error('Error getting purchase history:', error)
      return []
    }
  }
}

export const balanceService = new BalanceService()
