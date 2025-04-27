const net = require('net');
const os = require('os');
const WorkerThreads = require('node:worker_threads');;

const PORT = 3000;

// Check if the current process is the master process
if (WorkerThreads.isMainThread) {
  console.log(`Master process ${process.pid} is running`);
 
  // Create a TCP server on the parent
  const server = net.createServer();  
 
   server.listen({ port: PORT},
    () => {
      console.log(`parent process ${process.pid} is listening on port ${PORT}`);
    }
  );

  // Handle incoming connections
  //any connection we get, send it to a new thread 
  //ideally you want to have a limit to the number of threads 
  //but its just an example 
  server.on('connection', (socket) => {
    //create new worker
    console.log(`Got a new connection ${socket._handle.fd}`)
    const worker = new WorkerThreads.Worker(__filename, {"workerData": socket._handle.fd});
    worker.on("exit", () => {
        console.log(`thread terminated.`)
        //close their connection
        socket.destroy();
    })
});
 
 

} else {
  console.log(`Worker thread ${WorkerThreads.threadId} is starting`);

  const fd = WorkerThreads.workerData;
  console.log(`Thread ${WorkerThreads.threadId} Got file descriptor ${fd}`);
  console.log("socket received on thread " + WorkerThreads.threadId )

  const socket = new net.Socket({ fd });
  //send a message to the other thread
  socket.write(`Handled by thread ${WorkerThreads.threadId}\n`);
  socket.on("data", data=> console.log(`${WorkerThreads.threadId} got ${data}`))
  //DO NOT CLOSE the socket, main parent still works on it
  //exit the current thread instead.
  process.exit(0);
}
 