import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
import eleventyDb from '../main/database/eleventyDb';
import chokidar from 'chokidar';
import { imageToBase64, importDataFile, writeDataFile } from '../utils/utils';
const child_process = require('child_process')

let siteConfig = null;
let collectionWatcher = null;

let selectedSiteDir = null;
let siteInfoFilePath = null;
let collectionDirectories = [];

const getFavicon = async (sitePath) => {
    const extensions = ['svg', 'png', 'ico', 'jpg', 'jpeg', 'gif']
    const extension = extensions.find((ext) => fs.existsSync(`${sitePath}/${siteConfig.output}/favicon.${ext}`));
    return extension ? await fs.readFileSync(`${sitePath}/${siteConfig.output}/favicon.${extension}`, 'utf8') : undefined;
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
const functions = {
    createSiteConfigFile: async(siteConfigData)=>{
        return fs.writeFileSync(`${selectedSiteDir}/_11tycms.json`, JSON.stringify(siteConfigData));
    },
    openDirectory: async (selectedDirectory, cmsConfigData) => {
        if (!selectedDirectory) {
            selectedDirectory = selectedSiteDir
        } else {
            selectedSiteDir = selectedDirectory
        }
        if (!fs.existsSync(`${selectedDirectory}/eleventy.config.js`)) {
            throw new Error(`This doesn't appear to be an Eleventy website! Ensure you select a directory with an 'eleventy.config.js' file in its root.`)
        }
        if (collectionWatcher) {
            collectionWatcher.close()
        }
        collectionDirectories = [];
        collectionWatcher = null;
        const eleventyDB = eleventyDb.get();
        eleventyDB.ItemMetadata.destroy({
            truncate: true
        })
        const cmsConfigFile = await fs.readdirSync(`${selectedSiteDir}`, { withFileTypes: true }).filter(file => ['_11tycms.json', '_11tycms.js', '_11tycms.ts'].includes(file.name))[0];
        if (cmsConfigFile) {
            console.log("11tyCMS config FOUND!")
            siteConfig = await importDataFile(`${selectedSiteDir}/${cmsConfigFile.name}`);
        }
        else if (!cmsConfigData) {
            return { status: "NEW", selectedSiteDir };
        }
        console.log("after initing the site variables here", siteConfig);

        const collectionsFactory = async (collectionDirectories, nested) => {
            const getDirectoryName = (directoryPath, nestedDirectory) => {
                if (!nestedDirectory) {
                    const dirArray = directoryPath.split('/')
                    return dirArray[dirArray.length - 1]
                } else {
                    return directoryPath.substring(selectedSiteDir.length + siteConfig.input.length + 1);
                }
            }
            const addFileToCollectionCache = async (file, fileCollectionDir) => {
                try {
                    const filename = `${file.parentPath}/${file.name}`;
                    const frontmatterData = (await matter.read(`${file.parentPath}/${file.name}`))['data'];
                    console.log('adding file ', filename)
                    const dbFileMetadata = (await eleventyDB.ItemMetadata.create({
                        collection: fileCollectionDir,
                        isNested: nested,
                        name: file.name,
                        data: frontmatterData,
                        path: filename,
                        parentPath: file.parentPath
                    }))['dataValues']
                    collections[fileCollectionDir].push(dbFileMetadata);
                } catch (error) {
                    console.log("this is an error here", error)
                }
            }
            let collections = {}

            for (const directoryPath of collectionDirectories) {
                console.log(directoryPath, "this is a dirpath");
                const collectionDirectoryName = getDirectoryName(directoryPath, nested);
                collections[collectionDirectoryName] = []
                const collectionFilesAndDirs = fs.readdirSync(directoryPath, { withFileTypes: true });
                const collectionDirectories = collectionFilesAndDirs.filter(entry => entry.isDirectory()).map(({ path, name }) => `${path}/${name}`);
                const collectionFiles = collectionFilesAndDirs.filter(file => file.name.includes('.md'));
                collections = { ...collections, ...(await collectionsFactory(collectionDirectories, true)) }
                for (const file of collectionFiles) {
                    await addFileToCollectionCache(file, collectionDirectoryName)
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
            }).then((response) => {
                selectedSiteDir = response.filePaths[0]
                return functions.openDirectory(selectedSiteDir).then((res) => resolveOuter(res))
            })
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
    getSelectedSiteInfo: async () => {
        let otherData = {
            layouts: {}
        }
        fs.readdirSync(`${selectedSiteDir}/${siteConfig.includes}`, { withFileTypes: true }).forEach(file => {
            otherData['layouts'][file.name] = { title: file.name }
        })
        const favicon = await getFavicon(selectedSiteDir)
        if (favicon) {
            otherData['base64Favicon'] = imageToBase64(favicon, '.svg')
        }
        siteInfoFilePath = await functions._getSiteInfoFilePath();
        const siteInfoData = await importDataFile(siteInfoFilePath)
        return { ...siteInfoData, ...otherData };
    },
    setSiteInfo: async (data) => {
        const writeFileResult = writeDataFile(siteInfoFilePath, data)
        return writeFileResult
    },
    createCollection: async (name, layout) => {
        fs.mkdirSync(`${selectedSiteDir}/${siteConfig.input}/${name}`);
        fs.writeFileSync(`${selectedSiteDir}/${siteConfig.input}/${name}/${name}.11tydata.json`, JSON.stringify({ "layout": layout, tags: 'post' }))
        collectionDirectories.push(`${selectedSiteDir}/${siteConfig.input}/${name}`)
        refreshCollectionWatcher()
    },
    deleteCollection: async (name) => {
        const status = await fs.rmSync(`${selectedSiteDir}/${siteConfig.input}/${name}`, { recursive: true, force: true });
        refreshCollectionWatcher();
        return status;
    },
    buildSite: () => {
        return new Promise((resolve) => {
            child_process.exec(siteConfig.build, { cwd: selectedSiteDir }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    publishSite: async () => {
        return new Promise((resolve) => {
            child_process.exec(siteConfig.publish, { cwd: `${selectedSiteDir}/${siteConfig.output}` }, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
                resolve(err, stdout, stderr);
            });
        })
    },
    _getSelectedEleventySiteDir: () => selectedSiteDir
}

export default functions;
export const getSiteDir = functions._getSelectedEleventySiteDir
export const getSiteConfig = functions.getSiteConfig;