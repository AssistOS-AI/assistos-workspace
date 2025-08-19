const path = require("path");
const fsPromises = require("fs/promises");
const appFolders = {
    WEB_COMPONENTS: "web-components",
    WIDGETS: "Chat Widgets",
    PERSISTO: "Persisto",
    BACKEND_PLUGINS: "Backend Plugins",
    DOCUMENT_PLUGINS: "Document Plugins"
}

async function WebAssistant() {
    const self = {};
    self.getCodePath = function (folder, fileName) {
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, "vibe-code", folder, fileName);
    }

    self.saveCode = async function (folder, fileName, code) {
        const dir = path.dirname(self.getCodePath(folder, fileName));
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
            components: []
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

    self.getWidgets = async function () {
        return [];
    };

    self.getWidget = async function (widgetName) {
        const parts = widgetName.split('/');
        if(parts.length === 1){
            const defaultWidgetPath = path.resolve(
                process.env.SERVERLESS_ROOT_FOLDER,
                "../../..",
                `wallet/widgets/${widgetName}.html`
            );
            let widget = await fsPromises.readFile(defaultWidgetPath, "utf-8");
            return widget;
        } else {
            let appName = parts[0];
            let name = parts[1];
        }
    };
    self.listWidgets = async function(appName){
        let widgetsPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName, appFolders.WIDGETS);
        let widgets = await fsPromises.readdir(widgetsPath);
        return widgets;
    }
    self.updateWidget = async function (widgetId, widget) {

    };

    self.deleteWidget = async function (pageId) {
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
