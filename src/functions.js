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

let functionsByChannels = {
    files,
    site
}

for (const channelParentName in functionsByChannels) {
    for(const childFuncKey in functionsByChannels[channelParentName]){
        if(childFuncKey.startsWith("_")){
            continue;
        }
        console.log("Registering ", childFuncKey, " under ", channelParentName)
        registerExposedFunction(functionsByChannels[channelParentName][childFuncKey], `${channelParentName}:${childFuncKey}`)
    }
}
console.log(exposedFunctions)
export default exposedFunctions