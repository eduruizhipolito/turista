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
}

export const balanceService = new BalanceService()
