const {fsPromises} = require("fs");

const authSettings = [
    "public",
    "existingSpaceMembers",
    "newAndExistingSpaceMembers"
]

async function WebAssistant() {
    const self = {};

    const persistence = $$.loadPlugin("DefaultPersistence");
    const ChatScript = $$.loadPlugin("ChatScript");
    const chat = $$.loadPlugin("Chat");

    self.getDefaultChatScript = async function (webAssistantId) {
        const script = await ChatScript.getChatScript("DefaultChatScript");
        return script.id;
    }

    self.getDefaultControlRoomScript = async function (webAssistantId) {
        const script = await ChatScript.getChatScript("DefaultControlRoomScript");
        return script.id;
    }

    self.getWebAssistant = async function (id) {
        const webAssistant = await persistence.getWebAssistant(id);
        return webAssistant;
    }

    self.getSettings = async function (id) {
        const {settings} = await persistence.getWebAssistant(id);
        return settings
    }

    self.updateSettings = async function (id, settings) {
        if (!settings.authentication || !authSettings.includes(settings.authentication)) {
            throw new Error(`Invalid authentication setting. Allowed values are: ${authSettings.join(", ")}`);
        }
        const config = await persistence.getWebAssistant(id);
        config.settings = {...config.settings, ...settings};
        return await persistence.updateWebAssistant(id, config);
    }

    self.getAuth = async function (id) {
        const settings = await self.getSettings(id);
        return settings.authentication
    }

    self.getThemes = async function (assistantId) {
        const themes = await persistence.getEveryThemeObject();
        return themes
    };

    self.getTheme = async function (assistantId, themeId) {
        return await persistence.getTheme(themeId);
    };

    self.addTheme = async function (assistantId, theme) {
        return await persistence.createTheme(theme);
    };

    self.updateTheme = async function (assistantId, themeId, theme) {
        await persistence.setNameForTheme(themeId, theme.name);
        return await persistence.updateTheme(themeId, theme);

    };

    self.deleteTheme = async function (assistantId, themeId) {
        await persistence.deleteTheme(themeId);
        const settings = await self.getSettings(assistantId);
        if (settings.themeId === themeId) {
            settings.themeId = "";
            await self.updateSettings(assistantId, settings);
        }
    };

    self.addPage = async function (assistantId, page) {
        const newPage = await persistence.createPage(page);
        return newPage
    };

    self.getPages = async function (assistantId) {
        const pages = await persistence.getEveryPageObject();
        return pages;
    };

    self.getPage = async function (assistantId, pageId) {
        return await persistence.getPage(pageId);
    };

    self.updatePage = async function (assistantId, pageId, page) {
        await persistence.setNameForPage(pageId, page.name);
        return await persistence.updatePage(pageId, page);
    };

    self.addMenuItem = async function (assistantId, menuItem) {
        if (!menuItem.icon) {
            const svg = `<svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>default_file</title><path d="M20.414,2H5V30H27V8.586ZM7,28V4H19v6h6V28Z" style="fill:#c5c5c5"/></svg>`;
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            menuItem.icon = `data:image/svg+xml;base64,${base64}`;
        }
        const newItem = await persistence.createMenuItem(menuItem);
        return newItem;
    };

    self.getMenu = async function (assistantId) {
        const menuItems = await persistence.getEveryMenuItemObject();
        return menuItems;
    };

    self.getMenuItem = async function (assistantId, menuItemId) {
        const menuItem = await persistence.getMenuItem(menuItemId)
        return menuItem;
    };

    self.updateMenuItem = async function (assistantId, menuItemId, menuItem) {
        const menuIt = await self.getMenuItem(assistantId, menuItemId);
        const menuItemToUpdate = {...menuIt, ...menuItem};
        if (menuIt.name !== menuItem.name) {
            await persistence.setNameForMenuItem(menuIt.id, menuItem.name);
        }
        return await persistence.updateMenuItem(menuItemId, menuItemToUpdate);
    };

    self.deletePage = async function (assistantId, pageId) {
        await persistence.deletePage(pageId);
        const menuItems = await self.getMenu(assistantId);
        for (const item of menuItems) {
            if (item.targetPage === pageId) {
                await self.deleteMenuItem(assistantId, item.id);
            }
        }
    };

    self.deleteMenuItem = async function (assistantId, menuItemId) {
        await persistence.deleteMenuItem(menuItemId);
    };

    self.getHomePage = async function (assistantId) {
        const pages = await self.getPages(assistantId);
        if (pages.length === 0) {
            throw new Error('No pages found in the web assistant configuration');
        }
        return pages.find(page => page.role === "page") || pages[0];
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
        const chatScript = await persistence.getChatScript(scriptId);
        chatScript.widgetId = scriptsWidgetMap[scriptId] || null;
        return chatScript;
    }

    self.createControlRoom = async (assistantId, userId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const controlRoomScriptId = await self.getDefaultControlRoomScript(assistantId);
        const chatId = `${userId}_ControlRoom`;
        const chatObj = await chat.createChat(chatId, controlRoomScriptId, ["User", "Assistant"]);
        webAssistant[userId] = {
            chats: [chatObj.docId],
            controlRoom: chatObj.docId
        };
        await persistence.updateWebAssistant(assistantId, webAssistant);
    }

    self.createChat = async (assistantId, userId, chatData) => {
        const webAssistant = await self.getWebAssistant(assistantId, userId);
        const chatObj = await chat.createChat(chatData.id, chatData.scriptId, chatData.args);
        webAssistant[userId].chats.push(chatObj.docId);
        await persistence.updateWebAssistant(assistantId, webAssistant);
    };

    self.getChat = async (assistantId, userId, chatId) => {
        return  await chat.getChat(chatId);
    }

    self.getControlRoom = async (assistantId, userId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        return webAssistant[userId]?.controlRoom || null;
    }

    self.getUserChats = async (assistantId, userId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        if (!webAssistant[userId]) {
            webAssistant[userId] = {
                chats: [],
                controlRoom: null
            }
            await persistence.updateWebAssistant(assistantId, webAssistant);
            return [];
        }
        return webAssistant[userId].chats;
    }

    self.getChats = async (assistantId, userId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const chats = webAssistant.chats[userId]
        return chats
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
        if (scriptData.widgetId) {
            webAssistant.scriptsWidgetMap[script.id] = scriptData.widgetId;
        } else {
            webAssistant.scriptsWidgetMap[script.id] = null;
        }
        await persistence.updateWebAssistant(assistantId, webAssistant);
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
        return await persistence.updateWebAssistant(assistantId, webAssistant);
    }

    self.updateScript = async (assistantId, scriptId, scriptData) => {
        if (scriptData.widgetId) {
            const webAssistant = await self.getWebAssistant(assistantId);
            webAssistant.scriptsWidgetMap[scriptId] = scriptData.widgetId;
            await persistence.updateWebAssistant(assistantId, webAssistant);
        }
        await persistence.setNameForChatScript(scriptId, scriptData.name);
        return await ChatScript.updateChatScript(scriptId, {
            name: scriptData.name,
            code: scriptData.code,
            description: scriptData.description
        });
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
            if (command === "getAuth") {
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
        return ["DefaultPersistence", "ChatScript", "Chat"];
    }
};