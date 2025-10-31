# What is Child Process

![](./image/2025-04-27_15-05.png)

## How process communicate - Inter Process Communicate(iPC)

![](./image/2025-04-27_15-06.png)

## Node Fork

![](./image/2025-04-27_15-07.png)

## Exec vs Spawn

![](./image/2025-04-27_15-08.png)


# Node.js Child Process Internals

## The Big Picture

Node.js is single-threaded (one event loop, one V8 instance), but thanks to child processes, it can use multiple CPU cores by running multiple isolated Node runtimes. <br>

```
+-----------------------+
|    Main Process       |
|  JS Code + V8 + libuv |
+----------+------------+
           |
           | fork/spawn/exec
           v
+----------+------------+
|   Child Process       |
|  JS Code + V8 + libuv |
+-----------------------+
```

#### Each child:
- Has its own V8 engine, heap, and event loop
- Communicates with the parent via IPC (pipes/sockets)

## What Happens When You Call fork('./worker.js')

#### Step-by-step:
```
(1) JS Code             (2) Node internals        (3) Kernel (OS)
 ┌────────────┐          ┌──────────────┐          ┌───────────────┐
 │ fork('./w')│ ───────▶ │ libuv: uv_spawn()│ ───▶ │ fork() syscall │
 └────────────┘          └──────────────┘          └───────────────┘
```

After fork(): <br>
- The OS duplicates the current process memory space (copy-on-write)
- Both processes continue running from the same instruction point
- The child then executes node ./worker.js using exec()

## Memory View: Copy-On-Write
When the OS forks a process, it does not copy memory immediately — instead it uses Copy-On-Write (COW). <br>

```
Before fork():
  +----------------------------+
  |  Code Segment (V8 engine)  | <--- shared
  |  Read-only Data            | <--- shared
  |  Heap (JS objects)         |
  |  Stack (function frames)   |
  +----------------------------+

After fork():
  Parent and child share pages until one modifies them.

 Parent                   Child
 +---------+              +---------+
 | Heap A  | <--- shared  | Heap A  |
 | Stack A |              | Stack B | (copied if modified)
 +---------+              +---------+
```
✅ Shared initially <br>
- ⚙️ If parent modifies something → kernel creates a copy for isolation.
- Thus, both processes end up with independent memory.


## IPC Channel Setup (Inter-Process Communication)
When you use fork() in Node.js, it automatically creates an IPC pipe using socketpair() (Unix) or Named Pipes (Windows). <br>

```
Parent process
 ┌──────────────────────┐
 │ JS / V8 / libuv      │
 │   process.send()     │
 └─────────┬────────────┘
           │
           ▼
       [IPC socketpair]
           ▲
           │
 ┌─────────┴────────────┐
 │ JS / V8 / libuv      │
 │   process.on('msg')  │
 └──────────────────────┘
 Child process
```

#### How It Works Internally
Node calls socketpair() — creates two connected file descriptors (like a pipe). <br>
One FD stays in parent, one in child. <br>
Each process writes/reads JSON messages to its socket. <br>

#### When you call:
```
process.send({ hello: 'world' });
```

#### ➡️ Data flow:
```
JS object
  ↓
V8 serialize (JSON/stringify)
  ↓
libuv write(fd)
  ↓
kernel buffer (pipe)
  ↓
libuv read(fd)
  ↓
V8 parse (JSON.parse)
  ↓
'message' event emitted
```

## Signals and Kernel Interaction
When a child process exits, the kernel notifies the parent via the SIGCHLD signal. <br>

```
Child process exit()
  ↓
Kernel sends SIGCHLD
  ↓
Parent process notified
  ↓
Node libuv loop emits 'exit' event
```

#### Example:
```
child.on('exit', (code, signal) => {
  console.log(`Child exited with code ${code}, signal ${signal}`);
});
```

## fork() vs spawn() vs exec() — Visually
| Method      | Runs             | IPC            | Memory         | Data Flow     |
| ----------- | ---------------- | -------------- | -------------- | ------------- |
| **fork()**  | `node worker.js` | ✅ built-in     | Heavy (new V8) | bidirectional |
| **spawn()** | any command      | ❌ (only stdio) | depends        | stream-based  |
| **exec()**  | any command      | ❌ (only stdio) | buffers output | one-shot      |


## Shared Memory vs IPC
| Concept                  | Description                          | Speed  | Memory Shared? |
| ------------------------ | ------------------------------------ | ------ | -------------- |
| **IPC via send()**       | JSON serialized through pipe         | Slower | ❌              |
| **SharedArrayBuffer**    | Shared memory region between threads | Fast   | ✅              |
| **Worker Threads**       | Same process, multiple V8 isolates   | Fast   | ✅              |
| **Child Process fork()** | New process (separate heap)          | Medium | ❌              |

=> If you need shared memory → use worker_threads, not child_process. <br>

## Pros and Cons — with Architecture Insight
```
| ✅ Pros                                     | ❌ Cons                                      |
| ------------------------------------------ | ------------------------------------------- |
| True OS isolation (memory, crash safety)   | High overhead (each has own V8, event loop) |
| Can use all CPU cores                      | IPC is slower (serialization, OS pipes)     |
| Robust — crash of one doesn’t crash others | Not good for frequent task spawning         |
| Can run any binary or script               | Harder to coordinate shared state           |
```

## Comparison: child_process vs worker_threads
| Feature          | Child Process                     | Worker Thread                       |
| ---------------- | --------------------------------- | ----------------------------------- |
| V8 instance      | Separate                          | Shared                              |
| Memory isolation | Full (copy-on-write)              | Partial                             |
| Communication    | IPC (pipes)                       | Shared memory                       |
| Performance      | Medium                            | High                                |
| Use case         | CPU-heavy jobs, external programs | Parallel computation inside one app |
| Stability        | High (isolated)                   | Lower (same process crash risk)     |


