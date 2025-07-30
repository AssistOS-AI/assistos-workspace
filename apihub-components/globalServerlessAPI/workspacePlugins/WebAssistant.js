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


    await persistence.configureTypes({
        webAssistant: {
            id: "singleton webAssistant",
            alias: "string",
            scripts: "array chatScript",
            scriptsWidgetMap: `object`,
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

    self.createWebAssistant = async function () {
        async function addDefaultWebAssistantThemes() {

            const defaultThemes = [
                {
                    name: "Ubuntu Theme",
                    description: "A theme inspired by the Ubuntu operating system.",
                    variables: {
                        '--bg': '#333333',
                        '--bg-secondary': '#444444',
                        '--text': '#ffffff',
                        '--text-secondary': '#cccccc',
                        '--primary': '#dd4814',
                        '--primary-hover': '#b83b10',
                        '--accent': '#77216f',
                        '--danger': '#dc3545',
                        '--success': '#28a745',
                        '--warning': '#ffc107',
                        '--focus-ring': '#dd4814',
                        '--disabled-bg': '#555555',
                        '--disabled-text': '#999999',
                        '--link-color': '#dd4814',
                        '--link-hover': '#b83b10',
                        '--font-family': 'Ubuntu',
                        '--font-size': '16px',
                        '--heading-font-size': '26px',
                        '--padding': '18px',
                        '--margin': '18px',
                        '--border-color': '#555555',
                        '--border-radius': '6px',
                        '--button-radius': '4px',
                        '--container-max-width': '1280px',
                        '--gap': '1.2rem'
                    },
                    css: `
            /* Custom CSS for Ubuntu Theme */
            body {
                font-smooth: antialiased;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
        `
                },
                {
                    name: "Windows 11 Theme",
                    description: "A clean and modern theme inspired by Windows 11.",
                    variables: {
                        '--bg': '#f3f3f3',
                        '--bg-secondary': '#ffffff',
                        '--text': '#000000',
                        '--text-secondary': '#605e5c',
                        '--primary': '#0078d4',
                        '--primary-hover': '#005ea2',
                        '--accent': '#107c10',
                        '--danger': '#d13438',
                        '--success': '#107c10',
                        '--warning': '#ffc83b',
                        '--focus-ring': '#0078d4',
                        '--disabled-bg': '#e9e9e9',
                        '--disabled-text': '#a8a8a8',
                        '--link-color': '#0078d4',
                        '--link-hover': '#005ea2',
                        '--font-family': 'Segoe UI',
                        '--font-size': '15px',
                        '--heading-font-size': '22px',
                        '--padding': '14px',
                        '--margin': '14px',
                        '--border-color': '#e0e0e0',
                        '--border-radius': '4px',
                        '--button-radius': '2px',
                        '--container-max-width': '1360px',
                        '--gap': '0.8rem'
                    },
                    css: `
            /* Custom CSS for Windows 11 Theme */
            button {
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
        `
                },
                {
                    name: "Halloween Theme",
                    description: "A spooky theme perfect for Halloween!",
                    variables: {
                        '--bg': '#1a1a1a',
                        '--bg-secondary': '#2e0000',
                        '--text': '#ffa500', /* Orange */
                        '--text-secondary': '#cc5500',
                        '--primary': '#8b0000', /* Dark Red */
                        '--primary-hover': '#660000',
                        '--accent': '#4b0082', /* Indigo */
                        '--danger': '#ff0000',
                        '--success': '#32cd32', /* Lime Green */
                        '--warning': '#ff8c00', /* Dark Orange */
                        '--focus-ring': '#ffa500',
                        '--disabled-bg': '#333333',
                        '--disabled-text': '#666666',
                        '--link-color': '#ffa500',
                        '--link-hover': '#cc5500',
                        '--font-family': 'Creepster',
                        '--font-size': '18px',
                        '--heading-font-size': '30px',
                        '--padding': '20px',
                        '--margin': '20px',
                        '--border-color': '#8b0000',
                        '--border-radius': '0px',
                        '--button-radius': '0px',
                        '--container-max-width': '1000px',
                        '--gap': '1.5rem'
                    },
                    css: `
            /* Custom CSS for Halloween Theme */
            body {
                background-image: url('[https://www.transparenttextures.com/patterns/dark-fish-skin.png](https://www.transparenttextures.com/patterns/dark-fish-skin.png)');
                background-repeat: repeat;
            }
            .theme-var-label {
                text-shadow: 1px 1px 2px black;
            }
        `
                },
                {
                    name: "Dark Mode",
                    description: "A sleek, dark theme for reduced eye strain.",
                    variables: {
                        '--bg': '#1e1e1e',
                        '--bg-secondary': '#2c2c2c',
                        '--text': '#e0e0e0',
                        '--text-secondary': '#a0a0a0',
                        '--primary': '#8a2be2', /* Blue Violet */
                        '--primary-hover': '#6a1eb8',
                        '--accent': '#00bcd4', /* Cyan */
                        '--danger': '#ff6b6b',
                        '--success': '#5cb85c',
                        '--warning': '#ffeb3b',
                        '--focus-ring': '#8a2be2',
                        '--disabled-bg': '#3a3a3a',
                        '--disabled-text': '#6a6a6a',
                        '--link-color': '#8a2be2',
                        '--link-hover': '#6a1eb8',
                        '--font-family': 'Inter',
                        '--font-size': '16px',
                        '--heading-font-size': '24px',
                        '--padding': '16px',
                        '--margin': '16px',
                        '--border-color': '#444444',
                        '--border-radius': '8px',
                        '--button-radius': '6px',
                        '--container-max-width': '1200px',
                        '--gap': '1rem'
                    },
                    css: `
            /* Custom CSS for Dark Mode */
            body {
                color-scheme: dark;
            }
        `
                },
                {
                    name: "Light Mode",
                    description: "A bright and airy theme for maximum clarity.",
                    variables: {
                        '--bg': '#ffffff',
                        '--bg-secondary': '#f5f5f5',
                        '--text': '#000000',
                        '--text-secondary': '#6c757d',
                        '--primary': '#007bff',
                        '--primary-hover': '#0056b3',
                        '--accent': '#17a2b8',
                        '--danger': '#dc3545',
                        '--success': '#28a745',
                        '--warning': '#ffc107',
                        '--focus-ring': '#66afe9',
                        '--disabled-bg': '#e9ecef',
                        '--disabled-text': '#adb5bd',
                        '--link-color': '#007bff',
                        '--link-hover': '#0056b3',
                        '--font-family': 'Lato',
                        '--font-size': '16px',
                        '--heading-font-size': '24px',
                        '--padding': '16px',
                        '--margin': '16px',
                        '--border-color': '#dee2e6',
                        '--border-radius': '8px',
                        '--button-radius': '4px',
                        '--container-max-width': '1200px',
                        '--gap': '1rem'
                    },
                    css: `
            /* Custom CSS for Light Mode */
            body {
                color-scheme: light;
            }
        `
                },
                {
                    name: "High Contrast Theme",
                    description: "A theme with high contrast for accessibility.",
                    variables: {
                        '--bg': '#000000',
                        '--bg-secondary': '#000000',
                        '--text': '#ffff00', /* Bright Yellow */
                        '--text-secondary': '#ffffff',
                        '--primary': '#00ff00', /* Bright Green */
                        '--primary-hover': '#00cc00',
                        '--accent': '#ff00ff', /* Magenta */
                        '--danger': '#ff0000',
                        '--success': '#00ff00',
                        '--warning': '#ffff00',
                        '--focus-ring': '#ffffff',
                        '--disabled-bg': '#333333',
                        '--disabled-text': '#aaaaaa',
                        '--link-color': '#00ffff', /* Cyan */
                        '--link-hover': '#00aaaa',
                        '--font-family': 'Arial',
                        '--font-size': '18px',
                        '--heading-font-size': '28px',
                        '--padding': '12px',
                        '--margin': '12px',
                        '--border-color': '#ffffff',
                        '--border-radius': '0px',
                        '--button-radius': '0px',
                        '--container-max-width': '100%',
                        '--gap': '0.5rem'
                    },
                    css: `
            /* Custom CSS for High Contrast Theme */
            * {
                border: 2px solid var(--border-color) !important;
                box-shadow: none !important;
                text-shadow: none !important;
            }
            a:focus, button:focus, input:focus, select:focus, textarea:focus {
                outline: 5px solid var(--focus-ring) !important;
                outline-offset: 2px;
            }
        `
                }
            ];
            const defaultWidgets = [
                {
                    name: "AssistOS About Us Page",
                    description: "A dedicated page to inform users about your organization.",
                    widget: "assistOS/about-us",
                    chatSize: "50",
                    role: "page",
                    generalSettings: JSON.stringify({
                        title: "About Our Company",
                        showMissionStatement: true
                    }, null, 2),
                    data: JSON.stringify({
                        companyName: "Your Awesome Company",
                        foundingYear: "2020",
                        mission: "To provide the best solutions for our customers."
                    }, null, 2),
                    html: `<div><h1>About Us Placeholder</h1><p>Learn more about our company and mission here.</p></div>`,
                    css: `/* Test CSS for About Us Widget */.about-section { background-color: var(--bg-secondary); padding: 30px; }`,
                    js: `// Test JS for About Us Widget console.log('About Us widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Modal Widget",
                    description: "A versatile modal dialog for displaying content.",
                    widget: "assistOS/modal-widget",
                    chatSize: "50",
                    role: "page",
                    generalSettings: JSON.stringify({
                        title: "Welcome Modal",
                        showCloseButton: true,
                        backdropDismiss: true
                    }, null, 2),
                    data: JSON.stringify({
                        content: "This is a placeholder for your modal content."
                    }, null, 2),
                    html: `<div><h1>Modal Content Area</h1><p>This is where your modal's main content would go.</p></div>`,
                    css: `/* Test CSS for Modal Widget */.modal-content { border: 1px solid blue; padding: 20px; }`,
                    js: `// Test JS for Modal Widget console.log('Modal widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Text Widget",
                    description: "A simple widget for displaying blocks of text.",
                    widget: "assistOS/text-widget",
                    chatSize: "0",
                    role: "page",
                    generalSettings: JSON.stringify({
                        heading: "Important Information",
                        alignment: "left"
                    }, null, 2),
                    data: JSON.stringify({
                        text: "This is a basic text widget. You can use it to display paragraphs, instructions, or any general textual content on your page."
                    }, null, 2),
                    html: `<div><h2>Placeholder Text</h2><p>This paragraph serves as a basic example of text content.</p></div>`,
                    css: `/* Test CSS for Text Widget */.text-block { font-family: var(--font-family); color: var(--text); }`,
                    js: `// Test JS for Text Widget console.log('Text widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Blog Widget",
                    description: "Displays a list of blog posts or articles.",
                    widget: "assistOS/blog-widget",
                    chatSize: "30",
                    role: "page",
                    generalSettings: JSON.stringify({
                        postsToShow: 3,
                        showReadMoreButton: true
                    }, null, 2),
                    data: JSON.stringify({
                        blogPosts: [
                            {title: "First Post", summary: "Summary of the first post."},
                            {title: "Second Post", summary: "Summary of the second post."}
                        ]
                    }, null, 2),
                    html: `<div><h3>Recent Blog Posts</h3><ul><li>Post 1</li><li>Post 2</li></ul></div>`,
                    css: `/* Test CSS for Blog Widget */.blog-list { list-style: none; } .blog-item { margin-bottom: 15px; }`,
                    js: `// Test JS for Blog Widget console.log('Blog widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Contact Widget",
                    description: "A form for users to get in touch with you.",
                    widget: "assistOS/contact-widget",
                    chatSize: "0",
                    role: "page",
                    generalSettings: JSON.stringify({
                        formTitle: "Send us a message",
                        successMessage: "Message sent successfully!"
                    }, null, 2),
                    data: JSON.stringify({
                        recipientEmail: "contact@example.com",
                        phone: "+40 123 456 789"
                    }, null, 2),
                    html: `<form><h4>Contact Form Placeholder</h4><input type="text" placeholder="Name"><button>Submit</button></form>`,
                    css: `/* Test CSS for Contact Widget */.contact-form input, .contact-form button { display: block; margin-bottom: 10px; }`,
                    js: `// Test JS for Contact Widget console.log('Contact widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Pricing Widget",
                    description: "Showcases different pricing plans or tiers.",
                    widget: "assistOS/pricing-widget",
                    chatSize: "0",
                    role: "page",
                    generalSettings: JSON.stringify({
                        currency: "RON",
                        buttonText: "Sign Up"
                    }, null, 2),
                    data: JSON.stringify({
                        plans: [
                            {name: "Basic", price: "99", features: ["Feature A", "Feature B"]},
                            {name: "Pro", price: "199", features: ["All Basic", "Feature C"]}
                        ]
                    }, null, 2),
                    html: `<div><h2>Pricing Plans Placeholder</h2><p>See our flexible pricing options.</p></div>`,
                    css: `/* Test CSS for Pricing Widget */.pricing-card { border: 1px solid var(--border-color); padding: 20px; text-align: center; }`,
                    js: `// Test JS for Pricing Widget console.log('Pricing widget placeholder loaded.');`
                },
                {
                    name: "AssistOS Privacy Widget",
                    description: "Displays your privacy policy or related information.",
                    widget: "assistOS/privacy-widget",
                    chatSize: "0",
                    role: "page",
                    generalSettings: JSON.stringify({
                        title: "Privacy Policy",
                        lastUpdated: "2025-07-24"
                    }, null, 2),
                    data: JSON.stringify({
                        policyText: "This is a placeholder for your detailed privacy policy text. It would typically be a long string of legal content."
                    }, null, 2),
                    html: `<div><h3>Privacy Policy Placeholder</h3><p>Your privacy is important to us.</p></div>`,
                    css: `/* Test CSS for Privacy Widget */.privacy-content { max-width: 800px; margin: 0 auto; line-height: 1.6; }`,
                    js: `// Test JS for Privacy Widget console.log('Privacy widget placeholder loaded.');`
                }
            ];
            for (const theme of defaultThemes) {
                await persistence.createTheme(theme);
            }
            for (const widget of defaultWidgets) {
                await persistence.createPage(widget);
            }
        }

        const assistant = await persistence.createWebAssistant(
            {
                chats:[],
                scripts: [],
                scriptsWidgetMap: {},
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
        await addDefaultWebAssistantThemes();
        return assistant;
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
        const chatScript = await persistence.getChatScript(scriptId);
        chatScript.widgetId = scriptsWidgetMap[scriptId] || null;
        return chatScript;
    }

    self.createChat = async (assistantId, userId, chatData) => {
        const chatId = await chat.createChat(assistantId, chatData.id,chatData.scriptId, chatData.args);
        const webAssistant = await self.getWebAssistant(assistantId);
        if (!webAssistant.chats[userId]) {
            webAssistant.chats[userId] = [chatId];
        }
    }
    self.getChat = async (assistantId, userId, chatId) => {
        return await chat.getChat(chatId);

    }
    self.getChats = async (assistantId, userId) => {
        const webAssistant = await self.getWebAssistant(assistantId);
        const chats = webAssistant.chats[userId] || [];
        const chatPromises = chats.map(chatId => self.getChat(assistantId, userId, chatId));
        return await Promise.all(chatPromises);
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
        return ["DefaultPersistence", "ChatScript"/*,"Chat"*/];
    }
};