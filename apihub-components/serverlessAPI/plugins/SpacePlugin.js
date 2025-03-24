const {promises: fsPromises} = require("fs");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const constants = require("../../space/constants");
const secrets = require("../../apihub-component-utils/secrets");
const date = require("../../apihub-component-utils/date");

async function SpacePlugin(){
    let self = {};
    let persistence = await $$.loadPlugin("SpacePersistence");
    let UserLogin = await $$.loadPlugin("UserLogin");
    self.listAllSpaces = async function(){
        let spaces = await persistence.getEverySpace();
        return spaces;
    }
    self.createSpace = async function(spaceName, email, spacesFolder){
        let spaceData = {
            name: spaceName,
            users: [{email: email, role: constants.ROLES.OWNER}],
            applications: [],
            defaultAgent: "Assistant"
        }
        let space = await persistence.createSpaceStatus(spaceData);
        await secrets.createSpaceSecretsContainer(space.id);
        const spacePath = path.join(spacesFolder, space.id);
        let PersonalityPlugin = await $$.loadPlugin("PersonalityPlugin");
        await PersonalityPlugin.copyDefaultPersonalities(spacePath, space.id)
        await self.linkSpaceToUser(email, space.id)
        return space;
    }
    self.linkSpaceToUser = async function (email, spaceId) {
        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        userInfo.currentSpaceId = spaceId;
        if(!userInfo.spaces){
            userInfo.spaces = [];
        }
        if(userInfo.spaces.includes(spaceId)){
            console.log(`User ${email} is already linked to space ${spaceId}`);
            return;
        }
        userInfo.spaces.push(spaceId);
        await UserLogin.setUserInfo(email, userInfo);
    }
    self.unlinkSpaceFromUser = async function (email, spaceId) {
        let userInfo = UserLogin.getUserInfo(email);
        userInfo.spaces = userInfo.spaces.filter(id => id !== spaceId);
        if (userInfo.currentSpaceId === spaceId) {
            userInfo.currentSpaceId = userInfo.spaces.length > 0 ? userInfo.spaces[0] : null;
        }
        await UserLogin.setUserInfo(email, userInfo);
    }
    self.getSpaceStatus = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
    }
    self.getDefaultSpaceId = async function(email) {
        let result = UserLogin.getUserInfo(email);
        return result.userInfo.currentSpaceId;
    }
    self.setUserCurrentSpace = async function (email, spaceId) {
        let result = await UserLogin.getUserInfo(email);
        result.userInfo.currentSpaceId = spaceId;
        await UserLogin.setUserInfo(email, result.userInfo);
    }
    self.linkUserToSpace = async function(spaceId, userId, referrerId, role) {
        const spaceStatus = await persistence.getSpaceStatus(spaceId);
        if (spaceStatus.users[userId]) {
            return {
                status: "failed",
                reason: "user already linked to space",
            }
        }
        spaceStatus.users[userId] = {
                roles: [role],
                referrerId: referrerId,
                joinDate: date.getCurrentUnixTime()
            }
        await persistence.updateSpaceStatus(spaceId, spaceStatus);
    }

    self.getDefaultSpaceAgentId = async function (spaceId) {
        let spaceStatus = await persistence.getSpaceStatus(spaceId);
        return spaceStatus.defaultAgent;
    }
    self.getSpaceStatus = async function (spaceId) {
        return await persistence.getSpaceStatus(spaceId);
    }
    self.shutDown = async function(){
        await persistence.shutDown();
    }
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await SpacePlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["SpacePersistence", "UserLogin", "PersonalityPlugin"];
    }
}