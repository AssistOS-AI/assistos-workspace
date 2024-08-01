const utilModule = require("assistos").loadModule("util", {});
export class PersonalitiesPage {
    constructor(element, invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.invalidate = invalidate;
        this.refreshPersonalities = async ()=>{
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
        }
        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate, this.refreshPersonalities);

        this.id = "personalities";
        this.invalidate(async() =>{
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            await utilModule.subscribeToObject(this.id, ()=>{
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
        await utilModule.unsubscribeFromObject(this.id);
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