const path = require("path");
const fsPromises = require("fs/promises");

async function WebAssistant() {
    const self = {};
    self.getCodePath = function (fileName) {
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, "vibe-code", fileName);
    }
    self.saveCode = async function (fileName, code) {
        const dir = path.dirname(self.getCodePath(fileName));
        try {
            await fsPromises.access(dir);
        } catch (e) {
            await fsPromises.mkdir(dir, {recursive: true});
        }
        await fsPromises.writeFile(self.getCodePath(fileName), code);
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
        const [appName, name] = widgetName.split('/');

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
