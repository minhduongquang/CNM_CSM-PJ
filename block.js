//const crypto = require('crypto');
//SHA256 = message => crypto.createHash("sha256").update(message).digit("hex");
const sha256 = require('sha256');

SHA256 = message => sha256(message);

const EC = require('elliptic'), ec = new EC('secp256k1');

const keyPair = ec.genKeyPair();


class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = "";
        this.nonce = 0;
    }
    getHash(){
        return SHA256(this.prevHash + this.timestamp + JSON.stringify(this.data) + this.nonce);
    }
    mine(difficulty){
        while(!this.hash.startsWith(Array(difficulty+1).join("0"))){
            this.nonce++;
            this.hash = this.getHash()
        }
    }
}

class BlockChain {
    constructor(){
        this.chain = [new Block(Date.now().toString())]
        this.difficulty = 1;
        this.blockTime = 30000;
        this.transaction = [];
        this.reward = 2910; // random reward
    }

    getLastBlock(){
        return this.chain[this.chain.length -1];
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

    addBlock(block){
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();

        block.mine(this.difficulty);
        this.chain.push(block);

        this.difficulty += Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime ? 1 : -1
    }

    addTransaction(transaction){
        this.transaction.push(transaction);
    }

    mineTransaction(rewardAddress){
        this.addBlock(new Block(Date.now().toString(), [new Transaction(CREATE_REWARD_ADDRESS, rewardAddress, this.reward), ...this.transaction]));

        this.transaction = [];
    }

    isValid(BlockChain = this){
        for(let i = 1; i < BlockChain.chain.length; i++ ){
            const currentBlock = BlockChain.chain[i];
            const prevBlock = BlockChain.chain[i-1];

            if (currentBlock.hash !== currentBlock.getHash() || prevBlock.hash !== currentBlock.prevHash) {
                return false;
            }
        }
        return true;
    }
}

class Transaction {
    constructor(from, to, amount) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    sign(keyPair) {
        if (keyPair.getPublic("hex") == this.from){
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount), "base64").toDER("hex");
        }
    }

    isValid(tx, chain){
        return {
            tx.from &&
            tx.to &&
            tx.amount &&
            chain.getBalance(tx) >= tx.amount &&
            ec.keyFromPublic(tx.from, "hex").verify(SHA256(tx.from + tx.to + tx.gas))
        }
    }
}

const Crypto = new BlockChain();
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));

console.log(Crypto)