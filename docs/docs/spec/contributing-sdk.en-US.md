---
title: Contributing SDK Docs
order: 3
group:
  title: "Tutorial"
  order: 1
---

# Contributing SDK Docs

## Overview

Welcome to contributing SDK documentation for JadeView! This guide will help you understand how to create, organize, and submit high-quality SDK documentation, so that other developers can better use and integrate JadeView.

## Why Contribute SDK Docs

- **Help others**: Good documentation helps other developers understand and use the SDK more quickly
- **Improve the ecosystem**: Rich SDK documentation can foster the growth of the JadeView ecosystem
- **Showcase your work**: Use documentation to demonstrate your SDK's design philosophy and technical implementation
- **Gain recognition**: Your contributions will be recognized and appreciated by the community

## Documentation Structure

### Basic Structure

Each SDK document should include the following basic sections:

1. **Introduction**: An overview of the SDK, its features, and applicable scenarios
2. **Quick Start**: Installation and basic usage examples
3. **API Reference**: Detailed API documentation
4. **Advanced Usage**: Advanced features and usage tips
5. **Sample Code**: Complete usage examples
6. **FAQ**: Frequently asked questions and troubleshooting

### File Organization

The recommended file organization for SDK documentation is as follows:

```
docs/
  your-sdk-name/
    index.mdx          # Home page
    quickstart.mdx     # Quick start
    api-reference.mdx  # API reference
    advanced.mdx       # Advanced usage
    examples.mdx       # Sample code
    faq.mdx            # FAQ
```

## Documentation Writing Guidelines

### Formatting Requirements

- **Use Markdown**: All documentation uses Markdown format
- **Heading levels**: Use appropriate heading levels to keep the structure clear
- **Code blocks**: Use code blocks to present code examples, specifying the language type
- **Links**: Use relative paths to link to other documents
- **Images**: Reference images using relative paths, with images placed in the `static` directory

### Content Requirements

- **Clear and concise**: Use clear, concise language and avoid complex terminology
- **Well-structured**: Organize content in a logical order for ease of reading
- **Complete examples**: Provide complete, runnable code examples
- **Timely updates**: Ensure documentation stays in sync with the SDK version
- **Error handling**: Include explanations of error handling and exceptional cases

### Style Guide

- **Consistent terminology**: Use consistent terminology and naming conventions
- **Active voice**: Write documentation in the active voice
- **Second person**: Address the reader as "you"
- **Clear and concise**: Avoid lengthy sentences and paragraphs
- **Combine text and visuals**: Use images and diagrams appropriately to enhance explanations

## How to Submit SDK Docs

### Submission Process

1. **Fork the repository**: Fork the JadeView documentation repository to your GitHub account. Repository URL: [https://github.com/JadeViewDocs/docs](https://github.com/JadeViewDocs/docs)
2. **Create a branch**: Create a new branch in your fork
3. **Add documentation**: Add SDK documentation following the structure described above
4. **Submit a PR**: Submit a Pull Request to the main repository
5. **Review process**: Wait for the maintainers to review your PR
6. **Merge and publish**: Once approved, your documentation will be merged and published

### Submission Requirements

- **Complete documentation**: Ensure the documentation includes all necessary sections
- **Correct formatting**: Follow the Markdown format and documentation guidelines
- **Valid links**: Ensure all links work correctly
- **Runnable examples**: Ensure code examples run correctly
- **License compatibility**: Ensure your contribution complies with the project's license requirements

## Review Criteria

### Documentation Quality

- **Completeness**: Whether the documentation fully covers all features of the SDK
- **Accuracy**: Whether the documentation accurately reflects the SDK's behavior
- **Clarity**: Whether the documentation is clear, easy to understand, and well-structured
- **Consistency**: Whether the documentation's style and terminology are consistent with the project
- **Usefulness**: Whether the documentation provides real value to developers

### Technical Requirements

- **Code examples**: Whether the code examples are correct, complete, and runnable
- **API documentation**: Whether the API documentation is detailed and accurate
- **Error handling**: Whether explanations of error handling and exceptional cases are included
- **Version information**: Whether SDK version information and compatibility notes are included

## Examples and Best Practices

### Sample Documentation Structure

The following is an example structure for an SDK document:

#### 1. Introduction

```markdown
# My SDK Name

## What Is My SDK

My SDK is a library used for..., providing ... functionality.

## Core Features

- Feature 1
- Feature 2
- Feature 3

## Applicable Scenarios

My SDK is suitable for the following scenarios:
- Scenario 1
- Scenario 2
- Scenario 3
```

#### 2. Quick Start

```markdown
# Quick Start

## Requirements

- Node.js 14+
- JadeView 1.0+

## Installation

```bash
npm install my-sdk-name
```

## Basic Usage

```javascript
import { MySDK } from 'my-sdk-name';

// Initialize the SDK
const sdk = new MySDK({
  apiKey: 'your-api-key'
});

// Use SDK functionality
async function main() {
  try {
    const result = await sdk.someMethod();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

main();
```
```

### Best Practices

1. **Start from the user's perspective**: Consider the user's needs and usage scenarios
2. **Provide complete examples**: Include complete code examples and usage scenarios
3. **Keep documentation up to date**: Update the documentation promptly as the SDK evolves
4. **Collect feedback**: Encourage users to provide feedback and continuously improve the documentation
5. **Reference excellent documentation**: Refer to other excellent SDK documentation to learn from its structure and style

## FAQ

### How should I handle code examples in the documentation?

Code examples should:
- Be complete and runnable
- Include error handling
- Have clear comments
- Demonstrate typical usage scenarios

### How can I ensure the quality of the documentation?

- Test the code examples yourself
- Have colleagues or friends review the documentation
- Collect user feedback and continuously improve
- Update the documentation regularly to keep it in sync with the SDK

### What version information should the documentation include?

- The current version of the SDK
- The range of SDK versions the documentation applies to
- Important version change notes
- Compatibility information

## Resources and Tools

### Documentation Tools

- **Markdown editors**: VS Code, Typora, etc.
- **Syntax checking**: markdownlint, etc.
- **Code formatting**: Prettier, etc.
- **Version control**: Git

### Reference Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [Google Technical Writing Guide](https://developers.google.com/tech-writing)
- [Microsoft Documentation Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/)

## Contact Us

If you encounter any problems while contributing SDK documentation, or if you have any suggestions, feel free to contact us:

- **GitHub Issues**: [Submit an Issue](https://github.com/JadeViewDocs/docs/issues)
- **Documentation repository**: [https://github.com/JadeViewDocs/docs](https://github.com/JadeViewDocs/docs)
- **Email**: contact@jadeview.dev
- **Community**: [Join the community](https://discord.gg/jadeview)

## Contributor Guide

We greatly appreciate your contributions! Here are some additional suggestions:

1. **Start small**: If this is your first contribution, you can start by fixing small issues or improving existing documentation
2. **Follow the guidelines**: Follow the project's code style and documentation guidelines
3. **Submit clear PRs**: Provide a detailed PR description explaining what you changed and why
4. **Be patient**: The review process may take some time, so please be patient
5. **Continuous improvement**: Continuously improve your contributions based on feedback

## License

By contributing SDK documentation, you agree that your contribution will be released under the project's license. Please ensure that you have the right to submit your contribution and that your contribution complies with the project's license requirements.

---

Thank you for contributing to the JadeView ecosystem! Your efforts will help more developers use and benefit from JadeView.
