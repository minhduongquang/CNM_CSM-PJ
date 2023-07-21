const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
ec = new EC("secp256k1");

const keyPair = ec.genKeyPair();
const USER1_Public_key = keyPair.getPublic("hex")
const USER1_Private_key = keyPair.getPrivate("hex")

console.log("Public key user1:", USER1_Public_key);
console.log("Private key user1:", USER1_Private_key);

const KeyPair = ec.genKeyPair();
const USER2_Public_key = KeyPair.getPublic("hex")
const USER2_Private_key = KeyPair.getPrivate("hex")

console.log("Public key user2:", USER2_Public_key);
console.log("Private key user2:", USER2_Private_key);


const MINT_KEY_PAIR = ec.genKeyPair();

const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");
const MINT_PRIVATE_ADDRESS = MINT_KEY_PAIR.getPrivate("hex");

console.log("Private Address MINT:", MINT_PRIVATE_ADDRESS);
console.log("Public Address MINT:", MINT_PUBLIC_ADDRESS);


