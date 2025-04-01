const documentModule = require("assistos").loadModule("document", {});
let constants = require("assistos").constants;
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
            let document = await documentModule.addDocument(assistOS.space.id, formData.data.documentTitle, constants.DOCUMENT_CATEGORIES.DOCUMENT);
            assistOS.UI.closeModal(_target);
            await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-view-page/${document.id}`);
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
                    // Call the conversion service
                    console.log('Converting document to JSON...');
                    const startConversion = performance.now();
                    const jsonData = await documentModule.convertDocument(formData);
                    const textContent = jsonData.text_content;
                    const images = jsonData.images || [];
                    const imageInfo = jsonData.image_info || [];
                    console.log(`Conversion completed in ${((performance.now() - startConversion)/1000).toFixed(2)}s`);
                    console.log(`Found ${images.length} images in the document`);
                    console.log('Image names from JSON:', images);
                    console.log('Image info from JSON:', imageInfo);

                    // Create a map to store uploaded image IDs
                    const imageMap = new Map();
                    
                    // Upload images if any
                    if (images.length > 0) {
                        console.log('Uploading images...');
                        const spaceModule = require("assistos").loadModule("space", {});
                        
                        // Get the docs converter URL from assistOS config
                        let assistOSConfigs;
                        try {
                            const configResponse = await fetch("assistOS-configs.json");
                            assistOSConfigs = await configResponse.json();
                        } catch (configError) {
                            console.warn('Could not load assistOS-configs.json:', configError);
                            assistOSConfigs = {};
                        }
                        
                        if (!assistOSConfigs.docsConverterUrl) {
                            throw new Error('docsConverterUrl not found in assistOS-configs.json');
                        }
                        
                        const docsConverterUrl = assistOSConfigs.docsConverterUrl;
                        console.log('Using docs converter URL:', docsConverterUrl);
                        
                        for (const imageName of images) {
                            try {
                                // Fetch the image from the docs converter service
                                const imageUrl = `${docsConverterUrl}/images/${imageName}`;
                                console.log(`Fetching image from: ${imageUrl}`);
                                
                                const imageResponse = await fetch(imageUrl);
                                if (!imageResponse.ok) {
                                    console.error(`Failed to fetch image ${imageName}: ${imageResponse.status} ${imageResponse.statusText}`);
                                    continue;
                                }
                                
                                // Get the image as a blob
                                const imageBlob = await imageResponse.blob();
                                const imageArrayBuffer = await imageBlob.arrayBuffer();
                                const imageBuffer = new Uint8Array(imageArrayBuffer);
                                
                                // Upload the image to AssistOS
                                const imageId = await spaceModule.putImage(imageBuffer);
                                imageMap.set(imageName, imageId);
                                console.log(`Uploaded image ${imageName}, got ID: ${imageId}`);
                            } catch (imageError) {
                                console.error(`Error uploading image ${imageName}:`, imageError);
                            }
                        }
                    }

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
                            
                            // Check if paragraph has image tags
                            if (paragraphText.includes('[Image:')) {
                                console.log('Found image tag in paragraph:', paragraphText);
                                
                                // Extract image name from tag
                                const imageTagMatch = paragraphText.match(/\[Image:\s*([^\]]+)\]/);
                                if (imageTagMatch && imageTagMatch[1]) {
                                    const imageName = imageTagMatch[1].trim();
                                    console.log(`Extracted image name: "${imageName}"`);
                                    
                                    // Check if we have this image in our map
                                    if (imageMap.has(imageName)) {
                                        const imageId = imageMap.get(imageName);
                                        console.log(`Found matching image ID: ${imageId}`);
                                        
                                        // Add paragraph with image command
                                        await documentModule.addParagraph(assistOS.space.id, docId, chapterId, {
                                            text: paragraphText.replace(`[Image: ${imageName}] `, ''),
                                            commands: {
                                                image: {
                                                    id: imageId
                                                }
                                            }
                                        });
                                        console.log(`Added paragraph with image: ${imageName}`);
                                    } else {
                                        console.log(`No matching image ID found for: ${imageName}`);
                                        // Add regular paragraph without image
                                        await documentModule.addParagraph(assistOS.space.id, docId, chapterId, {
                                            text: paragraphText
                                        });
                                    }
                                } else {
                                    console.log('Failed to extract image name from tag:', imageTagMatch);
                                    // Add regular paragraph without image
                                    await documentModule.addParagraph(assistOS.space.id, docId, chapterId, {
                                        text: paragraphText
                                    });
                                }
                            } else {
                                // Add regular paragraph without image
                                await documentModule.addParagraph(assistOS.space.id, docId, chapterId, {
                                    text: paragraphText
                                });
                            }
                            
                            if ((pIndex + 1) % 5 === 0) {
                                console.log(`Progress: ${pIndex + 1}/${chapterContent.length} paragraphs`);
                            }
                        }
                    }
                    console.log(`All chapters and paragraphs added in ${((performance.now() - startChapters)/1000).toFixed(2)}s`);
                    console.log(`Total processing time: ${((performance.now() - startConversion)/1000).toFixed(2)}s`);
                    
                    // Remove any existing info toasts
                    document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
                    
                    // Show success toast
                    assistOS.showToast('Document uploaded successfully!',"success", 3000);
                } catch (error) {
                    console.error('Error processing file:', error);
                    // Remove any existing info toasts
                    document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
                    
                    // Close the modal first
                    assistOS.UI.closeModal(_target);
                    // Reset button state
                    uploadButton.innerHTML = originalButtonText;
                    uploadButton.disabled = false;
                    // Show toast error message
                    assistOS.showToast('Error processing file: ' + error.message,"error",5000);
                    return;
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
        } catch (error) {
            console.error('Unexpected error:', error);
            // Remove any existing info toasts
            document.querySelectorAll('.timeout-toast.info').forEach(toast => toast.remove());
            
            // Close the modal first
            assistOS.UI.closeModal(_target);
            // Reset button state
            uploadButton.innerHTML = originalButtonText;
            uploadButton.disabled = false;
            // Show toast error message
            assistOS.showToast('An unexpected error occurred: ' + error.message, "error", 5000);
        }
    }
}
