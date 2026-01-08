<!-- PROJECT LOGO -->
<p align="center">
  <a href="http://jade.run">
    <img src="static/logo/light.svg" alt="JadeView Logo" width="120">
  </a>

  <h2 align="center">JadeView Docs</h2>

  <p align="center">
    Documentation for JadeView - a Rust-based WebView window library.
    <br />
    <a href="http://jade.run"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/JadeViewDocs/docs">GitHub Repository</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Writing Documentation](#writing-documentation)
- [License](#license)

<!-- ABOUT THE PROJECT -->

## About The Project

JadeView is a Rust-based WebView window library that provides a C-language compatible API interface, making it easy to call and use in other languages (such as Easy Language).

This repository contains the documentation portal for JadeView, built with Docusaurus.

### Built With

- [Docusaurus](https://docusaurus.io/)
- [React](https://reactjs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Bun](https://bun.sh/) (Package Manager)

<!-- GETTING STARTED -->

## Getting Started

This section describes how you can get the JadeView documentation portal up and running on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Bun](https://bun.sh/) (Package Manager)

### Installation

1. Clone the repo

```sh
git clone https://github.com/JadeViewDocs/docs.git
```

2. Install dependencies using Bun

```sh
bun install
```

3. Run the development server

```sh
bun start
```

4. Build for production

```sh
bun run build
```

<!-- USAGE EXAMPLES -->

## Usage

After starting the development server, you can access the documentation at `http://localhost:3000`.

## Writing Documentation

### Adding New Documentation

1. Create new markdown files in the appropriate directory under `docs/`:
   - Core API documentation: `docs/guides/`
   - Web SDK documentation: `docs/web-sdk/`
   - Easy Language SDK documentation: `docs/easy-language-sdk/`
   - Design documentation: `docs/spec/`

2. Update the sidebar configuration for the corresponding section:
   - Core API: `sidebars-default.js`
   - Web SDK: `sidebars-web-sdk.js`
   - Easy Language SDK: `sidebars-easy-language-sdk.js`
   - Design: `sidebars-spec.js`

3. Run the development server to preview your changes:

```sh
bun start
```

### Logo Files

The logo files for JadeView can be found in the `static/logo/` directory:
- `light.svg`: Light theme logo
- `dark.svg`: Dark theme logo

<!-- LICENSE -->

## License

© 2025 JadeView. All rights reserved.

This documentation is proprietary and may not be distributed without permission.

## About

`docs` is created & maintained by the JadeView team.

The name and logo for JadeView are trademarks of JadeView.

JadeView is a Rust-based WebView window library that provides a modern, secure, and efficient way to create desktop applications with web technologies.
