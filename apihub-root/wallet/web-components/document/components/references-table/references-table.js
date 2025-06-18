import { generateAPACitation } from "./referenceUtils.js";
const documentModule = assistOS.loadModule("document");

export class ReferencesTable {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        let documentViewPage = document.querySelector("document-view-page");
        this.docPresenter = documentViewPage.webSkelPresenter;
        this.tor = this.docPresenter._document.comments.tor;
        this.documentId = this.docPresenter._document.id;
        this.invalidate();
    }
    beforeRender() {

    }
    afterRender() {
        if (this.tor.collapsed) {
            const torContent = this.element.querySelector('.tor-content');
            const visibilityArrow = this.element.querySelector('.tor-visibility-arrow');
            torContent.style.display = 'none';
            visibilityArrow.classList.add('collapsed');
        }
        this.refreshTableOfReferences();
    }
    async toggleTorVisibility(arrow){
        const torContent = this.element.querySelector('.tor-content');
        const isHidden = torContent.style.display === 'none';
        torContent.style.display = isHidden ? 'block' : 'none';
        arrow.classList.toggle('collapsed', !isHidden);
        this.tor.collapsed = !isHidden;
        await this.saveTorState();
    }

    refreshTableOfReferences() {
        const torContent = this.element.querySelector('.tor-content');
        torContent.innerHTML = '';
        if (this.tor.references.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'tor-empty';
            emptyMessage.textContent = 'No references available. Click \'Add Reference\' to add one.';
            torContent.appendChild(emptyMessage);
            return;
        }

        // Sort references alphabetically by author for APA style
        const sortedReferences = [...this.tor.references].sort((a, b) => {
            const authorA = a.authors || a.name || '';
            const authorB = b.authors || b.name || '';
            return authorA.localeCompare(authorB);
        });

        sortedReferences.forEach((reference, index) => {
            const referenceItem = document.createElement('div');
            referenceItem.className = 'tor-item';

            const citation = reference.authors ?
                generateAPACitation(reference) :
                `${reference.name} - ${reference.link}`;

            referenceItem.innerHTML = `
        <div class="tor-row">
            <div class="reference-content">
                <span class="reference-number">[${index + 1}]</span>
                <span class="reference-citation">${citation}</span>
            </div>
            <div class="reference-actions">
               <button class="edit-reference-btn" data-local-action="editReference ${reference.id}">Edit</button>
               <button class="delete-reference-btn" data-local-action="deleteReference ${reference.id}">Delete</button>
            </div>
        </div>`;
            torContent.appendChild(referenceItem);
        });
    }
    async deleteTable(){
        let message = "Are you sure you want to delete the references table? References will not be saved.";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            delete this.tor;
            await this.saveTorState();
            this.element.remove();
        }
    }
    async addReference() {
        await this.openReferenceModal();
    }
    async editReference(button, referenceId) {
        const ref = this.tor.references.find(r => r.id === referenceId);
        if (ref) {
            await this.openReferenceModal(ref);
        }
    }
    async deleteReference(button, referenceId) {
        let message = "Are you sure you want to delete this reference?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            this.tor.references = this.tor.references.filter(ref => ref.id !== referenceId);
            this.refreshTableOfReferences();
            await this.saveTorState();
            this.refreshTableOfReferences();
        }
    }

    async openReferenceModal(reference = null) {
        let saveData = await assistOS.UI.createReactiveModal("add-reference", {reference}, true);
        if(saveData){
            this.refreshTableOfReferences();
            await this.saveTorState();
        }
    }
    async saveTorState() {
        let document = this.docPresenter._document;
        document.comments.tor = this.tor;
        if(!document.comments.tor) {
            delete document.comments.tor;
        }
        await documentModule.updateDocument(assistOS.space.id, document.id,
            document.title,
            document.docId,
            document.category,
            document.infoText,
            document.commands,
            document.comments);
    }
}