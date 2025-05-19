export class PrintDocumentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-documentId");
        this.invalidate();

    }

    async beforeRender() {
    }

    closeModal() {
        assistOS.UI.closeModal(this.element);
    }

    async convertToPDF() {
        this.collectFormData();

        const htmlContent = this.generateHTMLFromDocument();
        const cssContent = this.generateCSSFromForm();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<style>${cssContent}</style>${htmlContent}`;
        document.body.appendChild(tempDiv);

        const margins = {
            top: parseInt(this.formData.topPadding) || 10,
            bottom: parseInt(this.formData.bottomPadding) || 10,
            left: parseInt(this.formData.leftPadding) || 10,
            right: parseInt(this.formData.rightPadding) || 10,
        };

        const options = {
            margin: [margins.top, margins.left, margins.bottom, margins.right],
            filename: 'document.pdf',
            image: {type: 'png', quality: 0.98},
            html2canvas: {scale: 2},
            jsPDF: {
                unit: 'mm',
                format: this.formData.pageSize || 'a4',
                orientation: this.formData.orientation || 'portrait',
            }
        };

        const pdf = await html2pdf().from(tempDiv).set(options).toPdf().get('pdf');

        const paginationFontSize = 10;
        pdf.setFontSize(paginationFontSize);

        const paginationText = `Page 1 of 1`;
        const textDimensions = pdf.getTextDimensions(paginationText);
        const footerHeight = textDimensions.h + 2;

        const pageCount = pdf.internal.getNumberOfPages();
        const paginationPosition = this.formData.paginationPosition;
        const paginationStyle = this.formData.paginationStyle || 'number';

        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);

            let paginationText = '';

            if (paginationStyle === 'simple') {
                paginationText = `Page ${i} of ${pageCount}`;
            } else if (paginationStyle === 'dashed') {
                paginationText = `-- Page ${i} of ${pageCount} --`;
            } else if (paginationStyle === 'fraction') {
                paginationText = `${i}/${pageCount}`;
            } else if (paginationStyle === 'number') {
                paginationText = `${i}`;
            } else if (paginationStyle === 'hyphenated') {
                paginationText = `Page ${i} - ${pageCount}`;
            } else if (paginationStyle === 'formal') {
                paginationText = `[ Page ${i} of ${pageCount} ]`;
            }

            let xPosition;
            const textWidth = pdf.getTextWidth(paginationText);

            if (paginationPosition === 'center') {
                xPosition = (pdf.internal.pageSize.width - textWidth) / 2;
            } else if (paginationPosition === 'right') {
                xPosition = pdf.internal.pageSize.width - margins.right - textWidth;
            } else {
                xPosition = margins.left;
            }

            pdf.text(
                paginationText,
                xPosition,
                pdf.internal.pageSize.height - margins.bottom + (footerHeight / 2),
                {align: paginationPosition}
            );
        }

        pdf.save('document.pdf');

        document.body.removeChild(tempDiv);
    }

    async openSettingsPage(eventTarget) {
        await this.closeModal();
        await assistOS.UI.changeToDynamicPage("settings-page", `${assistOS.space.id}/Space/settings-page`, {subpage: "settingsTab"});
    }

    async previewDocument() {
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

        this.formData = {
            title: {
                font: 'Helvetica',
                fontSize: `20px`,
                color: '#000000',
                bold: true,
                italic: false
            },
            abstract: {
                font: 'Helvetica',
                fontSize: `14px`,
                color: '#000000',
                bold: true,
                italic: false
            },
            chapter: {
                font: 'Helvetica',
                fontSize: `18px`,
                color: '#000000',
                bold: true,
                italic: false
            },
            paragraph: {
                font: 'Helvetica',
                fontSize: `14px`,
                color: '#000000',
                bold: true,
                italic: false
            },
            backgroundColor: '#FFFFFF',
            topPadding: 10,
            bottomPadding: 10,
            leftPadding: 10,
            rightPadding: 10,
            pageSize: 'a4',
            orientation: 'portrait',
            paginationPosition: 'center',
            paginationStyle: 'number'
        };
    }

    generateCSSFromForm() {
        const {title, abstract, chapters, paragraphs} = this.settings;

        let cssContent = `
        body {
            margin: 0;
            padding: 10px;
        }
        h1 {
            font-family: ${title.font};
            font-size: ${title.fontSize}px;
            color: ${title.color};
            font-weight: ${title.bold ? 'bold' : 'normal'};
            font-style: ${title.italic ? 'italic' : 'normal'};
        }
        h3 {
            font-family: ${abstract.font};
            font-size: ${abstract.fontSize}px;
            color: ${abstract.color};
            font-weight: ${abstract.bold ? 'bold' : 'normal'};
            font-style: ${abstract.italic ? 'italic' : 'normal'};
        }
        h2 {
            font-family: ${chapters.font};
            font-size: ${chapters.fontSize}px;
            color: ${chapters.color};
            font-weight: ${chapters.bold ? 'bold' : 'normal'};
            font-style: ${chapters.italic ? 'italic' : 'normal'};
        }
        p {
            font-family: ${paragraphs.font};
            font-size: ${paragraphs.fontSize}px;
            color: ${paragraphs.color};
            font-weight: ${paragraphs.bold ? 'bold' : 'normal'};
            font-style: ${paragraphs.italic ? 'italic' : 'normal'};
        }
    `;
        return cssContent;
    }

    generateHTMLFromDocument() {
        if (!this.document) {
            console.error("Document data is not available.");
            return "";
        }

        const {title, abstract, chapters} = this.document;

        let htmlContent = `<h1>${title}</h1>`;

        if (abstract) {
            htmlContent += `<h3>${abstract}</h3>`;
        }

        if (Array.isArray(chapters)) {
            chapters.forEach((chapter) => {
                const {title: chapterTitle, paragraphs} = chapter;

                htmlContent += `<br><h2>${chapterTitle}</h2>`;

                if (Array.isArray(paragraphs) && paragraphs.length > 0) {
                    paragraphs.forEach((paragraph) => {
                        const paragraphText = paragraph.text
                            .replace(/\u00A0/g, ' ')
                            .replace(/&#13;/g, '<br>');
                        htmlContent += `<p style="text-align: justify;">${paragraphText}</p>`;

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

    setupDynamicSection() {
        const sectionSelector = document.getElementById('sectionSelector');
        const dynamicFont = document.getElementById('dynamicFont');
        const dynamicBoldStyle = document.getElementById('dynamicBoldStyle');
        const dynamicItalicStyle = document.getElementById('dynamicItalicStyle');
        const dynamicFontSize = document.getElementById('dynamicFontSize');
        const dynamicColor = document.getElementById('dynamicColor');

        const updateSettings = () => {
            const selectedSection = sectionSelector.value;
            this.settings[selectedSection] = {
                font: dynamicFont.value,
                bold: dynamicBoldStyle.checked,
                italic: dynamicItalicStyle.checked,
                fontSize: dynamicFontSize.value,
                color: dynamicColor.value
            };
        };

        dynamicFont.addEventListener('change', updateSettings);
        dynamicBoldStyle.addEventListener('change', updateSettings);
        dynamicItalicStyle.addEventListener('change', updateSettings);
        dynamicFontSize.addEventListener('change', updateSettings);
        dynamicColor.addEventListener('change', updateSettings);

        sectionSelector.addEventListener('change', () => {
            const selectedSection = sectionSelector.value;
            dynamicFont.value = this.settings[selectedSection].font;
            dynamicBoldStyle.checked = this.settings[selectedSection].bold;
            dynamicItalicStyle.checked = this.settings[selectedSection].italic;
            dynamicFontSize.value = this.settings[selectedSection].fontSize;
            dynamicColor.value = this.settings[selectedSection].color;
        });
    }

    /*  async afterRender() {
          this.collectFormData();
          try {
              await this.loadJsPDF();
              await this.loadDompurify();
              await this.loadHTML2Canvas();
              await this.loadHTML2PDF();
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

          this.setupDynamicSection();
      }*/

    loadDompurify() {
        return this.loadExternalScript("./wallet/lib/dompurify/purify.js", "dompurify");
    }

    loadJsPDF() {
        return this.loadExternalScript("./wallet/lib/jspdf/jspdf.umd.js", "jsPDF");
    }

    loadHTML2Canvas() {
        return this.loadExternalScript("./wallet/lib/html2canvas/html2canvas.js", "html2canvas");
    }

    loadHTML2PDF() {
        return this.loadExternalScript("./wallet/lib/html2pdf/html2pdf.bundle.js", "html2pdf");
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