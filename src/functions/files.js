import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
import eleventyDb from '../main/database/eleventyDb';
import { getSiteDir, getSiteConfig } from './site';
const functions = {
    openFile: (collection, fileName) => {
        console.log("finding post in", collection, "called", fileName);
        const eleventyDB = eleventyDb.get();
        return new Promise(resolve => {
            eleventyDB.ItemMetadata.findOne({
                where: {
                    collection,
                    name: fileName
                }
            }).then(result => {
                let fileData = {...matter.read(result.dataValues.path)};
                const regex = /!\[(.*?)\]\((?!https?:\/\/)(.*?)\)/g;
                let content = fileData.content
                content = content.replace(regex, (fullMatch, altText, relativeUrl) => {
                    return `![${altText}](${"eleventy://"}${relativeUrl})`;
                })
                fileData.content = content

                result = result['dataValues']['data'];
                fileData.data = result
                resolve(fileData);
            })
        });
    },
    saveFile: (collection, fileName, metadata, contents) => {
        const path = `${getSiteDir()}/${getSiteConfig().input}/${collection}/${fileName}`
        const eleventyDB = eleventyDb.get();
        const browserWindow = mainWindow.get()
        let content = contents.replace(/eleventy:\/\//g, "");
        if (fs.existsSync(path)) {
            let fileData = matter.read(path)['data'];
            const metadataWithDate = metadata ? (metadata.date ? metadata : { ...metadata, date: new Date().toISOString() }) : fileData
            eleventyDB.ItemMetadata.update({ data: metadataWithDate }, { where: { name: fileName, collection: collection } })
            const fileContents = matter.stringify(content, metadataWithDate);
            browserWindow.webContents.send('collectionFileModified', { collection, fileName, metadata: metadataWithDate })
            console.log("Creating/writing file at " + path)
            console.log("File already exists, so sending collectionFileModified out")
            return fs.writeFileSync(path, fileContents);
        } else {
            const metadataWithDate = metadata.date ? metadata : { ...metadata, date: new Date().toISOString() }
            // eleventyDB.ItemMetadata.update({data:metadataWithDate}, { where: { name: fileName, collection: collection } })
            
            let parentPath = path.split('/');
            parentPath.pop();
            parentPath = parentPath.join('/')
            eleventyDB.ItemMetadata.create({
                collection: collection,
                name: fileName,
                data: metadataWithDate,
                path: path,
                parentPath
            })
            const fileContents = matter.stringify(content, metadataWithDate);
            console.log("Creating/writing file at " + path)
            return fs.writeFileSync(path, fileContents);
        }
    },
    renameFile: (beforePath, afterPath) => {
        const eleventyDB = eleventyDb.get();
        console.log("Renaming file from/to: ", beforePath, afterPath);
        let explodedPathBefore = beforePath.split('/');
        let explodedPathAfter = afterPath.split('/');
        let collection = explodedPath[explodedPathBefore.length - 2]
        let fileNameBefore = explodedPath[explodedPathBefore.length - 1];
        let fileNameAfter = explodedPath[explodedPathAfter.length - 1];
        eleventyDB.ItemMetadata.update({ name: fileNameAfter }, { where: { name: fileNameBefore, collection: collection } })
        return fs.rename(beforePath, afterPath, () => { });
    },
    deleteFile: async (collection, fileName) => {
        return fs.unlinkSync(`${getSiteDir()}/${getSiteConfig().input}/${collection}/${fileName}`);
    },
    saveFileMetadata: (collection, fileName, metadata, ...args) => {
        const path = `${getSiteDir()}/${getSiteConfig().input}/${collection}/${fileName}`
        console.log("this is the save file metadata path", path)
        let file = matter.read(path);
        console.log('this is the savefilemetadata file', file);
        functions.saveFile(collection, fileName, metadata, file.content, ...args);
    },
    saveImage: (fileName, file) => {
        const mediaPath = getSiteConfig().media;
        const siteDir = getSiteDir();
        return fs.writeFileSync(`${siteDir}/${mediaPath}/${fileName}`, Buffer.from(file));
    },
}

export default functions;