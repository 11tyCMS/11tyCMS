const { app } = require('electron');
import files from './functions/files';
import site from './functions/site'

let exposedFunctions = {}

const exposeChannelFunction = (func, channelName) => {
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
        exposeChannelFunction(functionsByChannels[channelParentName][childFuncKey], `${channelParentName}:${childFuncKey}`)
    }
}
export default exposedFunctions