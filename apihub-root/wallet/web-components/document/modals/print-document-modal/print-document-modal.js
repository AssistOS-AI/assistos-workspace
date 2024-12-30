export class PrintDocumentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.documentId = this.element.getAttribute("data-documentId");

        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        console.log(this.document);

        this.formData = {};
    }

    async beforeRender() {
        // cod de inițializare care rulează înainte de redarea paginii
    }

    closePrintModal() {
        assistOS.UI.closeModal(this.element);
    }

    async convertToPDF() {
        const { jsPDF } = window.jspdf;

        const pageSize = this.formData.pageSize || 'a4'; // Default A4
        const orientation = this.formData.orientation || 'p'; // Default portrait
        const doc = new jsPDF(orientation, 'mm', pageSize);

        this.collectFormData();

        const margins = {
            top: parseInt(this.formData.topPadding),
            bottom: parseInt(this.formData.bottomPadding),
            left: parseInt(this.formData.leftPadding),
            right: parseInt(this.formData.rightPadding)
        };

        const footerHeight = 5;

        // dimensiunile paginii
        const pageHeight = doc.internal.pageSize.height;

        const effectiveBottomMargin = Math.min(margins.bottom, footerHeight);

        // inaltime de completat cu text
        const usableHeight = pageHeight - margins.top - effectiveBottomMargin;
        const usableWidth = doc.internal.pageSize.width - margins.left - margins.right;


        this.collectFormData();

        const htmlContent = this.generateHTMLFromDocument();

        // Creăm un container temporar pentru HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        let y = margins.top;


        const addContentToPage = (element) => {
            const lineHeight = 10; // inaltime rand
            const elements = element.querySelectorAll('h1, h2, h3, p, img');

            elements.forEach((el) => {
                const text = el.textContent || '';
                const tagName = el.tagName.toLowerCase();

                if (tagName === 'h1') {
                    doc.setFontSize(16);
                } else if (tagName === 'h2') {
                    doc.setFontSize(14);
                } else if (tagName === 'h3') {
                    doc.setFontSize(12);
                } else {
                    doc.setFontSize(10);
                }

                // fragmentare text in fct de latimea disponibila
                const splitText = doc.splitTextToSize(text, usableWidth);

                const blockHeight = splitText.length * lineHeight;

                if (y + blockHeight > usableHeight) {
                    doc.addPage();
                    y = margins.top;
                }

                splitText.forEach((line) => {
                    doc.text(line, margins.left, y);
                    y += lineHeight;

                    if (y + footerHeight > usableHeight) {
                        doc.addPage();
                        y = margins.top;
                    }
                });
            });
        };

        addContentToPage(tempDiv);

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }

        document.body.removeChild(tempDiv);

        doc.save('document.pdf');
    }

    async PreviewDocument() {
        this.collectFormData();
        const cssContent = this.generateCSSFromForm();
        const htmlContent = this.generateHTMLFromDocument();

        const previewWindow = window.open("", "_blank");
        previewWindow.document.write(`
            <html>
                <head>
                    <style>${cssContent}</style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
    }

    collectFormData() {
        const form = document.getElementById('printSettingsForm');
        const formData = new FormData(form);

        this.formData = {
            titleFont: formData.get('titleFont'),
            titleFontSize: `${formData.get('titleFontSize')}px`,
            titleColor: formData.get('titleColor'),

            abstractFont: formData.get('abstractFont'),
            abstractFontSize: `${formData.get('abstractFontSize')}px`,
            abstractColor: formData.get('abstractColor'),

            chapterFont: formData.get('chapterFont'),
            chapterFontSize: `${formData.get('chapterFontSize')}px`,
            chapterColor: formData.get('chapterColor'),

            paragraphFont: formData.get('paragraphFont'),
            paragraphFontSize: `${formData.get('paragraphFontSize')}px`,
            paragraphColor: formData.get('paragraphColor'),

            backgroundColor: formData.get('backgroundColor'),
            backgroundImage: formData.get('backgroundImage'),

            topPadding: `${formData.get('topPadding')}px`,
            bottomPadding: `${formData.get('bottomPadding')}px`,
            leftPadding: `${formData.get('leftPadding')}px`,
            rightPadding: `${formData.get('rightPadding')}px`,

            pageSize: formData.get('pageSize'),
            orientation: formData.get('orientation')
        };
    }

    generateCSSFromForm() {
        const {
            titleFont, titleFontSize, titleColor,
            abstractFont, abstractFontSize, abstractColor,
            chapterFont, chapterFontSize, chapterColor,
            paragraphFont, paragraphFontSize, paragraphColor,
            backgroundColor, backgroundImage, topPadding, bottomPadding, leftPadding, rightPadding
        } = this.formData;

        let cssContent = `
        body {
            background-color: ${backgroundColor};
            ${backgroundImage ? `background-image: url('${URL.createObjectURL(backgroundImage)}'); background-size: cover;` : ""}
            margin: 0;
            padding: ${topPadding} ${rightPadding} ${bottomPadding} ${leftPadding};
        }
        h1 {
            font-family: ${titleFont};
            font-size: ${titleFontSize};
            color: ${titleColor};
            margin-bottom: 20px;
        }
        h3 {
            font-family: ${abstractFont};
            font-size: ${abstractFontSize};
            color: ${abstractColor};
            margin-bottom: 15px;
        }
        h2 {
            font-family: ${chapterFont};
            font-size: ${chapterFontSize};
            color: ${chapterColor};
            margin-top: 25px;
            margin-bottom: 15px;
        }
        p {
            font-family: ${paragraphFont};
            font-size: ${paragraphFontSize};
            color: ${paragraphColor};
            line-height: 1.6;
            margin-bottom: 15px;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 15px 0;
        }
        `;

        return cssContent;
    }

    generateHTMLFromDocument() {
        if (!this.document) {
            console.error("Document data is not available.");
            return "";
        }

        const { title, abstract, chapters } = this.document;

        let htmlContent = `<h1>${title}</h1>`;

        if (abstract) {
            htmlContent += `<h3>${abstract}</h3>`;
        }

        if (Array.isArray(chapters)) {
            chapters.forEach((chapter) => {
                const { title: chapterTitle, paragraphs } = chapter;

                htmlContent += `<br><h2>${chapterTitle}</h2>`;

                if (Array.isArray(paragraphs) && paragraphs.length > 0) {
                    paragraphs.forEach((paragraph) => {
                        const paragraphText = paragraph.text
                            .replace(/\u00A0/g, ' ')
                            .replace(/&#13;/g, '<br>');
                        htmlContent += `<p>${paragraphText}</p>`;

                        if (paragraph.commands && paragraph.commands.image) {
                            const image = paragraph.commands.image;
                            const imageURL = image.url || '';
                            const altText = image.altText || 'Image';
                            htmlContent += `<img src="${imageURL}" alt="${altText}" width="${image.width}" height="${image.height}" />`;
                        }
                    });
                } else {
                    htmlContent += `<p><em>(Empty Chapter)</em></p>`;
                }
            });
        }
        return htmlContent;
    }

    async afterRender() {
        try {
            await this.loadJsPDF();
            await this.loadDompurify();
            await this.loadHTML2Canvas();
            console.log("All scripts loaded successfully.");
        } catch (error) {
            console.error(error);
        }

        try {
            const htmlOutput = this.generateHTMLFromDocument();
            console.log(htmlOutput);
        } catch (error) {
            console.error("Failed to create the HTML string:", error);
        }

        try {
            const cssOutput = this.generateCSSFromForm();
            console.log(cssOutput);
        } catch (error) {
            console.error("Failed to create the CSS string:", error);
        }
    }

    loadDompurify() {
        return this.loadExternalScript("./wallet/lib/dompurify/purify.js", "dompurify");
    }

    loadJsPDF() {
        return this.loadExternalScript("./wallet/lib/jspdf/jspdf.umd.js", "jsPDF");
    }

    loadHTML2Canvas() {
        return this.loadExternalScript("./wallet/lib/html2canvas/html2canvas.js", "html2canvas");
    }

    loadExternalScript(src, name) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => {
                console.log(`${name} script loaded successfully.`);
                resolve();
            };
            script.onerror = () => reject(`Failed to load ${name} script.`);
            this.element.appendChild(script);
        });
    }
}
