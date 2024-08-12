const utilModule = require("assistos").loadModule("util", {});
const spaceAPIs = require("assistos").loadModule("space", {})

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
    async importDocument(_target){
        const  handleFile= async (file) => {
            const formData= new FormData();
            formData.append("file", file);
            await spaceAPIs.importPersonality(assistOS.space.id,formData);
        }
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.persai';
        fileInput.style.display = 'none';
        fileInput.onchange = async (event)=> {
            const file = event.target.files[0];
            if (file) {
                if (file.name.endsWith('.persai')) {
                    await handleFile(file);
                    this.invalidate(this.refreshPersonalities);
                    document.body.appendChild(fileInput);
                    fileInput.remove();
                } else {
                    alert('Only a .persai files are allowed!');
                }
            }
        };
        fileInput.click();
    }
}