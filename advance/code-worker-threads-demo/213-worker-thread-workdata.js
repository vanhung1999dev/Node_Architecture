//workerData is passed as an argument
//and let each worker do work
//count all primes between two numbers
//send the result to the parent
const WorkerThreads = require('node:worker_threads');;

   if (WorkerThreads.isMainThread) {
    //spin a new thread running the same file
    //pass in data
    const start = Date.now();
    const MaxNumber = 100_000_000
    const os = require("os")
    
    const threadCount = 2 //os.availableParallelism; //try to match the core count
    //use os.availableParallelism
    //spread MaxNumber on threads 
    //each thread gets workSlice worth 
    const workSlice = parseInt(MaxNumber/threadCount)
    console.log(`Scheduling ${MaxNumber} on ${threadCount} threads slice size: ${workSlice}`)
    const x = {"workerData":  {"from": -workSlice, "to": 0}} 
    for (let i =0 ; i < threadCount; i++){
      x.workerData.from += workSlice;
      x.workerData.to += workSlice;
      const worker = new WorkerThreads.Worker(__filename, x);
      worker.on("message", message => {
         //worker responded with work
         console.log (`Parent: Worker ${worker.threadId} found ${message.primes} primes between ${x.workerData.from} to ${x.workerData.to}.`)
      })
    } 

    console.log(`Scheduled ${MaxNumber} work to ${threadCount} threads`)
    //when all threads quite and there isn't anything to do 
    //listen to the process exit command and chek how long it takes 
    process.on("exit", () => console.log (`Processed ${MaxNumber} in ${Date.now() - start} seconds `))
  } else {
      
      //we got work from parent 
      const workerData =WorkerThreads.workerData ;

      console.log (`Worker ${WorkerThreads.threadId} ${process.pid}: Started working finding primes between ${workerData.from} to ${workerData.to}... `)
      const primes = []
      for (let i = workerData.from; i < workerData.to; i++)
           if (isPrime(i)) primes.push(i)
      
      //worker done lets tell the parent
      WorkerThreads.parentPort.postMessage ({"primes": primes.length})
      console.log (`Worker ${WorkerThreads.threadId}: Done.`)
   } 

   function isPrime(num) {
     if (num < 2) return false;
  
     for (let i = 2; i <= Math.sqrt(num); i++) {
       if (num % i === 0) {
        return false;
      }
    }
  
     return true;
  }