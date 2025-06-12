async function AssistOSAdmin(){
    let self = {};
    const persistence = await $$.loadPlugin("StandardPersistence");

    persistence.configureTypes({
        spaceStatus: {
            name: "string"
        }
    });

    await persistence.createIndex("spaceStatus", "name");

    let userLogger = await $$.loadPlugin("UserLoggerPlugin");
    let AdminPlugin = await $$.loadPlugin("AdminPlugin");

    self.roles = AdminPlugin.roles;
    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }
    self.getAllSpaces = async function(){
        return await persistence.getEverySpaceStatusObject();
    }

    self.createSpace = async function(spaceName, email){
        let spaceData = {
            name: spaceName
        }
        let space = await persistence.createSpaceStatus(spaceData);
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        userInfo.currentSpaceId = space.id;
        if(!userInfo.spaces){
            userInfo.spaces = [];
        }
        userInfo.spaces.push(space.id);
        await UserLogin.setUserInfo(email, {spaces: userInfo.spaces, currentSpaceId: space.id});
        let userLoginStatus = await persistence.getUserLoginStatus(email);
        await userLogger.userLog(userLoginStatus.globalUserId, `Created space: ${space.name}`);
        return space;
    }
    self.deleteSpace = async function (email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");
        let res = await UserLogin.getUserInfo(email);
        let spacesNr = res.userInfo.spaces.length;
        if (spacesNr === 1) {
            return "You can't delete your last space";
        }
        let spaceStatus = await self.getSpaceStatus(spaceId);

        await persistence.deleteSpaceStatus(spaceId);
        let userLoginStatus = await persistence.getUserLoginStatus(email);
        await userLogger.userLog(userLoginStatus.globalUserId, `Deleted space: ${spaceStatus.name}`);
    }
    self.getSpaceStatus = async function(spaceId){
        let spaceExists = await persistence.hasSpaceStatus(spaceId);
        if(spaceExists){
            return await persistence.getSpaceStatus(spaceId);
        }
    }
    self.addSpaceToUsers = async function(userEmails, spaceId, referrerEmail){
        let UserLogin = await $$.loadPlugin("UserLogin");
        let referrerUser = await persistence.getUserLoginStatus(referrerEmail);
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
        let spaceStatus = await self.getSpaceStatus(spaceId);
        await userLogger.userLog(referrerUser.globalUserId, `Invited ${userEmails.length} users to space: ${spaceStatus.name}`);
    }
    self.unlinkSpaceFromUser = async function (referrerEmail, email, spaceId) {
        let UserLogin = await $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        let userInfo = result.userInfo;
        userInfo.spaces = userInfo.spaces.filter(id => id !== spaceId);
        if (userInfo.currentSpaceId === spaceId) {
            userInfo.currentSpaceId = userInfo.spaces.length > 0 ? userInfo.spaces[0] : null;
        }
        await UserLogin.setUserInfo(email, userInfo);
        let referrerUser = await persistence.getUserLoginStatus(referrerEmail);
        let spaceStatus = await self.getSpaceStatus(spaceId);
        await userLogger.userLog(referrerUser.globalUserId, `Removed 1 user from space: ${spaceStatus.name}`);
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
    self.founderSpaceExists = async function () {
        return await persistence.hasSpaceStatus(process.env.SYSADMIN_SPACE);
    }

    self.getMatchingUsersOrSpaces = async function(input) {
        let UserLogin = await $$.loadPlugin("UserLogin");
        let matchingUsers = await UserLogin.getMatchingUsers(input);
        let spaces = await persistence.getEverySpaceStatusObject();
        let matchingSpaces = [];
        for(let space of spaces){
            if(space.name.contains(input)){
                matchingSpaces.push(space.name);
            }
        }
        return {users: matchingUsers, spaces: matchingSpaces};
    }
    return self;
}
let singletonInstance = undefined;
async function getUserRole(email) {
    let userExists = await singletonInstance.persistence.hasUserLoginStatus(email);
    if(!userExists){
        return false;
    }
    let user = await singletonInstance.persistence.getUserLoginStatus(email);
    return user.role;
}
module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await AssistOSAdmin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            // let role;
            // let AdminPlugin = await $$.loadPlugin("AdminPlugin");
            // switch (command){
            //     case "founderSpaceExists":
            //         return true;
            //     case "getFounderId":
            //     case "listAllSpaces":
            //         return args[0] === process.env.SERVERLESS_AUTH_SECRET;
            //     case "addSpaceToUsers":
            //     case "deleteSpace":
            //         return !!(await AdminPlugin.isFounder(globalUserId));
            //     case "setUserCurrentSpace":
            //         if(await AdminPlugin.isFounder(globalUserId)){
            //             return true;
            //         }
            //         return email === args[0];
            //     case "getDefaultSpaceId":
            //     case "listUserSpaces":
            //         if(await AdminPlugin.isFounder(globalUserId)){
            //             return true;
            //         }
            //         return email === args[0];
            //     case "getSpaceStatus":
            //         if(await AdminPlugin.isFounder(globalUserId)){
            //             return true;
            //         }
            //     case "createSpace":
            //         return email === args[1] || await singletonInstance.isFounder(globalUserId);
            //     case "unlinkSpaceFromUser":
            //         if(await singletonInstance.isFounder(globalUserId)){
            //             return true;
            //         }
            //         //member of the same space
            //         role = await getUserRole(args[0], args[1]);
            //         if(!role){
            //             return false;
            //         }
            //         let adminRole = await getUserRole(email, args[1]);
            //         if(!adminRole){
            //             return false;
            //         }
            //         return adminRole === roles.ADMIN;
            //     case "getAllSpaces":
            //         return await singletonInstance.isFounder(globalUserId);
            //     default:
            //         return true;
            // }
            return true;
        }
    },
    getDependencies: function () {
        return ["StandardPersistence", "AdminPlugin", "UserLoggerPlugin"];
    }
}