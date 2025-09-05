const authSettings = [
    "public",
    "existingSpaceMembers",
    "newAndExistingSpaceMembers"
]
const WEB_ASSISTANT_ALIAS = "webAssistant";
async function WebAssistant() {
    const self = {};
    const persistence = $$.loadPlugin("DefaultPersistence");
    await persistence.configureTypes({
        webAssistant: {
            alias: "string",
            header: "string",
            footer: "string",
            agentName: "string",
            authentication: "string",
        }
    })
    await persistence.createIndex("webAssistant", "alias");

    self.createWebAssistant = async function () {
        await persistence.createWebAssistant({
            alias: WEB_ASSISTANT_ALIAS,
            header: "",
            footer: "",
            agentName: "Assistant",
            authentication: "existingSpaceMembers",
        });
    }

    self.getWebAssistant = async function () {
        let webAssistant = await persistence.getWebAssistant(WEB_ASSISTANT_ALIAS, true);
        if (!webAssistant) {
            webAssistant = await self.createWebAssistant();
        }
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