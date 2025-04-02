const configs = require("../../../data-volume/config/config.json");
const constants = require("../constants");

async function SpaceInstancePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    let Workspace = await $$.loadPlugin("WorkspacePlugin");
    let WorkspaceUser = await $$.loadPlugin("WorkspaceUser");
    let EmailPlugin = await $$.loadPlugin("EmailPlugin");
    self.createWorkspace = async function(spaceName, spaceId, ownerId, email) {
        await Workspace.createWorkspace(spaceName, ownerId, spaceId);
        await WorkspaceUser.createUser(email, email, constants.ROLES.OWNER);
    }
    self.getCollaborators = async function () {
        const userIds = await WorkspaceUser.getAllUsers();
        let users = [];
        for (let userId of userIds) {
            let user = await WorkspaceUser.getUser(userId);
            users.push(user);
        }
        return users;
    }
    self.addCollaborators = async function(referrerEmail, collaborators, spaceName) {
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
                let text = `You have been added to the space ${spaceName} by ${referrerEmail}`;
                let html = `<p>You have been added to the space ${spaceName} by ${referrerEmail}</p>`;
                await EmailPlugin.sendEmail(collaborator.email, process.env.SENDGRID_SENDER_EMAIL, subject, text, html);
            }
        }
        return existingCollaborators;
    }
    self.removeCollaborator = async function (email) {
        let allUsers = await self.getCollaborators();
        let user = await allUsers.find(user => user.email === email);
        if (user === constants.ROLES.OWNER) {
            let owners = self.getOwnersCount(allUsers);
            if (owners === 1) {
                return "Can't delete the last owner of the space";
            }
        }
        await WorkspaceUser.deleteUser(email);
    }
    self.setCollaboratorRole = async function (email, role) {
        let allUsers = await self.getCollaborators();
        let user = await allUsers.find(user => user.email === email);
        if (user === constants.ROLES.OWNER) {
            let owners = self.getOwnersCount(allUsers);
            if (owners === 1 && role !== constants.ROLES.OWNER) {
                return "Can't change the role of the last owner of the space";
            }
        }
        user.role = role;
        await WorkspaceUser.updateUser(user.id, user.email, user.displayName, role);
    }
    self.getOwnersCount = function (users) {
        let owners = 0;
        for (let id in users) {
            if (users[id].role === constants.ROLES.OWNER) {
                owners++;
            }
        }
        return owners;
    }
    self.getDefaultAgentId = async function(){
        return "Assistant";
    }

    self.estimateDocumentVideoLength = async function(spaceId, document) {
        let totalDuration = 0;
        for (let chapter of document.chapters) {
            totalDuration += self.estimateChapterVideoLength(spaceId, chapter);
        }
        return totalDuration;
    }
    self.estimateChapterVideoLength = function(spaceId, chapter) {
        let totalDuration = 0;
        for (let paragraph of chapter.paragraphs) {
            if (paragraph.commands.video) {
                let videoDuration = paragraph.commands.video.end - paragraph.commands.video.start;
                if(paragraph.commands.audio){
                    //has both audio and video
                    let maxDuration = Math.max(paragraph.commands.audio.duration, videoDuration);
                    totalDuration += maxDuration;
                } else {
                    totalDuration += parseFloat(videoDuration);
                }
            } else if (paragraph.commands.audio) {
                totalDuration += parseFloat(paragraph.commands.audio.duration);
            } else if (paragraph.commands["silence"]) {
                if (paragraph.commands["silence"].duration) {
                    totalDuration += parseFloat(paragraph.commands["silence"].duration);
                }
            } else if (paragraph.commands.image) {
                totalDuration += 1;
            }
        }
        return totalDuration;
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