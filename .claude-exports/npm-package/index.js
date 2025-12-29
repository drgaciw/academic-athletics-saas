/**
 * @your-org/turborepo-claude-agents
 *
 * Reusable Claude Code agents and skills for Turborepo development
 */

const { install } = require('./install');

module.exports = {
  // Install function (can be called programmatically)
  install,

  // Metadata
  agents: [
    'turborepo-architect',
    'nextjs-app-developer',
    'shadcn-component-builder',
    'service-developer',
    'prisma-schema-manager'
  ],

  skills: [
    'add-workspace-package',
    'create-new-service',
    'shadcn-component-operations',
    'turborepo-optimization',
    'debug-build-issues'
  ],

  version: require('./package.json').version
};
