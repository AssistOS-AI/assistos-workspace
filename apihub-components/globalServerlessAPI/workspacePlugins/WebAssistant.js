const authSettings = [
    "public",
    "existingSpaceMembers",
    "newAndExistingSpaceMembers"
]
const WEB_ASSISTANT_ALIAS = "webAssistant";
const crypto = require("crypto");
async function WebAssistant() {
    const self = {};
    const persistence = $$.loadPlugin("DefaultPersistence");
    await persistence.configureTypes({
        webAssistant: {
            alias: "string",
            header: "string",
            footer: "string",
            agentName: "string",
            themeId: "string",
            authentication: "string",
        },
        theme: {
            name: "string",
            description: "string",
            css: "any",
            variables: "object"
        }
    })
    await persistence.createIndex("webAssistant", "alias");
    await persistence.createIndex("theme", "name");

    self.createWebAssistant = async function (config){
        for (const theme of config.themes) {
            await persistence.createTheme(theme);
        }
        await persistence.createWebAssistant(
            {
                alias: WEB_ASSISTANT_ALIAS,
                header: "",
                footer: "",
                agentName: "Assistant",
                themeId: "",
                authentication: "existingSpaceMembers",
            })
    }

    self.getWebAssistant = async function () {
        const webAssistant = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        return webAssistant;
    }

    self.updateWebAssistant = async function (data) {
        if (!data.authentication || !authSettings.includes(data.authentication)) {
            throw new Error(`Invalid authentication setting. Allowed values are: ${authSettings.join(", ")}`);
        }
        let webAssistant = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        webAssistant = { ...webAssistant, ...data };
        return await persistence.updateWebAssistant(WEB_ASSISTANT_ALIAS, webAssistant);
    }

    self.getAuth = async function () {
        const webAssistant = await self.getWebAssistant();
        return webAssistant.authentication;
    }

    self.getThemes = async function () {
        return await persistence.getEveryThemeObject();
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

            let webAssistant = await singletonInstance.getWebAssistant(WEB_ASSISTANT_ALIAS);

            if (webAssistant.authentication === "public") {
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
        return ["DefaultPersistence"];
    }
};