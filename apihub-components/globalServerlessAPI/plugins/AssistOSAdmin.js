const git = require("../../apihub-component-utils/git");
const fsPromises = require("fs").promises;
const path = require("path");
async function AssistOSAdmin(){
    let self = {};
    const persistence = $$.loadPlugin("StandardPersistence");

    persistence.configureTypes({
        spaceStatus: {
            name: "string"
        }
    });

    await persistence.createIndex("spaceStatus", "name");

    let userLogger = $$.loadPlugin("UserLoggerPlugin");

    self.listAllSpaces = async function(){
        return await persistence.getEverySpaceStatus();
    }
    self.getSpaces = async function(offset = 0, limit = 10){
        let allSpaceIds = await persistence.getEverySpaceStatus();
        let spaceIds = allSpaceIds.slice(offset, offset + limit);
        let spaces = [];
        for(let spaceId of spaceIds){
            let space = await persistence.getSpaceStatus(spaceId);
            spaces.push({
                id: space.id,
                name: space.name
            });
        }
        return spaces;
    }
    self.getSpacesCount = async function(){
        let spaces = await persistence.getEverySpaceStatus();
        return spaces.length;
    }
    self.createSpace = async function(spaceName, email){
        let spaceData = {
            name: spaceName
        }
        let space = await persistence.createSpaceStatus(spaceData);
        let UserLogin = $$.loadPlugin("UserLogin");

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
        let UserLogin = $$.loadPlugin("UserLogin");
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
        let UserLogin = $$.loadPlugin("UserLogin");
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
        let UserLogin = $$.loadPlugin("UserLogin");

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
        let UserLogin = $$.loadPlugin("UserLogin");

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
        let UserLogin = $$.loadPlugin("UserLogin");

        let result = await UserLogin.getUserInfo(email);
        result.userInfo.currentSpaceId = spaceId;
        await UserLogin.setUserInfo(email, result.userInfo);
    }
    self.listUserSpaces = async function(email) {
        let UserLogin = $$.loadPlugin("UserLogin");
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

    self.getMatchingSpaces = async function(input, offset = 0, limit = 10) {
        let names = await persistence.getEverySpaceStatusName();
        let matchingNames = names.filter(name => name.includes(input));
        matchingNames = matchingNames.slice(offset, offset + limit);
        let spaces = [];
        for(let name of matchingNames){
            let space = await persistence.getSpaceStatus(name);
            spaces.push(space);
        }
        return spaces;
    }

    self.getApplicationPath = function (appName) {
        return path.join(process.env.PERSISTENCE_FOLDER, `../systemApps/${appName}`);
    }
    self.getAvailableApps = function(){
        let apps = require("../applications.json");
        return apps.filter(app => app.systemApp);
    }
    self.installSystemApp = async function (appName) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.name === appName);
        if (!application) {
            throw new Error("Application not Found");
        }
        const applicationFolderPath = self.getApplicationPath(application.name);
        try {
            await git.clone(application.repository, applicationFolderPath);
        } catch (error) {
            if (error.message.includes("already exists and is not an empty directory")) {
                try {
                    await fsPromises.rm(applicationFolderPath, {recursive: true, force: true});
                } catch (e) {
                    //multiple users
                }
            }
            throw new Error("Failed to clone application repository " + error.message);
        }
        const manifestPath = path.join(applicationFolderPath, 'manifest.json');

        let manifestContent, manifest;
        try {
            manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
            manifest = JSON.parse(manifestContent);
        } catch (error) {
            throw new Error("Failed to read or parse Application manifest", error);
        }

        application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
        await git.installDependencies(applicationFolderPath);
        return manifest;
    }

    self.updateApplication = async function (appName) {
        const app = self.getAvailableApps().find(app => app.name === appName);
        if (!app) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(appName);
        const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, app.repository);
        if (applicationNeedsUpdate) {
            await git.updateRepo(applicationPath);
        } else {
            throw new Error("No updates available");
        }
    }

    self.requiresUpdate = async function (appName) {
        const app = self.getAvailableApps().find(app => app.name === appName);
        if (!app) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(appName);
        return await git.checkForUpdates(applicationPath, app.repository);
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
            // let AdminPlugin = $$.loadPlugin("AdminPlugin");
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