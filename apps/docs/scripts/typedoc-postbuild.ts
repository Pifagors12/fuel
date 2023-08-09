import { readdirSync, mkdirSync, copyFileSync, rmSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import replace from 'replace';

type Link = {
  link: string;
  text: string;
  items: Link[];
  collapsed?: boolean;
};

/**
 * Post build script to trim off undesired leftovers from Typedoc, restructure directories and generate json for links.
 */
const docsDir = join(__dirname, '../src/');
const apiDocsDir = join(docsDir, '/api');
const classesDir = join(apiDocsDir, '/classes');
const modulesDir = join(apiDocsDir, '/modules');

const filesToRemove = ['modules.md', 'api/modules.md', 'api/classes', 'api/modules'];

const { log } = console;

/**
 * Removes unwanted files and dirs generated by typedoc.
 */
const removeUnwantedFiles = () => {
  filesToRemove.forEach((dirPath) => {
    const fullDirPath = join(docsDir, dirPath);
    rmSync(fullDirPath, { recursive: true, force: true });
  });
};

/**
 * Generates a json file containing the links for the sidebar to be used by vitepress.
 */
const exportLinksJson = () => {
  const links: Link = { link: '/api/', text: 'API', items: [] };
  const directories = readdirSync(apiDocsDir);
  directories
    .filter((directory) => directory !== 'index.md')
    .forEach((directory) => {
      links.items.push({ text: directory, link: `/api/${directory}/`, collapsed: true, items: [] });
      readdirSync(join(apiDocsDir, directory))
        .filter((file) => file !== 'index.md')
        .forEach((file) => {
          const index = links.items.findIndex((item) => item.text === directory);
          if (index !== -1) {
            const name = file.split('.')[0];
            links.items[index].items.push({
              text: name,
              link: `/api/${directory}/${name}`,
              items: [],
            });
          }
        });
    });

  writeFileSync('.typedoc/api-links.json', JSON.stringify(links));
};

/**
 * Alters the typedoc generated file structure to be more semantic.
 */
const alterFileStructure = () => {
  const modulesFiles = readdirSync(modulesDir);
  const classesFiles = readdirSync(classesDir);

  modulesFiles.forEach((modulesFile) => {
    // Create a new directory for each module
    const newDirName = modulesFile.split('.')[0];
    const newDirPath = join(apiDocsDir, newDirName);
    mkdirSync(newDirPath);

    // Copy the class files to the correct module directory
    classesFiles.forEach((classesFile) => {
      if (classesFile.startsWith(newDirName)) {
        const newDirClassFilePath = join(newDirPath, classesFile);
        copyFileSync(join(classesDir, classesFile), newDirClassFilePath);

        // Rename the class file to remove module prefix
        renameSync(newDirClassFilePath, join(newDirPath, classesFile.split('-')[1]));
      }
    });

    // Move module index file
    copyFileSync(join(modulesDir, modulesFile), join(newDirPath, 'index.md'));

    // Rename module directory to remove 'fuel_ts_' prefix
    const formattedDirName = newDirPath.split('fuel_ts_')[1];
    const capitalisedDirName = formattedDirName.charAt(0).toUpperCase() + formattedDirName.slice(1);
    renameSync(newDirPath, join(apiDocsDir, capitalisedDirName));
  });
};

/**
 * Recreates the generated typedoc links
 *
 * TODO: this should be done via the filesystem rather than hardcoded
 */
const recreateInternalLinks = () => {
  const regexReplaces = [
    // Module replacements
    { regex: 'fuel_ts_address.md', replacement: '/api/Address/index.md' },
    { regex: 'fuel_ts_interfaces.md', replacement: '/api/Interfaces/index.md' },
    { regex: 'fuel_ts_wallet.md', replacement: '/api/Wallet/index.md' },
    { regex: 'fuel_ts_script.md', replacement: '/api/Script/index.md' },
    // Address replacements
    { regex: 'address-Address.md', replacement: '/api/Address/Address.md' },
    // Interfaces replacements
    { regex: 'interfaces-AbstractAccount.md', replacement: '/api/Interfaces/AbstractAccount.md' },
    { regex: 'interfaces-AbstractAddress.md', replacement: '/api/Interfaces/AbstractAddress.md' },
    { regex: 'interfaces-AbstractContract.md', replacement: '/api/Interfaces/AbstractContract.md' },
    // Wallet replacements
    { regex: 'wallet-Account.md', replacement: '/api/Wallet/Account.md' },
    { regex: 'wallet-BaseWalletUnlocked.md', replacement: '/api/Wallet/BaseWalletUnlocked.md' },
    { regex: 'wallet-WalletUnlocked.md', replacement: '/api/Wallet/WalletUnlocked.md' },
    { regex: 'wallet-WalletLocked.md', replacement: '/api/Wallet/WalletLocked.md' },
    { regex: 'wallet-Wallet.md', replacement: '/api/Wallet/Wallet.md' },
    // Script replacements
    { regex: 'script-Script.md', replacement: '/api/Script/Script.md' },
    // Prefix cleanups
    { regex: '../modules/', replacement: '/api/' },
    { regex: '../classes/', replacement: '/api/' },
    { regex: 'fuel_ts_', replacement: '' },
    { regex: '/api//api/', replacement: '/api/' },
    // Resolves `[plugin:vite:vue] Element is missing end tag.` error
    { regex: '<', replacement: '&lt;' },
  ];

  const topLevelDirs = readdirSync(apiDocsDir);

  topLevelDirs
    .filter((dir) => dir !== 'index.md')
    .forEach((dir) => {
      regexReplaces.forEach(({ regex, replacement }) => {
        replace({
          regex,
          replacement,
          paths: [join(apiDocsDir, dir)],
          recursive: true,
          silent: true,
        });
      });
    });
};

log('Cleaning up docs.');
alterFileStructure();
removeUnwantedFiles();
exportLinksJson();
recreateInternalLinks();
