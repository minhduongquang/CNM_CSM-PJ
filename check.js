const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
  ec = new EC("secp256k1"); 

const privateKey = '913c410f4e9cc6d439268d79dba86e442c7b8989ebc22a7823e475ae230117e6';
const keyPair = ec.keyFromPrivate(privateKey, "hex");
const keyPublic = keyPair.getPrivate("hex");

console.log("Public key: ", keyPublic);
console.log("Private key:", privateKey)