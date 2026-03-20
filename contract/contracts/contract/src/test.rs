#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_escrow() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    assert_eq!(escrow_id, 0);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.client, client_addr);
    assert_eq!(escrow.freelancer, freelancer_addr);
    assert_eq!(escrow.amount, 1000i128);
    assert_eq!(escrow.status, EscrowStatus::Created);
}

#[test]
fn test_accept_escrow() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.accept_escrow(&freelancer_addr, &escrow_id);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Accepted);
}

#[test]
fn test_submit_and_approve_work() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.accept_escrow(&freelancer_addr, &escrow_id);
    client.submit_work(&freelancer_addr, &escrow_id);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Submitted);

    client.approve_work(&client_addr, &escrow_id);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Completed);
}

#[test]
fn test_cancel_before_acceptance() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.cancel_escrow(&client_addr, &escrow_id);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Cancelled);
}

#[test]
fn test_raise_and_resolve_dispute() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.accept_escrow(&freelancer_addr, &escrow_id);
    client.submit_work(&freelancer_addr, &escrow_id);

    // Client raises dispute
    client.raise_dispute(&client_addr, &escrow_id);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Disputed);

    // Resolve with 50% to each
    client.resolve_dispute(&client_addr, &escrow_id, &500);

    let escrow = client.get_escrow(&0);
    assert_eq!(escrow.status, EscrowStatus::Resolved);
}

#[test]
#[should_panic(expected = "wrong status")]
fn test_cannot_accept_twice() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.accept_escrow(&freelancer_addr, &escrow_id);
    client.accept_escrow(&freelancer_addr, &escrow_id); // Should panic
}

#[test]
#[should_panic(expected = "not the freelancer")]
fn test_only_freelancer_can_accept() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let wrong_freelancer = Address::generate(&env);
    let correct_freelancer = Address::generate(&env);

    // Client creates escrow for correct_freelancer
    let escrow_id = client.create_escrow(
        &client_addr,
        &correct_freelancer,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    // Wrong freelancer tries to accept - should panic
    client.accept_escrow(&wrong_freelancer, &escrow_id);
}

#[test]
#[should_panic(expected = "wrong status")]
fn test_cannot_cancel_after_accepted() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);

    let escrow_id = client.create_escrow(
        &client_addr,
        &freelancer_addr,
        &String::from_str(&env, "Build website"),
        &1000i128,
    );

    client.accept_escrow(&freelancer_addr, &escrow_id);
    client.cancel_escrow(&client_addr, &escrow_id); // Should panic
}

#[test]
fn test_get_all_escrows() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer1 = Address::generate(&env);
    let freelancer2 = Address::generate(&env);

    client.create_escrow(
        &client_addr,
        &freelancer1,
        &String::from_str(&env, "Job 1"),
        &1000i128,
    );
    client.create_escrow(
        &client_addr,
        &freelancer2,
        &String::from_str(&env, "Job 2"),
        &2000i128,
    );

    let escrows = client.get_escrows();

    assert_eq!(escrows.len(), 2);
}
