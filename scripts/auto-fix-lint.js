#!/usr/bin/env node
/**
 * Automated Linting Fix Script
 * Fixes common ESLint warnings programmatically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '../frontend/vite-project');

console.log('🔧 Automated Linting Fix\n');

// Get list of files with issues
console.log('1️⃣ Analyzing linting issues...');
let lintOutput;
try {
    execSync('npm run lint', { cwd: FRONTEND_DIR, stdio: 'pipe' });
    console.log('✅ No linting issues found!');
    process.exit(0);
} catch (error) {
    lintOutput = error.stdout.toString();
}

// Parse issues
const issues = {};
const lines = lintOutput.split('\n');
let currentFile = null;

lines.forEach(line => {
    if (line.startsWith('/')) {
        currentFile = line.trim();
        issues[currentFile] = [];
    } else if (currentFile && line.includes('warning')) {
        const match = line.match(/(\d+):(\d+)\s+warning\s+'(.+?)' is (?:defined but never used|assigned a value but never used)/);
        if (match) {
            const [, lineNum, col, varName] = match;
            issues[currentFile].push({ line: parseInt(lineNum), col: parseInt(col), varName });
        }
    }
});

console.log(`Found issues in ${Object.keys(issues).length} files\n`);

// Fix issues
console.log('2️⃣ Applying automatic fixes...\n');
let fixedCount = 0;

Object.entries(issues).forEach(([filePath, fileIssues]) => {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const varsToRemove = new Set(fileIssues.map(i => i.varName));
    
    let modified = false;
    
    // Fix unused imports
    varsToRemove.forEach(varName => {
        // Remove standalone React import if unused
        if (varName === 'React' && !content.match(/React\.[a-zA-Z]/)) {
            content = content.replace(/^import React from ['"]react['"];?\s*\n/gm, '');
            modified = true;
            fixedCount++;
        }
        
        // Remove from destructured imports
        const destructurePattern = new RegExp(`import\\s*{([^}]*)}\\s*from`, 'g');
        content = content.replace(destructurePattern, (match, imports) => {
            const importList = imports.split(',').map(i => i.trim());
            const filtered = importList.filter(i => !i.includes(varName));
            
            if (filtered.length === 0) {
                modified = true;
                fixedCount++;
                return '';  // Remove entire import
            } else if (filtered.length < importList.length) {
                modified = true;
                fixedCount++;
                return `import { ${filtered.join(', ')} } from`;
            }
            return match;
        });
        
        // Remove standalone unused variable declarations
        const varPattern = new RegExp(`^\\s*(const|let|var)\\s+${varName}\\s*=`, 'm');
        if (varPattern.test(content)) {
            content = content.replace(new RegExp(`^\\s*(const|let|var)\\s+${varName}\\s*=[^;\\n]*;?\\n`, 'gm'), '');
            modified = true;
            fixedCount++;
        }
    });
    
    // Clean up empty lines
    if (modified) {
        content = content.replace(/\n\n\n+/g, '\n\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ Fixed ${filePath.replace(FRONTEND_DIR, '')}`);
    }
});

console.log(`\n✅ Applied ${fixedCount} automatic fixes\n`);

// Run eslint --fix
console.log('3️⃣ Running ESLint auto-fix...');
try {
    execSync('npm run lint -- --fix', { cwd: FRONTEND_DIR, stdio: 'inherit' });
} catch (error) {
    // Expected to have some remaining issues
}

// Final count
console.log('\n4️⃣ Checking remaining issues...');
try {
    execSync('npm run lint -- --max-warnings 0', { cwd: FRONTEND_DIR, stdio: 'inherit' });
    console.log('\n✅ All linting issues resolved!');
    process.exit(0);
} catch (error) {
    const remaining = (error.stdout?.toString() || '').match(/(\d+) warnings?/);
    if (remaining) {
        console.log(`\n⚠️  ${remaining[1]} warnings remaining - manual fixes needed`);
    }
    process.exit(1);
}
