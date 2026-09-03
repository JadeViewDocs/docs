---
order: 1
group:
  title: "Overview"
  order: 0
---

# Performance

## Performance Characteristics

### Startup Performance

JadeView adopts a lightweight architectural design, taking only **16 milliseconds** for the complete flow from project startup to window display. This number was measured in the EPL (易语言) environment,

> The complete flow below:

1. Project startup
2. JadeView initialization
3. Create WebView window
4. Window successfully displayed

Complete startup flow time: 300 milliseconds

> The complete flow below:

1. Project startup
2. JadeView initialization
3. Create WebView window
4. Window successfully displayed
5. Load HTML content

#### Comparison with Other Frameworks

> None of the startup flows below include the `Load HTML content` time:

> | Framework | Complete Startup Flow Time | Startup Flow | Architecture | Advantages |
> |------|----------------|----------|------|------|
> | JadeView | 16 ms | Project startup → Initialization → Create window → Display window | Rust + wry | Extremely fast startup, high performance, memory safety, thread safety, fast build |
> | Electron 23 | 1400 ms | Project startup → Load Chromium → Load Node.js → Initialization → Create window → Display window | Chromium + Node.js | Complete ecosystem, cross-platform |
> | NW.js 0.70 | 850 ms | Project startup → Load Chromium → Initialization → Create window → Display window | Chromium + Node.js | Directly loads the renderer process, simple development |
> | CEF/CefSharp | Hundreds of ms | Project startup → Load Chromium → Initialization → Create window → Display window | Chromium | High performance, widely used |

#### Reasons for Performance Advantages

1. **Lightweight architecture**: JadeView is built on Rust and the wry library, without a full Node.js runtime
2. **On-demand loading**: Loads only the necessary components, avoiding unnecessary resource consumption
3. **Efficient initialization flow**: An asynchronous initialization design that avoids blocking the main thread
4. **Optimized window creation**: Uses the native window system, reducing intermediate-layer overhead

### Memory Safety

JadeView is developed in Rust and inherits Rust's memory safety characteristics:

1. **Ownership model**: Rust's ownership system ensures memory safety, avoiding memory leaks and dangling pointers
2. **Safe string conversion**: Uses the `CStr::from_ptr` and `CString::new` methods for string conversion
3. **Automatic memory deallocation**: All allocated memory is automatically released at the appropriate time
4. **No direct malloc/free calls**: The API does not directly use `malloc` and `free` internally, reducing the risk of memory leaks
5. **Strict lifetime control**: The lifetime of objects is strictly controlled while callback functions execute

### Thread Safety

All of JadeView's API functions are thread-safe:

1. **Mutex protection**: All global state access is protected by mutexes
2. **No shared mutable state**: The design avoids shared mutable state
3. **Thread-safe callback mechanism**: The execution environment of callback functions is thread-safe
4. **Safe resource access**: Resource access undergoes strict thread-safety checks

### Asynchronous Architecture

JadeView adopts an asynchronous design architecture:

1. **Asynchronous initialization**: The initialization process is non-blocking, allowing the application to perform other operations during initialization
2. **Asynchronous window creation**: The `create_webview_window` function returns the window ID immediately, while the window is actually created asynchronously on the event loop thread
3. **Event-driven design**: Various window events and IPC messages are handled through an event callback mechanism
4. **Efficient event loop**: Based on Rust's efficient event loop implementation

## IPC Communication Performance

JadeView 2.4 redesigns the Windows large-message path used by `send_ipc_message`. Messages smaller than 1 MiB prefer WebView2 `PostWebMessageAsString`; messages greater than or equal to 1 MiB prefer SharedBuffer. If SharedBuffer is unavailable, JadeView can still fall back to the `bulk_ref` chunk-fetch path. The renderer continues to receive messages through [`jade.on`](/docs/api/javascript-api), so the public application interface is unchanged.

### Python Benchmark Disclosure

:::info{title="The results on this page were measured with a Python test program"}
This is not an internal Rust microbenchmark and was not measured with a C/C++ sample host. The benchmark host uses **Python 3.11**, loads `JadeView_x64.dll` through `ctypes.WinDLL`, and creates **eight Python sender threads** with `ThreadPoolExecutor` to call `send_ipc_message` concurrently.

`ctypes` releases the Python GIL while executing the foreign function, so all eight threads can enter the DLL concurrently. The reported results include Python scheduling, FFI calls, the JadeView message queue, WebView2 transport, and complete renderer-side delivery.
:::

