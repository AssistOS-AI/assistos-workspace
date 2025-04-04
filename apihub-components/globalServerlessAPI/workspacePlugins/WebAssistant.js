async function WebAssistant
() {
    const self = {};

    //const AgentPlugin = await $$.loadPlugin("AgentWrapper");
self.getWebChatThemes = async function () {

}

self.getWebChatTheme = async function (themeId) {

}
self.addWebChatTheme = async function (theme) {

}
self.updateWebChatTheme = async function (themeId, theme) {

}

self.deleteWebAssistantTheme = async function ( themeId) {

}

    self.getWebChatConfiguration = async function (spaceId) {
        return
    }

    self.updateWebChatConfiguration = async function (spaceId, settings) {

    }

    self.addWebAssistantConfigurationPage = async function (spaceId, page) {

    }

    self.getWebAssistantConfigurationPages = async function (spaceId) {

    }

    self.getWebAssistantConfigurationPage = async function (spaceId, pageId) {

    }

    self.updateWebAssistantConfigurationPage = async function (spaceId, pageId, page) {

    }

    self.deleteWebAssistantConfigurationPage = async function (spaceId, pageId) {

    }

    self.getWebAssistantHomePage = async function (spaceId) {

    }

    self.getWebAssistantConfigurationPageMenuItem = async function (spaceId, menuItemId) {

    }

    self.getWebAssistantConfigurationPageMenu = async function (spaceId) {

    }

    self.addWebAssistantConfigurationPageMenuItem = async function (spaceId, pageId, menuItem) {

    }

    self.updateWebAssistantConfigurationPageMenuItem = async function (spaceId, pageId, menuItemId, menuItem) {

    }

    self.deleteWebAssistantConfigurationPageMenuItem = async function (spaceId, pageId, menuItemId) {

    }

    self.getWidget = async function (spaceId, applicationId, widgetName) {

    }






    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
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
        return [];
    }
}