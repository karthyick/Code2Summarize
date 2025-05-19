const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
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
        
        // Get configuration settings
        const config = vscode.workspace.getConfiguration('code2summarize');
        const ignoreFolders = config.get('ignoreFolders') || [];
        const allowedExtensions = config.get('allowedExtensions') || ['.cs', '.py', '.jsx', '.ts', '.html'];
        
        // Start the summarization process
        summarizeWorkspace(rootPath, ignoreFolders, allowedExtensions)
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
 * @param {string[]} ignoreFolders
 * @param {string[]} allowedExtensions
 */
async function summarizeWorkspace(rootPath, ignoreFolders, allowedExtensions) {
    // Output file name
    const outputFileName = `${path.basename(rootPath)}_Code2Summarize.txt`;
    const outputFilePath = path.join(rootPath, outputFileName);
    
    // Create a stream to write to the output file
    const outputStream = fs.createWriteStream(outputFilePath);
    
    try {
        // Step 1: Generate ASCII tree structure
        const treeStructure = await generateTreeStructure(rootPath, allowedExtensions, ignoreFolders);
        outputStream.write('# Project Structure\n\n');
        outputStream.write(treeStructure);
        outputStream.write('\n\n# File Contents\n\n');
        
        // Step 2: Process files and write content
        await processFiles(rootPath, allowedExtensions, outputStream, ignoreFolders);
        
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
 * @param {string[]} ignoreFolders
 * @returns {Promise<string>}
 */
async function generateTreeStructure(rootPath, allowedExtensions, ignoreFolders) {
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
                // Skip folders in the ignore list
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
 * @param {string[]} ignoreFolders
 * @returns {Promise<void>}
 */
async function processFiles(rootPath, allowedExtensions, outputStream, ignoreFolders) {
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
                // Skip folders in the ignore list
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