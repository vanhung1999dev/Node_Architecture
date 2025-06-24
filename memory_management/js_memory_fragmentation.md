# 🧠 Core Idea: All Objects Are Rooted in a Tree of References

### 📌 Assumption:

> "All objects are rooted" — ✅ Correct!

- In JavaScript (and other GC languages), memory management is based on **reachability**.
- The **garbage collector (GC)** starts from a set of **root objects**:
  - Global scope (`window`, `globalThis`)
  - Local variables in the current stack frames
  - Closures and function contexts

From these **roots**, it follows all references to build a graph.

---

## 🧵 Reachability Tree (Simplified)

```
Global → user
           └── profile
               └── avatar
                   └── url
```

Any object not connected to this tree is **unreachable** → will be **garbage collected**.

---

## 📉 When Memory Becomes Unreachable

```js
let user = {
  name: "Hung",
  address: {
    city: "Hanoi"
  }
};

user = null;
```

Now:

- `user` reference is removed
- GC checks: is `address` still reachable from any root?
- ❌ No → GC will **reclaim** both `user` and `address`

---

## 📦 Visualization via Array (Reference Graph)

Let’s say:

```js
let arr = [
  { id: 1, name: "A" },         // [0]
  { id: 2, name: "B" },         // [1]
  { id: 3, next: null },        // [2]
];

arr[2].next = arr[0]; // [2] → [0]
arr[0].friend = arr[1]; // [0] → [1]
```

### Reachability Graph:

```
root → arr → [2] ── next ──► [0] ── friend ──► [1]
```

Now:

```js
arr = null;
```

### After this:

- No reference from any root
- [2], [0], [1] all become **unreachable**
- GC can reclaim them

---

## 💨 Detailed Explanation of Memory Fragmentation

### 🔹 Problem:

Memory fragmentation occurs when memory is available but **not in one piece**. This prevents large object allocations even when there is enough total space.

---

## 📏 Fragmentation Analogy: Bookshelf

```
Initial:
[📕][📕][📕][📘][📘][📗][📕][📘][📗][📕]   ← Full

Remove:
→ 📘 at slot 3 and 4
→ 📗 at slot 5 and 8

Now:
[📕][📕][📕][   ][   ][   ][📕][   ][📗][📕]
             ↑   ↑   ↑        ↑

Want to insert wide book (3 slots)? ❌ No space!
```

---

## 🧰 Fragmented Heap Layout Example

### Step 1:

```js
let a = { id: 1 }; // A
let b = { id: 2 }; // B
let c = { id: 3 }; // C
let d = { id: 4 }; // D
```

### Step 2:

```js
a = null;
c = null;
```

### Heap Before GC:

```
[ A ][ B ][ C ][ D ]
```

### Heap After GC:

```
[ . ][ B ][ . ][ D ]
```

- You have 2 free blocks, but not adjacent
- Large allocations fail → ❌ Fragmented

---

## 🔁 Types of Fragmentation

| Type              | Meaning                                           |
| ----------------- | ------------------------------------------------- |
| **External**      | Free blocks are scattered                         |
| **Internal**      | Allocated block is bigger than needed             |
| **Shallow Frag.** | Small leaks or nested shared refs prevent freeing |
| **Deep Frag.**    | Memory is mostly dead but too split up            |

---

## 🧹 How GC Fixes It: Compaction

### GC Compaction Phase:

- Moves live objects together
- Updates all references

### After Compaction:

```
[ B ][ D ][   ][   ]
```

✅ Free space now usable for big allocations

---

## 🧭 Fragmentation by Shared Reference

```js
let obj = {
  items: new Array(10000).fill({ val: "hang" })
};

let shared = obj.items[0];
obj = null;
```

- `shared` keeps the `{ val: "hang" }` alive
- Other items are GCed, but heap is fragmented

---

## 🧠 Final Visualization: Fragmented vs Compacted

### Fragmented Heap:

```
[   ][Obj1][   ][Obj2][   ][Obj3][   ][Obj4]
```

### Compacted Heap:

```
[Obj1][Obj2][Obj3][Obj4][   ][   ][   ][   ]
```

---

## ✅ Summary

| Term              | Description                          |
| ----------------- | ------------------------------------ |
| **GC Roots**      | Stack, global vars, closures         |
| **Unreachable**   | No path from root — eligible for GC  |
| **Fragmentation** | Free memory too split to reuse       |
| **Shallow leak**  | Nested object keeps large tree alive |
| **Compaction**    | Moves memory to avoid fragmentation  |

