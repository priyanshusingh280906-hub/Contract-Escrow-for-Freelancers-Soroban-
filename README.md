# 📄 Smart Contract Escrow for Freelancers (Soroban)

A decentralized escrow smart contract built using **Soroban (Stellar)** that enables secure freelance transactions between clients and freelancers.

---

## 🚀 Overview

This project implements an **escrow system** where:

- A **client** deposits funds into a smart contract
- A **freelancer** completes the work
- Funds are released only after approval

This ensures **trustless, transparent, and secure payments** without intermediaries.

---

## ⚙️ Features

- ✅ Create escrow between client and freelancer  
- 💰 Secure fund locking  
- 🔓 Release funds after work completion  
- ❌ Prevent double spending  
- 📜 Transparent on-chain logic  

---

## 📁 Project Structure

```text
.
├── contracts
│   └── escrow
│       ├── src
│       │   └── lib.rs       # Main smart contract code
│       └── Cargo.toml       # Contract dependencies
├── README.md
└── .gitignore
```

---

## 🧠 Smart Contract Logic

### 🔹 Escrow Structure

```rust
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub released: bool,
}
```

### 🔹 Core Functions

- `create_escrow()` → Initializes a new escrow  
- `release_payment()` → Transfers funds to freelancer  
- `get_escrow()` → Fetch escrow details  

---

## 🛠️ Tech Stack

- **Rust**
- **Soroban SDK**
- **Stellar Blockchain**

---

## 🧪 How It Works

1. Client creates an escrow with:
   - Freelancer address
   - Payment amount

2. Funds are locked in the contract

3. After work completion:
   - Client calls release function

4. Funds are transferred to freelancer

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/Contract-Escrow-for-Freelancers-Soroban.git
cd Contract-Escrow-for-Freelancers-Soroban
```

### 2️⃣ Build the Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

### 3️⃣ Run Tests

```bash
cargo test
```

---

## 🧩 Future Improvements

- ⏳ Milestone-based payments  
- ⚖️ Dispute resolution system  
- 📊 UI dashboard for users  
- 🔐 Multi-signature approval  

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository  
2. Create a new branch  
3. Make your changes  
4. Submit a pull request  

---

## 📜 License

This project is open-source and available under the **MIT License**.

---

## 🙌 Acknowledgements

- Soroban Documentation  
- Stellar Developer Community  

---

## 📬 Contact

For any queries or collaboration:

- GitHub: your-username  
- Email: your-email@example.com  

---

##  Deploy Contract Link

Link :- https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CC6GC6F2AFC6PDO37PYRDP2KL6AH3RQE7VO4RPGDNVW3LNGTIG7ZLDRX;;

---

## Contract Address 

Address :- CC6GC6F2AFC6PDO37PYRDP2KL6AH3RQE7VO4RPGDNVW3LNGTIG7ZLDRX

---

![Uploading Screenshot 2026-03-20 at 3.18.54 PM.png…]()

---

⭐ If you like this project, don’t forget to star the repo!
