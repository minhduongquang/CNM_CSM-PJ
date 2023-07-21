const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
  ec = new EC("secp256k1");

const { Block, Blockchain, Transaction, Crypto } = require("./block");

const MINT_PRIVATE_ADDRESS =
  "049ff90c66602bc415a0659e04ada68dd810b38f5cad8a033d006cdfe426e36ff4cd285d530c2824b715c3799f77aef41e0b1fd8e174ead0669dfd5b0a1b12349d";

const MINT_KEY_PAIR = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex");

const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");

const privateKey =
  "94f87428dda6b4017281499ac8d845d244a2f70accd06ee5727b1b074ff3f23d"; // Private key of current user
const keyPair = ec.keyFromPrivate(privateKey, "hex");
const publicKey = keyPair.getPrivate("hex");

// const friendWallet = ec.genKeyPair();
// const transaction = new Transaction(
//   publicKey,
//   friendWallet.getPublic("hex"),
//   1000,
//   10
// );
// transaction.sign(publicKey);
// Crypto.addTransaction(transaction);
// Crypto.mineTransactions(friendWallet.getPublic("hex"));

// console.log(
//   "Số dư của người gửi: ",
//   Crypto.getBalance(publicKey)
// );
// console.log(
//   "Số dư của người nhận",
//   Crypto.getBalance(friendWallet.getPublic("hex"))
// );

setTimeout(() => {
    Crypto.addBlock(new Block("",["Hello ", "World1"]));

    console.log(Crypto)
}, 50);