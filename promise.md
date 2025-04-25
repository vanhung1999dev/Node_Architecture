# What is Promise

- A Promise in JavaScript is an object that represents the eventual completion (or failure) of an asynchronous operation and its resulting value

## The Lifecycle of a Promise:

- Pending: The initial state, where the asynchronous operation is still running.
- Resolved (Fulfilled): The state when the asynchronous operation completes successfully.
- Rejected: The state when the asynchronous operation fails.

```js
const promise = new Promise((resolve, reject) => {
  // Asynchronous operation
  if (operationSuccess) {
    resolve("Success!"); // Settles the promise to the resolved state
  } else {
    reject("Failure!"); // Settles the promise to the rejected state
  }
});
```

## Microtasks and the Event Loop:

- When a Promise is resolved or rejected, **it doesn’t immediately execute the then() or catch() methods**. Instead, it **schedules the execution of those handlers in the microtask queue (a queue for small tasks that should be executed after the currently executing script, but before rendering and other tasks)**.

## Promise Internals:

A Promise object typically contains the following: <br>

- **State**: Stores the current state (pending, fulfilled, rejected).
- **Result**: Stores the resolved value or the rejection reason.
- **Handlers**: Arrays for .then() and .catch() callbacks that are queued to execute once the Promise settles.

## Promise Resolution and Chaining:

- When a Promise is resolved, it triggers the .then() method on it, and when rejected, it triggers .catch(). These methods return new Promises, which allows chaining:

```js
promise
  .then((value) => {
    console.log(value); // "Success!"
    return "Next step"; // Returns a new Promise (or value)
  })
  .then((nextValue) => {
    console.log(nextValue); // "Next step"
  })
  .catch((error) => {
    console.error(error); // Handles errors from any previous promise
  });
```

- Create a new Promise and attach the provided handlers (callbacks) to it.
- The handlers are invoked when the original Promise is settled.
- If the handler returns a value (non-Promise), it’s automatically wrapped in a resolved Promise.
- If the handler throws an error, the returned Promise is rejected.

```js
Promise.resolve(1)
  .then((val) => {
    console.log("Step 1:", val);
    return val + 1;
  })
  .then((val) => {
    console.log("Step 2:", val);
    return new Promise((resolve) => setTimeout(() => resolve(val + 1), 100));
  })
  .then((val) => {
    console.log("Step 3:", val);
  });
```

### 🔍 What happens under the hood?

#### Step 1: Promise.resolve(1)

- Creates a resolved Promise with value 1.

#### 🔸 Step 2: .then(callback)

When you call .then() on a Promise: <br>

- A new Promise is created and returned.
- The callback you pass is registered to run when the original Promise is fulfilled.
- That callback is scheduled into the microtask queue. <br>

```js
const p2 = p1.then(fn);
```

Is functionally: <br>

```js
const p2 = new Promise((resolve, reject) => {
  // When p1 settles...
  p1.onFulfilled = (val) => {
    try {
      const result = fn(val); // run your .then callback
      resolve(result); // resolve p2 with the return value
    } catch (err) {
      reject(err); // reject p2 if error happens
    }
  };
});
```

- So each .then() returns a new Promise linked to the previous one.

#### 💡 Important Internals:

- If fn() returns a value → the next Promise is resolved with that value.
- If fn() returns a Promise → the next Promise "follows" it — it waits for that inner Promise to resolve.
- If fn() throws an error → the next Promise is rejected.

### 🔄 Visual Model of the Chain:

```js
Promise.resolve(1)
  .then((val) => {
    // creates promise P1
    return val + 1; // resolves P2
  })
  .then((val) => {
    // creates promise P2
    return new Promise((res) => setTimeout(() => res(val + 1), 100)); // async op
  })
  .then((val) => {
    // creates promise P3
    console.log(val); // outputs 3
  });
```

⏳ Behind the scenes: <br>

- Each .then() returns a new Promise.
- Each new Promise has its own microtask.
- If a .then() returns a Promise, it waits for that inner Promise to resolve.

### ⚠️ Common Mistake — Not Returning in Chain

```js
Promise.resolve(1)
  .then((val) => {
    console.log("step 1");
    new Promise((resolve) => setTimeout(() => resolve(val + 1), 100));
  })
  .then((val) => {
    console.log("step 2", val); // val is undefined!
  });
```

Why? Because we didn’t return the inner Promise, so the chain doesn’t wait! <br>
✅ Fix: <br>

```js
.then((val) => {
  return new Promise((resolve) => setTimeout(() => resolve(val + 1), 100));
})

```
