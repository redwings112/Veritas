#!/usr/bin/env node

import { exec } from 'child_process';
import 'dotenv/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { reportFailure, sendHeartbeat } from '../src/firebase/node-protocol.js';

// 1. AUTO-DETECT PROJECT IDENTITY
let projectName = "unknown-sector";
try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        projectName = pkg.name || "unnamed-project";
    }
} catch (e) {
    // Fallback if filesystem is locked or busy
    projectName = "recovery-mode-active";
}

// 2. DEFINE BUILD ID (The line that was broken)
const BUILD_ID = `veritas_${Date.now()}`;

async function startSentinel() {
    console.clear();
    console.log(chalk.magentaBright.bold(`\n ⚡ VERITAS_PROTOCOL // AGENT_ACTIVE`));
    console.log(chalk.cyan(` 🏗️  PROJECT_ID:  ${projectName}`));
    console.log(chalk.cyan(` 🆔  BUILD_ID:    ${BUILD_ID}`));
    
    // Send initial heartbeat
    await sendHeartbeat(BUILD_ID, projectName);

    // Start the project
    const project = exec('npm run dev');

    project.stdout.on('data', (data) => {
        process.stdout.write(chalk.white(data));
    });

    project.stderr.on('data', async (data) => {
        const errorMsg = data.toString();
        process.stderr.write(chalk.red(errorMsg));

        if (errorMsg.includes('ERR_') || errorMsg.includes('ReferenceError') || errorMsg.includes('FATAL')) {
            console.log(chalk.bgRed.white.bold('\n 🚨 CRITICAL_SECTOR_FAILURE_DETECTED '));
            await reportFailure(BUILD_ID, errorMsg, projectName);
        }
    });
}

// Route the command
if (process.argv[2] === 'start') {
    startSentinel();
} else {
    console.log(chalk.yellow(`Usage: node bin/veritas.js start`));
}