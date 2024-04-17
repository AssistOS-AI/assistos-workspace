const apiModules={
    get document(){
        const module=require('./apis/document.js');
        Object.defineProperty(apiModules,'documentApis',{value:module,writable:false,configurable:true});
        return module;
    },
    get chapter(){
        const module=require('./apis/chapter.js');
        Object.defineProperty(apiModules,'chapterApis',{value:module,writable:false,configurable:true});
        return module;
    },
    get paragraph(){
        const module=require('./apis/paragraph.js');
        Object.defineProperty(apiModules,'paragraphApis',{value:module,writable:false,configurable:true});
        return module;
    }
}
const dataModules={
    templates:{
        get document(){
            const data=require('./data/templates/document.json');
            Object.defineProperty(dataModules,'documentTemplate',{value:data,writable:false,configurable:true});
            return data;
        }
    }
}
function loadAPIs(...apiNames) {
    if (apiNames.length === 0) {
        apiNames = Object.keys(apiModules);
    }
    if (apiNames.length === 1) {
        const api = apiModules[apiNames];
        if (!api) {
            throw new Error(`API '${apiNames}' not found`);
        }
        return api;
    }
    const selectedApis = {};
    for (const name of apiNames) {
        if (!apiModules[name]) {
            throw new Error(`API '${name}' not found`);
        }
        selectedApis[name] = apiModules[name];
    }
    return selectedApis;
}

function loadData(...dataTypes) {
    if (dataTypes.length === 0) {
        dataTypes = Object.keys(dataModules);
    }
    if (dataTypes.length === 1) {
        const data = dataModules[dataTypes[0]];
        if (!data) {
            throw new Error(`Data '${dataTypes[0]}' not found`);
        }
        return data;
    }
    const selectedData = {};
    for (const type of dataTypes) {
        if (!dataModules[type]) {
            throw new Error(`Data '${type}' not found`);
        }
        selectedData[type] = dataModules[type];
    }
    return selectedData;
}

module.exports = { loadAPIs, loadData };
