const cluster = require('cluster');
const net = require('net');
const os = require('os');

const PORT = 3000;

//cluster.schedulingPolicy= cluster.SCHED_NONE
//SCHED_NONE will send the socket listner to each worker
//the workers will call accept on the shared socket listener 
//it becomes a racing game based on how fast the processes are 
//unpredicable 
//SCHED_RR will leave the socket listener on the parent
//the parent will call accept 
//the parent then sends accepted connection to a worker based
//round robin algorithm
cluster.schedulingPolicy= cluster.SCHED_NONE ;


// Check if the current process is the master process
if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  // Fork workers based on the number of CPU cores
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
 

} else {
  console.log(`Worker process ${process.pid} is starting`);

  // Create a TCP server on the worker
  // will communicate with the parent
  // and ask the parent to listen and gets the socket 
  // the child gets the socket 
  //if a socket already exists it is returned.
  const server = net.createServer();
  //the exclusive false means the socket is not exclusive to the worker, but shared ,
  // node doesn't support SO_REUSEPORT, setting this to true will fail
  // because each worker will try to listen on the same port..
  server.listen(
    {
      port: PORT,
      exclusive: false,   
    },
    () => {
      console.log(`Worker ${process.pid} is listening on port ${PORT}`);
    }
  );

  // Handle incoming connections
  server.on('connection', (socket) => {
    console.log(`Worker ${process.pid} received a connection`);
    socket.end('Handled by worker ' + process.pid + '\n');
  });
}
 