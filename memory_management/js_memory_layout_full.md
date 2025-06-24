
# 🧠 Process Virtual Memory Layout (High-Level)

```
    High Memory Addresses (Top of Virtual Memory)
    ┌──────────────────────────────┐
    │          Stack               │ ← Grows downward (local vars, function calls)
    │  (function calls, local vars)│
    ├──────────────────────────────┤
    │      Free / Unmapped Space   │ ← Can be used for growing stack or heap
    ├──────────────────────────────┤
    │           Heap               │ ← Grows upward (dynamic allocations: malloc, new)
    │     (e.g., dynamic objects)  │
    ├──────────────────────────────┤
    │      BSS Segment             │ ← Uninitialized global/static variables
    ├──────────────────────────────┤
    │      Data Segment            │ ← Initialized global/static variables
    ├──────────────────────────────┤
    │      Text Segment            │ ← Executable code (binary instructions)
    │       (Read-Only)            │
    └──────────────────────────────┘
    Low Memory Addresses (Bottom of Virtual Memory)
```

---

# 🔁 Virtual Memory to Physical RAM Mapping

Each block above is in **virtual memory** (used by each process independently). The **OS memory manager + MMU** maps these to **physical RAM** using **pages** (typically 4KB each):

```
Virtual Memory            Physical RAM (Shared Resource)
┌───────────────┐         ┌─────────────────────────────┐
│ Stack         │◄──────►│ Page Frame X                │
│               │         ├─────────────────────────────┤
│               │◄──────►│ Page Frame Y (Heap)         │
├───────────────┤         ├─────────────────────────────┤
│ Heap          │◄──────►│ Page Frame Z (Heap contd.)  │
├───────────────┤         ├─────────────────────────────┤
│ BSS           │◄──────►│ Page Frame A                │
├───────────────┤         ├─────────────────────────────┤
│ Data          │◄──────►│ Page Frame B                │
├───────────────┤         ├─────────────────────────────┤
│ Text          │◄──────►│ Page Frame C (Read-only)    │
└───────────────┘         └─────────────────────────────┘
```

> 🔑 Each process has its **own virtual memory space**, but physical memory is shared.

---

# 🧩 Components Summary

| Region      | Purpose                                   | Grows       | Location       |
|-------------|--------------------------------------------|-------------|----------------|
| Text        | Executable machine code                   | -           | Bottom         |
| Data        | Initialized global/static vars            | -           | Above Text     |
| BSS         | Uninitialized global/static vars          | -           | Above Data     |
| Heap        | Dynamic memory (`malloc`, `new`)          | Upward ↑    | Middle         |
| Free Space  | Reserved / Unmapped memory                | -           | Between Stack and Heap |
| Stack       | Function call frames, local vars          | Downward ↓  | Top            |

---

# 🖼 Example Snapshot (Addresses Hypothetical)

```
0xFFFF_FFFF      ┌──────────────────────────────┐
                 │           Stack              │
0xFFF0_0000      ├──────────────────────────────┤
                 │         (Free Space)         │
0xC000_0000      ├──────────────────────────────┤
                 │           Heap               │
0xA000_0000      ├──────────────────────────────┤
                 │        BSS Segment           │
0x9000_0000      ├──────────────────────────────┤
                 │        Data Segment          │
0x8000_0000      ├──────────────────────────────┤
                 │        Text Segment          │
0x4000_0000      └──────────────────────────────┘
```

---

# 💡 Extra Notes

- The **stack overflows** if it grows into the heap region.
- The **heap expands** via system calls like `brk()` or `mmap()`.
- **Free space** is just unallocated virtual memory.
- **Virtual Memory** → broken into **pages** (4 KB), managed by the OS and hardware MMU.
- **TLB (Translation Lookaside Buffer)** helps speed up the mapping process.

---

# 📌 1. Variables and Primitives

```js
let hung = "hung";
let z = "hung";
```

### What Happens in Memory?

