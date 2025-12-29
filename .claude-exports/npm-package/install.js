#!/usr/bin/env node

/**
 * Postinstall script for @your-org/turborepo-claude-agents
 * Copies agents, skills, and documentation to .claude/ directory in consuming project
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function install() {
  try {
    // Find the consuming project root (go up from node_modules)
    const projectRoot = path.resolve(__dirname, '../../..');
    const targetDir = path.join(projectRoot, '.claude');

    log('\n🤖 Installing Claude Code Agents...\n', colors.cyan);

    // Create .claude directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      log('✅ Created .claude/ directory', colors.green);
    } else {
      log('ℹ️  .claude/ directory already exists - updating...', colors.yellow);
    }

    // Copy agents
    log('📋 Installing agents...', colors.blue);
    const agentsDir = path.join(targetDir, 'agents');
    copyDirectory(path.join(__dirname, 'agents'), agentsDir);
    log('   ✓ 5 specialized agents installed', colors.green);

    // Copy skills
    log('🛠️  Installing skills...', colors.blue);
    const skillsDir = path.join(targetDir, 'skills');
    copyDirectory(path.join(__dirname, 'skills'), skillsDir);
    log('   ✓ 5 practical skills installed', colors.green);

    // Copy documentation
    log('📚 Installing documentation...', colors.blue);
    const docs = [
      'README.md',
      'QUICK_REFERENCE.md',
      'AGENTS_AND_SKILLS.md',
      'PORTABILITY_GUIDE.md'
    ];

    for (const doc of docs) {
      const srcPath = path.join(__dirname, doc);
      const destPath = path.join(targetDir, doc);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    log('   ✓ Documentation installed', colors.green);

    // Success message
    log('\n✨ Claude Code Agents installed successfully!\n', colors.bright + colors.green);
    log('📖 Next steps:', colors.cyan);
    log('   1. Review .claude/QUICK_REFERENCE.md (your cheat sheet!)', colors.reset);
    log('   2. Customize workspace names if needed', colors.reset);
    log('   3. Start using agents in your AI assistant\n', colors.reset);
    log('💡 Example usage:', colors.yellow);
    log('   "Use the Turborepo Architect to optimize builds"', colors.reset);
    log('   "Follow the debug-build-issues skill"\n', colors.reset);

  } catch (error) {
    log('\n❌ Error installing Claude Code Agents:', colors.red);
    console.error(error);
    log('\n💡 You can manually copy from node_modules/@your-org/turborepo-claude-agents/\n', colors.yellow);
  }
}

// Only run if executed directly (not required as module)
if (require.main === module) {
  install();
}

module.exports = { install };
