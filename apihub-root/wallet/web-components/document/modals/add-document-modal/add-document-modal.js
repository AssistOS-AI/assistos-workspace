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
            assistOS.showToast('Please select at least one file', "error", 3000);
            return;
        }

        // Get the upload button and set loading state
        const uploadButton = this.element.querySelector('[data-local-action="uploadFiles"]');
        const originalButtonText = uploadButton.textContent;
        uploadButton.innerHTML = '<div class="loading-icon small"></div>';
        uploadButton.disabled = true;
        
        // Show processing toast
        assistOS.showToast('Uploading document, please wait...', "info", 60000);

        let lastCreatedDocId = null;
        try {
            for (const file of files) {
                console.log(`Processing file: ${file.name}`);
                const formData = new FormData();
                formData.append('file', file);

                try {
                    // Upload the file to the server for processing
                    console.log('Uploading document for processing...');
                    const startTime = performance.now();
                    
                    // Call the server-side upload endpoint
                    const docId = await documentModule.uploadDoc(assistOS.space.id, formData);
                    lastCreatedDocId = docId;
                    
                    console.log(`Document processed in ${((performance.now() - startTime)/1000).toFixed(2)}s`);
                    
                    // Show success toast
                    document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
                    assistOS.showToast('Document uploaded successfully!', "success", 3000);
                } catch (error) {
                    console.error('Error uploading document:', error);
                    document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
                    assistOS.showToast(`Error uploading document: ${error.message}`, "error", 5000);
                }
            }
        } catch (error) {
            console.error('Error processing files:', error);
            document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
            assistOS.showToast(`Error processing files: ${error.message}`, "error", 5000);
        } finally {
            // Reset button state
            uploadButton.innerHTML = originalButtonText;
            uploadButton.disabled = false;
            
            // Navigate to the document if one was created
            if (lastCreatedDocId) {
                assistOS.UI.closeModal(_target);
                await assistOS.UI.changeToDynamicPage(`space-application-page`, 
                    `${assistOS.space.id}/Space/document-view-page/${lastCreatedDocId}`);
            }
        }
    }
}
