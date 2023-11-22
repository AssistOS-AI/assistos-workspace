import {SaveElementTimer, sanitize, parseURL, extractFormInformation} from "../../../imports.js";

export class abstractProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.abstractText = this._document.abstract;
        if(!this.personality){
            this.selectedPersonality = `<option value="" disabled selected hidden>Select personality</option>`;
        }else {
            this.selectedPersonality = `<option value="${this.personality.id}" selected>${this.personality.name}</option>`
        }
        let stringHTML = "";
        for(let personality of webSkel.currentUser.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    afterRender(){
        if(this.improvedAbstract){
            let improvedAbstractSection = this.element.querySelector(".improved-abstract-container");
            improvedAbstractSection.style.display = "block";
        }
        let detailsElement = this.element.querySelector("#details");
        if(this.details){
            detailsElement.value = this.details;
        }
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async executeProofRead() {
        let form = this.element.querySelector(".proofread-form");
        const formData = await extractFormInformation(form);

        this.text = formData.data.text;
        if(formData.data.personality){
            this.personality = webSkel.currentUser.space.getPersonality(formData.data.personality);
        }
        this.details = formData.data.details;

        let result = await webSkel.getService("GlobalFlowsService").proofreadFlows.proofread(this.abstractText, formData.data.personality, this.details);
        this.observations = sanitize(result.responseJson.observations);
        this.improvedAbstract = sanitize(result.responseJson.improvedText);
        this.invalidate();
    }

    editCurrentAbstract(){
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await this._document.updateAbstract(sanitizedText);
                    abstract.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstract.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }
    async enterEditMode(_target) {
        let confirmationPopup = this.element.querySelector("confirmation-popup");
        if(confirmationPopup){
            confirmationPopup.remove();
        }
        let abstract = this.element.querySelector(".improved-abstract");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, abstract, controller), {signal:controller.signal});
        abstract.setAttribute("contenteditable", "true");
        abstract.focus();
    }

    async exitEditMode (abstract, controller, event) {
        if (abstract.getAttribute("contenteditable") === "true" && abstract !== event.target && !abstract.contains(event.target)) {
            abstract.setAttribute("contenteditable", "false");
            this.improvedAbstract = abstract.innerText;
            controller.abort();
        }
    }


    async acceptImprovements(_target) {
        let abstract = this.element.querySelector(".improved-abstract").innerText;
        if(abstract !== this._document.abstract) {
            await this._document.updateAbstract(abstract);
            this.invalidate();
        }
    }
    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }
    async proofreadAbstract(){
        await webSkel.changeToDynamicPage("abstract-proofread-page", `documents/${this._document.id}/abstract-proofread-page`);
    }

}