The renderer displays only the number of received packets and subscribes with `jade.on('perfTick', handler)`. Each callback validates that the payload:

- is a string;
- is exactly 1,048,576 bytes long;
- is counted only after the complete data reaches the renderer.

For 2.3.2, a `bulk_ref` is counted only after all chunks have been fetched and reassembled. For 2.4, a SharedBuffer packet is counted only after the renderer reads and decodes the complete payload. The benchmark does not count host submissions or reference delivery as completed packets.

### Test Environment and Parameters

| Item | Configuration |
| --- | --- |
| Operating system | Windows 11 Pro for Workstations, Build 26200 |
| CPU | Intel Core i5-14600KF, 14 cores / 20 logical processors |
| Memory | 31.84 GiB |
| WebView2 Runtime | 148.0.3967.96 |
| Python | 3.11 |
| Resource sampling | `psutil 7.2.2`, Python host plus WebView2 child processes |
| Packet size | 1 MiB, or 1,048,576 bytes |
| Sender threads | Eight Python threads |
| Packets per run | 20,000, or 19.53125 GiB |
| Maximum in flight | 128 packets, preventing an unbounded queue from accumulating about 20 GiB and causing system OOM |
| Warm-up | 256 packets before each formal run |
| Formal runs | Three per version, executed in an interleaved order |

Each version transferred 58.59375 GiB during the formal runs, for a combined total of 117.1875 GiB. The table below uses the median of three runs.

### Measured 2.4 vs. 2.3.2 Results

| Metric | 2.3.2 | 2.4.0 | 2.4 change |
| --- | ---: | ---: | ---: |
| Complete renderer receive throughput | 315.305 packets/s | 1255.185 packets/s | **298.086% higher** |
| Renderer data throughput | 0.307915 GiB/s | 1.225767 GiB/s | **298.086% higher** |
| End-to-end elapsed time | 63.430612 s | 15.934096 s | 74.879% lower |
| Python host send time | 63.162501 s | 15.881942 s | 74.855% lower |
| Renderer drain time | 0.268111 s | 0.130052 s | 51.493% lower |
| Python `ctypes` call P50 | 1.365400 ms | 1.201400 ms | 12.011% lower |
| Python `ctypes` call P95 | 1.737005 ms | 1.652305 ms | 4.876% lower |
| Python `ctypes` call P99 | 2.495606 ms | 1.922835 ms | 22.951% lower |
| Process-tree average CPU | 463.960% | 371.130% | 20.008% lower |
| Peak private memory | 1220.32 MiB | 269.23 MiB | **77.938% lower** |
| Peak handle count | 3417 | 3317 | 2.927% lower |

Based on complete renderer receive throughput, JadeView 2.4 is approximately **3.981x** as fast as 2.3.2 in this workload.

CPU percentages are summed across the Python host and WebView2 child processes. `100%` is approximately one fully utilized logical processor.

### Stability and Data Integrity

| Check | 2.3.2 | 2.4.0 |
| --- | ---: | ---: |
| Formal runs completed | 3/3 | 3/3 |
| Sent by the Python host | 60,000 | 60,000 |
| Completely received by the renderer | 60,000 | 60,000 |
| Invalid type/length packets | 0 | 0 |
| Lost packets | 0 | 0 |
| Packet loss rate | 0% | 0% |
| `send_ipc_message` return failures | 0 | 0 |
| Python/FFI exceptions | 0 | 0 |
| Timeouts | 0 | 0 |
| Crashes | 0 | 0 |
| JadeView log ERROR/WARN | 0/0 | 0/0 |

### Memory Accounting

The summed process-tree RSS is higher with 2.4 because the same SharedBuffer pages can be mapped into both the Python host and WebView2 processes. Summing per-process RSS double-counts those shared pages and must not be interpreted as 2.4 privately owning all of that memory.

Peak private memory is the more relevant measurement for exclusive commit pressure. Its median fell from 1220.32 MiB to 269.23 MiB, a **77.938% reduction**.

### Scope of the Results

- These results apply to host-to-renderer `send_ipc_message` traffic with 1 MiB UTF-8 payloads.
- Python `ctypes` call latency includes Python thread scheduling and FFI overhead; it is not a pure C or Rust microbenchmark.
- Actual performance depends on the CPU, memory, WebView2 Runtime, message size, renderer work, and maximum in-flight count.
- Small messages, `jade.invoke` request/response traffic, Linux WebKitGTK, and unthrottled burst sending require separate benchmarks.

### Suitable Workloads

The 2.4 SharedBuffer path is particularly useful for large host-to-renderer messages such as:

