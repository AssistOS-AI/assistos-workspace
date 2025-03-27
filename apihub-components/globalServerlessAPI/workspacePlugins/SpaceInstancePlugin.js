const configs = require("../../../data-volume/config/config.json");

async function SpaceInstancePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    let Workspace = await $$.loadPlugin("WorkspacePlugin");
    let WorkspaceUser = await $$.loadPlugin("WorkspaceUser");
    let EmailPlugin = await $$.loadPlugin("EmailPlugin");
    self.getCollaborators = async function () {
        const userIds = await WorkspaceUser.getAllUsers();
        let users = [];
        for (let userId of userIds) {
            let user = await WorkspaceUser.getUser(userId);
            users.push(user);
        }
        return users;
    }
    self.addCollaborators = async function(referrerId, collaborators, spaceName) {
        const users = await self.getCollaborators();
        let existingUserEmails = users.map(user => user.email);
        let existingCollaborators = [];
        for (let collaborator of collaborators) {
            if (existingUserEmails.includes(collaborator.email)) {
                existingCollaborators.push(collaborator.email);
                continue;
            }
            await WorkspaceUser.createUser(collaborator.email, collaborator.email, collaborator.role);
            if (configs.ENABLE_EMAIL_SERVICE) {
                let subject = "You have been added to a space";
                let text = `You have been added to the space ${spaceName} by ${referrerId}`;
                let html = `<p>You have been added to the space ${spaceName} by ${referrerId}</p>`;
                await EmailPlugin.sendEmail(collaborator.email, process.env.SENDGRID_SENDER_EMAIL, subject, text, html);
            }
        }
        return existingCollaborators;
    }
    self.getDefaultAgentId = async function(){
        return "Assistant";
    }
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await SpaceInstancePlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["SpaceInstancePersistence", "WorkspacePlugin", "WorkspaceUser", "EmailPlugin"];
    }
}