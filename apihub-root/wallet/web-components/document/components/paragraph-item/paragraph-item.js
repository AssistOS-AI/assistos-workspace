const documentModule = require("assistos").loadModule("document", {});
import selectionUtils from "../../pages/document-view-page/selectionUtils.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";
export class ParagraphItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.invalidate(this.subscribeToParagraphEvents.bind(this));
    }

    async subscribeToParagraphEvents() {
        this.boundOnParagraphUpdate = this.onParagraphUpdate.bind(this);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundOnParagraphUpdate);
        this.textClass = "paragraph-text";
        this.boundHandleUserSelection = this.handleUserSelection.bind(this, this.textClass);
        this.plugins = assistOS.space.plugins.paragraph;
        for (let pluginName of Object.keys(this.plugins)) {
            this.plugins[pluginName].boundHandleSelection = this.handleUserSelection.bind(this, pluginName);
            assistOS.NotificationRouter.subscribeToDocument(this._document.id, `${this.paragraph.id}_${pluginName}`, this.plugins[pluginName].boundHandleSelection);
        }
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundHandleUserSelection);
    }

    async beforeRender() {
        const textFontSize = localStorage.getItem("document-font-size")??16;
        const textFontFamily = localStorage.getItem("document-font-family")??"Arial";
        const textIndent = localStorage.getItem("document-indent-size")??"12";
        this.fontFamily = assistOS.constants.fontFamilyMap[textFontFamily]
        this.fontSize = assistOS.constants.fontSizeMap[textFontSize]
        this.textIndent = assistOS.constants.textIndentMap[textIndent]
    }

    async afterRender() {
        let paragraphPluginsIcons = this.element.querySelector(".paragraph-plugins-icons");
        await pluginUtils.renderPluginIcons(paragraphPluginsIcons, "paragraph");
        if(this.currentPlugin){
            this.openPlugin("", "paragraph", this.currentPlugin);
        }
        // let moveParagraphUp = this.element.querySelector(".comment-menu");
        // this.documentPresenter.attachTooltip(moveParagraphUp,"Move Paragraph Up");

        let moveParagraphUp = this.element.querySelector(".move-paragraph-up");
        this.documentPresenter.attachTooltip(moveParagraphUp,"Move Paragraph Up");

        let moveParagraphDown = this.element.querySelector(".move-paragraph-down");
        this.documentPresenter.attachTooltip(moveParagraphDown,"Move Paragraph Down");

        let copyParagraph = this.element.querySelector(".copy-paragraph");
        this.documentPresenter.attachTooltip(copyParagraph,"Copy Paragraph");

        let cutParagraph = this.element.querySelector(".cut-paragraph");
        this.documentPresenter.attachTooltip(cutParagraph,"Cut Paragraph");

        let insert = this.element.querySelector(".insert");
        this.documentPresenter.attachTooltip(insert,"Insert Elements");

        let attachFiles = this.element.querySelector(".files-menu");
        this.documentPresenter.attachTooltip(attachFiles,"Attach Files");

        let commentMenu = this.element.querySelector(".comment-menu");
        this.documentPresenter.attachTooltip(commentMenu,"Comments");

        if(this.paragraph.comments.trim() !== ""){
            let commentHighlight = this.element.querySelector(".plugin-circle.comment");
            commentHighlight.classList.add("highlight-attachment");
        }
        if(this.paragraph.commands.files && this.paragraph.commands.files.length > 0){
            let filesMenu = this.element.querySelector(".files-menu");
            filesMenu.classList.add("highlight-attachment");
        }

        let paragraphContainer = this.element.querySelector(".paragraph-container");
        if (!paragraphContainer) {
            console.error("Nu s-a găsit .paragraph-container!");
            return;
        }

        // let decodedText = await this.decodeHtmlEntities(this.paragraph.text);
        //
        // let parser = new DOMParser();
        // let doc = parser.parseFromString(decodedText, "text/html");
        // let tags = Array.from(doc.body.querySelectorAll("*"));
        //
        // if (tags.length > 0) {
        //     console.log("Length:", tags.length);
        //
        //     let htmlString = tags.map(tag => {
        //             let tempElement = document.createElement("div");
        //             tempElement.innerHTML = tag.innerHTML;
        //             let decodedContent = tempElement.textContent || tempElement.innerText || "";
        //
        //             return `<${tag.tagName.toLowerCase()}>${decodedContent}</${tag.tagName.toLowerCase()}>`;
        //         }).join("\n");
        //
        //         paragraphContainer.insertAdjacentHTML("afterbegin", `
        //         <paragraph-html-preview data-presenter="paragraph-html-preview">
        //         </paragraph-html-preview>`);
        //
        //         setTimeout(() => {
        //             let previewElement = paragraphContainer.querySelector("paragraph-html-preview");
        //             if (previewElement) {
        //                 previewElement.innerHTML += htmlString;
        //                 console.log(htmlString + 1112)
        //             }
        //         }, 500);
        // }

        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text;
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        let selected = this.documentPresenter.selectedParagraphs[this.paragraph.id];
        if (selected) {
            for (let selection of selected.users) {
                await selectionUtils.setUserIcon(selection.userImageId, selection.userEmail, selection.selectId, this.textClass, this);
            }
            if (selected.lockOwner) {
                selectionUtils.lockItem(this.textClass, this);
            }
        }
    }

    async onParagraphUpdate(type) {
        this.paragraph = await documentModule.getParagraph(assistOS.space.id, this.paragraph.id);
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.value = assistOS.UI.unsanitize(this.paragraph.text);
        this.documentPresenter.toggleEditingState(true);
    }

    async deleteParagraph(targetElement, skipConfirmation) {
        await this.documentPresenter.stopTimer(true);
        if(!skipConfirmation){
            let message = "Are you sure you want to delete this paragraph?";
            let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
            if (!confirmation) {
                return;
            }
        }

        let currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        await documentModule.deleteParagraph(assistOS.space.id, this.chapter.id, this.paragraph.id);
        if (this.chapter.paragraphs.length > 0) {
            if (currentParagraphIndex === 0) {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
            } else {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[currentParagraphIndex - 1].id;
            }
        } else {
            assistOS.space.currentParagraphId = null;
        }
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        chapterPresenter.deleteParagraph(this.paragraph.id);
    }

    getNewPosition(index, direction){
        if (direction === "up") {
            return index === 0 ? this.chapter.paragraphs.length - 1 : index - 1;
        }
        return index === this.chapter.paragraphs.length - 1 ? 0 : index + 1;
    };
    async moveParagraph(_target, direction) {
        if (this.chapter.paragraphs.length === 1) {
            return;
        }
        await this.documentPresenter.stopTimer(false);
        const currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        const position = this.getNewPosition(currentParagraphIndex, direction);
        await documentModule.changeParagraphOrder(assistOS.space.id, this.chapter.id, this.paragraph.id, position);
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.changeParagraphOrder(this.paragraph.id, position);
    }

    addParagraph() {
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: this.element.querySelector(".paragraph-text-container")
        }
        chapterPresenter.addParagraphOrChapterOnKeyPress(mockEvent);
    }

    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || !this.element.closest("body")) {
            return;
        }
        let paragraphText = assistOS.UI.sanitize(paragraph.value);
        if (paragraphText !== this.paragraph.text) {
            this.paragraph.text = paragraphText
            await documentModule.updateParagraph(assistOS.space.id, this.chapter.id, this.paragraph.id,
                paragraphText, this.paragraph.commands, this.paragraph.comments);
        }
    }

    switchParagraphToolbar(mode) {
        let toolbar = this.element.querySelector('.paragraph-toolbar');
        if (mode === "on") {
            toolbar.style.display = "flex";
            if (window.cutParagraph) {
                let pasteIcon = this.element.querySelector(".paste-icon");
                pasteIcon.classList.remove("hidden");
            }
        } else {
            toolbar.style.display = "none";
        }
    }

    async highlightParagraph() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphToolbar("on");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused");
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.add("highlighted-paragraph");
        if(this.curentPlugin){
            await this.openPlugin("", "paragraph", this.curentPlugin);
        }
    }

    removeHighlightParagraph() {
        this.switchParagraphToolbar("off");
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.focusOutHandler();
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.remove("highlighted-paragraph");
    }

    async focusOutHandler() {
        if (!this.element.closest("body")) {
            return;
        }
        await assistOS.loadifyComponent(this.element, async () => {
                this.removeHighlightParagraph();
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                if (textChanged) {
                    await this.saveParagraph(paragraphText);
                }
                assistOS.space.currentParagraphId = null;
                await selectionUtils.deselectItem(this.paragraph.id, this);

                let pluginContainer = this.element.querySelector(`.paragraph-plugin-container`);
                let pluginElement = pluginContainer.firstElementChild;
                if(!pluginElement){
                    return;
                }
                if(pluginElement.classList.contains("pinned")){
                    return;
                }
                this.curentPlugin = await this.closePlugin("", true);
            }
        );
    }


    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        await this.documentPresenter.resetTimer();
    }

    async cutParagraph(_target) {
        window.cutParagraph = this.paragraph;
        await this.deleteParagraph("", true);
        delete window.cutParagraph.id;
    }

    async pasteParagraph(_target) {

        window.cutParagraph.id = this.paragraph.id;
        await documentModule.updateParagraph(assistOS.space.id, this.chapter.id, this.paragraph.id,
            window.cutParagraph.text,
            window.cutParagraph.commands,
            window.cutParagraph.comments);
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            delete window.cutParagraph;
        });
    }

    menus = {
        "insert-document-element": `
                <div>
                    <list-item data-local-action="addParagraph" data-name="Insert Paragraph After" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addChapter above" data-name="Add Chapter Above" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addChapter below" data-name="Add Chapter Below" data-highlight="light-highlight"></list-item>
                </div>`,
        "paragraph-comment-menu": `<paragraph-comment-menu class="paragraph-comment-menu" data-presenter="paragraph-comment-modal"></paragraph-comment-menu>`,
        "files-menu": `<files-menu data-presenter="files-menu"></files-menu>`
    }

    async openPlugin(targetElement, type, pluginName) {
        let selectionItemId = `${this.paragraph.id}_${pluginName}`;
        this.currentPlugin = pluginName;
        let context = {
            chapterId: this.chapter.id,
            paragraphId: this.paragraph.id
        }
        await pluginUtils.openPlugin(pluginName, type, context, this, selectionItemId);
    }
    async closePlugin(targetElement, focusoutClose) {
        let pluginContainer = this.element.querySelector(`.paragraph-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if(!pluginElement){
            return;
        }
        let pluginName = pluginElement.tagName.toLowerCase();
        pluginElement.remove();
        pluginContainer.classList.remove("plugin-open");
        pluginUtils.removeHighlightPlugin("paragraph", this);
        if(focusoutClose){
            return pluginName;
        }
    }

    openMenu(targetElement, menuName) {
        let menuOpen = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menuOpen) {
            return;
        }

        let menuContent = this.menus[menuName];
        let menu = `<div class="toolbar-menu ${menuName}">${menuContent}</div>`
        targetElement.insertAdjacentHTML('beforeend', menu);
        let controller = new AbortController();
        let boundCloseMenu = this.closeMenu.bind(this, controller, targetElement, menuName);
        document.addEventListener("click", boundCloseMenu, {signal: controller.signal});
        let menuComponent = this.element.querySelector(`.${menuName}`);
        menuComponent.boundCloseMenu = boundCloseMenu;
    }

    closeMenu(controller, targetElement, menuName, event) {
        if (event.target.closest(`.toolbar-menu.${menuName}`) || event.target.closest(".insert-modal")) {
            return;
        }
        let menu = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menu) {
            menu.remove();
        }
        controller.abort();
    }

    async handleUserSelection(itemClass, data) {
        if (typeof data === "string") {
            return;
        }
        if (data.selected) {
            if (!this.plugins[itemClass]) {
                await selectionUtils.setUserIcon(data.userImageId, data.userEmail, data.selectId, itemClass, this);
            }
            if (data.lockOwner && data.lockOwner !== this.selectId) {
                return selectionUtils.lockItem(itemClass, this);
            }
        } else {
            if (!this.plugins[itemClass]) {
                selectionUtils.removeUserIcon(data.selectId, this);
            }

            if (!data.lockOwner) {
                selectionUtils.unlockItem(itemClass, this);
            }
        }
    }

    async afterUnload() {
        if (this.selectionInterval) {
            await selectionUtils.deselectItem(this.paragraph.id, this);
        }
    }
}