const path = require("path");
const fsPromises = require("fs/promises");
const appFolders = ["WebSkel Components", "Chat Widgets", "Persisto", "Backend Plugins", "Document Plugins"]

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

    self.newApp = async function (appName) {
        let appPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "vibe-code", appName);
        try {
            await fsPromises.access(appPath);
        } catch (e) {
            await fsPromises.mkdir(appPath, {recursive: true});
        }
        for (let folder of appFolders) {
            let folderPath = path.join(appPath, folder);
            try {
                await fsPromises.access(folderPath);
            } catch (e) {
                await fsPromises.mkdir(folderPath, {recursive: true});
            }
        }
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
