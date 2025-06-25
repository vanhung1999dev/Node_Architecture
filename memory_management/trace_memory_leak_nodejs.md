# 🔍 Tracing Memory Leaks in Node.js

## ♻️ 1. Understand the Symptoms

Memory leaks often show up as:
- Memory usage (RSS or heap) keeps increasing
- Crashes with `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`
- Latency or performance degradation

---

## 📈 2. Monitor Memory Usage Over Time

### A. Log Memory Usage
```js
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: (usage.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
  });
}, 10000);
```
> If `heapUsed` keeps growing with no GC reclaiming it, there may be a leak.

---

## 📊 3. Take Heap Snapshots

### A. Manual (Dev Tools)
1. Start with:
```bash
node --inspect yourApp.js
```
2. Open Chrome:
```
chrome://inspect
```
3. Go to **Memory** tab → Take heap snapshots → Compare growth

### B. Automated (heapdump)
```bash
npm install heapdump
```
```js
const heapdump = require('heapdump');
setInterval(() => {
  heapdump.writeSnapshot(`./heap-${Date.now()}.heapsnapshot`);
}, 60000);
```
> Open `.heapsnapshot` in Chrome DevTools → Memory tab.

---

## 🔎 4. Use `clinic.js` for Visualization

```bash
npm install -g clinic
clinic doctor -- node yourApp.js
```
Generates an HTML report with memory/GC/event loop metrics.

---

## 👀 5. Analyze in DevTools

- Load `.heapsnapshot` into Chrome
- Use **Comparison View** to find growing retained objects
- Watch for:
  - Detached DOM trees (in web apps)
  - Closures
  - Listeners not removed
  - Large Maps/Sets/Caches

---

## 🧪 6. Common Memory Leak Patterns

| Pattern              | Cause                                 |
|---------------------|----------------------------------------|
| Global variables     | Never collected                        |
| Closures             | Hold context too long                  |
| Event listeners      | Not removed                            |
| Caches               | Unlimited growth                       |
| Timers               | Not cleared                            |
| Queues               | Not drained                            |
| Third-party modules  | Internal state held too long           |

---

## 🌀 7. Use `memwatch-next` to Detect Leaks

```bash
npm install memwatch-next
```
```js
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
});

memwatch.on('stats', (stats) => {
  console.log('Memory stats:', stats);
});
```

---

## 🛠️ 8. Tools Summary

| Tool              | Purpose                               |
|------------------|----------------------------------------|
| `memoryUsage()`  | Quick memory overview                  |
| DevTools         | Snapshot inspection                    |
| `heapdump`       | Snapshot saving                        |
| `clinic.js`      | Full diagnostics                       |
| `memwatch-next`  | Runtime leak detection                 |

---

## 👣 9. Strategy in Practice

1. Start with `--inspect`
2. Reproduce memory growth
3. Take multiple snapshots
4. Use comparison view
5. Investigate large retained sets
6. Fix leak
7. Retest

---

## 🧪 Real Leak Example

```js
const EventEmitter = require('events');
const emitter = new EventEmitter();

function createLeak() {
  const big = new Array(1e6).fill('*');
  emitter.on('leak', () => console.log(big.length));
}

setInterval(() => {
  createLeak();
  emitter.emit('leak');
}, 1000);
```

### ❌ Memory Keeps Growing
### ✅ Fix: Remove listeners
```js
emitter.removeAllListeners('leak');
```

---

## ✅ Final Checklist

- [ ] Reproduce leak scenario
- [ ] Record multiple snapshots
- [ ] Compare retained objects
- [ ] Identify closure/listener/caching issues
- [ ] Apply fix and verify

