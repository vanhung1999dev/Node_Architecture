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

# Event-Loop , Main Thread, V8 

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

### Example 1

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

### Example 2

```js
console.log('A'); // ✅ Phase 0 — Synchronous

setTimeout(() => console.log('B'), 0); // 🕒 Phase 1 — Timers

setImmediate(() => console.log('C')); // 🕘 Phase 5 — Check

process.nextTick(() => console.log('D')); // 🔁 Microtask — Runs *after* current Phase 0, before Promises

Promise.resolve().then(() => console.log('E')); // 🔁 Microtask — Runs after nextTick

async function demo() {
  console.log("F"); // ✅ Phase 0 — Synchronous
  await taskA();    // 🔁 Microtask (after current stack)
  console.log("G"); // 🔁 Microtask — Scheduled after await completes
}

function taskA() {
  return Promise.resolve(); // Returns a resolved Promise
}

demo(); // ✅ Phase 0 — Call the async function

console.log("END"); // ✅ Phase 0 — Synchronous

-------------------------------------


A          // Phase 0
F          // Phase 0
END        // Phase 0
D          // Microtask (nextTick)
E          // Microtask (Promise.then)
G          // Microtask (await continuation)
B          // Phase 1 (setTimeout)
C          // Phase 5 (setImmediate)

```

#### 

```
The code BEFORE await runs just like any other synchronous function.
Only the part AFTER the first await is deferred.
```


### Example 3

```js

console.log('A'); 
// 🔹 Runs immediately (synchronous code — Phase 0)
// ✅ Output: A

setTimeout(() => console.log('B'), 0); 
// 🕒 Scheduled for later — runs in "timers" phase (Phase 1)
// ✅ Output: B (after microtasks are done)

setImmediate(() => console.log('C')); 
// 🕘 Scheduled for later — runs in "check" phase (Phase 5)
// ✅ Output: C (after setTimeout, usually)

process.nextTick(() => console.log('D')); 
// 🔁 Microtask — runs *after* current synchronous code finishes
// ✅ Output: D (before any Promises)

Promise.resolve().then(() => console.log('E')); 
// 🔁 Microtask — runs after nextTick
// ✅ Output: E

async function demo() {
  console.log("F");
  // 🔹 Runs immediately when `demo()` is awaited
  // ✅ Output: F (but not until the async block starts)

  await taskA();
  // ⏸ Pauses here — resumes in microtask queue
  // The code below is deferred

  console.log("G");
  // 🔁 Microtask — runs after await finishes
  // ✅ Output: G
}

function taskA() {
  return Promise.resolve(); 
  // ✅ Resolves immediately, so resume will happen soon
}

// 👇 This is an async IIFE (Immediately Invoked Function Expression)
(async () => {
  await demo();
  // 🔁 Microtask — runs after synchronous code finishes
  // The `demo()` function runs:
  // - F prints immediately
  // - Then G runs in a microtask after await
})();

console.log("END");
// 🔹 Runs synchronously right after top-level code
// ✅ Output: END

 ---------------------------

A      // sync
END    // sync
D      // process.nextTick (microtask)
E      // Promise.then (microtask)
F      // from demo(), called inside async IIFE
G      // after await inside demo()
B      // setTimeout (Phase 1)
C      // setImmediate (Phase 5)


```

## How main thread work
- One main thread running your JavaScript code (via V8 engine).
- A C++ layer (libuv) underneath that handles I/O, timers, and system calls asynchronously — using worker threads, thread pool, or OS-level async APIs.
- The main thread constantly switches between **two key roles** — but never does both at once

### ⚙️ Role 1: Execute JavaScript (V8 engine)
When Node.js runs your code, it does so through V8, Google’s JS engine (same one used in Chrome). <br>
This phase is where Node executes: <br>
- Your JS functions, variables, loops, etc. 
- Event callbacks (from timers, promises, I/O results) 
- Async/await resolutions
- nextTick, microtasks

What actually happens <br>
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

Step 1 — JS Execution (V8) <br>
- 1️⃣ console.log("1") → prints
- 2️⃣ setTimeout(...) → libuv timer queue
- 3️⃣ Promise.resolve() → microtask queue
- 4️⃣ console.log("4") → prints

Step 2 — After stack empty <br>
- Microtasks run first → console.log("3")
- Event loop continues → timer queue → console.log("2")

Final Output: <br>
```
1
4
3
2
```

Only when the JS stack is empty can control go back to the event loop (libuv).

### 🔄 Role 2: Drive the Event Loop (libuv)

When V8 is idle (no JS running), Node hands control to libuv’s event loop. <br>
The event loop is like a traffic controller: <br>
- It checks which async tasks are done (I/O, timers, etc.).
- It decides which callbacks should run next.
- Then it gives those callbacks back to V8 for execution.

#### 🔁 The 6 Phases of the Event Loop
| Phase                    | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| **1. timers**            | Executes `setTimeout` / `setInterval` callbacks whose time expired. |
| **2. pending callbacks** | Runs I/O callbacks deferred from the previous loop.                 |
| **3. idle, prepare**     | Internal phase (Node.js internals).                                 |
| **4. poll**              | Waits for new I/O events (e.g., file, socket, DNS).                 |
| **5. check**             | Executes `setImmediate()` callbacks.                                |
| **6. close callbacks**   | Runs `close` event handlers (like socket close).                    |

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

# Advance question relate to Nodejs 
[question](./question-to-ask.md)
