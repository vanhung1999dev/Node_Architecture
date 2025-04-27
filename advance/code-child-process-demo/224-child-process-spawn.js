//execute an external process 
//spawn gets us back events of stdout as they come in.
const child_process = require('child_process');
console.log(`Parent process id ${process.pid}`)

// Run the `top` command
const worker = child_process.spawn('top');
worker.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

worker.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

worker.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});


console.log(`child command process id ${worker.pid}`)
