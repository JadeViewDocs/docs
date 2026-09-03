---
title: JavaScript Execution Design
order: 2
group:
  title: "Core Concepts"
  order: 2
---

# JavaScript Execution Design

## 1. Important Notice: Current Limitations

### 1.1 Feature Status

**The current `execute_javascript` feature has a number of implementation issues and is not recommended for use at this time.** Due to technical limitations, executing JavaScript directly may lead to unpredictable behavior, including performance issues, security risks, and stability problems.

> How it works: `execute_javascript(window_id, script)` returns a **request id** (`int32_t`) immediately; the script's result is **not** returned by the function itself but is delivered asynchronously via the **`javascript-result` event** (whose `event_data` contains the matching request id and the result).

### 1.2 Recommended Alternatives

**We strongly recommend the following alternatives:**

1. **Preloaded JavaScript (preload_js)**: Inject a preload script when the WebView is initialized to enable communication between the main process and the renderer process.
2. **IPC Communication**: Use an event mechanism to enable interaction between the main process and the renderer process.

## 2. Design Recommendation: Prefer IPC Communication

### 2.1 Core Recommendation

**Prefer IPC communication** to enable interaction between the main process and the renderer process, and **avoid executing JavaScript directly to manipulate renderer process pages.**

### 2.2 IPC Communication vs. Direct JavaScript Execution

| Dimension | IPC Communication | Direct JavaScript Execution |
|------|----------|---------------------|
| Security | ✅ Well-defined interfaces, controllable permissions | ❌ Injection risk, excessive permissions |
| Performance | ✅ Asynchronous and efficient, event-driven | ❌ High overhead, may block rendering |
| Maintainability | ✅ Main process and renderer process are separated, easy to test | ❌ Logic is scattered, hard to manage |
| Debugging | ✅ Supports browser tools, complete logging | ❌ Difficult to locate errors |

### 2.3 Applicable Scenarios

| Requirement Type | Recommended Approach |
|----------|----------|
| UI updates | IPC events + renderer process handling |
| Data passing | IPC structured data |
| Function calls | IPC event triggering |
| State synchronization | IPC bidirectional events |
| Testing and debugging | Direct JS execution (exception) |
| One-off operations | Direct JS execution (exception) |

### 2.4 Best Practices

- Prefer designing IPC interfaces and clearly define the contract between the main process and the renderer process.
- Only use `execute_javascript` in special scenarios, and keep scripts simple.
- Avoid including complex logic in dynamic JS.
- Strictly validate inputs and outputs, and log executions.
