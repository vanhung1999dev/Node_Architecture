//execute an external process 
//this is great for execute commands that terminates and gives an output.. 
const child_process = require('child_process');
console.log(`Parent process id ${process.pid}`)

// Run the `ifconfig` command
const worker = child_process.exec('ifconfig', (error, stdout, stderr) => {
   if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with an error code
  } else if (stderr) {
    console.error(`Stderr: ${stderr}`);
    process.exit(1); // Exit with an error code
  } else {
    // Send the stdout result to the parent process
    console.log(stdout);
    process.exit(0); // Exit
  }
});

console.log(`child command process id ${worker.pid}`)
