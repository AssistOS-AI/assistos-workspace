const {fsPromises} = require("fs");

async function WebAssistant() {
    const self = {};

    const Persistence = await $$.loadPlugin("DefaultPersistence");
    const ChatScript = await $$.loadPlugin("ChatScript");

    await Persistence.configureTypes({
        webAssistant: {
            id: "singleton WEBASSISTANT",
            alias: "string",
            scripts: "array chatScript",
            settings: "object"
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
    });

    await Persistence.createIndex("webAssistant", "alias");
    await Persistence.createIndex("theme", "name");
    await Persistence.createIndex("page", "name");
    await Persistence.createIndex("menuItem", "name");

    if (!await Persistence.hasWebAssistant("whatever")) {
        await Persistence.createWebAssistant({
            alias: "whatever",
            scripts: [],
            settings: {
                header: "",
                footer: "",
                initialPrompt: "",
                chatIndications: "",
                agentId: "",
                knowledge: "",
                themeId: "",
            },
        });
    }

    self.getWebAssistant = async function () {
        const webAssistant = await Persistence.getWebAssistant("whatever");
        return webAssistant;
    }

    self.getSettings = async function () {
        const {settings} = await Persistence.getWebAssistant("whatever");
        return settings
    }
    self.updateSettings = async function (settings) {
        const config = await Persistence.getWebAssistant("whatever");
        config.settings = {...config.settings, ...settings};
        return await Persistence.updateWebAssistant("whatever", config);
    }


    self.getThemes = async function () {
        const themes = await Persistence.getEveryThemeObject();
        return themes
    };

    self.getTheme = async function (themeId) {
        return await Persistence.getTheme(themeId);
    };

    self.addTheme = async function (theme) {
        return await Persistence.createTheme(theme);
    };

    self.updateTheme = async function (themeId, theme) {
        await Persistence.setNameForTheme(themeId, theme.name);
        return await Persistence.updateTheme(themeId, theme);

    };

    self.deleteTheme = async function (themeId) {
        await Persistence.deleteTheme(themeId);
        const settings = await self.getSettings();
        if (settings.themeId === themeId) {
            settings.themeId = "";
            await self.updateSettings(settings);
        }
    };


    self.addPage = async function (page) {
        const newPage = await Persistence.createPage(page);
        return newPage
    };

    self.getPages = async function () {
        const pages = await Persistence.getEveryPageObject();
        return pages;
    };

    self.getPage = async function (pageId) {
        return await Persistence.getPage(pageId);
    };

    self.updatePage = async function (pageId, page) {
        await Persistence.setNameForPage(pageId, page.name);
        return await Persistence.updatePage(pageId, page);
    };


    self.addMenuItem = async function (menuItem) {
        if (!menuItem.icon) {
            const svg = `<svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>default_file</title><path d="M20.414,2H5V30H27V8.586ZM7,28V4H19v6h6V28Z" style="fill:#c5c5c5"/></svg>`;
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            menuItem.icon = `data:image/svg+xml;base64,${base64}`;
        }
        const newItem = await Persistence.createMenuItem(menuItem);
        return newItem;
    };

    self.getMenu = async function () {
        const menuItems = await Persistence.getEveryMenuItemObject();
        return menuItems;
    };

    self.getMenuItem = async function (menuItemId) {
        const menuItem = await Persistence.getMenuItem(menuItemId)
        return menuItem;
    };

    self.updateMenuItem = async function (menuItemId, menuItem) {
        const menuIt = await self.getMenuItem(menuItemId);
        const menuItemToUpdate = {...menuIt, ...menuItem};
        if (menuIt.name !== menuItem.name) {
            await Persistence.setNameForMenuItem(menuIt.id, menuItem.name);
        }
        return await Persistence.updateMenuItem(menuItemId, menuItemToUpdate);
    };

    self.deletePage = async function (pageId) {
        await Persistence.deletePage(pageId);
        const menuItems = await self.getMenu();
        for (const item of menuItems) {
            if (item.targetPage === pageId) {
                await self.deleteMenuItem(item.id);
            }
        }
    };
    self.deleteMenuItem = async function (menuItemId) {
        await Persistence.deleteMenuItem(menuItemId);
    };

    self.getHomePage = async function () {
        const pages = await self.getPages();
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

    self.getScript = async (scriptId) => {
        return await ChatScript.getChatScript(scriptId);
    }
    self.getScripts = async () => {
        const webAssistant = await self.getWebAssistant();
        const scripts = [];
        for (const scriptId of webAssistant.scripts) {
            scripts.push(self.getScript(scriptId))
        }
        return await Promise.all(scripts);
    }

    self.addScript = async (scriptData) => {
        const webAssistant = await self.getWebAssistant();
        const script = await ChatScript.createChatScript(scriptData.name, scriptData.code, scriptData.description);
        webAssistant.scripts.push(script.id);
        await Persistence.updateWebAssistant("whatever", webAssistant);
    }

    self.deleteScript = async (scriptId) => {
        const webAssistant = await self.getWebAssistant();
        const index = webAssistant.scripts.findIndex(el => el === scriptId);
        webAssistant.scripts.splice(index, 1);
        await ChatScript.deleteChatScript(scriptId);
        return await Persistence.updateWebAssistant("whatever", webAssistant);
    }

    self.updateScript = async (scriptId, scriptData) => {
        return await ChatScript.updateChatScript(scriptId, scriptData);
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
        return ["DefaultPersistence", "ChatScript"];
    }
};