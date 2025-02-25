const documentModule = require("assistos").loadModule("document", {});

export class AddDocumentModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.element = element;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.setupSourceToggle();
        this.setupTheme();
        this.invalidate();
    }

    setupTheme() {
        this.element.dataset.theme = this.currentTheme;
        document.addEventListener('themechange', this.handleThemeChange.bind(this));
    }

    handleThemeChange(event) {
        this.currentTheme = event.detail.theme;
        this.element.dataset.theme = this.currentTheme;
    }

    setupSourceToggle() {
        this.element.addEventListener('click', (e) => {
            const sourceOption = e.target.closest('.source-option');
            if (sourceOption) {
                const tab = sourceOption.dataset.tab;
                this.switchTab(tab);
            }
        });
    }

    switchTab(tab) {
        const options = this.element.querySelectorAll('.source-option');
        const forms = this.element.querySelectorAll('.add-document-form');
        
        options.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.style.display = 'none');
        
        this.element.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        this.element.querySelector(`#${tab}DocumentForm`).style.display = 'flex';
    }

    beforeRender() {
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            let docId = await documentModule.addDocument(assistOS.space.id, {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            });
            assistOS.UI.closeModal(_target);
            await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-view-page/${docId}`);
        }
    }

    async uploadFiles(_target) {
        const fileInput = this.element.querySelector('#fileUpload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            assistOS.UI.showError('Please select at least one file');
            return;
        }

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    let docId = await documentModule.addDocument(assistOS.space.id, {
                        title: file.name,
                        topic: 'Uploaded file',
                        content: e.target.result
                    });
                } catch (error) {
                    assistOS.UI.showError('Error uploading file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }

        assistOS.UI.closeModal(_target);
        await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-list-page`);
    }
}
