const { spawn } = require('child_process');

// Chạy n1.js
const n1Process = spawn('node', ['./src/p2p.js']);

// Chạy n2.js
const n2Process = spawn('node', ['./src/p2p(1).js']);

// Bắt sự kiện khi quá trình kết thúc
n1Process.on('exit', (code) => {
  console.log(`Process p2p.js has stopped with status: ${code}`);
});

n2Process.on('exit', (code) => {
    console.log(`Process p2p(1).js has stopped with status: ${code}`);
});
