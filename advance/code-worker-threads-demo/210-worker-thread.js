const WorkerThreads = require('node:worker_threads');;
//this tells us whether we are on the main thread or worker
  if (WorkerThreads.isMainThread) {
    //spin a new thread running the same file 
    console.log("I'm parent thread: " + WorkerThreads.threadId)
    const worker = new WorkerThreads.Worker(__filename);
    //the thread will be created in the poll phase
    setTimeout(()=> console.log("Parent Timer"), 0)
    console.log("Start parent initial phase")
    for (let i =0; i< 10000000000;i++);
    console.log("End parent initial phase")
  } else {
    //child thread gets its own loop
    setTimeout(()=> console.log("Child Timer"), 0)
    console.log("Start Thread's initial phase")
    for (let i =0; i< 10000000000;i++);
    console.log("End Thread's initial phase")
    console.log("I'm a worker thread: " + WorkerThreads.threadId)
   } 