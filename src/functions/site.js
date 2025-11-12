import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
import eleventyDb from '../main/database/eleventyDb';
import chokidar from 'chokidar';
import filesFuncs from './files';
const child_process = require('child_process')

const { _imageToBase64 } = filesFuncs;

let siteConfig = null;
let collectionWatcher = null;

let selectedSiteDir = null;
let selectedSiteDirectories = {
    input: '',
    includes: '_includes',
    data: '_data',
    output: '_site'
}
let siteInfoFilePath = null;
let collectionDirectories = [];

const getFavicon = async (sitePath) => {
    return await fs.readFileSync(`${sitePath}/media/favicon.svg`, 'utf8')
}

const refreshCollectionWatcher = () => {
    const eleventyDB = eleventyDb.get();
    let browserWindow = mainWindow.get();
    if (collectionWatcher)
        collectionWatcher.close();
    console.dbg('Watching these collections:\n', collectionDirectories.join(', '));
    collectionWatcher = chokidar.watch(collectionDirectories, { persistent: true, ignoreInitial: true });
    return collectionWatcher
        .on('add', path => {
            let explodedPathBefore = path.split('/');
            const matterData = matter.read(path);
            const pathArray = path.split('/');
            let parentPath = [...path.split('/')];
            parentPath.pop();
            parentPath = parentPath.join('/')
            eleventyDB.ItemMetadata.create({
                collection: explodedPathBefore[explodedPathBefore.length - 2],
                name: pathArray[pathArray.length - 1],
                data: matterData.data,
                path: matterData.path,
                parentPath: parentPath
            })

            browserWindow.webContents.send('collectionFileAdded', {
                collection: explodedPathBefore[explodedPathBefore.length - 2],
                name: pathArray[pathArray.length - 1],
                data: matterData.data,
                path: matterData.path,
                parentPath: parentPath
            })

        })
        .on('unlink', path => browserWindow.webContents.send('collectionFileRemoved', {
            path,
            collection: (() => {
                const lastSlashIndex = path.lastIndexOf('/')
                let string = path.substring(0, lastSlashIndex);
                let splitPath = string.split('/');
                return splitPath[splitPath.length - 1];
            })()
        }))
        .on('unlink', path => {
            let explodedPath = path.split('/');
            let collection = explodedPath[explodedPath.length - 2]
            let fileName = explodedPath[explodedPath.length - 1];
            eleventyDB.ItemMetadata.destroy({
                where: { collection, name: fileName }
            })
        })
        .on('change', path => {
        })
}
const functions = {
    openDirectory: async (selectedDirectory, cmsConfigData) => {
        if (!fs.existsSync(`${selectedDirectory}/eleventy.config.js`)) {
            throw new Error(`This doesn't appear to be an Eleventy website! Ensure you select a directory with an 'eleventy.config.js' file in its root.`)
        }
        if (collectionWatcher) {
            collectionWatcher.close()
        }
        collectionDirectories = [];
        collectionWatcher = null;
        selectedSiteDir = selectedDirectory
        const eleventyDB = eleventyDb.get();

        const cmsConfigFile = await fs.readdirSync(`${selectedSiteDir}`, { withFileTypes: true }).filter(file => ['_11tycms.json', '_11tycms.js', '_11tycms.ts'].includes(file.name))[0];
        if (cmsConfigFile) {
            console.log("11tyCMS config FOUND!")
            siteConfig = await filesFuncs._importDataFile(`${selectedSiteDir}/${cmsConfigFile.name}`);
        }
        else {
            if (!cmsConfigData) {
                return { status: "NEW", selectedDirectory };
            } else {
                filesFuncs._writeDataFile(`${selectedSiteDir}/_11tycms.json`, cmsConfigData);
                siteConfig = cmsConfigData;
            }
        }
        /* 
          We need a function that will return all the directories at the root of the 11ty src folder.
          It will then need to check through any folders that arent _* to see if its a collection, by checking to see if there is a child file with a matching name to its containing folder.
        */
        eleventyDB.ItemMetadata.destroy({
            truncate: true
        })

        const doesCollectionDirConfigExist = (path, folderName) => {
            const supportedConfigExtensions = ['.js', '.json', '.ts'];
            for (const extension of supportedConfigExtensions) {
                const collectionConfigPath = `${path}/${folderName}/${folderName}.11tydata${extension}`
                if (fs.existsSync(collectionConfigPath)) {
                    return collectionConfigPath
                }
            }
            return false;
        };
        const isDirCollection = (path, folderName) => {
            const isFolderInternal = folderName[0] == '_'
            const isCollectionFolder = doesCollectionDirConfigExist(path, folderName);
            return !isFolderInternal && isCollectionFolder;
        };

        const collectionsFactory = async (collectionDirectories) => {
            const getDirectoryName = (directoryPath) => {
                const dirArray = directoryPath.split('/')
                return dirArray[dirArray.length - 1]
            }
            let collections = {}
            for (const directoryPath of collectionDirectories) {
                const collectionDirectoryName = getDirectoryName(directoryPath);
                collections[collectionDirectoryName] = []
                const collectionFiles = fs.readdirSync(directoryPath, { withFileTypes: true }).filter(file => file.name.includes('.md'));
                console.log('found these files', collectionFiles);
                for (const file of collectionFiles) {
                    try {

                        const filename = `${file.parentPath}/${file.name}`;
                        console.log("trying to read file", filename)
                        const fileFrontmatterData = (await matter.read(`${file.parentPath}/${file.name}`))['data'];
                        console.log(fileFrontmatterData, file);
                        const fileMetadata = (await eleventyDB.ItemMetadata.create({
                            collection: collectionDirectoryName,
                            name: file.name,
                            data: fileFrontmatterData,
                            path: filename,
                            parentPath: file.parentPath
                        }))['dataValues']
                        collections[collectionDirectoryName].push(fileMetadata);
                    } catch (error) {
                        console.log("this is an error here", error)
                    }

                }
            }

            return collections
        }

        const siteRootDirectories = fs.readdirSync(`${selectedSiteDir}`, { withFileTypes: true }).filter(dirEntry => dirEntry.isDirectory())
        const siteInputDirectories = fs.readdirSync(`${selectedSiteDir}${siteConfig.input ? `/${siteConfig.input}` : ''}`, { withFileTypes: true }).filter(dirEntry => dirEntry.isDirectory())

        collectionDirectories = siteInputDirectories.filter(dir => isDirCollection(`${selectedSiteDir}${siteConfig.input ? `/${siteConfig.input}` : ''}`, dir.name)).map(dir => `${dir.path}/${dir.name}`)
        const processedCollections = await collectionsFactory(collectionDirectories);
        let eleventyStructure = {
            rootPath: selectedSiteDir,
            code: siteRootDirectories.filter(dir => dir.name[0] == '_'),
            collections: processedCollections
        }

        refreshCollectionWatcher()
        return eleventyStructure
    },
    openDirectoryWithDialog: async () => {
        return new Promise(resolveOuter => {
            dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then((response) => functions.openDirectory(response.filePaths[0]).then((res) => resolveOuter(res)))
        });
    },
    getSiteConfig: () => {
        return siteConfig
    },
    setSiteConfig: (data) => {
        siteConfig = data;
        return fs.writeFileSync(`${selectedSiteDir}/_11tycms.json`, JSON.stringify(data));
    },
    _getSiteInfoFilePath: async () => {
        const infoFile = await fs.readdirSync(`${selectedSiteDir}/${siteConfig.data}/`, { withFileTypes: true }).filter(file => (file.name.endsWith(".js") || file.name.endsWith(".jsx") || file.name.endsWith('.json')) && (file.name.includes('site.') || file.name.includes('metadata.')))[0];
        if (infoFile.length == 0)
            throw new Error("No metadata/site.js/json file found!")
        return `${infoFile.parentPath}${infoFile.name}`
    },
    getSiteInfo: async (path) => {
        let otherData = {
            layouts: {}
        }
        fs.readdirSync(`${path}/${siteConfig.includes}`, { withFileTypes: true }).forEach(file => {
            otherData['layouts'][file.name] = { title: file.name }
        })
        const favicon = await getFavicon(path)
        otherData['base64Favicon'] = _imageToBase64(favicon, '.svg')

        siteInfoFilePath = await functions._getSiteInfoFilePath();
        const siteInfoData = await filesFuncs._importDataFile(siteInfoFilePath)
        return { ...siteInfoData, ...otherData };
    },
    setSiteInfo: async (data) => {
        console.log(data);
        const writeFileResult = fs.writeFileSync(siteInfoFilePath, JSON.stringify(data));
        return writeFileResult
    },
    createCollection: async (sitePath, name, layout) => {
        fs.mkdirSync(`${sitePath}/${name}`);
        fs.writeFileSync(`${sitePath}/${name}/${name}.json`, JSON.stringify({ "layout": layout, tags: 'post' }))
        collectionDirectories.push(`${sitePath}/${name}`)
        refreshCollectionWatcher()
    },
    deleteCollection: async (name) => {
        const status = await fs.rmSync(`${selectedSiteDir}/${name}`, { recursive: true, force: true });
        refreshCollectionWatcher();
        return status;
    },
    buildSite: (path) => {
        return new Promise((resolve) => {
            child_process.exec(siteConfig.build, { cwd: path }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    publishSite: async (path) => {
        return new Promise((resolve) => {
            child_process.exec(siteConfig.publish, { cwd: `${path}/${siteConfig.output}` }, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
                resolve(err, stdout, stderr);
            });
        })
    },
    _getSelectedEleventySiteDir: () => selectedSiteDir
}

export default functions;