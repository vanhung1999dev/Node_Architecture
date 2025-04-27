# 🧵 What is Node.js Thread Pool Exactly?

- The thread pool is a **group of native OS threads managed by libuv** that handles **blocking, CPU-heavy, or async I/O operations** without blocking the main event loop.
- It's not JavaScript threads — JavaScript is always single-threaded — this is all happening underneath in C/C++.

## 🛠 How Thread Pool Works (Step-by-Step with Analogy)

```
fs.readFile("bigfile.txt", () => {
  console.log("done");
});

```

###

🧠 Internals: <br>

- **Main thread (event loop)** sees fs.readFile, which is not non-blocking by nature.
- It uses **libuv** to delegate the task to a thread pool.
- **libuv** queues the request internally and tries to assign it to an available thread in the pool.
- Each thread is a **native OS thread**, doing work like reading files, hashing passwords, compressing data.
- Once the thread finishes the work:

  - It signals back to libuv.
  - **libuv** puts the callback (console.log("done")) onto the event loop queue.
  - The **main thread** eventually picks it up and executes it.

🔗 Underlying Connection: <br>

- File Descriptors (FDs) are used to manage I/O.
- But operations like fs.readFile require blocking system calls (e.g., read(2)).
- To avoid blocking the main thread, libuv uses a thread + async I/O combo.
- When the blocking I/O is done, the worker thread notifies the main event loop via async handles (using pipes, events, or OS mechanisms).

## 🔄 What if All 4 Threads Are Busy?

- **UV_THREADPOOL_SIZE=4** by default

```
for (let i = 0; i < 10; i++) {
  fs.readFile("file.txt", () => {
    console.log(`done ${i}`);
  });
}

```

- When all 4 threads in the thread pool are still busy (say they're handling long-running operations like pbkdf2, fs.readFile, zlib, etc.) and more work arrives, here's what happens:

### 1. New Tasks Are Queued Inside libuv

- libuv maintains an internal queue (FIFO style) of work that’s waiting to be assigned to a thread.
  - It doesn’t crash.
  - It doesn’t spawn new threads.
  - It just waits.

### 2. The Event Loop is NOT blocked

- Even if all thread pool threads are busy, the main event loop continues running:

  - Your timers (setTimeout, etc.), networking callbacks (http), and other async code still work.
  - But anything that relies on the thread pool will be delayed until a thread becomes available.

### 🧪 Example (thread pool backlog in action)

```
const crypto = require("crypto");

for (let i = 0; i < 10; i++) {
  const start = Date.now();
  crypto.pbkdf2("password", "salt", 100000, 512, "sha512", () => {
    console.log(`Hash ${i} done in ${Date.now() - start}ms`);
  });
}

```

With default **UV_THREADPOOL_SIZE=4**,, run **4 thread in concurrent** with **single core** output might look like: <br>

```
Hash 0 done in 600ms
Hash 1 done in 600ms
Hash 2 done in 600ms
Hash 3 done in 600ms
Hash 4 done in 1200ms
Hash 5 done in 1200ms
...

```

## ⚙️ Can You Increase the Thread Pool Size?

- Set via **UV_THREADPOOL_SIZE**, **max ~128**
- The real limit is how many OS threads your system can handle efficiently.
- More threads = more context switching = potential performance degradation.
- Ideal size depends on the nature of your workload (CPU-bound vs I/O-bound).
