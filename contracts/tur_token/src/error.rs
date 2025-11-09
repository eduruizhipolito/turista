use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InsufficientBalance = 200,
    UnauthorizedBurn = 201,
    Unauthorized = 202,
}