- model context, batched state, and large text synchronization;
- real-time monitoring and high-frequency data pushes;
- bulk processing results;
- multi-window applications that need lower private-memory pressure.

See [IPC Communication API](/docs/api/ipc-api) for interface definitions, threading rules, and return-value semantics.

## `jade.invoke` Small-Request/Large-Response Performance

This benchmark models a more typical application request/response flow: the renderer sends only a small notification string, the Rust host returns a large result, and the renderer waits for the Promise and validates the complete response.

### Rust Benchmark Disclosure

:::info{title="This section uses a Rust benchmark host, not a Python host"}
The benchmark host is written in **Rust 1.96.0**. It loads `JadeView_x64.dll` through `libloading`, registers a `benchLarge` handler with `register_ipc_handler`, and returns a 1 MiB string through `jade_text_create`.

Resource sampling also runs inside the Rust benchmark process and uses Windows process APIs to measure the Rust host and WebView2 child processes. PowerShell only starts isolated runs and aggregates JSON; it is not part of the measured process tree and is not included in CPU or memory figures.
:::

Each request follows this complete path:

1. The renderer calls `jade.invoke('benchLarge', 'notify')`.
2. The upstream payload is the six-byte string `notify`.
3. JadeView calls the Rust `register_ipc_handler` callback.
4. Rust returns a 1 MiB ASCII `x` string through `jade_text_create`.
5. JadeView wraps the result as an `invoke-async-response`.
6. Version 2.3.2 fetches and rebuilds a `bulk_ref`; version 2.4 uses WebView2 SharedBuffer.
7. After the Promise resolves, the renderer validates the type and exact 1,048,576-byte length before counting the response.

### Response-Time Definition

The renderer records response time with `performance.now()`:

```js
const started = performance.now();
const result = await jade.invoke('benchLarge', 'notify');
const responseMs = performance.now() - started;
```

Timing starts when the renderer calls `jade.invoke` and ends when the Promise returns the complete 1 MiB result. It includes:

- renderer request encoding and custom-protocol dispatch;
- JadeView request parsing and thread scheduling;
- Rust callback execution plus 1 MiB allocation and copying;
- JadeView JSON result wrapping;
- `bulk_ref` or SharedBuffer delivery;
- renderer reading, decoding, request-ID matching, and full-length validation.

The P50/P95/P99 values therefore represent application-visible end-to-end response time, not the execution time of a single C API function.

### Test Parameters

| Item | Configuration |
| --- | --- |
| Rust | 1.96.0, release-optimized build |
| Request | `jade.invoke('benchLarge', 'notify')` |
| Upstream payload | Six-byte `notify` string |
| Downstream result | 1 MiB string, or 1,048,576 bytes |
| Renderer concurrency | Eight concurrent Promises; each worker sends its next request after completion |
| Requests per run | 20,000, returning 19.53125 GiB |
| Warm-up | 256 requests before each formal run |
| Formal runs | Three per version, executed in an interleaved order |
| Resource sampling | Rust-native Windows process-tree sampling every 100 ms |
| Environment | The same machine used by the Python push benchmark above |

Each version returned 58.59375 GiB during formal runs, for a combined 117.1875 GiB. The following figures use the median of three runs.

### Rust Request/Response Results

| Metric | 2.3.2 | 2.4.0 | 2.4 change |
| --- | ---: | ---: | ---: |
| Complete renderer response throughput | 167.406 responses/s | 731.237 responses/s | **336.805% higher** |
| Effective renderer data throughput | 0.163483 GiB/s | 0.714099 GiB/s | **336.803% higher** |
| Time for 20,000 responses | 119.4697 s | 27.3509 s | 77.106% lower |
| Mean response time | 47.773130 ms | 10.934035 ms | 77.113% lower |
| Response P50 | 47.600 ms | 10.400 ms | **78.151% lower** |
| Response P95 | 57.700 ms | 16.400 ms | 71.577% lower |
| Response P99 | 61.900 ms | 21.100 ms | 65.913% lower |
| Maximum response time | 77.600 ms | 51.300 ms | 33.892% lower |
| Process-tree average CPU | 370.770% | 526.470% | 41.994% higher |
| CPU core-seconds for the fixed workload | 444.688 | 144.154 | **67.583% lower** |
| Peak RSS | 644.85 MiB | 811.13 MiB | 25.786% higher |
| Peak private memory | 456.45 MiB | 523.51 MiB | 14.692% higher |
| Peak handle count | 3548 | 3102 | 12.570% lower |

