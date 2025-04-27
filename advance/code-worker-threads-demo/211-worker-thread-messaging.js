const WorkerThreads = require('node:worker_threads');;

//this tells us whether we are on the main thread or worker
  if (WorkerThreads.isMainThread) {
    //spin a new thread running the same file 
     const worker = new WorkerThreads.Worker(__filename);
    //send a message to the worker 
    worker.postMessage({"key": 0})
    //listen on the worker port
    worker.on("message", message => {
      console.log("Got a message on parent: " + message.key)
      //get the message on the thread increment and post it back..
      //every second
      setTimeout( ()=> {
        message.key ++;
        worker.postMessage(message)
      }, 1000)
     
    });

    worker.on("exit", ()=> console.log(`Child thread ${WorkerThreads.threadId} just quit `))

  } else {
    
    console.log("I'm a worker thread: " + WorkerThreads.threadId)
   //when we listen on the event, the worker remains alive
    WorkerThreads.parentPort.on("message", message => {
      console.log("Got a message on child: " + message.key)
      //get the message on the thread increment and post it back..
      //every second
      setTimeout( ()=> {
        message.key ++;
         //quit the current worker thread 
         //either pocess.exit or closing parent port
        if (message.key > 5) WorkerThreads.parentPort.close();
        WorkerThreads.parentPort.postMessage(message)
      }, 1000)
     
    });
     
   } 