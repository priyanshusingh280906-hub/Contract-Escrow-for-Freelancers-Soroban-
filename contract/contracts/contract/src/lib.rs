#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum EscrowStatus {
    Created,
    Accepted,
    Submitted,
    Completed,
    Cancelled,
    Disputed,
    Resolved,
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub description: String,
    pub amount: i128,
    pub status: EscrowStatus,
}

#[contracttype]
pub enum DataKey {
    Escrows,
    NextId,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        description: String,
        amount: i128,
    ) -> u64 {
        client.require_auth();

        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .unwrap_or_else(|| Map::new(&env));

        let next_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::NextId)
            .unwrap_or(0);

        escrows.set(
            next_id,
            Escrow {
                client,
                freelancer,
                description,
                amount,
                status: EscrowStatus::Created,
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
        env.storage()
            .persistent()
            .set(&DataKey::NextId, &(next_id + 1));

        next_id
    }

    pub fn accept_escrow(env: Env, caller: Address, escrow_id: u64) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        assert!(escrow.status == EscrowStatus::Created, "wrong status");
        assert!(escrow.freelancer == caller, "not the freelancer");

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Accepted,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn submit_work(env: Env, caller: Address, escrow_id: u64) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        assert!(escrow.status == EscrowStatus::Accepted, "wrong status");
        assert!(escrow.freelancer == caller, "not the freelancer");

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Submitted,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn approve_work(env: Env, caller: Address, escrow_id: u64) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        assert!(escrow.status == EscrowStatus::Submitted, "wrong status");
        assert!(escrow.client == caller, "not the client");

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Completed,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn cancel_escrow(env: Env, caller: Address, escrow_id: u64) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        assert!(escrow.status == EscrowStatus::Created, "wrong status");
        assert!(escrow.client == caller, "not the client");

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Cancelled,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn raise_dispute(env: Env, caller: Address, escrow_id: u64) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        let valid =
            escrow.status == EscrowStatus::Accepted || escrow.status == EscrowStatus::Submitted;
        assert!(valid, "wrong status");
        assert!(
            escrow.client == caller || escrow.freelancer == caller,
            "not authorized"
        );

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Disputed,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn resolve_dispute(env: Env, caller: Address, escrow_id: u64, _client_share: u32) {
        let mut escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");

        let escrow = escrows.get(escrow_id).expect("escrow not found");
        caller.require_auth();

        assert!(escrow.status == EscrowStatus::Disputed, "wrong status");
        assert!(escrow.client == caller, "not the client");

        escrows.set(
            escrow_id,
            Escrow {
                status: EscrowStatus::Resolved,
                ..escrow
            },
        );

        env.storage().persistent().set(&DataKey::Escrows, &escrows);
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        let escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .expect("escrow not found");
        escrows.get(escrow_id).expect("escrow not found")
    }

    pub fn get_escrows(env: Env) -> Vec<Escrow> {
        let escrows: Map<u64, Escrow> = env
            .storage()
            .persistent()
            .get(&DataKey::Escrows)
            .unwrap_or_else(|| Map::new(&env));
        escrows.values()
    }
}

mod test;