Based on complete renderer response throughput, 2.4 is approximately **4.368x** as fast as 2.3.2 in this Rust small-request/large-response workload.

### CPU and Memory Interpretation

2.4 has higher instantaneous average CPU because it completes about 4.37 times as many requests in the same period. For the fixed 20,000-request workload:

- 2.3.2 uses a median of 444.688 CPU core-seconds;
- 2.4 uses a median of 144.154 CPU core-seconds;
- total CPU work for the same result is 67.583% lower with 2.4.

In this `jade.invoke` workload, 2.4 has higher peak RSS and private memory than 2.3.2. This path combines Rust `jade_text_create` allocation, JadeView string copying, JSON wrapping, and SharedBuffer mapping. The private-memory reduction measured by the Python one-way push benchmark must not be applied to this request/large-response workload.

This demonstrates why different IPC usage patterns require separate benchmarks: one-way pushes and request/large-response traffic have different allocation lifetimes and concurrency models.

### Stability and Integrity

| Check | 2.3.2 | 2.4.0 |
| --- | ---: | ---: |
| Formal runs completed | 3/3 | 3/3 |
| Rust callback requests | 60,000 | 60,000 |
| Complete renderer responses | 60,000 | 60,000 |
| Non-`notify` requests | 0 | 0 |
| Invalid response type/length | 0 | 0 |
| `jade.invoke` exceptions | 0 | 0 |
| Lost responses | 0 | 0 |
| Loss rate | 0% | 0% |
| Rust/FFI exceptions | 0 | 0 |
| Crashes | 0 | 0 |
| Clean process exits | 3/3 | 3/3 |
| Windows Application Error/WER | 0 | 0 |

### Difference from the Python One-Way Push Benchmark

- Python benchmark: the host calls `send_ipc_message` and the renderer passively receives data, with up to 128 packets in flight.
- Rust benchmark: the renderer calls `jade.invoke`, the Rust callback returns the large result, and exactly eight requests remain concurrent.
- The Rust benchmark additionally includes the upstream request, callback allocation, JSON result wrapping, and Promise request-ID matching.

The absolute throughput figures from the two benchmarks should not be directly compared because they answer different questions. Both show a substantial 2.4 SharedBuffer advantage over the 2.3.2 `bulk_ref` path for large messages.

## Design Philosophy

### Simple and Easy to Use

JadeView's API design emphasizes simplicity and ease of use:

1. **Intuitive function naming**: Function names clearly reflect their functionality
2. **Reasonable parameter design**: The number and types of parameters are designed reasonably, making them easy to understand and use
3. **Complete documentation**: Provides detailed API documentation and usage examples
4. **Good error handling**: Provides clear error messages and error-handling mechanisms

### Cross-Platform Compatibility

JadeView currently supports the **Windows and Linux** platforms (macOS is not yet supported), and its design also takes cross-platform compatibility into account:

1. **Abstract window interface**: An abstract window interface is designed to make it easy to add support for other platforms
2. **Standardized API**: The API design follows cross-platform standards
3. **Modular design**: Core functionality is separated from platform-specific code

### Security First

Security is a core principle of JadeView's design:

1. **Rust language safety features**: Leverages Rust's type system and ownership model to ensure safety
2. **Strict input validation**: All API inputs undergo strict validation
3. **Secure IPC mechanism**: IPC communication is designed with security in mind, avoiding security vulnerabilities
4. **Principle of least privilege**: Follows the principle of least privilege to reduce potential security risks

## Technology Stack

JadeView uses a modern technology stack:

- **Rust**: The core development language, providing memory safety and high performance
- **wry**: The WebView library; JadeView is based on WebView2 (Windows) and WebKitGTK (Linux); macOS is not currently supported
- **tao**: The window management library, providing cross-platform window management and the event loop
- **serde**: The serialization/deserialization library, used for data transfer
- **crossbeam-channel**: Inter-thread message channels; JadeView does not depend on tokio — its asynchronous behavior is built on the tao event loop + crossbeam-channel

## Architecture Design

JadeView adopts a layered architecture design:

1. **Core layer**: Contains memory management, the event loop, and basic functionality
2. **API layer**: Provides a C-compatible API interface
3. **SDK layer**: Provides SDK wrappers for different languages (such as EPL/易语言)
4. **Application layer**: User applications

This layered design gives JadeView good extensibility and maintainability, making it easy to add new platform support and features.

## Future Development

Through continuous optimization and improvement, JadeView will continue to maintain its characteristics of high performance, high security, and ease of use, providing developers with a better WebView window library solution.
