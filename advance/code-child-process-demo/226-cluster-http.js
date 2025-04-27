import cluster from 'node:cluster';
import http from 'node:http';
import { availableParallelism } from 'node:os';
import process from 'node:process';

cluster.schedulingPolicy= cluster.SCHED_NONE;
const numCPUs = availableParallelism();

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`hello world served by worker ${process.pid}\n`);
  }).listen(8000)
  server.on("listening", ()=> console.log( process.pid + " listening...")) 

  console.log(`Worker ${process.pid} started`);
}


//curl http://localhost:8000 to consume