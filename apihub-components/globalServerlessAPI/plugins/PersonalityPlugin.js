const volumeManager = require("../../volumeManager");
const path = require("path");
const {promises: fsPromises} = require("fs");
const defaultModels = require("../defaultModels");
async function PersonalityPlugin() {
    let self = {};
    // let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    self.copyDefaultPersonalities = async function (spacePath, spaceId) {
        const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
        const personalitiesPath = path.join(spacePath, 'personalities');

        await fsPromises.mkdir(personalitiesPath, {recursive: true});
        const files = await fsPromises.readdir(defaultPersonalitiesPath, {withFileTypes: true});

        let promises = [];
        for (const entry of files) {
            if (entry.isFile()) {
                promises.push(self.preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId));
            }
        }
        await Promise.all(promises);
    }
    self.preparePersonalityData = async function (defaultPersonalitiesPath, personalitiesPath, entry) {
        const filePath = path.join(defaultPersonalitiesPath, entry.name);
        let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        personality.llms = defaultModels;
        let imagesPath = path.join(defaultPersonalitiesPath, 'images');
        let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${personality.imageId}.png`));

        //personality.imageId = await spaceModule.putImage(imageBuffer);
        await persistence.createPersonality(personality);
    }
    self.getPersonality = async function(id) {
        //id can be name
        return await persistence.getPersonality(id);
    }
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await PersonalityPlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return [];
    }
}
