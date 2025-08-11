const {fsPromises} = require("fs");

const authSettings = [
    "public",
    "existingSpaceMembers",
    "newAndExistingSpaceMembers"
]
const WEB_ASSISTANT_ALIAS = "webAssistant";

async function WebAssistant() {
    const self = {};
    const persistence = $$.loadPlugin("DefaultPersistence");
    const ChatScript = $$.loadPlugin("ChatScript");
    const chatRoom = $$.loadPlugin("ChatRoom");
    await persistence.configureTypes({
        webAssistant: {
            alias: "string",
            settings: "object",
            chats: "object"
        },
        theme: {
            name: "string",
            description: "string",
            css: "any",
            variables: "object"
        },
        page: {
            name: "string",
            description: "string",
            chatSize: "string",
            widget: "string",
            data: "string",
            role: "string",
            generalSettings: "string",
            css: "",
            html: "",
            js: ""
        },
        menuItem: {
            name: "string",
            description: "string",
            targetPage: "string",
            location: "string",
            icon: "string"
        }
    })
    await persistence.createIndex("webAssistant", "alias");

    self.createWebAssistant = async function (config){
        for (const theme of config.themes) {
            await persistence.createTheme(theme);
        }
        for (const widget of config.widgets) {
            await persistence.createPage(widget);
        }
        await persistence.createWebAssistant(
            {
                alias: WEB_ASSISTANT_ALIAS,
                settings: {
                    header: "",
                    footer: "",
                    initialPrompt: "",
                    chatIndications: "",
                    agentId: "",
                    knowledge: "",
                    themeId: "",
                    authentication: "existingSpaceMembers",
                }
            })
    }
    self.getDefaultChatScript = async function () {
        const script = await ChatScript.getChatScript("DefaultChatScript");
        return script.id;
    }

    self.getDefaultControlRoomScript = async function () {
        const script = await ChatScript.getChatScript("DefaultControlRoomScript");
        return script.id;
    }

    self.getWebAssistant = async function () {
        const webAssistant = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        return webAssistant;
    }

    self.getSettings = async function () {
        const {settings} = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        return settings;
    }

    self.updateSettings = async function (settings) {
        if (!settings.authentication || !authSettings.includes(settings.authentication)) {
            throw new Error(`Invalid authentication setting. Allowed values are: ${authSettings.join(", ")}`);
        }
        const config = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        config.settings = {...config.settings, ...settings};
        return await persistence.updateWebAssistant(WEB_ASSISTANT_ALIAS, config);
    }

    self.getAuth = async function () {
        const settings = await self.getSettings();
        return settings.authentication
    }

    self.getThemes = async function () {
        const themes = await persistence.getEveryThemeObject();
        return themes
    };

    self.getTheme = async function (themeId) {
        return await persistence.getTheme(themeId);
    };

    self.addTheme = async function (theme) {
        return await persistence.createTheme(theme);
    };

    self.updateTheme = async function (themeId, theme) {
        await persistence.setNameForTheme(themeId, theme.name);
        return await persistence.updateTheme(themeId, theme);

    };

    self.deleteTheme = async function (themeId) {
        await persistence.deleteTheme(themeId);
        const settings = await self.getSettings();
        if (settings.themeId === themeId) {
            settings.themeId = "";
            await self.updateSettings(settings);
        }
    };

    self.addPage = async function (page) {
        const newPage = await persistence.createPage(page);
        return newPage
    };

    self.getPages = async function () {
        const pages = await persistence.getEveryPageObject();
        return pages;
    };

    self.getPage = async function (pageId) {
        return await persistence.getPage(pageId);
    };

    self.updatePage = async function (pageId, page) {
        await persistence.setNameForPage(pageId, page.name);
        return await persistence.updatePage(pageId, page);
    };

    self.addMenuItem = async function (menuItem) {
        //TODO replace with bookmarks
        if (!menuItem.icon) {
            const svg = `<svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>default_file</title><path d="M20.414,2H5V30H27V8.586ZM7,28V4H19v6h6V28Z" style="fill:#c5c5c5"/></svg>`;
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            menuItem.icon = `data:image/svg+xml;base64,${base64}`;
        }
        const newItem = await persistence.createMenuItem(menuItem);
        return newItem;
    };

    self.getMenu = async function () {
        const menuItems = await persistence.getEveryMenuItemObject();
        return menuItems;
    };

    self.getMenuItem = async function (menuItemId) {
        const menuItem = await persistence.getMenuItem(menuItemId)
        return menuItem;
    };

    self.updateMenuItem = async function (menuItemId, menuItem) {
        const menuIt = await self.getMenuItem(menuItemId);
        const menuItemToUpdate = {...menuIt, ...menuItem};
        if (menuIt.name !== menuItem.name) {
            await persistence.setNameForMenuItem(menuIt.id, menuItem.name);
        }
        return await persistence.updateMenuItem(menuItemId, menuItemToUpdate);
    };

    self.deletePage = async function (pageId) {
        await persistence.deletePage(pageId);
        const menuItems = await self.getMenu();
        for (const item of menuItems) {
            if (item.targetPage === pageId) {
                await self.deleteMenuItem(item.id);
            }
        }
    };

    self.deleteMenuItem = async function (menuItemId) {
        await persistence.deleteMenuItem(menuItemId);
    };

    self.getHomePage = async function () {
        const pages = await self.getPages();
        if (pages.length === 0) {
            throw new Error('No pages found in the web assistant configuration');
        }
        let homePage = pages.find(page => page.role === "page") || pages[0];
        return homePage;
    };

    self.getWidget = async (applicationId, widgetName) => {
        //TODO rename to getComponent
        if (applicationId !== "assistOS") throw new Error("Unsupported application");
        const componentPath = path.join(__dirname, `../../apihub-root/wallet/web-components/widgets/${widgetName}`);
        const [html, css, js] = await Promise.all([
            fsPromises.readFile(path.join(componentPath, `${widgetName}.html`), 'utf8'),
            fsPromises.readFile(path.join(componentPath, `${widgetName}.css`), 'utf8'),
            fsPromises.readFile(path.join(componentPath, `${widgetName}.js`), 'utf8')
        ]);
        return {html, css, js};
    };


    self.createControlRoom = async (userId) => {
        const webAssistant = await self.getWebAssistant(WEB_ASSISTANT_ALIAS);
        const controlRoomScriptId = await self.getDefaultControlRoomScript();
        const chatId = `${userId}_ControlRoom`;
        const chatObj = await chatRoom.createChat(chatId, controlRoomScriptId, ["User", "Assistant"]);
        webAssistant[userId] = {
            chats: [chatObj.docId],
            controlRoom: chatObj.docId
        };
        await persistence.updateWebAssistant(WEB_ASSISTANT_ALIAS, webAssistant);
    }

    self.createChat = async (userId, chatData) => {
        const webAssistant = await self.getWebAssistant(WEB_ASSISTANT_ALIAS, userId);
        const chatObj = await chatRoom.createChat(chatData.id, chatData.scriptId, chatData.args);
        webAssistant[userId].chats.push(chatObj.docId);
        await persistence.updateWebAssistant(WEB_ASSISTANT_ALIAS, webAssistant);
    };

    self.getChat = async (userId, chatId) => {
        return  await chatRoom.getChat(chatId);
    }

    self.getControlRoom = async (userId) => {
        const webAssistant = await self.getWebAssistant(WEB_ASSISTANT_ALIAS);
        return webAssistant[userId]?.controlRoom || null;
    }

    self.getUserChats = async (userId) => {
        const webAssistant = await self.getWebAssistant(WEB_ASSISTANT_ALIAS);
        if (!webAssistant[userId]) {
            webAssistant[userId] = {
                chats: [],
                controlRoom: null
            }
            await persistence.updateWebAssistant(WEB_ASSISTANT_ALIAS, webAssistant);
            return [];
        }
        return webAssistant[userId].chats;
    }

    self.getChats = async (userId) => {
        const webAssistant = await self.getWebAssistant(WEB_ASSISTANT_ALIAS);
        const chats = webAssistant.chats[userId]
        return chats
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
            if (command === "getAuth" || command === "createWebAssistant") {
                return true;
            }

            let {settings} = await singletonInstance.getWebAssistant(WEB_ASSISTANT_ALIAS);

            if (settings.authentication === "public") {
                if (command.startsWith("get")) {
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
        return ["DefaultPersistence", "ChatScript", "ChatRoom"];
    }
};