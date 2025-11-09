use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InsufficientFunds = 300,
    InvalidMerchant = 301,
    TransferFailed = 302,
    Unauthorized = 303,
    Overflow = 304,
}
