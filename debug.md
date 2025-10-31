
# 🧠 Node.js Performance & Debugging Deep Dive

## 🚀 1. Performance Measurement
| Metric                      | Description                                | Typical Tool                      |
| --------------------------- | ------------------------------------------ | --------------------------------- |
| **Response Time (p95/p99)** | How long requests take to complete         | APM tools, `perf_hooks`           |
| **Throughput (req/s)**      | Number of requests handled per second      | `autocannon`, `wrk`               |
| **Event Loop Lag**          | Time event loop spends waiting to execute  | `monitorEventLoopDelay()`         |
| **CPU Usage**               | % CPU consumed by Node process             | `top`, `pidusage`, `clinic flame` |
| **Memory Usage**            | RSS, HeapUsed, External, ArrayBuffers      | `process.memoryUsage()`           |
| **GC Pause Time**           | Time V8 garbage collector pauses execution | `--trace-gc`, `node --inspect`    |


### 🧠 Node.js Profiling Techniques
#### 1. High-Resolution Timing
```js
const { performance } = require('perf_hooks');

const start = performance.now();
// Your function
const end = performance.now();
console.log(`Execution time: ${end - start} ms`);
```

#### 2. Using the V8 Profiler
```js
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

#### 3. Chrome DevTools
**node --inspect app.js**
- Open chrome://inspect
- Record “Performance” profile
- View flamechart of functions & async tasks

#### 4. Clinic.js Suite
```js
npx clinic doctor -- node app.js
npx clinic flame -- node app.js
npx clinic bubbleprof -- node app.js
```

### 5. Benchmarking
Use Benchmark.js <br>

```
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
suite.add('Loop', () => { for (let i = 0; i < 1e6; i++); })
  .on('complete', function() { console.log(this[0].toString()); })
  .run();
```

## 🔄 2. Event Loop Lag Analysis
### Monitor Event Loop Delay
```js
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay();
h.enable();
setInterval(() => {
  console.log(`Event loop delay: ${Math.round(h.mean / 1e6)} ms`);
}, 1000);
```
#### Interpretation
```
| Delay (ms) | Meaning                          |
| ---------- | -------------------------------- |
| `<10ms`    | Normal                           |
| `10–50ms`  | Some blocking                    |
| `>100ms`   | Heavy CPU-bound or sync I/O work |
```

## Memory Leak Detection
#### Common Causes

- Global variables retaining large data
- Unremoved event listeners
- Caches without limits
- Closures holding references
- Unresolved Promises
- Third-party library leaks

### Monitoring Memory Usage
```js
setInterval(() => {
  const mem = process.memoryUsage();
  console.table({
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  });
}, 5000);
```

### Heap Snapshot (Chrome DevTools)
Run Node with: <br>
```js
node --inspect app.js
```

Open chrome://inspect <br>
Take Heap Snapshot before and after load test <br>
Look for “Detached DOM Trees” or retained closures <br>


