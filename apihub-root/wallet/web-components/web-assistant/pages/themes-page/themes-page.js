const WebAssistant = assistOS.loadModule("webassistant",{});

export class ThemesPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Themes"
        this.assistantId = assistOS.space.webAssistant
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }

    async beforeRender() {
        const themes = await WebAssistant.getThemes(this.spaceId,this.assistantId);
        this.themeRows = (themes||[]).map(themeData => {
            return `
            <div class="page-item">
            <span class="page-item-name">${themeData.name}</span>
           
            <div class="page-item-description-container">
            <div class="page-item-description">
            ${themeData.description}
            </div>
            <div class="page-item-description-buttons">
                <div class="pointer" data-local-action="openEditModal ${themeData.id}">
                    <img src="./wallet/assets/icons/edit-document.svg">
                </div>
                <div class="pointer" data-local-action="deleteTheme ${themeData.id}">
                    <img src="./wallet/assets/icons/trash-can.svg">
                </div>
            </div>
            </div>
            </div> `}).join('');
    }

    async afterRender() {

    }

    async generateTheme(eventTarget) {
        const {shouldInvalidate} = await assistOS.UI.showModal("generate-theme-modal", {}, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async viewActions(eventTarget, id) {
        document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('show'));

        const dropdown = eventTarget.querySelector('.action-dropdown');
        dropdown.classList.toggle('show');

        const clickHandler = (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', clickHandler);
            }
        };

        document.addEventListener('click', clickHandler);
    }

    async openAddModal(target) {
        const {shouldInvalidate} = await assistOS.UI.showModal("edit-theme-modal", {}, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async openEditModal(target, id) {
        const {shouldInvalidate} = await assistOS.UI.showModal("edit-theme-modal", {id}, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async deleteTheme(target, id) {
        let message = "Are you sure you want to delete this theme?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await WebAssistant.deleteTheme(this.spaceId,this.assistantId, id);
        this.invalidate();
    }
}