export const tools = {
  'shell': {
    description: 'Run general shell commands.',
    run: async ({ command }) => {
      const { execSync } = await import('child_process');
      return execSync(command, { encoding: 'utf-8' });
    }
  },
  'wp-cli': {
    description: 'Run WP-CLI commands on a given site. Provide: { site, command }',
    run: async ({ command, site }) => {
      const { runWpCli } = await import('./wpcli.js');
      return runWpCli(command, site);
    }
  },
  'http': {
    description: 'Make authenticated REST API calls to WordPress sites.',
    run: async (params) => {
      const { runHttpApi } = await import('./httpapi.js');
      return runHttpApi(params);
    }
  }
};