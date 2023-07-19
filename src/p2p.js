const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
  ec = new EC("secp256k1"); 

const {Block, Blockchain, Transaction, Crypto} = require("./block");

const MINT_PRIVATE_ADDRESS = "049ff90c66602bc415a0659e04ada68dd810b38f5cad8a033d006cdfe426e36ff4cd285d530c2824b715c3799f77aef41e0b1fd8e174ead0669dfd5b0a1b12349d";

const MINT_KEY_PAIR = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex");

const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");

// console.log("MINT_PRIVATE_ADDRESS: ", MINT_PRIVATE_ADDRESS)

// console.log("MINT_KEY_PAIR: ", MINT_KEY_PAIR)

// console.log("MINT_PUBLIC_ADDRESS: ", MINT_PUBLIC_ADDRESS)

const privateKey = '94f87428dda6b4017281499ac8d845d244a2f70accd06ee5727b1b074ff3f23d' // Private key of current user 
const keyPair = ec.keyFromPrivate(privateKey, "hex");
const keyPublic = keyPair.getPrivate("hex");

const WS = require("ws");

const PORT  = process.env.PORT || 3000;
const PEERS = process.env.PEERS ? process.env.PEERS.split(",") : [];
const MY_ADDRESS = process.env.MY_ADDRESS || "ws://localhost:3000";

const server = new WS.Server({port : PORT});

let opened = [];
let connected = [];

process.on("uncaughtException", err => console.log(err));

server.on("connection", async(socket, req) => {
  socket.on("message", message => {
    const _message = JSON.parse(message);

    switch(_message.type) {
      case "TYPE_HANDSHAKE": 
        const nodes = _message.data;

        nodes.forEach(node => connect(node));

        break;
    }
  })
});

async function connect (address){
  if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS){
    const socket = new WS(address);

    socket.on("open", () => {
      socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected])));

      opened.forEach(node => node.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))));

      if (!opened.find(peer => peer.address === address) && address !== MY_ADDRESS){
        opened.push({socket, address});
      };

      if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS){
        connected.push({socket, address});
      };

      socket.on("close", () => {
        opened.splice(connected.indexOf(address), 1);
        connected.splice(connected.indexOf(address), 1);
      });

    });
  }
} 

function produceMessage(message){
  return {type, data} // data sẽ trả về địa chỉ của ta và địa chỉ của các node đã kết nối, "địa chỉ x", "địa chỉ y"
}

PEERS.forEach(peer => connect(peer));