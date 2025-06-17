import { generateAPACitation } from "./referenceUtils.js";
export class ReferencesTable {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.references = [];
        this.element.classList.add("maintain-focus");
        let documentViewPage = document.querySelector("document-view-page");
        this.docPresenter = documentViewPage.webSkelPresenter;
        this.documentId = this.docPresenter._document.id;
        this.invalidate();
    }
    beforeRender() {

    }
    afterRender() {
        if (this.torContentCollapsed) {
            const torContent = this.element.querySelector('.tor-content');
            const visibilityArrow = this.element.querySelector('.tor-visibility-arrow');
            torContent.style.display = 'none';
            visibilityArrow.classList.add('collapsed');
            return;
        }
        this.refreshTableOfReferences();
    }
    toggleTorVisibility(arrow){
        const torContent = this.element.querySelector('.tor-content');
        const isHidden = torContent.style.display === 'none';
        torContent.style.display = isHidden ? 'block' : 'none';
        arrow.classList.toggle('collapsed', !isHidden);
        this.torContentCollapsed = !isHidden;
        this.savePluginStates();
    }

    refreshTableOfReferences() {
        const torContent = this.element.querySelector('.tor-content');
        torContent.innerHTML = '';
        if (this.references.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'tor-empty';
            emptyMessage.textContent = 'No references available. Click \'Add Reference\' to add one.';
            torContent.appendChild(emptyMessage);
            return;
        }

        // Sort references alphabetically by author for APA style
        const sortedReferences = [...this.references].sort((a, b) => {
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
    closeTable(){
        this.docPresenter.torState = false;
        this.docPresenter.savePluginStates();
        this.element.remove();
    }
    async addReference() {
        await this.openReferenceModal();
    }
    async editReference(button, referenceId) {
        const ref = this.references.find(r => r.id === referenceId);
        if (ref) {
            await this.openReferenceModal(ref);
        }
    }
    deleteReference(button, referenceId) {
        if (confirm('Are you sure you want to delete this reference?')) {
            this.references = this.references.filter(ref => ref.id !== referenceId);
            this.refreshTableOfReferences();
            this.docPresenter.savePluginStates();
            this.saveReferencesToLocalStorage();
            this.refreshTableOfReferences();
        }
    }

    async openReferenceModal(reference = null) {
        let saveData = await assistOS.UI.createReactiveModal("add-reference", {reference}, true);
        if(saveData){
            this.refreshTableOfReferences();
            this.docPresenter.savePluginStates();
            this.saveReferencesToLocalStorage();
        }
    }
    saveReferencesToLocalStorage() {
        try {
            const storedDict = localStorage.getItem('documentReferencesDict');
            const dict = storedDict ? JSON.parse(storedDict) : {};
            dict[this.documentId] = this.references;
            localStorage.setItem('documentReferencesDict', JSON.stringify(dict));
        } catch (e) {
            console.error("Failed to save references to localStorage:", e);
        }
    }
    loadReferencesFromLocalStorage() {
        try {
            const storedDict = localStorage.getItem('documentReferencesDict');
            if (storedDict) {
                const dict = JSON.parse(storedDict);
                this.references = dict[this.documentId] || [];
            } else {
                this.references = [];
            }
        } catch (e) {
            console.error("Failed to load references from localStorage:", e);
            this.references = [];
        }
    }
}