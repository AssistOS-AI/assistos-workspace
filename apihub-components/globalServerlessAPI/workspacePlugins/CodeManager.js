const path = require("path");
const fsPromises = require("fs/promises");
async function WebAssistant() {
    const self = {};
    self.getCodePath = function(fileName){
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, "vibe-code", fileName);
    }
    self.saveCode = async function(fileName, code){
        await fsPromises.writeFile(self.getCodePath(fileName), code);
    }
    self.getCode = async function(fileName){
        return await fsPromises.readFile(self.getCodePath(fileName), "utf-8");
    }

    self.listWidgets = async function () {

    };

    self.getWidget = async function (widgetId) {

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