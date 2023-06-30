//const crypto = require('crypto');
//SHA256 = message => crypto.createHash("sha256").update(message).digit("hex");
const sha256 = require('sha256');

SHA256 = message => sha256(message);

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
    }

    getLastBlock(){
        return this.chain[this.chain.length -1];
    }
    addBlock(block){
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();

        block.mine(this.difficulty);
        this.chain.push(block);

        this.difficulty += Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime ? 1 : -1
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

const Crypto = new BlockChain();
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));
Crypto.addBlock(new Block(Date.now().toString(), ["Hello ", "World"]));

console.log(Crypto)