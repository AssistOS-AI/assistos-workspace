import {Space} from './Space.js';

async function createSpace(spaceName, apiKey){
    await assistOS.storage.createSpace(spaceName, apiKey);
}
async function loadSpace(spaceId) {
    const spaceData = (await assistOS.storage.loadSpace(spaceId)).data;
    assistOS.space = new Space(spaceData);
    await assistOS.space.loadFlows();
    await assistOS.space.loadApplicationsFlows();
}
async function changeSpace(spaceId) {
    await this.loadSpace(spaceId);
    await assistOS.refresh();
}


