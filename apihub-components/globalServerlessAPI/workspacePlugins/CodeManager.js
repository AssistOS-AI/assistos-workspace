const path = require("path");
const fsPromises = require("fs/promises");
const appFolders = {
    WEB_COMPONENTS: "web-components",
    PERSISTO: "Persisto",
    BACKEND_PLUGINS: "Backend Plugins",
    DOCUMENT_PLUGINS: "Document Plugins"
}

async function WebAssistant() {
    const self = {};
    self.getCodePath = function (appName, folder, fileName) {
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, folder, fileName);
    }

    self.saveCode = async function (appName, folder, fileName, code) {
        const dir = path.dirname(self.getCodePath(appName, folder, fileName));
        try {
            await fsPromises.access(dir);
        } catch (e) {
            await fsPromises.mkdir(dir, {recursive: true});
        }
        await fsPromises.writeFile(path.join(dir, fileName), code);
    }

    self.createApp = async function (appName) {
        let appPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName);
        for (let folder of Object.values(appFolders)) {
            let folderPath = path.join(appPath, folder);
            try {
                await fsPromises.access(folderPath);
            } catch (e) {
                await fsPromises.mkdir(folderPath, {recursive: true});
            }
        }

        const manifestTemplate = {
            applicationName: appName,
            entryPoint: `${appName}-landing`,
            componentsDirPath: "WebSkel Components",
        }
        await fsPromises.writeFile(path.join(appPath, "manifest.json"), JSON.stringify(manifestTemplate));
    }
    self.getApps = async function(){
        let apps = [];
        let appsPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications");
        let apssDirs = await fsPromises.readdir(appsPath);
        for(let app of apssDirs){
            let manifest = await fsPromises.readFile(path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`, app, "manifest.json"), 'utf8');
            manifest = JSON.parse(manifest);
            if(!manifest.systemApp){
                apps.push(manifest.applicationName);
            }
        }
        return apps;
    }
    /*

        self.saveWebskelComponent = async function (fileName, componentData) {
            let items = Object.keys(componentData);
            if (!items || items.length === 0 || !componentData.html || !componentData.css) {
                throw new Error("Invalid component data");
            }
            try {
                for (let componentItem of items) {
                    await self.saveCode(`${fileName}/${fileName}.${componentItem}`, componentData[componentItem]);
                    return true;
                }
            } catch (e) {
                return false;
            }
        }
    */

    self.getCode = async function (fileName) {
        return await fsPromises.readFile(self.getCodePath(fileName), "utf-8");
    }

    self.listWebComponents = async function(appName){
        let componentsPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, appFolders.WEB_COMPONENTS);
        return await fsPromises.readdir(componentsPath);
    }

    self.deleteWebComponent = async function (appName, componentName) {
        //TODO delete ref from chatScript also
    };

    self.getPublicMethods = function () {
        return []
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await WebAssistant();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["DefaultPersistence", "ChatScript", "ChatRoom"];
    }
};
