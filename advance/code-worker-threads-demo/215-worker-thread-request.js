//we build multi-threaded server
//every request the parent process receive
//we pass as many info as possible to the worker thread
//thread receives the request and process it and 
//send back to the parent so it can response to the client
//note we can't send the request/response streams as they are not transferable

const http = require('http');
const WorkerThreads = require('node:worker_threads');;

const PORT = 8080;

// Check if the current process is the master process
if (WorkerThreads.isMainThread) {
  console.log(`Master process ${process.pid} is running`);
 
  // Create a TCP server on the parent
  const server = http.createServer();  

   // Listen on the port
   server.listen({ port: PORT},
    () => {
      console.log(`parent process ${process.pid} is listening on port ${PORT}`);
    }
  );
 


  // Handle incoming requests
  //any request we get, send it to a new thread 
  //ideally you want to have a limit to the number of threads 
  //but its just an example 
  server.on('request', (req,res) => {
    //create new worker
    console.log(`Got a new request ${req.url}`)
    const worker = new WorkerThreads.Worker(__filename, {"workerData": {reqUrl: req.url}}, [req.url]);
    worker.on("message", message => {
      res.statusCode= 200;
      res.setHeader("content-type", "text/plain")
      res.write(message) 
      res.end();
    })
    worker.on("exit", () => {
        console.log(`thread terminated.`)
    })
});
 
 

} else {
  console.log(`Worker thread ${WorkerThreads.threadId} is starting`);
  const reqUrl = WorkerThreads.workerData.reqUrl;
  console.log(`Thread got request ${reqUrl}...`);
  
  //process the request/
  setTimeout( ()=> {
     //processing done.. lets write the response to the parent so it can send it
     WorkerThreads.parentPort.postMessage(`Handled by thread ${WorkerThreads.threadId}-${reqUrl}\n` )
     console.log(`Handled by thread ${WorkerThreads.threadId}-${reqUrl}\n`)
  }, 2000)
 
  
}
 