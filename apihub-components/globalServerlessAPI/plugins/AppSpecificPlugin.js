const roles = {
    "ADMIN": "admin",
    "MEMBER": "member",
    "GUEST": "guest"
}
async function AppSpecificPlugin() {
    let self = {};
    self.rewardUser = async function (user, referrerId) {
        return true;
    }
    const persistence = await $$.loadPlugin("StandardPersistence");
    persistence.configureTypes({
        spaceStatus: {
            name: "string",
            users: "array"
        }
    });

    await persistence.createIndex("spaceStatus", "name");
    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }

    self.createSpace = async function(spaceName, email){
        let spaceData = {
            name: spaceName,
            users: [{email: email, role: roles.ADMIN}]
        }
        return await persistence.createSpaceStatus(spaceData);
    }

    self.deleteSpace = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");
        let res = await UserLogin.getUserInfo(email);
        let spacesNr = res.userInfo.spaces.length;
        if (spacesNr === 1) {
            return "You can't delete your last space";
        }
        let spaceStatus = await self.getSpaceStatus(spaceId);
        let user = spaceStatus.users.find(user => user.email === email);
        if (!user) {
            return "You dont have permission to delete this space";
        }
        if (user.role !== roles.ADMIN) {
            return "You dont have permission to delete this space";
        }
        //unlink space from all users
        for (let userId of Object.keys(spaceStatus.users)) {
            await self.unlinkSpaceFromUser(email, spaceId);
        }
        await persistence.deleteSpaceStatus(spaceId);
    }

    self.getSpaceStatus = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
    }
    self.linkSpaceToUser = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

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
    self.addSpaceToUsers = async function(userEmails, spaceId){
        let UserLogin = await $$.loadPlugin("UserLogin");

        for(let email of userEmails){
            let result = await UserLogin.getUserInfo(email);
            if(result.status === "success"){
                if(!result.userInfo.spaces.includes(spaceId)){
                    result.userInfo.spaces.push(spaceId);
                }
                await UserLogin.setUserInfo(email, result.userInfo);
            } else {
                throw new Error(result.reason);
            }
        }
    }
    self.unlinkSpaceFromUser = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        userInfo.spaces = userInfo.spaces.filter(id => id !== spaceId);
        if (userInfo.currentSpaceId === spaceId) {
            userInfo.currentSpaceId = userInfo.spaces.length > 0 ? userInfo.spaces[0] : null;
        }
        await UserLogin.setUserInfo(email, userInfo);
    }
    self.getDefaultSpaceId = async function(email) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        if(!userInfo.currentSpaceId || userInfo.currentSpaceId === "undefined"){
            userInfo.currentSpaceId = userInfo.spaces[0];
            await UserLogin.setUserInfo(email, userInfo);
            return result.userInfo.currentSpaceId;

        }
        return result.userInfo.currentSpaceId;
    }
    self.setUserCurrentSpace = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        result.userInfo.currentSpaceId = spaceId;
        await UserLogin.setUserInfo(email, result.userInfo);
    }
    self.listUserSpaces = async function(email) {
        let UserLogin = await $$.loadPlugin("UserLogin");
        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        let spaces = [];
        if(userInfo.spaces){
            for(let spaceId of userInfo.spaces){
                let space = await persistence.getSpaceStatus(spaceId);
                spaces.push({id: spaceId, name: space.name});
            }
        }
        return spaces;
    }
    self.getDefaultSpaceAgentId = async function (spaceId) {
        let spaceStatus = await persistence.getSpaceStatus(spaceId);
        return spaceStatus.defaultAgent;
    }
    self.founderSpaceExists = async function () {
        return await persistence.hasSpaceStatus(process.env.SYSADMIN_SPACE);
    }
    self.getFounderId = async function () {
        let userStatus = await persistence.getUserLoginStatus(process.env.SYSADMIN_EMAIL);
        return userStatus.globalUserId;
    }
    self.isFounder = async function (userId) {
        if(!await persistence.hasUserLoginStatus(process.env.SYSADMIN_EMAIL)){
            return false;
        }
        let userStatus = await persistence.getUserLoginStatus(process.env.SYSADMIN_EMAIL);
        return userStatus.globalUserId === userId;
    }
    return self;
}

let singletonInstance = undefined;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await AppSpecificPlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["StandardPersistence"];
    }
}
