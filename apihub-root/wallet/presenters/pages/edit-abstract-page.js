import { closeModal, showActionBox,showModal} from "../../imports.js";
export class editAbstractPage {
    constructor(element) {
        this.element = element;
        this.id = webSkel.company.currentDocumentId;
        this.showChaptersInSidebar = 0;
        if (webSkel.company.documents) {
            setTimeout(() => {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => {

            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.id);
    }

    beforeRender() {
        this.title = `<title-view title="${this._document.title}"></title-view>`;
        this.alternativeAbstracts = "";
        this.chapterSidebar = "";
        if (this._document.chapters) {
            let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
            for (let number = 1; number <= 10; number++) {
                this.alternativeAbstracts += `<alternative-abstract-renderer nr="${number}" title="${suggestedTitle}"></alternative-abstract-renderer>`;
            }
            this._document.chapters.forEach((item) => {
                this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
            });
        }
        if (this.editableAbstract) {
            this.editableAbstract.removeEventListener("click", setEditableAbstract);
            document.removeEventListener("click", removeEventForDocument, true);
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    async saveAbstract() {
        let updatedAbstract = document.querySelector(".abstract-content").innerText;
        const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === this.id);
        if (documentIndex !== -1 && updatedAbstract !== this.documentService.getAbstract(this._document)) {
            for (let i = 0; i < updatedAbstract.length; i++) {
                if (updatedAbstract[i] === '\n') {
                    let numberOfNewLines = 0;
                    let initialIndex = i;
                    while (updatedAbstract[i] === '\n') {
                        i++;
                        numberOfNewLines++;
                    }
                    numberOfNewLines = Math.floor(numberOfNewLines / 2) + 1;
                    let newLineString = "";
                    for (let j = 0; j < numberOfNewLines; j++) {
                        newLineString += "<br>";
                    }
                    updatedAbstract = updatedAbstract.slice(0, initialIndex) + newLineString + updatedAbstract.slice(i);
                }
            }
            this.documentService.updateAbstract(this._document, updatedAbstract)
            await this.documentService.updateDocument(this._document, this._document.id);
        }
    }

    afterRender() {
        this.editableAbstract = this.element.querySelector("#editable-abstract");
        this.editableAbstract.addEventListener("click", setEditableAbstract);
        document.addEventListener("click", removeEventForDocument, true);
        document.editableAbstract = this.editableAbstract;
    }

    showEditChapterSubmenu() {
        const chapterSubmenuSection = document.querySelector(".sidebar-submenu");
        const sidebarArrow = document.querySelector(".arrow-sidebar");
        if (this.showChaptersInSidebar === 0) {
            chapterSubmenuSection.style.display = "inherit";
            sidebarArrow.classList.remove('rotate');
            this.showChaptersInSidebar = 1;
        } else {
            chapterSubmenuSection.style.display = "none";
            sidebarArrow.classList.toggle('rotate');
            this.showChaptersInSidebar = 0;
        }
    }

    async showSuggestAbstractModal() {
        await showModal(document.querySelector("body"), "suggest-abstract-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }
}

function removeEventForDocument(event) {
    if(this.editableAbstract.getAttribute("contenteditable") === "true" && !this.editableAbstract.contains(event.target)) {
        this.editableAbstract.setAttribute("contenteditable", "false");
    }
}

function setEditableAbstract(event) {
    this.setAttribute("contenteditable", "true");
    event.stopPropagation();
    event.preventDefault();
}