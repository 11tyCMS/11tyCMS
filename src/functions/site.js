import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
import eleventyDb from '../main/database/eleventyDb';
import chokidar from 'chokidar';
import filesFuncs from './files';
const child_process = require('child_process')

const { _imageToBase64 } = filesFuncs;
let siteInfoData = {};
let collectionDirectories = [];
let collectionWatcher = null;
let eleventyDir = null;
let collections = {}
let siteInfoPath = null;
let site11tyCMSConfig = null;

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
    openDirectory: async (selectedSiteDir, resolveOuter) => {
        if (collectionWatcher) {
            collectionWatcher.close()
        }
        collectionDirectories = [];
        collectionWatcher = null;
        collections = {}
        eleventyDir = selectedSiteDir
        const eleventyDB = eleventyDb.get();
        let browserWindow = mainWindow.get();

        /* 
          We need a function that will return all the directories at the root of the 11ty src folder.
          It will then need to check through any folders that arent _* to see if its a collection, by checking to see if there is a child file with a matching name to its containing folder.
        */
        eleventyDB.ItemMetadata.destroy({
            truncate: true
        })
        const isDirCollection = (path, folderName) => {
            const isFolderInternal = folderName[0] == '_'
            const files = fs.readdirSync(`${path}/${folderName}`, { withFileTypes: true }).map(file => file.name).includes(`${folderName}.json`)
            return !isFolderInternal && files;
        };

        const collectionsFactory = (collectionDirectories) => {
            collectionDirectories.forEach(dir => {
                collections[dir.name] = []
                fs.readdirSync(`${dir.path}/${dir.name}`, { withFileTypes: true }).filter(file => file.name.includes('.md')).forEach(file => {
                    const matterData = matter.read(`${file.parentPath}/${file.name}`);
                    eleventyDB.ItemMetadata.create({
                        collection: dir.name,
                        name: file.name,
                        data: matterData.data,
                        path: matterData.path,
                        parentPath: file.parentPath
                    })
                })
            })
            return collections
        }

        console.log(selectedSiteDir, "this is the dir")
        const eleventyRootDirs = fs.readdirSync(selectedSiteDir, { withFileTypes: true }).filter(dirFile => dirFile.isDirectory())

        const collectionDirs = eleventyRootDirs.filter(dir => isDirCollection(selectedSiteDir, dir.name));
        collectionDirectories = collectionDirs.map(dir => `${dir.path}/${dir.name}`)
        let eleventyStructure = {
            rootPath: selectedSiteDir,
            code: eleventyRootDirs.filter(dir => dir.name[0] == '_'),
            collections: collectionsFactory(collectionDirs)
        }
        const thePromise = new Promise(resolveOuter2 => {
            eleventyDB.ItemMetadata.findAll().then((res) => {
                const files = res.map(({ dataValues }) => dataValues)
                let structuredCollections = eleventyStructure['collections'];

                files.forEach(file => {
                    let currentColllection = structuredCollections[file.collection];
                    if (currentColllection)
                        structuredCollections[file.collection].push(file);
                    else
                        structuredCollections[file.collection] = [file];
                });
                eleventyStructure['collections'] = structuredCollections;
                if (resolveOuter)
                    resolveOuter(eleventyStructure);
                resolveOuter2(eleventyStructure)
            })
        })

        const configFilePath = `${selectedSiteDir}/_11tycms.json`
        if(fs.existsSync(configFilePath)){
            console.log("11tyCMS config FOUND!")
            site11tyCMSConfig = JSON.parse(await fs.readFileSync(configFilePath, 'utf8'))
        } 
        else{
            console.log("11tyCMS config not found, creating new one")
            filesFuncs._writeDataFile(configFilePath, {});
        }
            
        refreshCollectionWatcher()
        return thePromise
    },
    openDirectoryWithDialog: async () => {
        //response.filePaths[0]+'/'+fileName
        return new Promise(resolveOuter => {
            dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then((response) => functions.openDirectory(response.filePaths[0], resolveOuter))
        });
    },
    getSiteConfig: ()=>{
        return site11tyCMSConfig
    },
    setSiteConfig: (data)=>{
        console.log("this is the config data coming into the ufnction", data);
        return fs.writeFileSync(`${eleventyDir}/_11tycms.json`, JSON.stringify(data));
    },
    _getSiteInfoFilePath: async ()=>{
        const infoFile = await fs.readdirSync(`${eleventyDir}/_data/`, {withFileTypes:true}).filter(file=>(file.name.endsWith(".js") || file.name.endsWith(".jsx") || file.name.endsWith('.json')) && (file.name.includes('site.') || file.name.includes('metadata.')))[0];
        if(infoFile.length == 0)
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
        
        siteInfoPath = await functions._getSiteInfoFilePath();
        siteInfoData = await filesFuncs._importDataFile(siteInfoPath)
        return { ...siteInfoData, ...otherData };
    },
    setSiteInfo: async (data)=>{
        console.log(data);
        const writeFileResult = fs.writeFileSync(siteInfoPath, JSON.stringify(data));
        siteInfoData = data;
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
        console.log("Deleting collection at ", `${eleventyDir}/${name}`)
        const status = await fs.rmSync(`${eleventyDir}/${name}`, { recursive: true, force: true });

        refreshCollectionWatcher();
        return status;
    },
    buildSite: (path) => {
        console.log('building the site')
        return new Promise((resolve) => {
            child_process.exec(site11tyCMSConfig.build, { cwd: path }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    publishSite: async (path) => {
        return new Promise((resolve) => {
            child_process.exec(site11tyCMSConfig.publish, { cwd: `${path}/_site` }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    _getSelectedEleventySiteDir: () => eleventyDir
}

export default functions;