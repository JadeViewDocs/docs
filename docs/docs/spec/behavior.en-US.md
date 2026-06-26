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

JadeView uses a custom protocol to implement IPC communication between the main process and the renderer process, featuring **low latency, high throughput, and good asynchronous support**.

### Design Philosophy

JadeView adopts a custom-protocol communication architecture based on modern Web standards, aiming to provide an efficient, secure, and easy-to-use way for the main process and renderer process to interact. This design combines the low-latency advantages of traditional IPC mechanisms with the ease of use of Web APIs, while avoiding complex message-passing mechanisms.

### Core Architecture

1. **Custom protocol layer**
   - Built on the browser-standard Fetch API
   - Leverages a local communication channel for low-latency data transfer
   - Supports an asynchronous request-response pattern
   - Supports event-driven message pushing

2. **Request handling mechanism**
   - The renderer process initiates requests through a standardized API
   - The main process efficiently handles requests and returns results
   - Automatically handles serialization and deserialization
   - Supports transferring multiple data types

3. **Event system**
   - Designed around the publish-subscribe pattern
   - Supports concurrent subscription to multiple events
   - Automatically manages event lifetimes
   - Efficient event dispatch mechanism

### Performance Metrics

| Metric | Value | Description |
|---------|------|------|
| Round-trip latency | `<1ms` | Round-trip latency of communication between the main process and renderer process, based on actual test data |
| Concurrent requests | `>800 requests/second` | The number of supported high-concurrency requests |
| CPU consumption reduction | `30%-50%` | Compared with traditional IPC solutions |
| Memory usage reduction | `20%-40%` | Compared with traditional IPC solutions |

### Performance Advantages

- **Low-latency design**: Optimized communication path, reducing intermediate-layer overhead
- **High throughput**: Supports handling a large number of concurrent requests
- **Resource-efficient**: Uses a connection-reuse mechanism, reducing system resource consumption
- **Asynchronous and non-blocking**: Fully designed around Promise/async-await, avoiding UI blocking

### Security Considerations

- Strict local communication restrictions to prevent external access
- A standardized request validation mechanism
- A secure data transfer channel
- A protection mechanism to prevent malicious requests

### Comparison with Other Frameworks

| Framework | IPC Latency | Concurrency Capacity | Architectural Characteristics |
|------|---------|-------------|----------|
| JadeView | `<1ms` | `>800 requests/second` | Custom protocol + Rust implementation |
| Electron 23 | `10-50ms` | `~100 requests/second` | Chromium + Node.js IPC |
| NW.js 0.70 | `8-40ms` | `~150 requests/second` | Chromium + Node.js IPC |
| CEF/CefSharp | `5-30ms` | `~200 requests/second` | Chromium IPC |

### Comparison with Traditional IPC

| Feature | JadeView Communication Mechanism | Traditional IPC Mechanism |
|------|------------------|---------------|
| Ease of use | Based on Web standards, low learning cost | Usually requires specific APIs, with a steeper learning curve |
| Performance | Low latency (`<1ms` round trip) | Latency depends on the implementation, usually higher |
| Compatibility | Based on modern browser features, good compatibility | May depend on a specific runtime environment |
| Extensibility | Easy to add new commands and events | Extending may require modifying the underlying implementation |
| Debugging convenience | Supports debugging with browser DevTools | Debugging tools are limited |

### Use Cases

JadeView's high-performance IPC communication is suitable for the following scenarios:

- **Real-time data transfer**: such as real-time monitoring, game data synchronization, etc.
- **High-frequency interaction**: such as UI control events, state synchronization, etc.
- **Large data transfer**: such as file upload/download, batch data processing, etc.
- **Low-latency requirements**: such as audio/video processing, real-time communication, etc.

JadeView's IPC design emphasizes a balance between performance and ease of use, providing developers with an efficient and reliable communication solution between the main process and the renderer process.

## Design Philosophy

### Simple and Easy to Use

JadeView's API design emphasizes simplicity and ease of use:

1. **Intuitive function naming**: Function names clearly reflect their functionality
2. **Reasonable parameter design**: The number and types of parameters are designed reasonably, making them easy to understand and use
3. **Complete documentation**: Provides detailed API documentation and usage examples
4. **Good error handling**: Provides clear error messages and error-handling mechanisms

### Cross-Platform Compatibility

Although it currently mainly supports the Windows platform, JadeView's design takes cross-platform compatibility into account:

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
- **wry**: The WebView library, based on WebKitGTK (Linux), WKWebView (macOS), and WebView2 (Windows)
- **tao**: The window management library, providing cross-platform window management capabilities
- **serde**: The serialization/deserialization library, used for data transfer
- **tokio**: The asynchronous runtime, used for handling asynchronous operations

## Architecture Design

JadeView adopts a layered architecture design:

1. **Core layer**: Contains memory management, the event loop, and basic functionality
2. **API layer**: Provides a C-compatible API interface
3. **SDK layer**: Provides SDK wrappers for different languages (such as EPL/易语言)
4. **Application layer**: User applications

This layered design gives JadeView good extensibility and maintainability, making it easy to add new platform support and features.

## Future Development

Through continuous optimization and improvement, JadeView will continue to maintain its characteristics of high performance, high security, and ease of use, providing developers with a better WebView window library solution.
