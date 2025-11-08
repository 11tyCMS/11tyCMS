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
    openDirectory: async (selectedDirectory) => {
        if (collectionWatcher) {
            collectionWatcher.close()
        }
        collectionDirectories = [];
        collectionWatcher = null;
        selectedSiteDir = selectedDirectory
        const eleventyDB = eleventyDb.get();
        /* 
          We need a function that will return all the directories at the root of the 11ty src folder.
          It will then need to check through any folders that arent _* to see if its a collection, by checking to see if there is a child file with a matching name to its containing folder.
        */
        eleventyDB.ItemMetadata.destroy({
            truncate: true
        })

        const doesCollectionDirConfigExist = (path, folderName)=>{
            const supportedConfigExtensions = ['.js', '.json', '.ts'];
            for(const extension of supportedConfigExtensions){
                const collectionConfigPath = `${path}/${folderName}/${folderName}${extension}`
                if(fs.existsSync(collectionConfigPath)){
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
                for (const file of collectionFiles) {
                    const filename = `${file.parentPath}/${file.name}`;
                    const fileFrontmatterData = (await matter.read(`${file.parentPath}/${file.name}`))['data'];
                    const fileMetadata = (await eleventyDB.ItemMetadata.create({
                        collection: collectionDirectoryName,
                        name: file.name,
                        data: fileFrontmatterData,
                        path: filename,
                        parentPath: file.parentPath
                    }))['dataValues']
                    collections[collectionDirectoryName].push(fileMetadata);
                }
            }

            return collections
        }

        const siteRootDirectories = fs.readdirSync(selectedSiteDir, { withFileTypes: true }).filter(dirEntry => dirEntry.isDirectory())
        collectionDirectories = siteRootDirectories.filter(dir => isDirCollection(selectedSiteDir, dir.name)).map(dir => `${dir.path}/${dir.name}`)
        const processedCollections = await collectionsFactory(collectionDirectories);
        let eleventyStructure = {
            rootPath: selectedSiteDir,
            code: siteRootDirectories.filter(dir => dir.name[0] == '_'),
            collections: processedCollections
        }

        const configFile = await fs.readdirSync(`${selectedSiteDir}`, { withFileTypes: true }).filter(file => ['_11tycms.json', '_11tycms.js', '_11tycms.ts'].includes(file.name))[0];
        if (configFile) {
            console.log("11tyCMS config FOUND!")
            siteConfig = filesFuncs._importDataFile(`${selectedSiteDir}/${configFile.name}`);
        }
        else {
            console.log("11tyCMS config not found, creating new one")
            filesFuncs._writeDataFile(`${selectedSiteDir}/_11tycms.json`, {});
        }

        refreshCollectionWatcher()
        return eleventyStructure
    },
    openDirectoryWithDialog: async () => {
        //response.filePaths[0]+'/'+fileName
        return new Promise(resolveOuter => {
            dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then((response) => functions.openDirectory(response.filePaths[0], resolveOuter))
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
        const infoFile = await fs.readdirSync(`${selectedSiteDir}/_data/`, { withFileTypes: true }).filter(file => (file.name.endsWith(".js") || file.name.endsWith(".jsx") || file.name.endsWith('.json')) && (file.name.includes('site.') || file.name.includes('metadata.')))[0];
        if (infoFile.length == 0)
            throw new Error("No metadata/site.js/json file found!")
        return `${infoFile.parentPath}${infoFile.name}`
    },
    getSiteInfo: async (path) => {
        let otherData = {
            layouts: {}
        }
        fs.readdirSync(`${path}/_includes/`, { withFileTypes: true }).forEach(file => {
            const matterData = matter.read(`${file.parentPath}/${file.name}`);
            otherData['layouts'][file.name] = matterData.data
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
        console.log("creating collection at ", `${sitePath}/${name}`)
        fs.mkdirSync(`${sitePath}/${name}`);
        fs.writeFileSync(`${sitePath}/${name}/${name}.json`, JSON.stringify({ "layout": layout, tags: 'post' }))
        collectionDirectories.push(`${sitePath}/${name}`)
        refreshCollectionWatcher()
    },
    deleteCollection: async (name) => {
        console.log("Deleting collection at ", `${selectedSiteDir}/${name}`)
        const status = await fs.rmSync(`${selectedSiteDir}/${name}`, { recursive: true, force: true });
        refreshCollectionWatcher();
        return status;
    },
    buildSite: (path) => {
        console.log('building the site')
        return new Promise((resolve) => {
            child_process.exec(siteConfig.build, { cwd: path }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    publishSite: async (path) => {
        return new Promise((resolve) => {
            child_process.exec(siteConfig.publish, { cwd: `${path}/_site` }, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
                resolve(err, stdout, stderr);
            });
        })
    },
    _getSelectedEleventySiteDir: () => selectedSiteDir
}

export default functions;