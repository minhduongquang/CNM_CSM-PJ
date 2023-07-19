//const crypto = require('crypto');
//SHA256 = message => crypto.createHash("sha256").update(message).digit("hex");
const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
  ec = new EC("secp256k1");

// const keyPair = ec.genKeyPair();

// const MINT_KEY_PAIR = ec.genKeyPair();

// const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");

// const holderKeyPair = ec.genKeyPair();

const MINT_PRIVATE_ADDRESS = "049ff90c66602bc415a0659e04ada68dd810b38f5cad8a033d006cdfe426e36ff4cd285d530c2824b715c3799f77aef41e0b1fd8e174ead0669dfd5b0a1b12349d";

const MINT_KEY_PAIR = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex")

const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex")

class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = "";
        this.nonce = 0;
    }

    getHash() {
        return SHA256(this.prevHash + this.timestamp + JSON.stringify(this.data) + this.nonce);
    }

    mine(difficulty) {
        while(!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
            this.nonce++;
            this.hash = this.getHash();
        }
    }

    hasValidTransactions(chain) {
        let gas = 0, reward = 0;

        this.data.forEach(transaction => {
            if (transaction.from !== MINT_PUBLIC_ADDRESS) {
                gas += transaction.gas;
            } else {
                reward = transaction.amount;
            }
        });

        return (
            reward - gas === chain.reward &&
            this.data.every(transaction => transaction.isValid(transaction, chain)) && 
            this.data.filter(transaction => transaction.from === MINT_PUBLIC_ADDRESS).length === 1
        );
    }
}

class Blockchain {
    constructor() {
        //const initalCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, holderKeyPair.getPublic("hex"), 100000); // Genesis block 
        const initalCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, "04d2acede993eae83522d324bbb17d9f8d8c65813b295aa0c04747efdf48b803a56e852aa1b861d0f224e22dd6302abe32c6ee77f13107a8b946e4fea6a3ffaa61", 100000); 
        this.chain = [new Block("", [initalCoinRelease])]; //Setup timestamp for sync
        this.difficulty = 1;
        this.blockTime = 30000;
        this.transactions = [];
        this.reward = 297;
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    getBalance(address) {
        let balance = 0;

        this.chain.forEach(block => {
            block.data.forEach(transaction => {
                if (transaction.from === address) {
                    balance -= transaction.amount;
                    balance -= transaction.gas
                }

                if (transaction.to === address) {
                    balance += transaction.amount;
                }
            })
        });

        return balance;
    }

    addBlock(block) {
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();

        block.mine(this.difficulty);
        this.chain.push(block);

        this.difficulty += Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime ? 1 : -1;
    }

    addTransaction(transaction) {
        if (transaction.isValid(transaction, this)) {
            this.transactions.push(transaction);
        }
    }

    mineTransactions(rewardAddress) {
        let gas = 0;

        this.transactions.forEach(transaction => {
            gas += transaction.gas;
        });

        const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward + gas);
        rewardTransaction.sign(MINT_KEY_PAIR);

        // Prevent people from minting coins and mine the minting transaction.
        if (this.transactions.length !== 0) this.addBlock(new Block(Date.now().toString(), [rewardTransaction, ...this.transactions]));

        this.transactions = [];
    }

    isValid(blockchain = this) {
        for (let i = 1; i < blockchain.chain.length; i++) {
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];

            if (
                currentBlock.hash !== currentBlock.getHash() || 
                prevBlock.hash !== currentBlock.prevHash || 
                !currentBlock.hasValidTransactions(blockchain)
            ) {
                return false;
            }
        }
        return true;
    }
}

class Transaction {
        // Gas will be set to 0 because we are making it optional
        constructor(from, to, amount, gas = 0) {
            this.from = from;
            this.to = to;
            this.amount = amount;
            this.gas = gas;
        }

        sign(keyPair) {
            if (keyPair.getPublic("hex") === this.from) {
                // Add gas
                this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas), "base64").toDER("hex");
            }
        }

        isValid(tx, chain) {
            return (
                tx.from &&
                tx.to &&
                tx.amount &&
                // Add gas
                (chain.getBalance(tx.from) >= tx.amount + tx.gas || tx.from === MINT_PUBLIC_ADDRESS && tx.amount === chain.reward) &&
                ec.keyFromPublic(tx.from, "hex").verify(SHA256(tx.from + tx.to + tx.amount + tx.gas), tx.signature)
            );
        }
    }


const Crypto = new Blockchain();
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
// Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));

// console.log(Crypto)

// test transaction

// const friendWallet = ec.genKeyPair();
// const transaction = new Transaction(
//   holderKeyPair.getPublic("hex"),
//   friendWallet.getPublic("hex"),
//   1000,
//   10
// );
// transaction.sign(holderKeyPair);
// Crypto.addTransaction(transaction);
// Crypto.mineTransactions(friendWallet.getPublic("hex"));

// console.log(
//   "Số dư của người gửi: ",
//   Crypto.getBalance(holderKeyPair.getPublic("hex"))
// );
// console.log(
//   "Số dư của người nhận",
//   Crypto.getBalance(friendWallet.getPublic("hex"))
// );

module.exports = {Block, Blockchain, Transaction, Crypto};