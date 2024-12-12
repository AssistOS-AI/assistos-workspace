const utilModule = require("assistos").loadModule("util", {});
const spaceModule = require("assistos").loadModule("space", {})
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
            this.boundsOnListUpdate = this.onListUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, this.boundsOnListUpdate);
        });
    }
    onListUpdate(){
        this.invalidate(this.refreshPersonalities);
    }
    async beforeRender() {
        this.personalityBlocks = "";
        for(let pers of this.personalities){
            let imageSrc;
            if(pers.imageId){
                imageSrc = await spaceModule.getImageURL(pers.imageId);
            } else {
                imageSrc = "./wallet/assets/images/default-personality.png";
            }
            this.personalityBlocks += `<personality-item data-name="${pers.name}" data-id="${pers.id}" data-image="${imageSrc}"></personality-item>`;
        }
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
           const importResult= await spaceModule.importPersonality(assistOS.space.id, formData);
           if(importResult.overriden){
                alert(`The personality ${importResult.name} has been overriden`);
           }
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