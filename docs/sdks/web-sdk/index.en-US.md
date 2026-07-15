---
order: 0
---

# Introduction

The JadeView Web SDK is a library for frontend development that provides IPC type definitions and APIs for communicating with the JadeView WebView, helping frontend developers gain type safety and IntelliSense support when working with the JadeView WebView.

## What is the JadeView Web SDK

The JadeView Web SDK is a set of TypeScript type definitions that provides frontend developers with type-safe support for IPC (inter-process communication) with the JadeView WebView. It allows frontend code to communicate with the native application, enabling bidirectional data interaction.

## Core Features

- **Type Safety**: Complete TypeScript type definitions that provide IntelliSense support
- **IPC Communication**: APIs for bidirectional communication with the native application
- **Event Subscription**: Supports subscribing to and unsubscribing from events sent by the native application
- **Message Sending**: Supports sending messages to the frontend
- **Automatic Recognition**: Automatically recognized by TypeScript after installation, with no additional configuration required

## Use Cases

The JadeView Web SDK is suitable for the following scenarios:

1. **Frontend-to-native communication**: When data interaction with the native application is needed within the WebView
2. **Type-safe development**: When you want TypeScript type support to avoid type errors
3. **Event-driven architecture**: When using an event-driven approach to handle application logic
4. **Cross-platform development**: When developing applications that need to run on multiple platforms

## Technical Architecture

The JadeView Web SDK adopts the following technical architecture:

1. **Type Definition Layer**: Provides complete TypeScript type definitions
2. **API Layer**: Defines the API interfaces for communicating with the native application
3. **Event System**: Supports event subscription and publishing
4. **IPC Communication**: Implements inter-process communication with the native application

## System Requirements

- TypeScript 4.0+: Requires TypeScript compiler support
- Modern browsers: Support for ES6+ syntax
- JadeView WebView: Must run within the JadeView WebView environment

## Installation

Install the JadeView Web SDK via npm:

```bash
npm install --save-dev jadeview-ipc-types
```

Or using yarn:

```bash
yarn add --dev jadeview-ipc-types
```

## License

The JadeView Web SDK is licensed under the MIT License, allowing free use, modification, and distribution.

## Reference Implementation

You can review the official DemoWeb implementation to learn how to use the JadeView Web SDK in a real-world project:

- **DemoWeb implementation**: [https://github.com/JadeViewDocs/JadeView/tree/main/DemoWeb](https://github.com/JadeViewDocs/JadeView/tree/main/DemoWeb)

## Community and Support

- GitHub repository: [https://github.com/JadeViewDocs/web_Sdk](https://github.com/JadeViewDocs/web_Sdk)
- Documentation repository: [https://github.com/JadeViewDocs/docs](https://github.com/JadeViewDocs/docs)
- Documentation website: [https://jadeviewdocs.github.io](https://jadeviewdocs.github.io)
- Download: [GitHub Releases](https://github.com/JadeViewDocs/JadeView/releases)
- If you have any questions or suggestions, feel free to submit an Issue or Pull Request
