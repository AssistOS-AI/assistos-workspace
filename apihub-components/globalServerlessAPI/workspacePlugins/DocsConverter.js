const fs = require('fs');
const fsPromises = fs.promises;
const path = require("path");
const Busboy = require("busboy");
const docsConverterUrl = "http://localhost:3001"
async function DocsConverter() {
    let self = {};
    const Documents = $$.loadPlugin("Documents");
    self.convertDocument = async function (files) {
        let promises = [];
        for (let file of files) {
            promises.push(self.uploadFileToDisk(file));
        }

        let uploadedFiles =await Promise.all(promises);
        let lastCreatedDocId = null;
        for (const file of uploadedFiles) {
            const startConversion = performance.now();
            console.log(`Processing file: ${file.name}`);
            const formData = new FormData();
            const fileStream = fs.readFileSync(file.filepath);
            formData.append('file', new Blob([fileStream], { type: file.mimetype }), file.filename);

            const jsonData = await self.callConverterServer(formData);
            const textContent = jsonData.text_content;
            const images = jsonData.images || [];
            const imageInfo = jsonData.image_info || [];
            console.log(`Conversion completed in ${((performance.now() - startConversion)/1000).toFixed(2)}s`);
            console.log(`Found ${images.length} images in the document`);
            console.log('Image names from JSON:', images);
            console.log('Image info from JSON:', imageInfo);

            // Create a map to store uploaded image IDs
            const imageMap = await self.uploadImages(images);

            // Create the main document
            console.log('Creating AssistOS document...');
            const startDoc = performance.now();
            let title = textContent.title || file.name;
            let docInfo = JSON.stringify(textContent.document_info || {})
            let documentObj = await Documents.createDocument(title, "document", docInfo);
            let docId = documentObj.id;
            lastCreatedDocId = docId;
            console.log(`Document created in ${((performance.now() - startDoc)/1000).toFixed(2)}s`);

            // Add chapters and paragraphs
            console.log(`Adding ${textContent.chapters.length} chapters...`);
            const startChapters = performance.now();
            for (const [index, chapter] of textContent.chapters.entries()) {
                await self.createChapter(index, chapter, docId, imageMap);
            }
            console.log(`All chapters and paragraphs added in ${((performance.now() - startChapters)/1000).toFixed(2)}s`);
            console.log(`Total processing time: ${((performance.now() - startConversion)/1000).toFixed(2)}s`);
        }
        return lastCreatedDocId;
    }
    self.uploadFileToDisk = async function(){
        //upload Files to disk?
        let tempDir = path.join(process.env.PERSISTENCE_FOLDER, "Temp", crypto.generateSecret(16));
        await fsPromises.mkdir(tempDir, { recursive: true });
        const tempFilePath = path.join(tempDir, `upload_${Date.now()}.bin`);
        const busboyOptions = { headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } };
        let busboy = new Busboy(busboyOptions);
        busboy.on('file', (fieldName, fileStream, fileInfo) => {
            const writeStream = fs.createWriteStream(tempFilePath);
            let fileSize = 0;
            fileStream.on('data', (chunk) => {
                fileSize += chunk.length;
            });
            fileStream.pipe(writeStream);
            writeStream.on('finish', () => {
                // Extract filename and mimetype, handling both string and object formats
                let filename = 'document.bin';
                let mimetype = 'application/octet-stream';
                if (typeof fileInfo === 'object' && fileInfo !== null) {
                    filename = fileInfo.filename || 'document.bin';
                    mimetype = fileInfo.mimeType || 'application/octet-stream';
                } else if (typeof fileInfo === 'string') {
                    filename = fileInfo;
                }

                let uploadedFile = {
                    fieldName,
                    filepath: tempFilePath,
                    filename,
                    mimetype,
                    size: fileSize,
                    ready: true
                };
            });

            writeStream.on('error', (err) => {
                console.error(`[DocConverter] Error saving file: ${err.message}`);
            });
        });
        req.pipe(busboy);
    }
    self.createChapter = async (index, chapter, docId, imageMap) => {
        const chapterTitle = Object.keys(chapter)[0];
        const chapterContent = chapter[chapterTitle];

        // Create chapter
        console.log(`Creating chapter ${index + 1}/${textContent.chapters.length}: ${chapterTitle}`);
        const chapterObj = await Documents.createChapter(docId, chapterTitle);
        let chapterId = chapterObj.id;

        // Add paragraphs to chapter
        console.log(`Adding ${chapterContent.length} paragraphs to chapter "${chapterTitle}"...`);
        for (const [pIndex, paragraph] of chapterContent.entries()) {
            await self.createParagraph(pIndex, paragraph, chapterId, imageMap);
            if ((pIndex + 1) % 5 === 0) {
                console.log(`Progress: ${pIndex + 1}/${chapterContent.length} paragraphs`);
            }
        }
    }
    self.createParagraph = async function (pIndex, paragraph, chapterId, imageMap) {
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
                    let text = paragraphText.replace(`[Image: ${imageName}] `, '');
                    await Documents.createParagraph(chapterId, text);
                    console.log(`Added paragraph with image: ${imageName}`);
                    return;
                }
            }
        }
        // Add regular paragraph without image
        await Documents.createParagraph(chapterId, paragraphText);
    }
    self.callConverterServer = async function (formData){
        const init = {
            method: 'POST',
            body: formData
        };
        // Use server proxy endpoint instead of direct docs converter URL
        let url = docsConverterUrl + '/documents/convert';
        const response = await fetch(url, init);
        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = errorText;
            try {
                errorDetails = JSON.parse(errorText);
            } catch (e) {
                // Not JSON, keep as text
            }
            throw new Error(`HTTP error! status: ${response.status}, details: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails}`);
        }
        const data = await response.json();
        return data.text_content;
    }
    self.uploadImages = async function (images) {
        // Upload images if any
        const imageMap = new Map();
        if (images.length > 0) {
            console.log('Uploading images...');
            const spaceModule = require("assistos").loadModule("space", {});

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
        return imageMap;
    }
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await DocsConverter();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["Documents"];
    }
}