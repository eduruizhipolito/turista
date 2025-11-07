#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, String, symbol_short};

// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Balance(Address),
    TotalSupply,
    Name,
    Symbol,
    Decimals,
    Admin,
}

// Error types
#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InsufficientBalance = 200,
    UnauthorizedBurn = 201,
    Unauthorized = 202,
}

#[contract]
pub struct TurToken;

#[contractimpl]
impl TurToken {
    /// Initialize the token with name, symbol, decimals, and initial supply
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        initial_supply: i128,
    ) {
        // Set token metadata
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &initial_supply);

        // Mint initial supply to admin
        env.storage().instance().set(&DataKey::Balance(admin.clone()), &initial_supply);

        // Emit event
        env.events().publish(
            (symbol_short!("init"), admin),
            initial_supply,
        );
    }

    /// Get token name
    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .unwrap_or(String::from_str(&env, "Turistas Token"))
    }

    /// Get token symbol
    pub fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .unwrap_or(String::from_str(&env, "TUR"))
    }

    /// Get token decimals
    pub fn decimals(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Decimals)
            .unwrap_or(7)
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Get balance of an address
    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    /// Transfer tokens from one address to another
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // Require authentication
        from.require_auth();

        // Validate amount
        if amount < 0 {
            return Err(Error::InsufficientBalance);
        }

        // Get balances
        let from_balance = Self::balance(env.clone(), from.clone());
        let to_balance = Self::balance(env.clone(), to.clone());

        // Check sufficient balance
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        // Update balances
        let new_from_balance = from_balance
            .checked_sub(amount)
            .ok_or(Error::InsufficientBalance)?;
        let new_to_balance = to_balance
            .checked_add(amount)
            .ok_or(Error::InsufficientBalance)?;

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &new_from_balance);
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &new_to_balance);

        // Emit event
        env.events().publish(
            (symbol_short!("transfer"), from, to),
            amount,
        );

        Ok(())
    }

    /// Burn tokens from an address
    pub fn burn(
        env: Env,
        from: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // Require authentication
        from.require_auth();

        // Validate amount
        if amount < 0 {
            return Err(Error::InsufficientBalance);
        }

        // Get balance
        let balance = Self::balance(env.clone(), from.clone());

        // Check sufficient balance
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }

        // Update balance
        let new_balance = balance
            .checked_sub(amount)
            .ok_or(Error::InsufficientBalance)?;

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &new_balance);

        // Update total supply
        let total_supply = Self::total_supply(env.clone());
        let new_total_supply = total_supply
            .checked_sub(amount)
            .ok_or(Error::InsufficientBalance)?;

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &new_total_supply);

        // Emit event
        env.events().publish(
            (symbol_short!("burn"), from),
            amount,
        );

        Ok(())
    }

    /// Mint new tokens (only admin)
    pub fn mint(
        env: Env,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // Get admin
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();

        // Require admin authentication
        admin.require_auth();

        // Validate amount
        if amount < 0 {
            return Err(Error::InsufficientBalance);
        }

        // Get balance
        let balance = Self::balance(env.clone(), to.clone());

        // Update balance
        let new_balance = balance
            .checked_add(amount)
            .ok_or(Error::InsufficientBalance)?;

        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &new_balance);

        // Update total supply
        let total_supply = Self::total_supply(env.clone());
        let new_total_supply = total_supply
            .checked_add(amount)
            .ok_or(Error::InsufficientBalance)?;

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &new_total_supply);

        // Emit event
        env.events().publish(
            (symbol_short!("mint"), to),
            amount,
        );

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, TurToken);
        let client = TurTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let name = String::from_str(&env, "Turistas Token");
        let symbol = String::from_str(&env, "TUR");
        let decimals = 7;
        let initial_supply = 10_000_000_0000000; // 10M TUR with 7 decimals

        client.initialize(&admin, &name, &symbol, &decimals, &initial_supply);

        assert_eq!(client.name(), name);
        assert_eq!(client.symbol(), symbol);
        assert_eq!(client.decimals(), decimals);
        assert_eq!(client.total_supply(), initial_supply);
        assert_eq!(client.balance(&admin), initial_supply);
    }

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, TurToken);
        let client = TurTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let initial_supply = 10_000_0000000;

        client.initialize(
            &admin,
            &String::from_str(&env, "Turistas Token"),
            &String::from_str(&env, "TUR"),
            &7,
            &initial_supply,
        );

        let transfer_amount = 1000_0000000;
        client.transfer(&admin, &user, &transfer_amount);

        assert_eq!(client.balance(&admin), initial_supply - transfer_amount);
        assert_eq!(client.balance(&user), transfer_amount);
    }

    #[test]
    fn test_burn() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, TurToken);
        let client = TurTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let initial_supply = 10_000_0000000;

        client.initialize(
            &admin,
            &String::from_str(&env, "Turistas Token"),
            &String::from_str(&env, "TUR"),
            &7,
            &initial_supply,
        );

        let burn_amount = 1000_0000000;
        client.burn(&admin, &burn_amount);

        assert_eq!(client.balance(&admin), initial_supply - burn_amount);
        assert_eq!(client.total_supply(), initial_supply - burn_amount);
    }
}
