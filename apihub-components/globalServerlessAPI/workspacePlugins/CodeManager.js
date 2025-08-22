const path = require("path");
const fsPromises = require("fs/promises");
const appFolders = {
    WEB_COMPONENTS: "web-components",
    BACKEND_PLUGINS: "backend-plugins",
    DOCUMENT_PLUGINS: "document-plugins"
}
const PERSISTO_CONFIG = "persistoConfig.json";
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
        await fsPromises.writeFile(path.join(appPath, PERSISTO_CONFIG), "{}");
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

    self.getComponent = async function (appName, componentName) {
        let componentPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, appFolders.WEB_COMPONENTS, componentName);
        try {
            await fsPromises.access(componentPath);
        }catch (e){
            throw new Error("Component not found");
        }
        let html = await fsPromises.readFile(path.join(componentPath, `${componentName}.html`), "utf-8");
        let css = await fsPromises.readFile(path.join(componentPath, `${componentName}.css`), "utf-8");
        let js = await fsPromises.readFile(path.join(componentPath, `${componentName}.js`), "utf-8");
        return {html, css, js};
    }
    self.saveComponent = async function (appName, componentName, html, css, js) {
        let componentPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, appFolders.WEB_COMPONENTS, componentName);
        try {
            await fsPromises.access(componentPath);
        } catch (e){
            await fsPromises.mkdir(componentPath, {recursive: true});
        }
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.html`), html);
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.css`), css);
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.js`), js);
    }


    self.getCode = async function (fileName) {
        return await fsPromises.readFile(self.getCodePath(fileName), "utf-8");
    }

    self.listComponents = async function(){
        let appsPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications");
        let appsDirs = await fsPromises.readdir(appsPath);
        let components = [];
        for(let appName of appsDirs){
            let componentsPath = path.join(appsPath, appName, appFolders.WEB_COMPONENTS);
            try {
                await fsPromises.access(componentsPath);
            } catch (e) {
                //doesnt have web-components folder
                continue;
            }
            let componentNames = await fsPromises.readdir(componentsPath);
            for(let componentName of componentNames){
                components.push({componentName, appName})
            }
        }
        return components;
    }
    async function listAppItems(appName, itemType){
        let itemTypePath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, itemType);
        let items = [];
        try {
            await fsPromises.access(itemTypePath);
        } catch (e) {
            return items;
            //doesnt have that type
        }
        let names = await fsPromises.readdir(itemTypePath);
        for(let name of names){
            items.push(name);
        }
        return items;
    }
    self.listComponentsForApp = async function(appName){
        return await listAppItems(appName, appFolders.WEB_COMPONENTS);
    }
    self.listBackendPluginsForApp = async function(appName){
        return await listAppItems(appName, appFolders.BACKEND_PLUGINS);
    }
    self.listDocumentPluginsForApp = async function(appName){
        return await listAppItems(appName, appFolders.DOCUMENT_PLUGINS);
    }
    self.getAppPersistoConfig = async function(appName){
        let persistoPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, PERSISTO_CONFIG);
        let persistoConfig = await fsPromises.readFile(persistoPath, "utf8");
        return JSON.parse(persistoConfig);
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
