const applicationModule = require('assistos').loadModule('application', {});
const spaceModule = require('assistos').loadModule('space', {});

const getWidgets = async function (spaceId) {
    const widgets = await applicationModule.getWidgets(spaceId);
    return widgets;
}


const getPageData = async function (spaceId, pageId) {
    const page = await spaceModule.getWebAssistantConfigurationPage(spaceId, pageId);
    return page;
}


export class ApplicationEditPageModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.id = this.element.getAttribute('data-id');
        this.spaceId = assistOS.space.id;
        this.dataStructure = {};
    }

    async beforeRender() {
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
    }

    async handleAddRender() {
        this.modalName = "Add Page";
        this.actionButton = "Add";
        this.actionFn = `addPage`;

        this.widgets = Object.entries(
            (await getWidgets(this.spaceId)))
            .map(([app, widgets]) =>
                widgets.map(widget => `<option value="${app}/${widget.name}">${app}/${widget.name}</option>`))
            .flat(2)
            .join('');
        this.widgets = `<select class="application-form-item-select" id="selectedWidget" name="selectedWidget">${this.widgets}</select>`
        this.chatOptions = `
                        <option value="0">Minimized</option>
                        <option value="30">Third of Screen</option>
                        <option value="50">Half of Screen</option>
                        <option value="100">Full Screen</option>
`
    }

    async handleEditRender() {
        const pageData = await getPageData(this.spaceId, this.id);
        this.name = pageData.name;


        this.description = pageData.description;
        this.widget = pageData.widget;
        this.data = pageData.data;
        this.chatSize = pageData.chatSize;
        this.generalSettings = pageData.generalSettings;

        this.modalName = "Edit Page";
        this.actionButton = "Save";
        this.actionFn = `editPage`;
        this.widgets = Object.entries((await getWidgets(this.spaceId))).map(([app, widgets]) => widgets.map(widget => `<option value="${app}/${widget.name}" ${`${app}/${widget.name}` === this.widget ? "selected" : ""}>${app}/${widget.name}</option>`)).flat(2).join('');
        this.widgets = `<select class="application-form-item-select" id="selectedWidget" name="selectedWidget">${this.widgets}</select>`
        this.chatOptions = ` <option value="0" ${this.chatSize === "0" ? "selected" : ""}>Minimized</option>
                        <option value="30" ${this.chatSize === "30" ? "selected" : ""}>Third of Screen</option>
                        <option value="50" ${this.chatSize === "50" ? "selected" : ""}>Half of Screen</option>
                        <option value="100" ${this.chatSize === "100" ? "selected" : ""}>Full Screen</option>
`
    }

    async afterRender() {
        this.tabContent = '';
        this.form = this.element.querySelector('.application-form');
        if (!this.id) {
            this.dataStructure["General Settings"] = {value: ''};
            this.dataStructure["Data"] = {value: ''};
        }else{
            this.dataStructure["General Settings"] = {value: this.generalSettings};
            this.dataStructure["Data"] = {value: this.data};
        }
        this.setupDataTabs();

    }


    setupDataTabs() {
        const container = this.element.querySelector('.data-tabs-container');
        if (!container) return;
        container.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                const activeKey = this.getActiveTabKey();
                if (activeKey) {
                    this.dataStructure[activeKey].value = e.target.value;
                }
            }
        });

        this.renderTabs();
        this.switchTab("General Settings");
    }

    handleDataTypeChange(e) {
        if (e.target.classList.contains('data-type-select')) {
            const activeKey = this.getActiveTabKey();
            if (activeKey) {
                this.dataStructure[activeKey].type = e.target.value;
            }
        }
    }

    handleDataContentInput(e) {
        if (e.target.classList.contains('application-form-item-select') && e.target.tagName === 'TEXTAREA') {
            const activeKey = this.getActiveTabKey();
            if (activeKey) {
                this.dataStructure[activeKey].value = e.target.value;
            }
        }
    }

    getActiveTabKey() {
        const tabsList = this.element.querySelector('.tabs-list');
        return tabsList?.querySelector('.tab.active')?.dataset.key;
    }

    renderTabs() {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <textarea class="application-form-item-select no-resize textarea-large" 
                      placeholder="Enter data..."></textarea>
        `;

        this.element.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.element.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchTab(tab.dataset.key);
            });
        });
    }


    updateTabContent(key) {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        const typeSelect = tabContent.querySelector('.data-type-select');
        const contentArea = tabContent.querySelector('textarea');

        if (typeSelect && contentArea) {
            typeSelect.value = this.dataStructure[key].type;
            contentArea.value = this.dataStructure[key].value;
        }
    }


    switchTab(key) {
        const tabContent = this.element.querySelector('.tab-content');
        if (!tabContent) return;

        const textarea = tabContent.querySelector('textarea');
        if (textarea) {
            textarea.value = this.dataStructure[key]?.value || '';
        }
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addPage(_target) {
        const form = this.element.querySelector('.application-form');
        const description = form.querySelector('#description');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            const pageData = {
                name: formData.data["page-name"],
                widget: formData.data.selectedWidget,
                chatSize: formData.data.chatSize,
                description: description.value,
                generalSettings: this.dataStructure["General Settings"].value,
                data: this.dataStructure["Data"].value
            }
            await spaceModule.addWebAssistantConfigurationPage(this.spaceId, pageData);
            this.shouldInvalidate = true;
            await this.closeModal();
        }
    }

    async editPage() {
        const form = this.element.querySelector('.application-form');
        const description = form.querySelector('#description');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            const pageData = {
                name: formData.data["page-name"],
                widget: formData.data.selectedWidget,
                chatSize: formData.data.chatSize,
                description: description.value,
                generalSettings: this.dataStructure["General Settings"].value,
                data: this.dataStructure["Data"].value
            }
            await spaceModule.updateWebAssistantConfigurationPage(this.spaceId, this.id, pageData);
            this.shouldInvalidate = true;
            await this.closeModal();
        }
        await this.closeModal();
    }
}