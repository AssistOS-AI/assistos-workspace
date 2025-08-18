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
    const chatRoom = $$.loadPlugin("ChatRoom");
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
        },
        chatUser: {
            chats: "array"
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
                settings: {
                    header: "",
                    footer: "",
                    agentName: "Assistant",
                    themeId: "",
                    authentication: "existingSpaceMembers",
                }
            })
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

    self.createDefaultChat = async function(userId){
        let webAssistant = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS);
        let docId = webAssistant.settings.agentName + "_Chat_" + crypto.randomBytes(4).toString('hex');
        await self.createChat(userId,  docId, "DefaultScript", ["User", webAssistant.settings.agentName]);
        return docId;
    }

    self.createChat = async (userId, docId, scriptName, args) => {
        const chatObj = await chatRoom.createChat(docId, scriptName, args);
        if(await persistence.hasChatUser(userId)){
            let chatUser = await persistence.getChatUser(userId);
            chatUser.chats.push(chatObj.docId);
            await persistence.updateChatUser(userId, chatUser);
        } else {
            await persistence.createChatUser({chats: [chatObj.docId]});
        }
        return chatObj.docId;
    };

    self.getChat = async (userId, chatId) => {
        return await chatRoom.getChat(chatId);
    }


    self.getUserChats = async (userId) => {
        if(!await persistence.hasChatUser(userId)){
            return [];
        }
        let chatUser = await persistence.getUserChats(userId);
        return chatUser.chats;
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
        return ["DefaultPersistence", "ChatRoom"];
    }
};