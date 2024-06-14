const spaceAPIs = require("assistos").loadModule("space", {});
const {notificationService} = require("assistos").loadModule("util", {});
export class PersonalitiesPage {
    constructor(element, invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.refreshPersonalities = async ()=>{
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
        }
        this.invalidate = invalidate;
        this.id = "personalities";
        this.invalidate(async() =>{
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            await spaceAPIs.subscribeToObject(assistOS.space.id, this.id);
            spaceAPIs.startCheckingUpdates(assistOS.space.id);
            notificationService.on(this.id, ()=>{
                this.invalidate(this.refreshPersonalities);
            });
        });
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (this.personalities.length > 0) {
            this.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-item data-name="${item.name}" data-id="${item.id}" data-image="${item.image || "./wallet/assets/images/default-personality.png"}"></personality-item>`;
            });
        }
    }
    async afterUnload() {
        await spaceAPIs.unsubscribeFromObject(assistOS.space.id, this.id);
        spaceAPIs.stopCheckingUpdates(assistOS.space.id);
    }
    setContext(){
        assistOS.context = {
            "location and available actions":"You are in the page Personalities. Here you can add, edit or delete personalities.",
            "available items": this.personalities
        }
    }

    afterRender(){
        this.setContext();
    }
    async showAddPersonalityModal() {
        await assistOS.UI.showModal("add-personality-modal");
    }

    async selectPersonality(_target){
        let personalityId = assistOS.UI.reverseQuerySelector(_target, "personality-item").getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/edit-personality-page/${personalityId}`);
    }
}