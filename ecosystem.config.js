module.exports = {
  apps: [
    {
      name: 'sabath-backend',
      script: 'node',
      args: 'dist/src/main',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'sabath-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
