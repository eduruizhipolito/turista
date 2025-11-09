#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, symbol_short};
mod error;
pub use error::Error;

// Token interface for cross-contract calls
mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "TokenClient")]
    #[allow(dead_code)]
    pub trait TokenInterface {
        fn transfer(env: Env, from: Address, to: Address, amount: i128);
        fn burn(env: Env, from: Address, amount: i128);
        fn burn_from(env: Env, spender: Address, from: Address, amount: i128);
    }
}

// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TurTokenContract,
    XlmTokenContract,
    PlatformAddress,
    Admin,
}

// Purchase event data
#[contracttype]
#[derive(Clone, Debug)]
pub struct PurchaseEvent {
    pub buyer: Address,
    pub merchant: Address,
    pub total_xlm: i128,
    pub merchant_xlm: i128,
    pub platform_fee: i128,
    pub amount_tur_burned: i128,
    pub timestamp: u64,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Initialize the marketplace contract
    pub fn initialize(
        env: Env,
        admin: Address,
        platform_address: Address,
        tur_token_contract: Address,
        xlm_token_contract: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PlatformAddress, &platform_address);
        env.storage().instance().set(&DataKey::TurTokenContract, &tur_token_contract);
        env.storage().instance().set(&DataKey::XlmTokenContract, &xlm_token_contract);
    }

    /// Purchase with XLM only (with 1% platform fee)
    pub fn purchase_with_xlm(
        env: Env,
        buyer: Address,
        merchant: Address,
        total_amount_xlm: i128,
    ) -> Result<(), Error> {
        // Require buyer authentication
        buyer.require_auth();

        // Validate amount
        if total_amount_xlm <= 0 {
            return Err(Error::InsufficientFunds);
        }

        // Get platform address and XLM contract
        let platform_address: Address = env.storage()
            .instance()
            .get(&DataKey::PlatformAddress)
            .unwrap();
        
        let xlm_contract: Address = env.storage()
            .instance()
            .get(&DataKey::XlmTokenContract)
            .unwrap();

        // Calculate 1% platform fee
        let platform_fee = total_amount_xlm.checked_div(100).ok_or(Error::Overflow)?;
        let merchant_amount = total_amount_xlm.checked_sub(platform_fee).ok_or(Error::Overflow)?;

        // Create token client for XLM
        let xlm_client = token::TokenClient::new(&env, &xlm_contract);

        // Transfer platform fee (1%)
        xlm_client.transfer(&buyer, &platform_address, &platform_fee);

        // Transfer to merchant (99%)
        xlm_client.transfer(&buyer, &merchant, &merchant_amount);

        // Emit purchase event
        let purchase_event = PurchaseEvent {
            buyer: buyer.clone(),
            merchant: merchant.clone(),
            total_xlm: total_amount_xlm,
            merchant_xlm: merchant_amount,
            platform_fee,
            amount_tur_burned: 0,
            timestamp: env.ledger().timestamp(),
        };

        env.events().publish(
            (symbol_short!("purchase"), buyer, merchant),
            purchase_event,
        );

        Ok(())
    }

    /// Purchase with XLM + TUR discount (with 1% platform fee)
    pub fn purchase_with_discount(
        env: Env,
        buyer: Address,
        merchant: Address,
        total_amount_xlm: i128,
        amount_tur: i128,
    ) -> Result<(), Error> {
        // Require buyer authentication
        buyer.require_auth();

        // Validate amounts
        if total_amount_xlm <= 0 || amount_tur <= 0 {
            return Err(Error::InsufficientFunds);
        }

        // Get contract addresses from storage
        let platform_address: Address = env.storage()
            .instance()
            .get(&DataKey::PlatformAddress)
            .unwrap();
        
        let xlm_contract: Address = env.storage()
            .instance()
            .get(&DataKey::XlmTokenContract)
            .unwrap();
        
        let tur_contract: Address = env.storage()
            .instance()
            .get(&DataKey::TurTokenContract)
            .unwrap();

        // Calculate 1% platform fee
        let platform_fee = total_amount_xlm.checked_div(100).ok_or(Error::Overflow)?;
        let merchant_amount = total_amount_xlm.checked_sub(platform_fee).ok_or(Error::Overflow)?;

        // Create token clients
        let xlm_client = token::TokenClient::new(&env, &xlm_contract);
        let tur_client = token::TokenClient::new(&env, &tur_contract);

        // 1. Transfer platform fee (1%)
        xlm_client.transfer(&buyer, &platform_address, &platform_fee);

        // 2. Transfer to merchant (99%)
        xlm_client.transfer(&buyer, &merchant, &merchant_amount);

        // 3. Burn TUR tokens using allowance
        let marketplace_address = env.current_contract_address();
        tur_client.burn_from(&marketplace_address, &buyer, &amount_tur);

        // Emit purchase event with fee breakdown
        let purchase_event = PurchaseEvent {
            buyer: buyer.clone(),
            merchant: merchant.clone(),
            total_xlm: total_amount_xlm,
            merchant_xlm: merchant_amount,
            platform_fee,
            amount_tur_burned: amount_tur,
            timestamp: env.ledger().timestamp(),
        };

        env.events().publish(
            (symbol_short!("purchase"), buyer, merchant),
            purchase_event,
        );

        Ok(())
    }

    /// Get total purchases count (for statistics)
    pub fn get_purchase_count(_env: Env) -> u64 {
        // This would be implemented with a counter in storage
        // For MVP, we return 0
        0
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};
    
    // Import TUR token contract for testing
    mod tur_token {
        soroban_sdk::contractimport!(
            file = "../target/wasm32v1-none/release/tur_token.optimized.wasm"
        );
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register(Marketplace {}, ());
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let platform_address = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let xlm_contract = Address::generate(&env);

        client.initialize(&admin, &platform_address, &tur_contract, &xlm_contract);
    }

    #[test]
    fn test_purchase_with_xlm() {
        let env = Env::default();
        env.mock_all_auths();

        let token_admin = Address::generate(&env);

        // Register XLM token contract (using TUR contract as mock)
        let xlm_contract_id = env.register(tur_token::WASM, ());
        let xlm_client = tur_token::Client::new(&env, &xlm_contract_id);
        xlm_client.initialize(
            &token_admin,
            &String::from_str(&env, "Stellar Lumens"),
            &String::from_str(&env, "XLM"),
            &7,
            &1_000_000_0000000,
        );

        // Register TUR token contract
        let tur_contract_id = env.register(tur_token::WASM, ());
        let tur_client = tur_token::Client::new(&env, &tur_contract_id);
        tur_client.initialize(
            &token_admin,
            &String::from_str(&env, "Turista Token"),
            &String::from_str(&env, "TUR"),
            &7,
            &10_000_000_0000000,
        );

        // Register Marketplace contract
        let contract_id = env.register(Marketplace {}, ());
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let platform_address = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &platform_address, &tur_contract_id, &xlm_contract_id);

        // Mint XLM to buyer
        let amount_xlm = 50_0000000i128; // 50 XLM
        xlm_client.mint(&buyer, &(amount_xlm * 2)); // Mint extra for fees

        client.purchase_with_xlm(&buyer, &merchant, &amount_xlm);
        
        // Verify balances
        let platform_fee = amount_xlm / 100;
        let merchant_amount = amount_xlm - platform_fee;
        assert_eq!(xlm_client.balance(&platform_address), platform_fee);
        assert_eq!(xlm_client.balance(&merchant), merchant_amount);
    }

    #[test]
    fn test_purchase_with_discount() {
        let env = Env::default();
        env.mock_all_auths();

        let token_admin = Address::generate(&env);

        // Register XLM token contract (using TUR contract as mock)
        let xlm_contract_id = env.register(tur_token::WASM, ());
        let xlm_client = tur_token::Client::new(&env, &xlm_contract_id);
        xlm_client.initialize(
            &token_admin,
            &String::from_str(&env, "Stellar Lumens"),
            &String::from_str(&env, "XLM"),
            &7,
            &1_000_000_0000000,
        );

        // Register TUR token contract
        let tur_contract_id = env.register(tur_token::WASM, ());
        let tur_client = tur_token::Client::new(&env, &tur_contract_id);
        tur_client.initialize(
            &token_admin,
            &String::from_str(&env, "Turista Token"),
            &String::from_str(&env, "TUR"),
            &7,
            &10_000_000_0000000,
        );

        // Register Marketplace contract
        let contract_id = env.register(Marketplace {}, ());
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let platform_address = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &platform_address, &tur_contract_id, &xlm_contract_id);

        // Mint tokens to buyer
        let amount_xlm = 30_0000000i128; // 30 XLM
        let amount_tur = 5000_0000000i128; // 5000 TUR
        xlm_client.mint(&buyer, &(amount_xlm * 2));
        tur_client.mint(&buyer, &amount_tur);

        // Approve marketplace to burn TUR tokens
        tur_client.approve(&buyer, &contract_id, &amount_tur);

        client.purchase_with_discount(&buyer, &merchant, &amount_xlm, &amount_tur);
        
        // Verify XLM balances
        let platform_fee = amount_xlm / 100;
        let merchant_amount = amount_xlm - platform_fee;
        assert_eq!(xlm_client.balance(&platform_address), platform_fee);
        assert_eq!(xlm_client.balance(&merchant), merchant_amount);
        
        // Verify TUR was burned (balance should be 0)
        assert_eq!(tur_client.balance(&buyer), 0);
    }

    #[test]
    fn test_invalid_amounts() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(Marketplace {}, ());
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let platform_address = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let xlm_contract = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &platform_address, &tur_contract, &xlm_contract);

        // Test with zero amount
        let result = client.try_purchase_with_xlm(&buyer, &merchant, &0);
        assert_eq!(result, Err(Ok(Error::InsufficientFunds)));

        // Test with negative amount
        let result = client.try_purchase_with_xlm(&buyer, &merchant, &-100);
        assert_eq!(result, Err(Ok(Error::InsufficientFunds)));
    }
}
