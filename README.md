# Node_Architecture

Deep Dive into how Nodejs work

## NodeJS Architecture

I cover the various phases in the event loop and what exactly happens in each phase, how promises are just callbacks, how and when modules are loaded and their effect on performance, Node packages anatomy and more

## Node Internals

This is where we go one layer deeper, how Node truly achieves asynchronous IO with libuv, and how each protocol in node is implemented. How concurrent node works on both user level threads and process level.

## Node Optimization and Performance

Now that we understand the internals and architecture of Node, this is where we discuss tips how to make the code runs more efficiently and more performance. And only when we exhaust all other avenues Node provides ways to extend it with C++ add-ons where JavaScript just can't no longer hold.

## LibUV

- [Document](https://docs.libuv.org/en/v1.x/design.html)

# Libvu Component

![](./images/Screenshot_1.png)

```vbnet
JavaScript → Node C++ binding → libuv I/O request
           ↓                  ↘
     callback stored     libuv assigns an internal "req" object with ID
                             ↓
        Event loop runs → I/O finishes (e.g., file read, TCP done)
                             ↓
       Callback is put into the correct event loop phase (e.g., poll)
                             ↓
               JavaScript callback is invoked

```

## Thread Pool

[how it work internal](./basic/thread_pool.md)

## Socket event

[socket event](./basic/socket_event.md)

## V8

- [Document](https://v8.dev/blog/fast-async)

# Event-Loop

![](./images/Screenshot_8.png)

## Include nextTick and microTask: <br>

```arduino

  ┌────────────────────────────┐
 │  Phase 0: Init             │ <── Executes:
 │                            │     - Top-level code (global scope)
 │                            │     - Module imports/exports
 │                            │     - Synchronous setup (e.g. app.init())
 │                            │     - Registered timers, promises, etc.
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue (FIFO, includes nested)
    ✅ microtask queue (Promise.then, includes nested)
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 1: Timers           │ <── Executes:
 │                            │     - setTimeout() callbacks
 │                            │     - setInterval() callbacks
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 2: Pending Callbacks│ <── Executes:
 │                            │     - Some system-level I/O callbacks
 │                            │     - e.g., TCP errors from previous loop
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 3: Idle, Prepare    │ <── Internal phase (libuv)
 │                            │     - Prepares for I/O polling
 │                            │     - JS code can’t hook into this
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 4: Poll             │ <── Executes:
 │                            │     - I/O event callbacks (fs, net, etc.)
 │                            │     - Waits if no timers or immediates
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 5: Check            │ <── Executes:
 │                            │     - setImmediate() callbacks
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Phase 6: Close Callbacks  │ <── Executes:
 │                            │     - close events (e.g. socket.on('close'))
 │                            │     - handle .destroy(), etc.
 └────────────┬───────────────┘
              ▼
    🔥 process.nextTick queue
    ✅ microtask queue
    ⬇️ Continue to next phase

 ┌────────────────────────────┐
 │  Back to Phase 1 (loop)    │ <── Loop repeats until exit
 └────────────────────────────┘

```

- ✅ Both **process.nextTick()** and **Promise.then() queues are drained completely before moving to the next phase — including new items added during their own execution**.

### Example

```js
console.log('A'); // Phase 0

setTimeout(() => console.log('B'), 0);       // Phase 1
setImmediate(() => console.log('C'));        // Phase 5
process.nextTick(() => console.log('D'));    // Runs after Phase 0
Promise.resolve().then(() => console.log('E')); // After nextTick

// OUTPUT:
A      ← Init (Phase 0)
D      ← nextTick (after Phase 0)
E      ← microtask (after nextTick)
B      ← setTimeout (Timers - Phase 1)
C      ← setImmediate (Check - Phase 5)

```

# 🧵 Task Queues Overview

## 🟦 MacroTasks

Also called "Tasks", they include: <br>

- **setTimeout**
- **setInterval**
- **setImmediate**
- **I/O callbacks (like from fs.readFile)**
- **MessageChannel or postMessage**

These are **scheduled to run in different event loop phases**. <br>

## 🟩 MicroTasks

Also called "Jobs", they include: <br>

- **Promise.then(), catch(), finally()**
- **queueMicrotask()**
- **process.nextTick()** (sort of — special case, more on that later)

These **run after the current operation finishes, before the event loop continues to the next phase**. <br>

## 🧪 process.nextTick()

- It's a Node.js-specific **special microtask**.
- It schedules a callback to **run immediately after the current operation completes, before any other microtasks like Promises**.
- This gives it **higher priority than normal microtasks**.

# Callback Internally

[how callback work](./basic/callback.md)

# Promise Internally

[how promise work internally](./basic/promise.md)

# Async/Await

[how async/await work internally](./basic/await.md)

# Import/Require

[how require work](./basic/require.md)

[how import work](./basic/import.md)

- **Require** load module in **sync** often in **Initial Phase, Poll Phase, Time Phase, .., support condition, can use in JS only**
- **Import** load module in **async**, return **promise, load in Poll Phase, can use for both js and mjs**
- **Import X from package** load **intermediately**, at the **top of declaration**, can not use in condition

# Streaming data

[streaming data](./basic/stream.md)

# Package.json

[how package work](./basic/package.md)

# Performance

- [Tip for Nodejs](./basic/performance.md)

# Advance Concept

## Process and Thread

[process and thread](./advance/process_thread.md)

## Child Process

[child process](./advance/child_process.md)

## Worker Thread

[worker thread](./advance/worker_thread.md)