- `"hung"` is a **primitive string**, stored in memory (in the heap or intern pool).
- Both `hung` and `z` store **references (or pointers)** to the **same immutable string value** in memory.

```
Memory:
[0xABC123]: "hung"

Variables:
hung ──► 0xABC123
  z  ──► 0xABC123
```

### Now mutate `z`:

```js
z = "hih";
```

```
Memory:
[0xABC123]: "hung"
[0xDEF456]: "hih"

Variables:
hung ──► 0xABC123
  z  ──► 0xDEF456
```

---

# 📌 2. Variables and Objects (References)

```js
let a = { name: "hung" };
let b = a;
```

```
Heap:
[0x777AAA]: { name: "hung" }

Variables:
a ──► 0x777AAA
b ──► 0x777AAA
```

### Mutate via `b`:

```js
b.name = "z";
```

```
Heap:
[0x777AAA]: { name: "z" }

Variables:
a ──► 0x777AAA
b ──► 0x777AAA
```

### Reassign:

```js
b = { name: "new" };
```

```
Heap:
[0x777AAA]: { name: "z" }
[0x888BBB]: { name: "new" }

Variables:
a ──► 0x777AAA
b ──► 0x888BBB
```

---

# 📌 3. Summary: Primitive vs Reference

| Feature                  | Primitives (`string`, `number`, etc) | Objects / Arrays / Functions |
|--------------------------|---------------------------------------|-------------------------------|
| Stored in                | Stack (pointer to immutable in heap)  | Heap                          |
| Assignment copies        | The **value**                         | The **reference (address)**   |
| Mutation affects         | Only the variable                     | All variables pointing to it  |
| Reassignment             | Creates new value                     | Can point to new object       |

---

# 📌 4. Spread Operator (`...`) — Behavior & Memory

### A. Spread on Objects (Shallow Copy)

```js
let a = { name: "hung" };
let b = { ...a };
b.name = "z";
```

```
Heap:
[0x111AAA]: { name: "hung" } ← a
[0x222BBB]: { name: "z" }    ← b

Variables:
a ──► 0x111AAA
b ──► 0x222BBB
```

### B. Spread on Nested Objects

```js
let a = { name: "hung", info: { age: 25 } };
let b = { ...a };
b.info.age = 30;
```

```
Heap:
[0x111AAA]: { name: "hung", info: 0x333CCC }  ← a
[0x222BBB]: { name: "hung", info: 0x333CCC }  ← b
[0x333CCC]: { age: 30 }                       ← shared nested object

Variables:
a ──► 0x111AAA
b ──► 0x222BBB
```

---

# 📦 5. Stack vs Heap Visual Memory Diagram

```
🧠 Memory Overview (JS Runtime)

Stack (Fast, Stores Primitives & Pointers):
────────────────────────────────────────────
| var a       | 0x111AAA (→ heap object)     |
| var b       | 0x222BBB (→ heap object)     |
| var z       | 0xDEF456 (→ "hih")           |
| var hung    | 0xABC123 (→ "hung")          |
────────────────────────────────────────────

Heap (Big, Slower, Stores Actual Objects):
────────────────────────────────────────────
| 0x111AAA    | { name: "hung", info: ─┐ }   |
| 0x222BBB    | { name: "hung", info: ─┘ }   |
| 0x333CCC    | { age: 30 }                  |
| 0xABC123    | "hung" (immutable string)    |
| 0xDEF456    | "hih" (immutable string)     |
────────────────────────────────────────────

📌 Legend:
- Stack: Stores variable names + addresses (pointers or primitives).
- Heap: Stores actual objects, arrays, functions, and strings.
- Spread (`...`) creates a new top-level object, but **shares nested references** unless deep cloned.
```

---

# 🧠 Extra: Deep Clone vs Shallow Clone

- `...obj` — **shallow copy**.
- `JSON.parse(JSON.stringify(obj))` — deep clone (but can't handle functions or undefined).
- For deep clone of complex objects → use `structuredClone()` or libraries like Lodash.
