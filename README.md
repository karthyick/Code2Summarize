# Code2Summarize

A VS Code extension that generates a summary of your project's code files. It analyzes the project structure and extracts content from supported file types to create a comprehensive summary.

## Features

- Generates an ASCII tree structure of your project
- Extracts code from supported file types:
  - C# (`.cs`)
  - Python (`.py`)
  - React (`.jsx`, `.ts`)
  - HTML (`.html`)
- Creates a single summary file with both project structure and file contents

## Usage

1. Open your project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the command palette
3. Type and select `Code2Summarize: Generate Code Summary`
4. The extension will create a summary file named `[ParentFolderName]_Code2Summarize.txt` in your project's root directory

## Output Format

The summary file contains:

1. An ASCII tree representation of your project structure
2. Content of each supported file, including:
   - File name
   - Relative path
   - Full content
   - End-of-file delimiter

## Installation

### Local Installation
1. Download the extension files
2. Place them in a folder under your `.vscode/extensions` directory:
   - Windows: `%USERPROFILE%\.vscode\extensions\code2summarize-0.1.0`
   - macOS/Linux: `~/.vscode/extensions/code2summarize-0.1.0`
3. Restart VS Code

### From VSIX (Recommended)
1. Build the extension using `vsce package`
2. Install the generated VSIX file:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type and select `Extensions: Install from VSIX...`
   - Locate and select the VSIX file

## Requirements

- VS Code 1.60.0 or higher

## Extension Settings

This extension does not add any VS Code settings.

## Known Issues

- Large projects may take some time to process
- Very large files might impact performance

## Release Notes

### 0.1.0

Initial release of Code2Summarize