// extension.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */

const ignoreFolders = [
	'node_modules',      // JS/TS dependencies
	'.git',              // Git repository metadata
	'bin',               // .NET compiled binaries
	'obj',               // .NET intermediate build output
	'dist',              // Build output (JS/TS)
	'build',             // Alternative build folder
	'.vs',               // Visual Studio specific metadata
	'.vscode',           // VS Code settings (optional)
	'__pycache__',       // Python bytecode cache
	'.pytest_cache',     // Pytest cache folder
	'.mypy_cache',       // mypy type checker cache
	'.venv',             // Python virtual environment
	'env',               // Common alt name for Python venv
	'venv',              // Common alt name for Python venv
	'.idea',             // JetBrains IDE settings
	'.next',             // Next.js build output
	'.angular',          // Angular build cache
	'coverage',          // Test coverage reports
	'logs',              // Log output directories
	'.DS_Store',         // macOS metadata (not a folder, but often excluded)
	'target',            // Java/Maven/Gradle build output
	'.gradle',           // Gradle build cache
	'out',               // General build output
	'.turbo',            // Turborepo cache
	'.cache',            // Cache folders (e.g., Vite, Astro)
  ];

  
function activate(context) {
    console.log('Code2Summarize is now active!');

    let disposable = vscode.commands.registerCommand('code2summarize.summarize', function () {
        // Get workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder or workspace first.');
            return;
        }

        // Assuming we're working with the first folder in the workspace
        const rootPath = workspaceFolders[0].uri.fsPath;
        
        // Start the summarization process
        summarizeWorkspace(rootPath)
            .then(() => {
                vscode.window.showInformationMessage('Code2Summarize completed successfully!');
            })
            .catch(err => {
                vscode.window.showErrorMessage(`Error: ${err.message}`);
                console.error(err);
            });
    });

    context.subscriptions.push(disposable);
}

/**
 * Main function to summarize the workspace
 * @param {string} rootPath 
 */
async function summarizeWorkspace(rootPath) {
    // Define allowed file extensions
    const allowedExtensions = ['.cs', '.py', '.jsx', '.ts', '.html'];
    
    // Output file name
    const outputFileName = `${path.basename(rootPath)}_Code2Summarize.txt`;
    const outputFilePath = path.join(rootPath, outputFileName);
    
    // Create a stream to write to the output file
    const outputStream = fs.createWriteStream(outputFilePath);
    
    try {
        // Step 1: Generate ASCII tree structure
        const treeStructure = await generateTreeStructure(rootPath, allowedExtensions);
        outputStream.write('# Project Structure\n\n');
        outputStream.write(treeStructure);
        outputStream.write('\n\n# File Contents\n\n');
        
        // Step 2: Process files and write content
        await processFiles(rootPath, allowedExtensions, outputStream);
        
        // Close the stream
        outputStream.end();
    } catch (error) {
        outputStream.end();
        throw error;
    }
}

/**
 * Generate ASCII tree structure of the project
 * @param {string} rootPath 
 * @param {string[]} allowedExtensions 
 * @returns {Promise<string>}
 */
async function generateTreeStructure(rootPath, allowedExtensions) {
    let treeOutput = '';
    const rootName = path.basename(rootPath);
    
    treeOutput += rootName + '\n';
    
    /**
     * Recursively build the tree structure
     * @param {string} dirPath 
     * @param {string} prefix 
     * @returns {Promise<void>}
     */
    async function buildTree(dirPath, prefix) {
        const items = fs.readdirSync(dirPath).sort();
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            const isLast = i === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            
            if (stats.isDirectory()) {
                // Skip node_modules, .git, and other common unnecessary folders
				if (ignoreFolders.includes(item)) {
                    continue;
                }
                
                treeOutput += prefix + connector + item + '\n';
                await buildTree(itemPath, newPrefix);
            } else {
                // Only include files with allowed extensions
                const ext = path.extname(item).toLowerCase();
                if (allowedExtensions.includes(ext)) {
                    treeOutput += prefix + connector + item + '\n';
                }
            }
        }
    }
    
    await buildTree(rootPath, '');
    return treeOutput;
}

/**
 * Process files and append their content to the output file
 * @param {string} rootPath 
 * @param {string[]} allowedExtensions 
 * @param {fs.WriteStream} outputStream 
 * @returns {Promise<void>}
 */
async function processFiles(rootPath, allowedExtensions, outputStream) {
    /**
     * Recursively process files in directories
     * @param {string} dirPath 
     * @returns {Promise<void>}
     */
    async function processDir(dirPath) {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                // Skip node_modules, .git, and other common unnecessary folders
				if (ignoreFolders.includes(item)) {
                    continue;
                }
                
                await processDir(itemPath);
            } else {
                // Only process files with allowed extensions
                const ext = path.extname(item).toLowerCase();
                if (allowedExtensions.includes(ext)) {
                    // Get relative path from root
                    const relativePath = path.relative(rootPath, itemPath);
                    
                    // Read file content
                    const fileContent = fs.readFileSync(itemPath, 'utf8');
                    
                    // Write file info and content to output file
                    outputStream.write(`## File: ${item}\n`);
                    outputStream.write(`### Path: ${relativePath}\n`);
                    outputStream.write('### Content:\n');
                    outputStream.write('```' + ext.substring(1) + '\n');
                    outputStream.write(fileContent);
                    outputStream.write('\n```\n');
                    outputStream.write('### End of file: ' + item + '\n\n');
                    outputStream.write('-'.repeat(80) + '\n\n');
                }
            }
        }
    }
    
    await processDir(rootPath);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};