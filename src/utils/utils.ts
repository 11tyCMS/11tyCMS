import Module from "node:module";
import path from "node:path";
import fs from 'node:fs';
import {writeFile, parseModule, loadFile} from 'magicast';
import { pathToFileURL } from "node:url";

async function requireUncached(modulePath: string): Promise<Module> {
    const cacheBuster = `?update=${Date.now()}`;
    const module = await import(pathToFileURL(modulePath).toString() + cacheBuster);
    return module.default;
}

type SupportedDataFileExtension = "js" | "jsx" | "ts" | "json";

const doesFileExtensionMatch = (path:string, ext:SupportedDataFileExtension | SupportedDataFileExtension[]) => {
    console.log('Checking if ', path, 'is of type(s)', ext);
    const splitPath = path.split('.');
    const fileExtension:SupportedDataFileExtension = splitPath[splitPath.length - 1] as SupportedDataFileExtension;
    console.log("found ext:", fileExtension);
    if (typeof ext == "string")
        return fileExtension == ext
    if (Array.isArray(ext))
        return ext.includes(fileExtension);
}

type SupportedImageExtension = ".png" | '.jpeg' | '.jpg' | '.gif' | '.svg' | '.webp';
type SupportedMimeType = "image/png" | "image/jpeg" | "image/gif" | "image/svg+xml" | "image/webp";

export const imageToBase64 = (fileContents: string, ext: SupportedImageExtension): string => {
    const base64: string = Buffer.from(fileContents, 'utf8').toString('base64');
    let mimeType: SupportedMimeType;
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
            console.warn(`Unknown image type for this image. Defaulting to image/jpeg.`);
            mimeType = 'image/jpeg';
    }
    return `data:${mimeType};base64,${base64}`;
}

export const importDataFile = async (dataFilePath: string, encoding: BufferEncoding = "utf8"): Promise<any> => {
    const extension = path.extname(dataFilePath);
    
    switch (extension) {
        case '.js':
        case '.jsx':
            return await requireUncached(dataFilePath);
            break;
        case '.json':
            console.log("importnig the freakin json")
            return JSON.parse(await fs.readFileSync(dataFilePath, encoding))
            break;
        default:
            throw new Error("Not a supported file format. Supported files are: .js .jsx and .json")
            break;
    }
}

export const writeDataFile = async (path:string, data:any, shallow:boolean = false, encoding:BufferEncoding = "utf8") => {
    if (await fs.existsSync(path)) {
        const isJsFile = doesFileExtensionMatch(path, ["js", 'jsx', 'ts']);
        async function writeFile(path:string, data:any) {
            if (isJsFile) {
                console.log("javascript file so writing js")
                const jsFile = parseModule((await fs.readFileSync(path, { encoding })))
                for (const key in data) {
                    jsFile.exports.default[key] = data[key];
                }
                return await writeFile(jsFile, path);
            } else {
                console.log("not javascript file so writing json")
                return fs.writeFileSync(path, JSON.stringify(data));;
            }
        }

        if (shallow) {
            let existingData;
            if (!isJsFile)
                existingData = JSON.parse(await fs.readFileSync(path, encoding));
            else
                existingData = (await loadFile(path)).exports.default;
            existingData = { ...existingData, ...data }
            return await writeFile(path, existingData);
        } else {
            return await writeFile(path, data);
        }
    }
    else
        throw new Error(`File "${path}" does not exist!`)
}