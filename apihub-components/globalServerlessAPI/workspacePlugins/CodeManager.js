const path = require("path");
const fsPromises = require("fs/promises");
const constants = require("../constants.js");
const git = require("../../apihub-component-utils/git");
async function CodeManager() {
    const self = {};
    function getAppPath(appName){
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName);
    }
    self.createApp = async function (appName) {
        if(!process.env.ORGANISATION_NAME){
            throw new Error("ORGANISATION_NAME is not set!");
        }
        if(!process.env.GITHUB_TOKEN){
            throw new Error("GITHUB_TOKEN is not set!");
        }
        let appPath = getAppPath(appName)
        for (let folder of Object.values(constants.APP_FOLDERS)) {
            let folderPath = path.join(appPath, folder);
            try {
                await fsPromises.access(folderPath);
            } catch (e) {
                await fsPromises.mkdir(folderPath, {recursive: true});
            }
        }
        function toKebabCase(str) {
            if (!str) return '';
            return str
                .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
                .replace(/\s+/g, '-')
                .toLowerCase();
        }
        const landingPageName = toKebabCase(appName) + "-landing";
        const manifestTemplate = {
            applicationName: appName,
            entryPoint: landingPageName,
            componentsDirPath: constants.APP_FOLDERS.WEB_COMPONENTS,
            repository: `https://github.com/${process.env.ORGANISATION_NAME}/${appName}.git`
        }
        await fsPromises.writeFile(path.join(appPath, "manifest.json"), JSON.stringify(manifestTemplate, null, 4));
        let entryComponentPath = path.join(appPath, constants.APP_FOLDERS.WEB_COMPONENTS, landingPageName);
        await fsPromises.mkdir(entryComponentPath, {recursive: true});
        await fsPromises.writeFile(path.join(entryComponentPath, `${landingPageName}.html`), constants.HTML_TEMPLATE);
        await fsPromises.writeFile(path.join(entryComponentPath, `${landingPageName}.css`), "");
        await fsPromises.writeFile(path.join(entryComponentPath, `${landingPageName}.js`), constants.PRESENTER_TEMPLATE);
        await git.createAndPublishRepo(appName, appPath, "", false);
        return appName;
    }
    self.deleteApp = async function (appName) {
        let apps = require("../applications.json");
        let app = apps.find(app => app.name === appName);
        if (app) {
            throw new Error(`Trying to delete default app ${appName}. This operation is not permitted!`);
        }
        await git.deleteAppRepo(appName);
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
        let componentPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName);
        try {
            await fsPromises.access(componentPath);
        }catch (e){
            throw new Error(`Component ${componentName} not found`);
        }
        let html = await fsPromises.readFile(path.join(componentPath, `${componentName}.html`), "utf-8");
        let css = await fsPromises.readFile(path.join(componentPath, `${componentName}.css`), "utf-8");
        let js = await fsPromises.readFile(path.join(componentPath, `${componentName}.js`), "utf-8");
        return {html, css, js};
    }
    self.saveComponent = async function (appName, componentName, html, css, js, newName) {
        let componentPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName);
        if(newName){
            let newHTMLPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName, `${newName}.html`);
            let newCSSPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName, `${newName}.css`);
            let newJSPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName, `${newName}.js`);
            await fsPromises.rename(path.join(componentPath, `${componentName}.html`), newHTMLPath);
            await fsPromises.rename(path.join(componentPath, `${componentName}.css`), newCSSPath);
            await fsPromises.rename(path.join(componentPath, `${componentName}.js`), newJSPath);
            //rename dir
            let newComponentPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, newName);
            await fsPromises.rename(componentPath, newComponentPath);
            componentPath = newComponentPath;
            componentName = newName;
        }
        try {
            await fsPromises.access(componentPath);
        } catch (e){
            await fsPromises.mkdir(componentPath, {recursive: true});
        }
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.html`), html);
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.css`), css);
        await fsPromises.writeFile(path.join(componentPath, `${componentName}.js`), js);
    }
    self.deleteComponent = async function (appName, componentName) {
        let componentPath = path.join(getAppPath(appName), constants.APP_FOLDERS.WEB_COMPONENTS, componentName);
        await fsPromises.rm(componentPath, {recursive: true});
        //TODO delete ref from chatScript also
    };
    self.listComponents = async function(){
        let appsPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications");
        let appsDirs = await fsPromises.readdir(appsPath);
        let components = [];
        for(let appName of appsDirs){
            let componentsPath = path.join(appsPath, appName, constants.APP_FOLDERS.WEB_COMPONENTS);
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
        let itemTypePath = path.join(getAppPath(appName), itemType);
        let items = [];
        try {
            await fsPromises.access(itemTypePath);
        } catch (e) {
            return items;
            //doesnt have that type
        }
        let names = await fsPromises.readdir(itemTypePath);
        for(let name of names){
            if(name.endsWith(".js")){
                name = name.slice(0, -3);
            }
            if(name.endsWith(".json")){
                name = name.slice(0, -5);
            }
            if(name.endsWith(".css")){
                name = name.slice(0, -4);
            }
            items.push(name);
        }
        return items;
    }
    self.listComponentsForApp = async function(appName){
        return await listAppItems(appName, constants.APP_FOLDERS.WEB_COMPONENTS);
    }
    self.listBackendPluginsForApp = async function(appName){
        return await listAppItems(appName, constants.APP_FOLDERS.BACKEND_PLUGINS);
    }
    self.listDocumentPluginsForApp = async function(appName){
        return await listAppItems(appName, constants.APP_FOLDERS.DOCUMENT_PLUGINS);
    }
    self.listThemesForApp = async function(appName){
        return await listAppItems(appName, constants.APP_FOLDERS.THEMES);
    }
    self.getTheme = async function(appName, themeName){
        let themePath = path.join(getAppPath(appName), constants.APP_FOLDERS.THEMES, `${themeName}.css`);
        try {
            await fsPromises.access(themePath);
        }catch (e){
            throw new Error(`Theme ${themeName} not found`);
        }
        return await fsPromises.readFile(themePath, "utf8");
    }
    self.saveTheme = async function(appName, themeName, content, newName){
        let themePath = path.join(getAppPath(appName), constants.APP_FOLDERS.THEMES, `${themeName}.css`);
        if(newName){
            let newThemePath = path.join(getAppPath(appName), constants.APP_FOLDERS.THEMES, `${newName}.css`);
            await fsPromises.rename(themePath, newThemePath);
            themePath = newThemePath;
        }
        await fsPromises.writeFile(themePath, content);
    }
    self.deleteTheme = async function(appName, themeName){
        let themePath = path.join(getAppPath(appName), constants.APP_FOLDERS.THEMES, `${themeName}.css`);
        await fsPromises.rm(themePath);
    }
    self.getBackendPlugin = async function(appName, pluginName){
        let pluginPath = path.join(getAppPath(appName), appName, constants.APP_FOLDERS.BACKEND_PLUGINS, `${pluginName}.js`);
        try {
            await fsPromises.access(pluginPath);
        }catch (e){
            throw new Error(`Backend plugin ${pluginName} not found`);
        }
        return await fsPromises.readFile(pluginPath, "utf8");

    }
    self.saveBackendPlugin = async function(appName, pluginName, content, newName){
        let pluginPath = path.join(getAppPath(appName), constants.APP_FOLDERS.BACKEND_PLUGINS, `${pluginName}.js`);
        if(newName){
            let newPluginPath = path.join(getAppPath(appName), constants.APP_FOLDERS.BACKEND_PLUGINS, `${newName}.js`);
            await fsPromises.rename(pluginPath, newPluginPath);
            pluginPath = newPluginPath;
        }
        await fsPromises.writeFile(pluginPath, content);
    }
    self.deleteBackendPlugin = async function(appName, pluginName){
        let pluginPath = path.join(getAppPath(appName), constants.APP_FOLDERS.BACKEND_PLUGINS, `${pluginName}.js`);
        await fsPromises.rm(pluginPath);
    }
    self.getAppRepoStatus = async function(appName){
        let appPath = getAppPath(appName);
        let status = await git.getRepoStatus(appPath);
        return status;
    }
    self.commitAndPush = async function(appName, commitMessage){
        let appPath = getAppPath(appName);
        let status = await git.commitAndPush(appPath, commitMessage);
        return status;
    }
    self.getPublicMethods = function () {
        return []
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await CodeManager();
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
