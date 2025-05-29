const {fsPromises} = require("fs");

async function WebAssistant() {
    const self = {};

    const Persistence = await $$.loadPlugin("DefaultPersistence");

    await Persistence.configureTypes({
        webAssistant: {
            id: "singleton WEBASSISTANT",
            name: "string",
            description: "string",
            alias: "string",
            themeId: "string",
            configurationId: "string",
            settings: "any",
            themes: "array",
            pages: "array",
            menu: "array"
        },
        webChatTheme: {
            id: "random",
            name: "string",
            description: "string",
            theme: "any"
        },
        webAssistantConfigurationPage: {
            id: "random",
            name: "string",
            description: "string",
            pageType: "string",
            pageContent: "any"
        },
        webAssistantConfigurationPageMenuItem: {
            id: "random",
            name: "string",
            description: "string",
            pageId: "string",
            icon: "string"
        }
    });

    await Persistence.createIndex("webAssistant", "alias");
    await Persistence.createIndex("webChatTheme", "id");

    if (!await Persistence.hasWebAssistant("whatever")) {
        await Persistence.createWebAssistant({
            alias: "whatever",
            settings: {
                header: "",
                initialPrompt: "",
                chatIndications: "",
                personality: "",
                knowledge:"",
                theme: "light",
                primaryColor: "#007bff",
                textColor: "#000000"
            },
            themes: [],
            pages: [],
            menu: []
        });
    }

    self.updateWebAssistantConfigurationSettings = async function (settings) {
        const config = await Persistence.getWebAssistant("whatever");
        config.settings = {...config.settings, ...settings};
        return await Persistence.updateWebAssistant("whatever", config);
    }
    self.getWebAssistantConfiguration = async function () {
        const configuration = await Persistence.getWebAssistant("whatever");
        return configuration;
    }

    self.getWebChatThemes = async function () {
        const webChatThemes = await Persistence.getEveryWebChatThemeObject();
        return webChatThemes
    };

    self.getWebChatTheme = async function (themeId) {
        return await Persistence.getWebChatTheme(themeId);
    };

    self.addWebChatTheme = async function (theme) {
        return await Persistence.createWebChatTheme(theme);
    };

    self.updateWebChatTheme = async function (themeId, theme) {
        return await Persistence.updateWebChatTheme(themeId, theme);
    };

    self.deleteWebAssistantTheme = async function (themeId) {
        await Persistence.deleteWebChatTheme(themeId);
    };

    self.getWebChatConfiguration = async function () {
        const config = await Persistence.getWebAssistant("whatever");
        return config.settings;
    };

    self.updateWebChatConfiguration = async function (settings) {
        const config = await Persistence.getWebAssistant("whatever");
        config.settings = {...config.settings, ...settings};
        return await Persistence.updateWebAssistant("whatever", config);
    };

    self.addWebAssistantConfigurationPage = async function (page) {
        const newPage = await Persistence.createWebAssistantConfigurationPage(page);
        const config = await Persistence.getWebAssistant("whatever");
        config.pages.push(newPage.id);
        await Persistence.updateWebAssistant("config", config);
        return newPage;
    };

    self.getWebAssistantConfigurationPages = async function () {
        const config = await Persistence.getWebAssistant("whatever");
        return Promise.all(config.pages.map(id => Persistence.getWebAssistantConfigurationPage(id)));
    };

    self.getWebAssistantConfigurationPage = async function (pageId) {
        return await Persistence.getWebAssistantConfigurationPage(pageId);
    };

    self.updateWebAssistantConfigurationPage = async function (pageId, page) {
        return await Persistence.updateWebAssistantConfigurationPage(pageId, page);
    };

    self.deleteWebAssistantConfigurationPage = async function (pageId) {
        const config = await Persistence.getWebAssistant("whatever");
        config.pages = config.pages.filter(id => id !== pageId);
        await Persistence.updateWebAssistant("whatever", config);
        await Persistence.deleteWebAssistantConfigurationPage(pageId);
    };

    self.addWebAssistantConfigurationPageMenuItem = async function (pageId, menuItem) {
        if (!menuItem.icon) {
            const svg = `<svg width="800px" height="800px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>default_file</title><path d="M20.414,2H5V30H27V8.586ZM7,28V4H19v6h6V28Z" style="fill:#c5c5c5"/></svg>`;
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            menuItem.icon = `data:image/svg+xml;base64,${base64}`;
        }
        menuItem.pageId = pageId;
        const newItem = await Persistence.createWebAssistantConfigurationPageMenuItem(menuItem);
        const config = await Persistence.getWebAssistant("whatever");
        config.menu.push(newItem.id);
        await Persistence.updateWebAssistant("whatever", config);
        return newItem;
    };

    self.getWebAssistantConfigurationPageMenu = async function () {
        const config = await Persistence.getWebAssistant("whatever");
        return Promise.all(config.menu.map(id => Persistence.getWebAssistantConfigurationPageMenuItem(id)));
    };

    self.getWebAssistantConfigurationPageMenuItem = async function (menuItemId) {
        return await Persistence.getWebAssistantConfigurationPageMenuItem(menuItemId);
    };

    self.updateWebAssistantConfigurationPageMenuItem = async function (menuItemId, menuItem) {
        return await Persistence.updateWebAssistantConfigurationPageMenuItem(menuItemId, menuItem);
    };

    self.deleteWebAssistantConfigurationPageMenuItem = async function (menuItemId) {
        const config = await Persistence.getWebAssistant("whatever");
        config.menu = config.menu.filter(id => id !== menuItemId);
        await Persistence.updateWebAssistant("whatever", config);
        await Persistence.deleteWebAssistantConfigurationPageMenuItem(menuItemId);
    };

    self.getWebAssistantHomePage = async function () {
        const pages = await self.getWebAssistantConfigurationPages();
        if (pages.length === 0) {
            throw new Error('No pages found in the web assistant configuration');
        }

        const config = await self.getWebChatConfiguration();
        const personalityData = await getPersonalityData(config.personality);
        const modelName = personalityData.llms.text;


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
        return ["DefaultPersistence"];
    }
};