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

        let lastCreatedDocId = null;
        for (const file of files) {
            console.log(`Processing file: ${file.name}`);
            const formData = new FormData();
            formData.append('file', file);

            try {
                // Call the conversion service
                console.log('Converting document to JSON...');
                const startConversion = performance.now();
                const response = await fetch('http://localhost:3001/convert', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const jsonData = await response.json();
                const textContent = jsonData.text_content;
                console.log(`Conversion completed in ${((performance.now() - startConversion)/1000).toFixed(2)}s`);

                // Create the main document
                console.log('Creating AssistOS document...');
                const startDoc = performance.now();
                let docId = await documentModule.addDocument(assistOS.space.id, {
                    title: textContent.title || file.name,
                    topic: 'Converted Document',
                    abstract: JSON.stringify(textContent.document_info || {})
                });
                lastCreatedDocId = docId;
                console.log(`Document created in ${((performance.now() - startDoc)/1000).toFixed(2)}s`);

                // Add chapters and paragraphs
                console.log(`Adding ${textContent.chapters.length} chapters...`);
                const startChapters = performance.now();
                for (const [index, chapter] of textContent.chapters.entries()) {
                    const chapterTitle = Object.keys(chapter)[0];
                    const chapterContent = chapter[chapterTitle];
                    
                    // Create chapter
                    console.log(`Creating chapter ${index + 1}/${textContent.chapters.length}: ${chapterTitle}`);
                    const chapterId = await documentModule.addChapter(assistOS.space.id, docId, {
                        title: chapterTitle
                    });

                    // Add paragraphs to chapter
                    console.log(`Adding ${chapterContent.length} paragraphs to chapter "${chapterTitle}"...`);
                    for (const [pIndex, paragraph] of chapterContent.entries()) {
                        const paragraphText = Object.values(paragraph)[0];
                        await documentModule.addParagraph(assistOS.space.id, docId, chapterId, {
                            text: paragraphText
                        });
                        if ((pIndex + 1) % 5 === 0) {
                            console.log(`Progress: ${pIndex + 1}/${chapterContent.length} paragraphs`);
                        }
                    }
                }
                console.log(`All chapters and paragraphs added in ${((performance.now() - startChapters)/1000).toFixed(2)}s`);
                console.log(`Total processing time: ${((performance.now() - startConversion)/1000).toFixed(2)}s`);
            } catch (error) {
                console.error('Error processing file:', error);
                assistOS.UI.showError('Error processing file: ' + error.message);
                continue;
            }
        }

        assistOS.UI.closeModal(_target);
        
        // Add a small delay to ensure modal is fully closed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Only redirect if we successfully created at least one document
        if (lastCreatedDocId) {
            console.log('Redirecting to the created document...');
            await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-view-page/${lastCreatedDocId}`);
        } else {
            await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-list-page`);
        }
    }
}
