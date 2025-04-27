//with processes we will need our own indicator 
const child_process = require('child_process');
//this tells us whether we are on the main thread or worker
  if (!process.env.isChildProcess) {
    //spin a new process running the same file 
    console.log("Start parent initial phase")
    console.log("I'm parent thread: " + process.pid)
    //we have to set a env variable so we know which process is a child
    console.log("Before forking..")
    const worker = child_process.fork(__filename, [], { env: { isChildProcess: 'true' } });
    console.log("After forking..")

    //the thread will be created in the poll phase
    setTimeout(()=> console.log("Parent Timer"), 0)
    console.log("About to start a loop in parent ..")

    for (let i =0; i< 10000000000;i++);
    console.log("End parent initial phase")
    process.on("exit", ()=>console.log("Parent exit"))
  } else {
    //child Process gets its own loop
    setTimeout(()=> console.log("Child Timer"), 0)
    console.log("Start Process's initial phase")
    console.log("I'm a worker process: " + process.pid)

    for (let i =0; i< 10000000000;i++);
    console.log("End Process's initial phase")
    process.on("exit", ()=>console.log("Child exit"))

   } 


