import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'node:fs';
import * as matter from 'gray-matter';
import chokidar from 'chokidar';
import path from 'node:path';
import { CMSDatabase } from './database/models';
const { Sequelize, DataTypes } = require('sequelize');
const child_process = require('child_process')
const sequelize = new Sequelize('sqlite::memory:');

let collectionDirectories = [];
let collectionWatcher = null;
let browserWindow = null;
let eleventyDir = null;
let collections = {}
let eleventyDB = new CMSDatabase(sequelize);
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,

    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // app.whenReady().then(()=>{
  //   protocol.handle('eleventy', (request)=>{
  //     console.log("eleventy")
  //     return net.fetch('file://' + request.url.slice('eleventy://'.length))
  //   });
  // })

  // Register the protocol handler ONCE
  protocol.handle('eleventy', (request) => {
    console.log(`%c[Eleventy Protocol] Fetching: %c${request.url}%c from 11ty directory: %c ${eleventyDir}`, "color:cyan; font-weight:bold;", "font-style:italic;", "color:cyan; font-weight:bold;")

    // Check if user has selected a directory
    if (!eleventyDir) {
      console.log("[Eleventy Protocol] No directory selected yet");
      return new Response('No directory selected', { status: 404 });
    }

    // Get the file path from the URL
    const relativePath = request.url.slice('eleventy://'.length);
    const fullPath = path.join(eleventyDir, relativePath);

    console.log("[Eleventy Protocol] Serving file:", fullPath);

    // Security check - make sure file is within selected directory
    if (!fullPath.startsWith(eleventyDir)) {
      return new Response('Access denied', { status: 403 });
    }

    return net.fetch('file://' + fullPath);
  });


  const openDir = async () => {
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
              collections[dir.name].push({ ...file, path: matterData.path, data: matterData.data })
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
          let structuredCollections = {}
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

        if (collectionWatcher)
          collectionWatcher.close();

        collectionWatcher = chokidar.watch(collectionDirectories, { persistent: true, ignoreInitial: true });
        collectionWatcher
          .on('add', path => browserWindow.webContents.send('collectionFileAdded', {
            path,
            file: matter.read(path),
            collection: (() => {
              const lastSlashIndex = path.lastIndexOf('/')
              let string = path.substring(0, lastSlashIndex);
              let splitPath = string.split('/');
              return splitPath[splitPath.length - 1];
            })()
          }))
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
      })
    });
  }

  const openFile = (event, filePath) => {
    let explodedPath = filePath.split('/');
    let collection = explodedPath[explodedPath.length - 2]
    let fileName = explodedPath[explodedPath.length - 1];
    let fileData = matter.read(filePath);
    const regex = /!\[(.*?)\]\((?!https?:\/\/)(.*?)\)/g;
    let content = fileData.content
    content = content.replace(regex, (fullMatch, altText, relativeUrl) => {
      return `![${altText}](${"eleventy://"}${relativeUrl})`;
    })
    fileData.content = content
    return new Promise(resolve => {
      eleventyDB.ItemMetadata.findAll({
        where: {
          collection,
          name: fileName
        }
      }).then(results => {
        results = results.map(item=>item.dataValues)[0]['data'];
        fileData.data = results
        resolve(fileData);
      })
    });
  }

  const saveFile = (event, path, metadata, contents) => {
    let content = contents.replace(/eleventy:\/\//g, "");
    let explodedPath = path.split('/');
    let collection = explodedPath[explodedPath.length - 2]
    let fileName = explodedPath[explodedPath.length - 1];
    const metadataWithDate = metadata.date ? metadata : { ...metadata, date: new Date().toString() }
    eleventyDB.ItemMetadata.update({data:metadataWithDate}, { where: { name: fileName, collection: collection } })
    const fileContents = matter.stringify(content, metadataWithDate);
    console.log("Creating/writing file at " + path)
    return fs.writeFileSync(path, fileContents);
  }
  const saveFileMetadata = (event, path, metadata) => {
    let file = matter.read(path);
    const data = { ...file.data, metadata };
    saveFile(null, path, metadata, file.content);
  }

  const saveImage = (event, path, file) => {
    console.log("Creating image at " + path)
    return fs.writeFileSync(path, Buffer.from(file));
  }

  const renameFile = (event, beforePath, afterPath) => {
    console.log("Renaming file from/to: ", beforePath, afterPath);
    let explodedPathBefore = beforePath.split('/');
    let explodedPathAfter = afterPath.split('/');
    let collection = explodedPath[explodedPathBefore.length - 2]
    let fileNameBefore = explodedPath[explodedPathBefore.length - 1];
    let fileNameAfter = explodedPath[explodedPathAfter.length - 1];
    eleventyDB.ItemMetadata.update({ name: fileNameAfter }, { where: { name: fileNameBefore, collection: collection } })
    return fs.rename(beforePath, afterPath, () => { });
  }
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
  const getSiteInfo = async (event, path) => {
    let otherData = {
    }
    const favicon = await getFavicon(path)
    otherData['base64Favicon'] = imageToBase64(favicon, '.svg')
    return { ...JSON.parse(await fs.readFileSync(`${path}/_data/site.json`, 'utf8')), ...otherData };
  }
  const buildSite = (event, path) => {
    return new Promise((resolve) => {
      console.log("my cwd", path);
      child_process.exec('npx @11ty/eleventy', { cwd: path }, function (err, stdout, stderr) {
        resolve(err, stdout, stderr);
      });
    })
  }

  const publishSite = async (event, path) => {
    return new Promise((resolve) => {
      child_process.exec('/Users/jessie/.gem/ruby/3.4.0/bin/neocities push .', { cwd: `${path}/_site` }, function (err, stdout, stderr) {
        console.log(stdout, stderr);
        resolve(err, stdout, stderr);
      });
    })
  }

  ipcMain.handle('dialog:openDir', openDir)
  ipcMain.handle('dialog:openFile', openFile)
  ipcMain.handle('file:save', saveFile)
  ipcMain.handle('file:saveMetadata', saveFileMetadata);
  ipcMain.handle('file:saveImage', saveImage)
  ipcMain.handle('file:rename', renameFile)
  ipcMain.handle('site:getSiteInfo', getSiteInfo);
  ipcMain.handle('site:build', buildSite);
  ipcMain.handle('site:publish', publishSite);


  // IPC test


  browserWindow = createWindow()
  console.log('window created');
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    collectionWatcher.close()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
