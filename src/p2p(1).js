const sha256 = require("sha256");

SHA256 = (message) => sha256(message);

const EC = require("elliptic").ec,
  ec = new EC("secp256k1"); 

const {Block, Blockchain, Transaction, Crypto} = require("./block");

const MINT_PRIVATE_ADDRESS = "049ff90c66602bc415a0659e04ada68dd810b38f5cad8a033d006cdfe426e36ff4cd285d530c2824b715c3799f77aef41e0b1fd8e174ead0669dfd5b0a1b12349d";

const MINT_KEY_PAIR = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex");

const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");
const privateKey = '913c410f4e9cc6d439268d79dba86e442c7b8989ebc22a7823e475ae230117e6';
const keyPair = ec.keyFromPrivate(privateKey, "hex");
const publicKey = keyPair.getPrivate("hex");

const WS = require("ws");

const PORT = 3001;
console.log('port: ', PORT)
const PEERS = ["ws://localhost:3001"];
const MY_ADDRESS = "ws://localhost:3001";
const server = new WS.Server({ port: 3001});

let opened = [], connected = [];
let check = [];
let checked = [];
let checking = false;
let tempChain = new Blockchain();

console.log("Listening on PORT", PORT);

server.on("connection", async (socket, req) => {
    socket.on("message", message => {
        const _message = JSON.parse(message);

        console.log(_message);

        switch(_message.type) {
            case "TYPE_REPLACE_CHAIN":
                const [ newBlock, newDiff ] = _message.data;

                const ourTx = [...Crypto.transactions.map(tx => JSON.stringify(tx))];
                const theirTx = [...newBlock.data.filter(tx => tx.from !== MINT_PUBLIC_ADDRESS).map(tx => JSON.stringify(tx))];
                const n = theirTx.length;

                if (newBlock.prevHash !== Crypto.getLastBlock().prevHash) {
                    for (let i = 0; i < n; i++) {
                        const index = ourTx.indexOf(theirTx[0]);

                        if (index === -1) break;
                        
                        ourTx.splice(index, 1);
                        theirTx.splice(0, 1);
                    }

                    if (
                        theirTx.length === 0 &&
                        SHA256(Crypto.getLastBlock().hash + newBlock.timestamp + JSON.stringify(newBlock.data) + newBlock.nonce) === newBlock.hash &&
                        newBlock.hash.startsWith("000" + Array(Math.round(Math.log(Crypto.difficulty) / Math.log(16) + 1)).join("0")) &&
                        Block.hasValidTransactions(newBlock, Crypto) &&
                        (parseInt(newBlock.timestamp) > parseInt(Crypto.getLastBlock().timestamp) || Crypto.getLastBlock().timestamp === "") &&
                        parseInt(newBlock.timestamp) < Date.now() &&
                        Crypto.getLastBlock().hash === newBlock.prevHash &&
                        (newDiff + 1 === Crypto.difficulty || newDiff - 1 === Crypto.difficulty)
                    ) {
                        Crypto.chain.push(newBlock);
                        Crypto.difficulty = newDiff;
                        Crypto.transactions = [...ourTx.map(tx => JSON.parse(tx))];
                    }
                } else if (!checked.includes(JSON.stringify([newBlock.prevHash, Crypto.chain[Crypto.chain.length-2].timestamp || ""]))) {
                    checked.push(JSON.stringify([Crypto.getLastBlock().prevHash, Crypto.chain[Crypto.chain.length-2].timestamp || ""]));

                    const position = Crypto.chain.length - 1;

                    checking = true;

                    sendMessage(produceMessage("TYPE_REQUEST_CHECK", MY_ADDRESS));

                    setTimeout(() => {
                        checking = false;

                        let mostAppeared = check[0];

                        check.forEach(group => {
                            if (check.filter(_group => _group === group).length > check.filter(_group => _group === mostAppeared).length) {
                                mostAppeared = group;
                            }
                        })

                        const group = JSON.parse(mostAppeared)

                        Crypto.chain[position] = group[0];
                        Crypto.transactions = [...group[1]];
                        Crypto.difficulty = group[2];

                        check.splice(0, check.length);
                    }, 5000);
                }

                break;

            case "TYPE_REQUEST_CHECK":
                opened.filter(node => node.address === _message.data)[0].socket.send(
                    JSON.stringify(produceMessage(
                        "TYPE_SEND_CHECK",
                        JSON.stringify([Crypto.getLastBlock(), Crypto.transactions, Crypto.difficulty])
                    ))
                );

                break;

            case "TYPE_SEND_CHECK":
                if (checking) check.push(_message.data);

                break;

            case "TYPE_CREATE_TRANSACTION":
                const transaction = _message.data;

                Crypto.addTransaction(transaction);

                break;

            case "TYPE_SEND_CHAIN":
                const { block, finished } = _message.data;

                if (!finished) {
                    tempChain.chain.push(block);
                } else {
                    tempChain.chain.push(block);
                    if (Blockchain.isValid(tempChain)) {
                        Crypto.chain = tempChain.chain;
                    }
                    tempChain = new Blockchain();
                }

                break;

            case "TYPE_REQUEST_CHAIN":
                const socket = opened.filter(node => node.address === _message.data)[0].socket;
                
                for (let i = 1; i < Crypto.chain.length; i++) {
                    socket.send(JSON.stringify(produceMessage(
                        "TYPE_SEND_CHAIN",
                        {
                            block: Crypto.chain[i],
                            finished: i === Crypto.chain.length - 1
                        }
                    )));
                }

                break;

            case "TYPE_REQUEST_INFO":
                opened.filter(node => node.address === _message.data)[0].socket.send(JSON.stringify(produceMessage(
                    "TYPE_SEND_INFO",
                    [Crypto.difficulty, Crypto.transactions]
                )));

                break;

            case "TYPE_SEND_INFO":
                [ Crypto.difficulty, Crypto.transactions ] = _message.data;
                
                break;

            case "TYPE_HANDSHAKE":
                const nodes = _message.data;

                nodes.forEach(node => connect(node))
        }
    });
})

async function connect(address) {
	if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
		const socket = new WS(address);

		socket.on("open", () => {
			socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected])));

			opened.forEach(node => node.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))));

			if (!opened.find(peer => peer.address === address) && address !== MY_ADDRESS) {
				opened.push({ socket, address });
			}

			if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
				connected.push(address);
			}
		});

		socket.on("close", () => {
			opened.splice(connected.indexOf(address), 1);
			connected.splice(connected.indexOf(address), 1);
		});
	}
}

function produceMessage(type, data) {
	return { type, data };
}

function sendMessage(message) {
	opened.forEach(node => {
		node.socket.send(JSON.stringify(message));
	})
}

process.on("uncaughtException", err => console.log(err));

PEERS.forEach(peer => connect(peer));

setTimeout(() => {
	if (Crypto.transactions.length !== 0) {
		Crypto.mineTransactions(publicKey);

		sendMessage(produceMessage("TYPE_REPLACE_CHAIN", [
			Crypto.getLastBlock(),
			Crypto.difficulty
		]))
	}
}, 6500);

setTimeout(() => {
	console.log(opened);
	console.log(Crypto);
}, 10000);