const { app } = require('electron');
import * as matter from 'gray-matter';
import files from './functions/files';
import site from './functions/site'
import fs from 'node:fs';

let exposedFunctions = {

}
const registerExposedFunction = (func, channelName) => {
    exposedFunctions[`${channelName}`] = func;
}

let functions = {
    files,
    site
}

for (const channelParentName in functions) {
    for(const childFuncKey in functions[channelParentName]){
        if(childFuncKey.startsWith("_")){
            continue;
        }
        console.log("Registering ", childFuncKey, " under ", channelParentName)
        registerExposedFunction(functions[channelParentName][childFuncKey], `${channelParentName}:${childFuncKey}`)
    }
}
console.log(exposedFunctions)
export default exposedFunctions