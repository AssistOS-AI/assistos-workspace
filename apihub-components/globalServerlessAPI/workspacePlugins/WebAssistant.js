const {fsPromises} = require("fs");

async function WebAssistant() {
    const self = {};

    const Persistence = await $$.loadPlugin("DefaultPersistence");
    const ChatScript = await $$.loadPlugin("ChatScript");

    self.getWebAssistant = async function (id) {
        const webAssistant = await Persistence.getWebAssistant(id);
        return webAssistant;
    }

    self.getSettings = async function (id) {
        const {settings} = await Persistence.getWebAssistant(id);
        return settings
    }
    self.updateSettings = async function (id,settings) {
        const config = await Persistence.getWebAssistant(id);
        config.settings = {...config.settings, ...settings};
        return await Persistence.updateWebAssistant(id, config);
    }
    self.requiresAuth = async function (id){
        const settings = await self.getSettings(id);
        return !settings.isPublic;
    }

    self.getThemes = async function (assistantId) {
        const themes = await Persistence.getEveryThemeObject();
        return themes
    };

    self.getTheme = async function (assistantId,themeId) {
        return await Persistence.getTheme(themeId);
    };

    self.addTheme = async function (assistantId,theme) {
        return await Persistence.createTheme(theme);
    };

    self.updateTheme = async function (assistantId,themeId, theme) {
        await Persistence.setNameForTheme(themeId, theme.name);
        return await Persistence.updateTheme(themeId, theme);

    };

    self.deleteTheme = async function (assistantId,themeId) {
        await Persistence.deleteTheme(themeId);
        const settings = await self.getSettings(assistantId);
        if (settings.themeId === themeId) {
            settings.themeId = "";
            await self.updateSettings(assistantId,settings);
        }
    };


    self.addPage = async function (assistantId,page) {
        const newPage = await Persistence.createPage(page);
        return newPage
    };

    self.getPages = async function (assistantId) {
        const pages = await Persistence.getEveryPageObject();
        return pages;
    };

    self.getPage = async function (assistantId,pageId) {
        return await Persistence.getPage(pageId);
    };

    self.updatePage = async function (assistantId,pageId, page) {
        await Persistence.setNameForPage(pageId, page.name);
        return await Persistence.updatePage(pageId, page);
    };


    self.addMenuItem = async function (assistantId,menuItem) {
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

    self.getMenuItem = async function (assistantId,menuItemId) {
        const menuItem = await Persistence.getMenuItem(menuItemId)
        return menuItem;
    };

    self.updateMenuItem = async function (assistantId,menuItemId, menuItem) {
        const menuIt = await self.getMenuItem(assistantId,menuItemId);
        const menuItemToUpdate = {...menuIt, ...menuItem};
        if (menuIt.name !== menuItem.name) {
            await Persistence.setNameForMenuItem(menuIt.id, menuItem.name);
        }
        return await Persistence.updateMenuItem(menuItemId, menuItemToUpdate);
    };

    self.deletePage = async function (assistantId,pageId) {
        await Persistence.deletePage(pageId);
        const menuItems = await self.getMenu(assistantId);
        for (const item of menuItems) {
            if (item.targetPage === pageId) {
                await self.deleteMenuItem(assistantId,item.id);
            }
        }
    };
    self.deleteMenuItem = async function (assistantId,menuItemId) {
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

    self.getScript = async (assistantId,scriptId) => {
        return await ChatScript.getChatScript(scriptId);
    }
    self.getScripts = async (assistantId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const scripts = [];
        for (const scriptId of webAssistant.scripts) {
            scripts.push(self.getScript(assistantId,scriptId))
        }
        return await Promise.all(scripts);
    }

    self.addScript = async (assistantId,scriptData) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const script = await ChatScript.createChatScript(scriptData.name, scriptData.code, scriptData.description);
        webAssistant.scripts.push(script.id);
        await Persistence.updateWebAssistant(assistantId, webAssistant);
    }

    self.deleteScript = async (assistantId,scriptId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const index = webAssistant.scripts.findIndex(el => el === scriptId);
        webAssistant.scripts.splice(index, 1);
        await ChatScript.deleteChatScript(scriptId);
        return await Persistence.updateWebAssistant(assistantId, webAssistant);
    }

    self.updateScript = async (assistantId,scriptId, scriptData) => {
        return await ChatScript.updateChatScript(assistantId,scriptId, scriptData);
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
            if(command === "requiresAuth"){
                return true;
            }
            let {settings} = await singletonInstance.getWebAssistant(args[0]);

            if (settings.isPublic === true) {
                if(command.startsWith("get")){
                    return true;
                }
            }else{
                const Persistence = await $$.loadPlugin("DefaultPersistence");
                const AdminPlugin = await $$.loadPlugin("AdminPlugin");
                const user = await Persistence.getUser(globalUserId);
                let abc =12 ;
            }

        }
    },
    getPublicMethods :function(){
        return [
          "requiresAuth"
        ]
    },
    getDependencies: function () {
        return ["DefaultPersistence", "ChatScript","AdminPlugin"];
    }
};