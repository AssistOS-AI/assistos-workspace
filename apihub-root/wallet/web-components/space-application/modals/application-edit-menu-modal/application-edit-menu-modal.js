const spaceModule = require('assistos').loadModule('space', {});

const getPageRows = async function (spaceId) {
    return await spaceModule.getWebAssistantConfigurationPages(spaceId);
}
const getMenuItem = async function (spaceId,menuItemId) {
    return await spaceModule.getWebAssistantConfigurationPageMenuItem(spaceId,  menuItemId);
}
const getPage = async function (spaceId, pageId) {
    const page = await spaceModule.getWebAssistantConfigurationPage(spaceId, pageId);
    return page;
}

export class ApplicationEditMenuModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.spaceId = assistOS.space.id;
        this.id = this.element.getAttribute('data-id');
        this.pageId = this.element.getAttribute('data-pageId');
    }

    async beforeRender() {
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
    }

    async handleAddRender() {
        this.modalName = "Add Menu Item";
        this.actionButton = "Add";
        this.actionFn = `addMenuItem`;
        const pages = await getPageRows(this.spaceId);
        this.targetPages = `
        <select class="application-form-item-select" data-name="targetPage" id="targetPage">
        ${pages.map(pageData => {
            return `<option value="${pageData.id}" data-name="${pageData.name}">${pageData.name}</option>`
        })
            .join('')}
        </select>
        `
        this.menuTypes = `
        <select class="application-form-item-select" data-name="itemLocation" id="itemLocation">
            <option value="chat">Chat</option>
            <option value="assistant">Assistant</option>
            <option value="page">Page</option>
        </select>`
    }

    async handleEditRender() {
        this.modalName = "Edit Menu Item";
        this.actionButton = "Save";
        this.actionFn = `editMenuItem`;
        const pages = await getPageRows(this.spaceId);
        this.targetPages = `
        <select class="application-form-item-select" data-name="targetPage" id="targetPage"
        ${pages.map(pageData => {
            return `<option value="${pageData.id}" data-name="${pageData.name}">${pageData.name}</option>`
        })
            .join('')}
        </select>`

        this.menuTypes = `
        <select class="application-form-item-select" data-name="itemLocation" id="itemLocation">
            <option value="chat">Chat</option>
            <option value="assistant">Assistant</option>
            <option value="page">Page</option>
        </select>`

        const pageMenu = await getMenuItem(this.spaceId,  this.id);
        this.name = pageMenu.name;
        this.icon = pageMenu.icon;
    }

    async afterRender() {
        const fileInput = this.element.querySelector('#customFile');
        const fileLabel = this.element.querySelector('.file-input-label span:last-child');
        const targetPageSelectElement = this.element.querySelector('#targetPage');
        this.lastTargetPage = targetPageSelectElement.value;
        targetPageSelectElement.addEventListener('change', (e) => {
            this.lastTargetPage = e.target.value;
        })

        const iconContainer = this.element.querySelector('.file-input-label span:first-child');

        if (this.icon) {
            iconContainer.style.width = '200px';
            iconContainer.style.height = '200px';
            iconContainer.innerHTML = ` <img src="${this.icon}" style="width: 100%; height: 100%; object-fit: contain;"> `;
        }
        const self = this;
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                fileLabel.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    iconContainer.style.width = '200px';
                    iconContainer.style.height = '200px';
                    iconContainer.style.transition = 'all 0.3s ease';
                    self.icon = e.target.result;
                    iconContainer.innerHTML = ` <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;"> `;
                }
                reader.readAsDataURL(file);
            } else {
                fileLabel.textContent = 'No file selected';
                iconContainer.style.width = '24px';
                iconContainer.style.height = '24px';
                iconContainer.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
            }
        });
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addMenuItem() {
        const locationSelect = this.element.querySelector('#itemLocation');
        const form = this.element.querySelector('.application-form');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid && this.currentPage !== null) {
            const menuItem = {
                icon: this.icon,
                name: formData.data["display-name"],
                targetPage: this.lastTargetPage,
                itemLocation: locationSelect.value
            }
            await spaceModule.addWebAssistantConfigurationPageMenuItem(this.spaceId, this.currentPage, menuItem)
            this.shouldInvalidate = true;
            await this.closeModal();
        }
    }

    async editMenuItem() {
        const form = this.element.querySelector('.application-form');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            const menuItem = {
                icon: this.icon,
                name: formData.data["display-name"],
                targetPage: this.lastTargetPage
            }
            await spaceModule.updateWebAssistantConfigurationPageMenuItem(this.spaceId, this.pageId, this.id, menuItem)
            this.shouldInvalidate = true;
            await this.closeModal();
        }
    }
}

