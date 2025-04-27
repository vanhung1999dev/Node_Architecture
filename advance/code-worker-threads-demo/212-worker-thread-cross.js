//two worker threads talking to each other..
//we setup a channel and send it over

const WorkerThreads = require('node:worker_threads');;

//this tells us whether we are on the main thread or worker
  if (WorkerThreads.isMainThread) {
 
    const subChannel = new WorkerThreads.MessageChannel();
    
    //spin two workers  
    const worker1 = new WorkerThreads.Worker(__filename);
    const worker2 = new WorkerThreads.Worker(__filename);

    //send a message to the worker 
    //must be included in the transfer list
    //this will ensure memory is correctly managed
    worker1.postMessage({"port": subChannel.port1}, [subChannel.port1])
    worker2.postMessage({"port": subChannel.port2}, [subChannel.port2]) 
  
    worker1.on("exit", w=> console.log(`Child thread ${w.threadId} just quit `))
    worker2.on("exit", w=> console.log(`Child thread ${w.threadId} just quit `))

  } else {
     
    //when we listen on the event on the parent
    WorkerThreads.parentPort.on("message", message => {
        //send a message to the other thread
        console.log("port received on thread " +WorkerThreads.threadId )
       
        message.port.postMessage({"key": 0})
        message.port.on("message", m => {
              console.log("message received " + m.key + " on thread " + WorkerThreads.threadId)
              m.key ++;
              setTimeout( ()=> message.port.postMessage (m) , 1000)
        })  
    });
     
   } 