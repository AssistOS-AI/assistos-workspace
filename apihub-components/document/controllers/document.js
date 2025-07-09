const utils = require("../../apihub-component-utils/utils");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const unzipper = require("unzipper");
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
const {sendResponse} = require("../../apihub-component-utils/utils");
const Storage = require("../../apihub-component-utils/storage");
const documentService = require("../services/document");
const ExportDocument = require("../../tasks/ExportDocument");
const TaskManager = require("../../tasks/TaskManager");
const fsPromises = fs.promises;
const { Document, Packer, TextRun, Paragraph, AlignmentType, Footer, BorderStyle, PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder, PageNumber, PageOrientation, WidthType } = require("docx");

async function exportDocument(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const exportType = request.body.exportType;
    const userId = request.userId;
    const sessionId = request.sessionId;
    try {
        let task = new ExportDocument(spaceId, userId, {documentId, exportType});
        await TaskManager.addTask(task);
        let objectId = SubscriptionManager.getObjectId(spaceId, "tasks");
        SubscriptionManager.notifyClients(sessionId, objectId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        TaskManager.runTask(task.id);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Error at getting document: ${documentId}. ${error.message}`
        });
    }
}

function downloadDocumentArchive(request, response) {
    let spaceId = request.params.spaceId;
    let fileName = request.params.fileName;
    let spacePath = space.APIs.getSpacePath(spaceId);
    let filePath = path.join(spacePath, "temp", `${fileName}.docai`);
    streamFile(filePath, response, "application/zip");
}

function streamFile(filePath, response, contentType) {
    try {
        let readStream = fs.createReadStream(filePath);
        let fileSize = fs.statSync(filePath).size;
        response.setHeader('Content-Length', fileSize);
        response.setHeader('Content-Type', contentType);
        response.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
        readStream.on('error', (error) => {
            utils.sendResponse(response, 500, "application/json", {
                message: `Error reading file: ${error.message}`
            });
        });
        readStream.on('end', async () => {
            await fsPromises.unlink(filePath);
        });

        readStream.pipe(response);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Error reading file: ${e.message}`
        });
    }
}

function downloadDocumentVideo(request, response) {
    let spaceId = request.params.spaceId;
    let fileName = request.params.fileName;
    let spacePath = space.APIs.getSpacePath(spaceId);
    let filePath = path.join(spacePath, "temp", `${fileName}.mp4`);
    streamFile(filePath, response, "video/mp4");
}

async function importDocument(request, response) {
    const spaceId = request.params.spaceId;
    const fileId = crypto.generateSecret(64);
    const tempDir = path.join(__dirname, '../../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.docai`);

    await fs.promises.mkdir(tempDir, {recursive: true});
    const busboy = Busboy({headers: request.headers});
    const taskId = crypto.generateId(16);
    let objectId = SubscriptionManager.getObjectId(spaceId, taskId);
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);
        writeStream.on('close', async () => {
            try {
                await fs.promises.access(filePath, fs.constants.F_OK);

                const extractedPath = path.join(tempDir, 'extracted');
                await fs.promises.mkdir(extractedPath, {recursive: true});

                // Wrap the unzipping process in a Promise
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(unzipper.Extract({path: extractedPath}))
                        .on('close', resolve)
                        .on('error', reject);
                });

                await new Promise(resolve => setTimeout(resolve, 0));

                const extractedFiles = await fs.promises.readdir(extractedPath);

                if (!extractedFiles.includes('metadata.json') || !extractedFiles.includes('data.json')) {
                    throw new Error(`Required files not found. Files in directory: ${extractedFiles.join(', ')}`);
                }

                const docDataPath = path.join(extractedPath, 'data.json');
                const docDataStream = fs.createReadStream(docDataPath, 'utf8');

                const docData = await space.APIs.streamToJson(docDataStream);
                const personalities = docData.personalities || [];
                const personalityPath = path.join(extractedPath, 'personalities');
                const overriddenPersonalities = new Set();
                for (let personality of personalities) {
                    const personalityFileName = `${personality}.persai`;
                    const filePath = path.join(personalityPath, personalityFileName);
                    const extractedPath = path.join(personalityPath, 'extracted', personality);
                    fs.mkdirSync(extractedPath, {recursive: true});

                    await fs.createReadStream(filePath)
                        .pipe(unzipper.Extract({path: extractedPath}))
                        .promise();

                    const importResults = await space.APIs.importPersonality(spaceId, extractedPath, request);
                    if (importResults.overriden) {
                        overriddenPersonalities.add(importResults.name);
                    }
                }
                const documentId = await storeDocument(spaceId, docData, request, extractedPath);
                await fs.promises.unlink(filePath);
                SubscriptionManager.notifyClients("", objectId, {
                    id: documentId,
                    overriddenPersonalities: Array.from(overriddenPersonalities)
                });
            } catch (error) {
                console.error('Error processing extracted files:', error);
                SubscriptionManager.notifyClients("", objectId, {error: error.message});
            } finally {
                await fs.promises.rm(tempDir, {recursive: true, force: true});
            }
        });

        writeStream.on('error', async (error) => {
            console.error('Error writing file:', error);
            SubscriptionManager.notifyClients("", objectId, {error: error.message});
        });
    });

    busboy.on('error', async (error) => {
        console.error('Busboy error:', error);
        SubscriptionManager.notifyClients("", objectId, {error: error.message});
    });

    request.pipe(busboy);
    utils.sendResponse(response, 200, "application/json", {
        message: 'Document import started',
        data: taskId
    });
}

