const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'MyBusinessApp',
    executableName: 'MyBusinessApp',
    icon: './build-resources/icon',
  },
  rebuildConfig: {},
  hooks: {
    prePackage: async () => {
      const { execSync } = require('child_process');
      console.log('Running Vite build (includes TypeScript)...');
      execSync('npx vite build', { stdio: 'inherit' });
      console.log('Building Electron main process...');
      execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' });
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'MyBusinessApp',
        authors: 'Your Name',
        description: 'Offline Desktop Business Application',
        exe: 'MyBusinessApp.exe',
        setupExe: 'MyBusinessApp-Setup.exe',
        noMsi: true,
        remoteReleases: '',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
