import * as matter from 'gray-matter';
import fs from 'node:fs';
import mainWindow from '../main/window';
const functions = {
    openFile: (filePath, eleventyDB) => {
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
                results = results.map(item => item.dataValues)[0]['data'];
                fileData.data = results
                resolve(fileData);
            })
        });
    },
    saveFile: (path, metadata, contents, eleventyDB) => {
        const browserWindow = mainWindow.get()
        let content = contents.replace(/eleventy:\/\//g, "");
        let explodedPath = path.split('/');
        let collection = explodedPath[explodedPath.length - 2]
        let fileName = explodedPath[explodedPath.length - 1];
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

            let parentPath = [...explodedPath];
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
            //browserWindow.webContents.send('collectionFileModified', {collection, fileName, metadata:metadataWithDate})
            console.log("Creating/writing file at " + path)
            return fs.writeFileSync(path, fileContents);
        }
    },
    renameFile: (beforePath, afterPath, eleventyDB) => {
        console.log("Renaming file from/to: ", beforePath, afterPath);
        let explodedPathBefore = beforePath.split('/');
        let explodedPathAfter = afterPath.split('/');
        let collection = explodedPath[explodedPathBefore.length - 2]
        let fileNameBefore = explodedPath[explodedPathBefore.length - 1];
        let fileNameAfter = explodedPath[explodedPathAfter.length - 1];
        eleventyDB.ItemMetadata.update({ name: fileNameAfter }, { where: { name: fileNameBefore, collection: collection } })
        return fs.rename(beforePath, afterPath, () => { });
    },
    deleteFile: async (path) => {
        return fs.unlinkSync(path)
    },
    saveFileMetadata: (path, metadata, ...args) => {
        let file = matter.read(path);
        functions.saveFile(path, metadata, file.content, ...args);
    },
    saveImage: (path, file) => {
        console.log("Creating image at " + path)
        return fs.writeFileSync(path, Buffer.from(file));
    },
    _imageToBase64: (file, ext) => {
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
                console.warn(`Unknown image type for ${imagePath}. Defaulting to image/jpeg.`);
                mimeType = 'image/jpeg';
        }

        return `data:${mimeType};base64,${base64String}`;
    }
}

export default functions;