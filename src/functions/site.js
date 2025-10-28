import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
import eleventyDb from '../main/database/eleventyDb';
import chokidar from 'chokidar';
import path from 'node:path';
import { join } from 'path'
const child_process = require('child_process')
let collectionDirectories = [];
let collectionWatcher = null;
let eleventyDir = null;
let collections = {}
const getFavicon = async (sitePath) => {
    return await fs.readFileSync(`${sitePath}/media/favicon.svg`, 'utf8')
}
const imageToBase64 = (file, ext) => {
    const base64String = Buffer.from(file, 'utf8').toString('base64');
    let mimeType;
    switch (ext) {
        case '.png':
            mimeType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            mimeType = 'image/jpeg';
            break;
        case '.gif':
            mimeType = 'image/gif';
            break;
        case '.svg':
            mimeType = 'image/svg+xml';
            break;
        case '.webp':
            mimeType = 'image/webp';
            break;
        default:
            // Fallback for unknown types, or you can throw an error
            console.warn(`Unknown image type for ${imagePath}. Defaulting to image/jpeg.`);
            mimeType = 'image/jpeg';
    }

    // 4. Construct the Base64 data URL
    return `data:${mimeType};base64,${base64String}`;
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
    openDirectory: async () => {
        const eleventyDB = eleventyDb.get();
        let browserWindow = mainWindow.get();
        //response.filePaths[0]+'/'+fileName
        return new Promise(resolveOuter => {
            dialog.showOpenDialog({
                properties: ['openDirectory']
            }).then((response) => {
                eleventyDir = response.filePaths[0];
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

                const eleventyRootDirs = fs.readdirSync(response.filePaths[0], { withFileTypes: true }).filter(dirFile => dirFile.isDirectory())

                const collectionDirs = eleventyRootDirs.filter(dir => isDirCollection(response.filePaths[0], dir.name));
                collectionDirectories = collectionDirs.map(dir => `${dir.path}/${dir.name}`)
                let eleventyStructure = {
                    rootPath: response.filePaths[0],
                    code: eleventyRootDirs.filter(dir => dir.name[0] == '_'),
                    collections: collectionsFactory(collectionDirs)
                }
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
                    resolveOuter(eleventyStructure);
                })

                refreshCollectionWatcher()
            })
        });
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
        otherData['base64Favicon'] = imageToBase64(favicon, '.svg')
        return { ...JSON.parse(await fs.readFileSync(`${path}/_data/site.json`, 'utf8')), ...otherData };
    },
    createCollection: async (sitePath, name, layout) => {
        console.log("creating collection at ", `${sitePath}/${name}`)
        fs.mkdirSync(`${sitePath}/${name}`);
        fs.writeFileSync(`${sitePath}/${name}/${name}.json`, JSON.stringify({ "layout": layout, tags: 'post' }))
        collectionDirectories.push(`${sitePath}/${name}`)
        refreshCollectionWatcher()
    },
    buildSite: (path) => {
        console.log('building the site')
        return new Promise((resolve) => {
            child_process.exec('npx @11ty/eleventy', { cwd: path }, function (err, stdout, stderr) {
                resolve(err, stdout, stderr);
            });
        })
    },
    publishSite: async (path) => {
        return new Promise((resolve) => {
            child_process.exec('/Users/jessie/.gem/ruby/3.4.0/bin/neocities push .', { cwd: `${path}/_site` }, function (err, stdout, stderr) {
                console.log(stdout, stderr);
                resolve(err, stdout, stderr);
            });
        })
    },
    _getEleventyDir: ()=>eleventyDir
}

export default functions;