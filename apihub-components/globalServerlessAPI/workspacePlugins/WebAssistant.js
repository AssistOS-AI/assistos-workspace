const {fsPromises} = require("fs");

 const authSettings = [
    "public",
    "existingSpaceMembers",
    "newAndExistingSpaceMembers"
]

async function WebAssistant() {
    const self = {};

    const Persistence = $$.loadPlugin("DefaultPersistence");
    const ChatScript = $$.loadPlugin("ChatScript");

    self.getWebAssistant = async function (id) {
        const webAssistant = await Persistence.getWebAssistant(id);
        return webAssistant;
    }

    self.getSettings = async function (id) {
        const {settings} = await Persistence.getWebAssistant(id);
        return settings
    }

    self.updateSettings = async function (id, settings) {
        if(!settings.authentication || !authSettings.includes(settings.authentication)){
            throw new Error(`Invalid authentication setting. Allowed values are: ${authSettings.join(", ")}`);
        }
        const config = await Persistence.getWebAssistant(id);
        config.settings = {...config.settings, ...settings};
        return await Persistence.updateWebAssistant(id, config);
    }

    self.getAuth = async function (id) {
        const settings = await self.getSettings(id);
        return settings.authentication
    }

    self.getThemes = async function (assistantId) {
        const themes = await Persistence.getEveryThemeObject();
        return themes
    };

    self.getTheme = async function (assistantId, themeId) {
        return await Persistence.getTheme(themeId);
    };

    self.addTheme = async function (assistantId, theme) {
        return await Persistence.createTheme(theme);
    };

    self.updateTheme = async function (assistantId, themeId, theme) {
        await Persistence.setNameForTheme(themeId, theme.name);
        return await Persistence.updateTheme(themeId, theme);

    };

    self.deleteTheme = async function (assistantId, themeId) {
        await Persistence.deleteTheme(themeId);
        const settings = await self.getSettings(assistantId);
        if (settings.themeId === themeId) {
            settings.themeId = "";
            await self.updateSettings(assistantId, settings);
        }
    };


    self.addPage = async function (assistantId, page) {
        const newPage = await Persistence.createPage(page);
        return newPage
    };

    self.getPages = async function (assistantId) {
        const pages = await Persistence.getEveryPageObject();
        return pages;
    };

    self.getPage = async function (assistantId, pageId) {
        return await Persistence.getPage(pageId);
    };

    self.updatePage = async function (assistantId, pageId, page) {
        await Persistence.setNameForPage(pageId, page.name);
        return await Persistence.updatePage(pageId, page);
    };


    self.addMenuItem = async function (assistantId, menuItem) {
        if (!menuItem.icon) {
            const svg = `<svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>default_file</title><path d="M20.414,2H5V30H27V8.586ZM7,28V4H19v6h6V28Z" style="fill:#c5c5c5"/></svg>`;
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            menuItem.icon = `data:image/svg+xml;base64,${base64}`;
        }
        const newItem = await Persistence.createMenuItem(menuItem);
        return newItem;
    };

    self.getMenu = async function (assistantId) {
        const menuItems = await Persistence.getEveryMenuItemObject();
        return menuItems;
    };

    self.getMenuItem = async function (assistantId, menuItemId) {
        const menuItem = await Persistence.getMenuItem(menuItemId)
        return menuItem;
    };

    self.updateMenuItem = async function (assistantId, menuItemId, menuItem) {
        const menuIt = await self.getMenuItem(assistantId, menuItemId);
        const menuItemToUpdate = {...menuIt, ...menuItem};
        if (menuIt.name !== menuItem.name) {
            await Persistence.setNameForMenuItem(menuIt.id, menuItem.name);
        }
        return await Persistence.updateMenuItem(menuItemId, menuItemToUpdate);
    };

    self.deletePage = async function (assistantId, pageId) {
        await Persistence.deletePage(pageId);
        const menuItems = await self.getMenu(assistantId);
        for (const item of menuItems) {
            if (item.targetPage === pageId) {
                await self.deleteMenuItem(assistantId, item.id);
            }
        }
    };
    self.deleteMenuItem = async function (assistantId, menuItemId) {
        await Persistence.deleteMenuItem(menuItemId);
    };

    self.getHomePage = async function (assistantId) {
        const pages = await self.getPages(assistantId);
        if (pages.length === 0) {
            throw new Error('No pages found in the web assistant configuration');
        }
        return pages[0];
    };


    self.getWidget = async (applicationId, widgetName) => {
        if (applicationId !== "assistOS") throw new Error("Unsupported application");
        const componentPath = path.join(__dirname, `../../apihub-root/wallet/web-components/widgets/${widgetName}`);
        const [html, css, js] = await Promise.all([
            fsPromises.readFile(path.join(componentPath, `${widgetName}.html`), 'utf8'),
            fsPromises.readFile(path.join(componentPath, `${widgetName}.css`), 'utf8'),
            fsPromises.readFile(path.join(componentPath, `${widgetName}.js`), 'utf8')
        ]);
        return {html, css, js};
    };

    self.getScript = async (assistantId, scriptId) => {
        const scriptsWidgetMap = (await self.getWebAssistant(assistantId)).scriptsWidgetMap;
        const chatScript = await Persistence.getChatScript(scriptId);
        chatScript.widgetId = scriptsWidgetMap[scriptId] || null;
        return chatScript;
    }
    self.getScripts = async (assistantId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const scripts = [];
        for (const scriptId of webAssistant.scripts) {
            scripts.push(self.getScript(assistantId, scriptId))
        }
        return await Promise.all(scripts);
    }

    self.addScript = async (assistantId, scriptData) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const script = await ChatScript.createChatScript(scriptData.name, scriptData.code, scriptData.description);
        webAssistant.scripts.push(script.id);
        if(scriptData.widgetId){
            webAssistant.scriptsWidgetMap[script.id] = scriptData.widgetId;
        }else{
            webAssistant.scriptsWidgetMap[script.id] = null;
        }
        await Persistence.updateWebAssistant(assistantId, webAssistant);
        return {
            ...script,
            widgetId: webAssistant.scriptsWidgetMap[script.id] || null
        }
    }

    self.deleteScript = async (assistantId, scriptId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const index = webAssistant.scripts.findIndex(el => el === scriptId);
        webAssistant.scripts.splice(index, 1);
        delete webAssistant.scriptsWidgetMap[scriptId];
        await ChatScript.deleteChatScript(scriptId);
        return await Persistence.updateWebAssistant(assistantId, webAssistant);
    }

    self.updateScript = async (assistantId, scriptId, scriptData) => {
        if(scriptData.widgetId){
            const webAssistant = await self.getWebAssistant(assistantId);
            webAssistant.scriptsWidgetMap[scriptId] = scriptData.widgetId;
            await Persistence.updateWebAssistant(assistantId, webAssistant);
        }
        await Persistence.setNameForChatScript(scriptId, scriptData.name);
        return await ChatScript.updateChatScript( scriptId, {name: scriptData.name, code: scriptData.code, description: scriptData.description});
    }

    self.getPublicMethods = function () {
        return [
            "getAuth"
        ]
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
            if(command === "getAuth") {
                return true;
            }
            let {settings} = await singletonInstance.getWebAssistant(args[0]);

            if (settings.authentication === "public") {
                if (command.startsWith("get")) {
                    return true;
                }
                // if user is guest
                if (command === "postMessage") {
                    return true;
                }
            } else {
                const workspaceUser = $$.loadPlugin("WorkspaceUser");
                const users = await workspaceUser.getAllUsers();
                for (const user of users) {
                    if (user.email === email) {
                        return true;
                    }
                }
                return false;
            }

        }
    },

    getDependencies: function () {
        return ["DefaultPersistence", "ChatScript"];
    }
};