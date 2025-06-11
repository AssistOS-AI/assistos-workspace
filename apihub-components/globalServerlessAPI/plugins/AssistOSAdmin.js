async function AssistOSAdmin(){
    let self = {};
    const persistence = await $$.loadPlugin("StandardPersistence");

    persistence.configureTypes({
        spaceStatus: {
            name: "string"
        }
    });

    await persistence.createIndex("spaceStatus", "name");

    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }
    self.getAllSpaces = async function(){
        return await persistence.getEverySpaceStatusObject();
    }
    self.createSpace = async function(spaceName){
        let spaceData = {
            name: spaceName
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
    self.founderSpaceExists = async function () {
        return await persistence.hasSpaceStatus(process.env.SYSADMIN_SPACE);
    }
    return self;
}
let singletonInstance = undefined;

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
            // switch (command){
            //     case "isFounder":
            //     case "founderSpaceExists":
            //     case "rewardUser":
            //         return true;
            //     case "getFounderId":
            //     case "listAllSpaces":
            //         return args[0] === process.env.SERVERLESS_AUTH_SECRET;
            //
            //     case "linkSpaceToUser":
            //     case "addSpaceToUsers":
            //     case "deleteSpace":
            //         if(await singletonInstance.isFounder(globalUserId)){
            //             return true;
            //         }
            //         role = await getUserRole(email, args[1]);
            //         if(!role){
            //             return false;
            //         }
            //         return role === roles.ADMIN;
            //
            //     case "setUserCurrentSpace":
            //         if(await singletonInstance.isFounder(globalUserId)){
            //             return true;
            //         }
            //         return email === args[0];
            //     case "getDefaultSpaceId":
            //     case "listUserSpaces":
            //         if(await singletonInstance.isFounder(globalUserId)){
            //             return true;
            //         }
            //         return email === args[0];
            //
            //
            //     case "getSpaceStatus":
            //         if(await singletonInstance.isFounder(globalUserId)){
            //             return true;
            //         }
            //         //guest
            //         role = await getUserRole(email, args[0]);
            //         if(!role){
            //             return false;
            //         }
            //         return true;
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
        return ["StandardPersistence"];
    }
}