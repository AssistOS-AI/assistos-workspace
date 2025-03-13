const spaceModule = require('assistos').loadModule('space', {});

const getChatIframe = (spaceId, personalityId) => {
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?spaceId=${spaceId}&personalityId=${personalityId}"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

const getConfiguration = async function (spaceId) {
    const configuration = await spaceModule.getWebAssistantConfiguration(spaceId)
    return configuration;
}

const getHomePageConfig = async function (spaceId) {
    const homePage = await spaceModule.getWebAssistantHomePage(spaceId);
    return homePage
}
const getPageConfig = async function (spaceId, pageId) {
    const page = await spaceModule.getWebAssistantConfigurationPage(spaceId, pageId);
    return page
}

export class ApplicationCreatorPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName = "Preview"
        this.spaceId = assistOS.space.id;
        this.invalidate();

    }

    async beforeRender() {
        if(!this.currentPageId){
            this.configuration = await getConfiguration(this.spaceId);
            this.previewContentLeft = getChatIframe(this.spaceId, this.configuration.settings.personality);
            const homePageConfig = await getHomePageConfig(this.spaceId, this.configuration.pages);
            this.currentPageId=homePageConfig.id;
        }
        this.page = await getPageConfig(this.spaceId, this.currentPageId);
        this.previewContentRight = `<div>${this.page.name} Page</div>`;
        this.previewContentHeader = `<div>Preview Content Header</div>`;
        this.previewContentSidebar = this.page.menu.map((menuItem) => {
            return `<div class="preview-sidebar-item" data-local-action="openPreviewPage ${menuItem.targetPage}">
            <span><img src="${menuItem.icon}" class="menu-icon-img" alt="Menu Icon"></span> <span class="menu-item-name">${menuItem.name}</span>
            </div>`
        }).join('');
    }

    async afterRender() {
        this.previewLeftElement = this.element.querySelector('#preview-content-left');
        this.previewRightElement = this.element.querySelector('#preview-content-right');

        this.previewLeftElement.style.width = `${this.page.chatSize}%`;
        this.previewRightElement.style.width = `${100 - this.page.chatSize}%`;

        if(this.previewRightElement.style.width==='0%'){
            this.previewRightElement.style.display = 'none';
        }
        if(this.previewLeftElement.style.width==='0%'){
            this.previewLeftElement.style.display = 'none';
        }
    }
    async openPreviewPage(eventTarget,pageId) {
        this.currentPageId=pageId
        this.invalidate();
    }
}
