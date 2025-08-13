const applicationModule = assistOS.loadModule("application");
const WebAssistant = assistOS.loadModule("webassistant", {});

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export class EditWidgetModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.assistantId = assistOS.space.webAssistant;
        this.id = this.element.getAttribute('data-id');
        this.spaceId = assistOS.space.id;
        this.dataStructure = {};
    }

    async beforeRender() {
        debugger
        if (this.id) {
            await this.handleEditRender();
        } else {
            await this.handleAddRender();
        }
    }

    async handleAddRender() {
        this.modalName = "Add Widget";
        this.actionButton = "Add";
        this.actionFn = `addPage`;
        const widgets = await applicationModule.getWidgets(this.spaceId);
        this.widgets = Object.entries(
            (isEmpty(widgets) ? {} : widgets))
            .map(([app, widgets]) =>
                widgets.map(widget => `<option value="${app}/${widget.name}">${app}/${widget.name}</option>`))
            .flat(2)
            .join('');
        this.widgets = `<select class="application-form-item-select" id="selectedWidget" name="selectedWidget">${this.widgets}</select>`
        const existingPages = await WebAssistant.getPages(this.spaceId, this.assistantId);

        this.chatOptions = `
                        <option value="0">Minimized</option>
                        <option value="30">Third of Screen</option>
                        <option value="50">Half of Screen</option>
                        <option value="100">Full Screen</option>
`
        this.roleOptions = `
                        <option value="page" selected>Page</option>
                        <option value="header" ${existingPages.find(page=>page.role==="header")?"disabled":""} >Header</option>
                        <option value="footer" ${existingPages.find(page=>page.role==="footer")?"disabled":""}>Footer</option>
                        <option value="load" ${existingPages.find(page=>page.role==="load")?"disabled":""}>Load Room</option>
                        <option value="new" ${existingPages.find(page=>page.role==="new")?"disabled":""}>New Room</option>
`
    }

    async handleEditRender() {
        const pageData = await WebAssistant.getPage(this.spaceId, this.assistantId, this.id);
        this.name = pageData.name;
        this.description = pageData.description;
        this.widget = pageData.widget;
        this.data = pageData.data;
        this.chatSize = pageData.chatSize;
        this.generalSettings = pageData.generalSettings;
        this.html = pageData.html || '';
        this.css = pageData.css || '';
        this.js = pageData.js || '';
        this.role = pageData.role || 'page';
        this.modalName = "Edit Widget";
        this.actionButton = "Save";
        this.actionFn = `editPage`;
        const widgets = await applicationModule.getWidgets(this.spaceId);
        this.widgets = Object.entries((isEmpty(widgets) ? {} : widgets)).map(([app, widgets]) => widgets.map(widget => `<option value="${app}/${widget.name}" ${`${app}/${widget.name}` === this.widget ? "selected" : ""}>${app}/${widget.name}</option>`)).flat(2).join('');
        this.widgets = `<select class="application-form-item-select" id="selectedWidget" name="selectedWidget">${this.widgets}</select>`
        this.chatOptions = ` <option value="0" ${this.chatSize === "0" ? "selected" : ""}>Minimized</option>
                        <option value="30" ${this.chatSize === "30" ? "selected" : ""}>Third of Screen</option>
                        <option value="50" ${this.chatSize === "50" ? "selected" : ""}>Half of Screen</option>
                        <option value="100" ${this.chatSize === "100" ? "selected" : ""}>Full Screen</option>
`
        const existingPages = await WebAssistant.getPages(this.spaceId, this.assistantId);

        this.roleOptions = `
                        <option value="page">Page</option>
                        <option value="header" ${pageData.role==="header"?"selected":""} ${existingPages.find(page=>page.role==="header")?"disabled":""} >Header</option>
                        <option value="footer" ${pageData.role==="footer"?"selected":""} ${existingPages.find(page=>page.role==="footer")?"disabled":""}>Footer</option>
                        <option value="load" ${pageData.role==="load"?"selected":""} ${existingPages.find(page=>page.role==="load")?"disabled":""}>Load Room</option>
                        <option value="new" ${pageData.role==="new"?"selected":""} ${existingPages.find(page=>page.role==="new")?"disabled":""}>New Room</option>
`
    }

    async afterRender() {
        this.tabContent = '';
        this.form = this.element.querySelector('.application-form');
        if (!this.id) {
            this.dataStructure["General Settings"] = {value: ''};
            this.dataStructure["Data"] = {value: ''};
            this.dataStructure["HTML"] = {value: ''};
            this.dataStructure["CSS"] = {value: ''};
            this.dataStructure["JS"] = {value: ''};
        } else {
            this.dataStructure["General Settings"] = {value: this.generalSettings};
            this.dataStructure["Data"] = {value: this.data};
            this.dataStructure["HTML"] = {value: this.html};
            this.dataStructure["CSS"] = {value: this.css};
            this.dataStructure["JS"] = {value: this.js};
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

            switch (key) {
                case "General Settings":
                    textarea.placeholder = "Enter general settings...";
                    break;
                case "Data":
                    textarea.placeholder = "Enter data...";
                    break;
                case "HTML":
                    textarea.placeholder = "Enter HTML code...";
                    break;
                case "CSS":
                    textarea.placeholder = "Enter CSS code...";
                    break;
                case "JS":
                    textarea.placeholder = "Enter JavaScript code...";
                    break;
            }
        }
    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addPage(_target) {
        debugger
        const form = this.element.querySelector('form');
        const description = form.querySelector('#description');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            // Check if header or footer already exists
            const selectedRole = formData.data["page-role"];
            if (selectedRole === "header" || selectedRole === "footer" || selectedRole === "load" || selectedRole === "new") {
                const existingPages = await WebAssistant.getPages(this.spaceId, this.assistantId);
                const existingRole = existingPages.find(page => page.role === selectedRole);
                if (existingRole) {
                    await assistOS.showToast(`A ${selectedRole} already exists. Only one ${selectedRole} is allowed.`, "error");
                    return;
                }
            }

            const pageData = {
                name: formData.data["page-name"],
                widget: formData.data.selectedWidget,
                chatSize: formData.data.chatSize,
                description: description.value,
                role: formData.data["page-role"],
                generalSettings: this.dataStructure["General Settings"].value,
                data: this.dataStructure["Data"].value,
                html: this.dataStructure["HTML"].value,
                css: this.dataStructure["CSS"].value,
                js: this.dataStructure["JS"].value
            }
            await WebAssistant.addPage(this.spaceId, this.assistantId, pageData);
            this.shouldInvalidate = true;
            await this.closeModal();
        }
    }

    async editPage() {
        const form = this.element.querySelector('form');
        const description = form.querySelector('#description');
        let formData = await assistOS.UI.extractFormInformation(form);
        if (formData.isValid) {
            const selectedRole = formData.data["page-role"];
            if (selectedRole === "header" || selectedRole === "footer" || selectedRole === "load" || selectedRole === "new") {
                const existingPages = await WebAssistant.getPages(this.spaceId, this.assistantId);
                const existingRole = existingPages.find(page =>
                    page.role === selectedRole && page.id !== this.id
                );
                if (existingRole) {
                    this.closeModal();
                    await assistOS.showToast(`A ${selectedRole} already exists. Only one ${selectedRole} is allowed.`, "error");
                    return;
                }
            }

            const pageData = {
                name: formData.data["page-name"],
                widget: formData.data.selectedWidget,
                chatSize: formData.data.chatSize,
                description: description.value,
                role: formData.data["page-role"],
                generalSettings: this.dataStructure["General Settings"].value,
                data: this.dataStructure["Data"].value,
                html: this.dataStructure["HTML"].value,
                css: this.dataStructure["CSS"].value,
                js: this.dataStructure["JS"].value
            }
            await WebAssistant.updatePage(this.spaceId, this.assistantId, this.id, pageData);
            this.shouldInvalidate = true;
            await this.closeModal();
        }
        await this.closeModal();
    }
}