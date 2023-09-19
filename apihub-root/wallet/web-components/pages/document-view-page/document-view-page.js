import { Chapter } from "../../../imports.js";

export class documentViewPage {
    static chapterIdForSidebar;
    static paragraphIdForSidebar;
    constructor() {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        let url = window.location.hash;
        this.button = "Add new document";
        this.id = parseInt(url.split('/')[1]);
        this.documentService = webSkel.getService('documentService');
        this._document = this.documentService.getDocument(this.id);
        if (this._document) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
            this.chapters = this._document.chapters;
        } else {
            console.log(`this _document doesnt exist: docId: ${this.id}`);
        }
        this.updateState = ()=> {
            this._document = this.documentService.getDocument(this.id);
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.chapterDivs = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this.chapters.length > 0) {
            this.documentService.setCurrentChapter(this._document, this.chapters[0].id);
            let iterator = 0;
            this.chapters.forEach((item) => {
                iterator++;
                this.chapterDivs += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openChapterTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-chapter-title/${documentViewPage.chapterIdForSidebar}`);
    }

    openChapterBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/chapter-brainstorming/${documentViewPage.chapterIdForSidebar}`);
    }

    openParagraphProofreadPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/paragraph-proofread/${documentViewPage.chapterIdForSidebar}/${documentViewPage.paragraphIdForSidebar}`);
    }

    openParagraphBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/paragraph-brainstorming/${documentViewPage.chapterIdForSidebar}/${documentViewPage.paragraphIdForSidebar}`);
    }

    addChapter() {
        this.chapterDivs += `<chapter-unit data-chapter-title="New Chapter" data-chapter-id="${this.chapters.length}" data-presenter="chapter-unit"></chapter-unit>`;
        let chapterObj= {
            title: "Edit your title here",
            id: this.chapters.length + 1,
            paragraphs:[{id:1, text:"Edit your paragraph here"}]
        }
        this.chapters.push(new Chapter(chapterObj));
        this.invalidate();
    }

    afterRender() {
        let chapterSidebar = document.getElementById("chapter-sidebar");
        if(chapterSidebar) {
            document.addEventListener("click", (event) => {
                chapterSidebar.style.display = "none";
                let selectedChapter = document.getElementById("select-chapter-visualise");
                if(selectedChapter) {
                    document.getElementById("select-chapter-visualise").removeAttribute("id");
                }
            }, true);
        }
    }

    static openChapterSidebar(chapterId) {
        const chapterSubmenuSection = document.getElementById("chapter-sidebar");
        chapterSubmenuSection.style.display = "block";
        documentViewPage.chapterIdForSidebar = chapterId;
        webSkel.company.currentChapterId = chapterId;
    }

    static openParagraphSidebar(chapterId, paragraphId) {
        const paragraphSubmenuSection = document.getElementById("paragraph-sidebar");
        paragraphSubmenuSection.style.display = "block";
        documentViewPage.chapterIdForSidebar = chapterId;
        documentViewPage.paragraphIdForSidebar = paragraphId;
    }
}