async function estimateDocumentVideoLength(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require("assistos").loadModule("document", securityContext);
    let document = await documentModule.getDocument(spaceId, documentId);
    try {
        let duration = await ffmpeg.estimateDocumentVideoLength(spaceId, document);
        sendResponse(response, 200, "application/json", {
            message: `Estimation in progress`,
            data: duration
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

function refineTextContent(text) {
    if (typeof text !== "string") {
        return [{ text: String(text), color: "000000" }];
    }

    text = text.replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#13;/g, "")
        .replace(/\r/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const instructionPatterns = [
        /Your task is to write.*?\*\*Paragraph Idea\*\*/gis,
        /{.*?("text":\s*".*?")?.*?}/gis,
        /instructions?\s*[:\-]/i,
        /Book Details.*?paragraphs\s*:\s*\[\s*\]/gis,
        /Chapter Details.*?paragraphs\s*:\s*\[\s*\]/gis,
        /Preparing for Generation\.\.\./gis,
        /Generating\.\.\./gis,
        /Expanding paragraph\s*[:\-]\s*undefined/gi,
        /Error\s*[:\-]\s*\w+/gi,
        /Failed\s*[:\-]\s*\w+/gi,
        /Processing\s*[:\-]\s*\w+/gi,
    ];

    const errorWords = new Set(["error", "undefined", "null"]);

    // Mapare culori predefinite la coduri hex
    const colorMap = {
        black: "000000",
        red: "FF0000"
    };

    function isValidHex(color) {
        return /^[0-9A-Fa-f]{6}$/.test(color);
    }

    const paragraphs = text.split(/\n{2,}/);

    return paragraphs.map((paragraph) => {
        const words = paragraph.match(/\b\w+\b/g) || [];
        const hasErrorWord = words.some((word) => errorWords.has(word.toLowerCase()));
        const isInstruction = instructionPatterns.some((pattern) => pattern.test(paragraph));

        let color = hasErrorWord || isInstruction ? "FF0000" : "000000";

        if (colorMap[color]) {
            color = colorMap[color];
        }

        return {
            text: paragraph,
            color: isValidHex(color) ? color : "000000",
        };
    });
}

async function exportDocumentAsDocx(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const settings = request.body.settings;

    if (!settings) {
        return utils.sendResponse(response, 400, "application/json", "Missing settings for export.");
    }

    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require("assistos").loadModule("document", securityContext);

    try {
        let documentData = await documentModule.getDocument(spaceId, documentId);
        const paragraphs = [];

        function applyTextSettings(text, sectionSettings) {
            const refinedContent = refineTextContent(text);
            const refinedText = refinedContent.length > 0 ? refinedContent[0].text : text;
            const refinedColor = refinedContent.length > 0 ? refinedContent[0].color : "000000";

            return new TextRun({
                text: refinedText,
                font: sectionSettings?.font || "Arial",
                size: (parseInt(sectionSettings?.fontSize) || 12) * 2,
                color: sectionSettings?.color || refinedColor.replace("#", ""),
                bold: sectionSettings?.bold || false,
                italic: sectionSettings?.italic || false,
            });
        }

        if (documentData.title) {
            paragraphs.push(new Paragraph({
                children: [applyTextSettings(documentData.title, settings.title)],
                spacing: { after: 300 },
                alignment: AlignmentType.JUSTIFIED,
            }));
        }

        if (documentData.abstract) {
            paragraphs.push(new Paragraph({
                children: [applyTextSettings("Abstract", settings.abstract)],
                spacing: { after: 150 },
                alignment: AlignmentType.JUSTIFIED,
            }));
            paragraphs.push(new Paragraph({
                children: [applyTextSettings(documentData.abstract, settings.paragraphs || {})],
                spacing: { after: 300 },
                alignment: AlignmentType.JUSTIFIED,
            }));
        }

        if (documentData.chapters && documentData.chapters.length > 0) {
            documentData.chapters.forEach((chapter) => {
                if (chapter.title) {
                    paragraphs.push(new Paragraph({
                        children: [applyTextSettings(chapter.title, settings.chapters)],
                        spacing: { after: 150 },
                        alignment: AlignmentType.JUSTIFIED,
                    }));
                }
                if (chapter.paragraphs && chapter.paragraphs.length > 0) {
                    chapter.paragraphs.forEach((paragraph) => {
                        if (paragraph.text) {
                            paragraphs.push(new Paragraph({
                                children: [applyTextSettings(paragraph.text, settings.paragraphs || {})],
                                spacing: { after: 200 },
                                alignment: AlignmentType.JUSTIFIED,
                            }));
                        }
                    });
                }
            });
        }

        let footerAlignment;
        if (settings.paginationPosition === "center") {
            footerAlignment = AlignmentType.CENTER;
        } else if (settings.paginationPosition === "left") {
            footerAlignment = AlignmentType.LEFT;
        } else {
            footerAlignment = AlignmentType.RIGHT;
        }

        function getPageNumberText(style) {
            switch (style) {
                case "fraction":
                    return {
                        text: "",
                        children: [
                            new TextRun({ text: "Page ", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                            new TextRun({ text: " / ", size: 20 }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                        ],
                    };
                case "simple":
                    return {
                        text: "",
                        children: [
                            new TextRun({ text: "Page ", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                            new TextRun({ text: " of ", size: 20 }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                        ],
                    };
                case "dashed":
                    return {
                        text: "-- ",
                        children: [
                            new TextRun({ text: "Page ", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                            new TextRun({ text: " of ", size: 20 }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                            new TextRun({ text: " --", size: 20 }),
                        ],
                    };
                case "hyphenated":
                    return {
                        text: "",
                        children: [
                            new TextRun({ text: "Page ", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                            new TextRun({ text: " - ", size: 20 }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                        ],
                    };
                case "formal":
                    return {
                        text: "[ ",
                        children: [
                            new TextRun({ text: "Page ", size: 20 }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                            new TextRun({ text: " of ", size: 20 }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                            new TextRun({ text: " ]", size: 20 }),
                        ],
                    };
                case "number":
                default:
                    return {
                        text: "",
                        children: [
                            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                        ],
                    };
            }
        }

        const pagination = getPageNumberText(settings.paginationStyle);
        const footer = new Footer({
            children: [
                new Paragraph({
                    alignment: footerAlignment,
                    spacing: { before: 0, after: 0 },
                    children: [
                        new TextRun({ text: pagination.text, size: 20 }),
                        ...pagination.children,
                    ],
                }),
            ],
        });

        function convertToTwips(value, unit = "pt") {
            const units = {
                pt: 20, // 1 punct = 20 TWIPs
                mm: 56.7, // 1 milimetru ≈ 56.7 TWIPs
                cm: 567, // 1 centimetru ≈ 567 TWIPs
                in: 1440, // 1 inch = 1440 TWIPs
            };
            return Math.round(value * (units[unit] || 1));
        }

        const pageSize = settings.pageSize?.toUpperCase() || "A4";
        const pageOrientation = settings.orientation === "l" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;

        const pageDimensions = {
            A3: { width: 16838, height: 23812 }, // A3 în TWIPs
            A4: { width: 11906, height: 16838 }, // A4 în TWIPs
            A5: { width: 8391, height: 11906 },  // A5 în TWIPs
        };

        const pageWidth = pageOrientation === PageOrientation.LANDSCAPE ? pageDimensions[pageSize].height : pageDimensions[pageSize].width;
        const pageHeight = pageOrientation === PageOrientation.LANDSCAPE ? pageDimensions[pageSize].width : pageDimensions[pageSize].height;

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: pageWidth,
                            height: pageHeight,
                        },
                        orientation: pageOrientation,
                        margin: {
                            top: convertToTwips(settings.topPadding || 10, "pt"),
                            bottom: convertToTwips(settings.bottomPadding || 0, "pt"),
                            left: convertToTwips(settings.leftPadding || 10, "pt"),
                            right: convertToTwips(settings.rightPadding || 10, "pt"),
                        },
                    },
                },
                footers: { default: footer },
                children: paragraphs,
            }],
        });

        const buffer = await Packer.toBuffer(doc);

        if (!response.headersSent) {
            return utils.sendResponse(response, 200, "application/octet-stream", buffer);
        }

    } catch (error) {
        console.error("Export DOCX error:", error);
        if (!response.headersSent) {
            return utils.sendResponse(response, error.statusCode || 500, "application/json", error.message);
        }
    }
}

async function exportDocumentAsHTML(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;

    try {
        const SecurityContext = require("assistos").ServerSideSecurityContext;
        let securityContext = new SecurityContext(request);

        const documentModule = require("assistos").loadModule("document", securityContext);
        const documentData = await documentModule.getDocument(spaceId, documentId);

        if (!documentData) {
            throw new Error("Document data is not available.");
        }

        const {title, abstract, chapters} = documentData;
        let htmlContent = `<html><head><title>${title}</title></head><body>`;
        htmlContent += `<h1>${title}</h1>`;

        if (abstract) {
            htmlContent += `<h3>${abstract}</h3>`;
        }

        if (Array.isArray(chapters)) {
            chapters.forEach((chapter) => {
                const {title: chapterTitle, paragraphs} = chapter;
                htmlContent += `<h2>${chapterTitle}</h2>`;
                if (paragraphs) {
                    paragraphs.forEach((paragraph) => {
                        htmlContent += `<p>${paragraph.text}</p>`;
                    });
                }
            });
        }

        htmlContent += `</body></html>`;

        if (!response.headersSent) {
            return utils.sendResponse(response, 200, "text/html", htmlContent);
        }

    } catch (error) {
        console.error("Export HTML error:", error);
        utils.sendResponse(response, 500, "application/json", {
            message: `Error exporting document: ${error.message}`
        });
    }
}

async function undoOperation(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let success = await documentService.undoOperation(spaceId, documentId);
        return utils.sendResponse(response, 200, "application/json", {
            data: success
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", error.message);
    }
}

async function redoOperation(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let success = await documentService.redoOperation(spaceId, documentId);
        return utils.sendResponse(response, 200, "application/json", {
            data: success
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", error.message);
    }
}

async function addDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotData = request.body;
    const SecurityContextClass = require('assistos').ServerSideSecurityContext;
    let securityContext = new SecurityContextClass(request);
    let documentModule = require('assistos').loadModule('document', securityContext);
    try {
        let document = await documentModule.getDocument(spaceId, documentId);
        document.type = "snapshot";
        document.abstract = JSON.stringify({originalDocumentId: documentId, ...snapshotData});
        delete document.id;
        document.snapshots = [];
        snapshotData.documentId = await documentModule.addDocument(spaceId, document);
        let {id, position} = await lightDB.addEmbeddedObject(spaceId, `${documentId}/snapshots`, snapshotData);
        snapshotData.id = id;
        utils.sendResponse(response, 200, "application/json", {
            data: snapshotData
        });
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function getDocumentSnapshots(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let snapshots = await documentService.getSnapshots(spaceId, documentId);
        utils.sendResponse(response, 200, "application/json", {
            data: snapshots
        });
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function restoreDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotId = request.params.snapshotId;
    let newSnapshotData = request.body;
    try {
        let restoreSnapshot = await lightDB.getRecord(spaceId, documentId, snapshotId);
        let restoreDocumentId = restoreSnapshot.data.documentId;
        let restoreSnapshotDocument = await documentService.getDocument(spaceId, restoreDocumentId, {});
        let document = await documentService.getDocument(spaceId, documentId, {});

        let originalDocumentType = document.type;
        let originalDocumentAbstract = document.abstract;
        let originalDocumentSnapshots = JSON.parse(JSON.stringify(document.snapshots));
        //create new snapshot
        let newSnapshotDocument = JSON.parse(JSON.stringify(document));
        newSnapshotDocument.type = "snapshot";
        newSnapshotDocument.abstract = JSON.stringify({originalDocumentId: documentId, ...newSnapshotData});
        delete newSnapshotDocument.id;
        newSnapshotDocument.snapshots = [];
        newSnapshotData.documentId = await documentService.createDocument(spaceId, newSnapshotDocument);
        //restore snapshot
        document = JSON.parse(JSON.stringify(restoreSnapshotDocument));
        document.id = documentId;
        document.type = originalDocumentType;
        document.abstract = originalDocumentAbstract;
        document.snapshots = originalDocumentSnapshots;
        document.snapshots = document.snapshots.filter(snapshot => snapshot.id !== snapshotId);
        document.snapshots.push(newSnapshotData);
        await documentService.updateDocument(spaceId, documentId, document, {});
        await documentService.deleteDocument(spaceId, restoreDocumentId);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function deleteDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotId = request.params.snapshotId;
    try {
        let snapshotRecord = await lightDB.getRecord(spaceId, documentId, snapshotId);
        await lightDB.deleteContainerObject(spaceId, snapshotRecord.data.documentId);
        await lightDB.deleteEmbeddedObject(spaceId, `${documentId}/${snapshotId}`);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function proxyDocumentConversion(req, res) {
    let tempDir = null;
    try {

        return new Promise(async (resolve, reject) => {
            // Validate content type
        if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
            return sendResponse(res, 400, 'application/json', {
                message: "Expected multipart/form-data content type"
            });
        }

        // Get config for docsConverterUrl
        const config = require('../../../apihub-root/assistOS-configs.json');
        let docsConverterUrl = config.docsConverterUrl;

        // Create a temporary directory for the uploaded file
        tempDir = path.join(__dirname, '../../../data-volume/Temp', crypto.generateSecret(16));
        await fsPromises.mkdir(tempDir, {recursive: true});
        const tempFilePath = path.join(tempDir, `upload_${Date.now()}.bin`);

        // Initialize upload file object
        let uploadedFile = {ready: false};

        // Process the multipart form with Busboy
        const busboyOptions = {headers: req.headers, limits: {fileSize: 50 * 1024 * 1024}};
        let busboy;

        try {
            busboy = new Busboy(busboyOptions);
        } catch (err) {
            busboy = Busboy(busboyOptions);
        }

        // Process file uploads
        busboy.on('file', (fieldname, fileStream, fileInfo) => {
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

                uploadedFile = {
                    fieldname,
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

        // Process finish event
        busboy.on('finish', async () => {
            // Wait for file to be ready
            let attempts = 0;
            const maxAttempts = 50;

            while ((!uploadedFile || !uploadedFile.ready) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            try {
                if (!uploadedFile || !uploadedFile.ready) {
                    throw new Error('File upload timed out or failed');
                }

                // Use curl command to send the file to the converter
                // This is the most reliable way to send multipart/form-data to Flask
                const {spawn} = require('child_process');
                const curl = spawn('curl', [
                    '-s',
                    '-X', 'POST',
                    '-F', `file=@${uploadedFile.filepath};filename=${uploadedFile.filename};type=${uploadedFile.mimetype}`,
                    `${docsConverterUrl}/convert`
                ]);

                let responseData = '';
                let errorData = '';

                curl.stdout.on('data', (data) => {
                    responseData += data.toString();
                });

                curl.stderr.on('data', (data) => {
                    errorData += data.toString();
                });

                const exitCode = await new Promise((resolve) => {
                    curl.on('close', resolve);
                });

                if (exitCode === 0 && responseData) {
                    try {
                        const data = JSON.parse(responseData);
                        if (data.text_content) {
                            sendResponse(res, 200, 'application/json', data);
                        } else {
                            sendResponse(res, 500, 'application/json', {
                                message: 'Invalid document structure returned from converter'
                            });
                        }
                        resolve();
                        return;
                    } catch (err) {
                        sendResponse(res, 500, 'application/json', {
                            message: 'Invalid JSON response from converter'
                        });
                        resolve();
                        return;
                    }
                } else {
                    sendResponse(res, 500, 'application/json', {
                        message: `Error from docs converter: ${errorData || 'Unknown error'}`
                    });
                    resolve();
                    return;
                }
            } catch (error) {
                console.error(`[DocConverter] Conversion error: ${error.message}`);
                sendResponse(res, 500, 'application/json', {
                    message: `Error proxying document conversion: ${error.message}`
                });
                resolve();
                return;
            } finally {
                // Clean up temp directory
                if (tempDir) {
                    try {
                        await fsPromises.rm(tempDir, {recursive: true, force: true});
                    } catch (err) {
                        // Ignore cleanup errors
                    }
                }
            }
        });

        busboy.on('error', (err) => {
            console.error(`[DocConverter] Form parsing error: ${err.message}`);
            sendResponse(res, 500, 'application/json', {
                message: `Error processing form data: ${err.message}`
            });
            resolve();
            return;
        });

        // Pipe the request to busboy
        req.pipe(busboy);
        });
    } catch (error) {
        console.error(`[DocConverter] Setup error: ${error.message}`);
        // Clean up temp directory if it exists
        if (tempDir) {
            try {
                await fsPromises.rm(tempDir, {recursive: true, force: true});
            } catch (err) {
                // Ignore cleanup errors
            }
        }
        return sendResponse(res, 500, 'application/json', {
            message: `Error processing document conversion: ${error.message}`
        });
    }
}

async function uploadDoc(req, res) {
    const spaceId = req.params.spaceId;

    try {
        let body = null;
        // Create a proxy response object to capture the conversion result
        const proxyRes = {
            _headers: {},
            _statusCode: 200,
            setHeader(name, value) {
                this._headers[name] = value;
            },
            writeHead(statusCode) {
                this._statusCode = statusCode;
            },
            end(data) {
            },
            write(data) {
                body = data;
            },
        };

        // Use the existing proxyDocumentConversion function
        await proxyDocumentConversion(req, proxyRes);

        // If conversion failed, return the error
        if (proxyRes._statusCode !== 200 || !body) {
            return utils.sendResponse(res, proxyRes._statusCode, 'application/json',
                body ? JSON.parse(body) : { message: 'Document conversion failed' });
        }

        // Parse the conversion result
        const jsonData = JSON.parse(body);

        if (!jsonData.text_content) {
            throw new Error('Invalid document structure returned from converter');
        }

        // Process the converted document
        const textContent = jsonData.text_content;
        const images = jsonData.images || [];

        // Get config for docsConverterUrl
        const config = require('../../../apihub-root/assistOS-configs.json');
        let docsConverterUrl = config.docsConverterUrl;

        // Create a map to store uploaded image IDs
        const imageMap = new Map();

        // Upload images if any
        if (images.length > 0) {
            const SecurityContext = require("assistos").ServerSideSecurityContext;
            const securityContext = new SecurityContext(req);
            const spaceModuleClient = require("assistos").loadModule("space", securityContext);

            for (const imageName of images) {
                try {
                    // Fetch the image from the docs converter service
                    const imageUrl = `${docsConverterUrl}/images/${imageName}`;

                    const imageResponse = await fetch(imageUrl);
                    if (!imageResponse.ok) {
                        console.error(`Failed to fetch image ${imageName}: ${imageResponse.status} ${imageResponse.statusText}`);
                        continue;
                    }

                    // Get the image as a buffer
                    const imageBlob = await imageResponse.blob();
                    const imageArrayBuffer = await imageBlob.arrayBuffer();
                    const imageBuffer = new Uint8Array(imageArrayBuffer);

                    // Upload the image to AssistOS space using the proper module
                    const imageId = await spaceModuleClient.putImage(imageBuffer);
                    imageMap.set(imageName, imageId);
                } catch (imageError) {
                    console.error(`Error uploading image ${imageName}:`, imageError);
                }
            }
        }

        // Create the main document
        const chapterService = require('../services/chapter');
        const documentData = {
            title: textContent.title || 'Converted Document',
            topic: 'Converted Document',
            abstract: JSON.stringify(textContent.document_info || {}),
            metadata: ['id', 'title', 'type'],
            content: '',
            type: ''
        };

        const documentId = await documentService.createDocument(spaceId, documentData);

        // Add chapters and paragraphs
        for (const chapter of textContent.chapters) {
            const chapterTitle = Object.keys(chapter)[0];
            const chapterContent = chapter[chapterTitle];

            // Create chapter
            const chapterId = await chapterService.createChapter(spaceId, documentId, {
                title: chapterTitle
            });

            // Add paragraphs to chapter
            for (const paragraph of chapterContent) {
                const paragraphText = Object.values(paragraph)[0];

                // Check if paragraph has image tags
                if (paragraphText.includes('[Image:')) {
                    // Extract image name from tag
                    const imageTagMatch = paragraphText.match(/\[Image:\s*([^\]]+)\]/);
                    if (imageTagMatch && imageTagMatch[1]) {
                        const imageName = imageTagMatch[1].trim();

                        // Check if we have this image in our map
                        if (imageMap.has(imageName)) {
                            const imageId = imageMap.get(imageName);

                            // Add paragraph with image command
                            await paragraphService.createParagraph(spaceId, documentId, chapterId.id, {
                                text: paragraphText.replace(`[Image: ${imageName}]`, '').trim(),
                                commands: {
                                    image: {
                                        id: imageId
                                    }
                                }
                            });
                        } else {
                            // Add regular paragraph without image
                            await paragraphService.createParagraph(spaceId, documentId, chapterId.id, {
                                text: paragraphText
                            });
                        }
                    } else {
                        // Add regular paragraph without image
                        await paragraphService.createParagraph(spaceId, documentId, chapterId.id, {
                            text: paragraphText
                        });
                    }
                } else {
                    // Add regular paragraph without image
                    await paragraphService.createParagraph(spaceId, documentId, chapterId.id, {
                        text: paragraphText
                    });
                }
            }
        }

        // Send back the created document ID
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, "documents"));
        return utils.sendResponse(res, 200, "application/json", {
            data: documentId
        });
    } catch (error) {
        console.error(`[DocUpload] Error: ${error.message}`);
        return utils.sendResponse(res, 500, "application/json", {
            message: `Error uploading document: ${error.message}`
        });
    }
}

module.exports = {
    exportDocument,
    importDocument,
    estimateDocumentVideoLength,
    downloadDocumentArchive,
    downloadDocumentVideo,
    exportDocumentAsDocx,
    exportDocumentAsHTML,
    undoOperation,
    redoOperation,
    getDocumentSnapshots,
    addDocumentSnapshot,
    deleteDocumentSnapshot,
    restoreDocumentSnapshot,
    proxyDocumentConversion,
    uploadDoc
}
