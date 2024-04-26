export class PersonalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.notificationId = assistOS.space.getNotificationId();
        this.refreshPersonalities = async ()=>{
            this.personalities = await assistOS.space.refreshPersonalitiesMetadata();
        }
        assistOS.space.observeChange(this.notificationId, invalidate, this.refreshPersonalities);
        this.invalidate = invalidate;
        this.invalidate(async() =>{
            await assistOS.space.getPersonalitiesMetadata();
        });
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (this.personalities.length > 0) {
            this.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-unit data-name="${item.name}" data-id="${item.id}" data-image="${item.image || "./wallet/assets/images/default-personality.png"}"></personality-unit>`;
            });
        }
    }
    setContext(){
        assistOS.context = {
            "location and available actions":"You are in the page Personalities. Here you can add, edit or delete personalities.",
            "available items": assistOS.space.personalities.map((personality)=>personality.simplify())
        }
    }
    expandTable(){
        let table = this.element.querySelector(".table");
        table.style.gridTemplateColumns = "repeat(4, 1fr)";
        table.style.gridColumnGap = "25px";
    }
    minimizeTable(){
        let table = this.element.querySelector(".table");
        table.style.gridTemplateColumns = "repeat(3, 1fr)";
        table.style.gridColumnGap = "0px";
    }
    afterRender(){
        if(this.boundExpandTable){
            this.element.removeEventListener("hideSidebar", this.boundExpandTable);
        }
        this.boundExpandTable = this.expandTable.bind(this);
        this.element.addEventListener("hideSidebar", this.boundExpandTable);
        if(this.boundMinimizeTable){
            this.element.removeEventListener("showSidebar", this.boundMinimizeTable);
        }
        this.boundMinimizeTable = this.minimizeTable.bind(this);
        this.element.addEventListener("showSidebar", this.boundMinimizeTable);
        this.setContext();
    }
    async showAddPersonalityModal() {
        await assistOS.UI.showModal("add-personality-modal");
    }

    async selectPersonality(_target){
        let personalityId = assistOS.UI.reverseQuerySelector(_target, "personality-unit").getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/edit-personality-page/${personalityId}`);
    }
}