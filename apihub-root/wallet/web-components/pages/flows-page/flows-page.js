import {
    showModal, showActionBox, reverseQuerySelector, extractFormInformation
} from "../../../imports.js";

export class flowsPage {
    constructor(element, invalidate) {
        webSkel.currentUser.space.observeChange(webSkel.currentUser.space.getNotificationId(), invalidate);
        this.element = element;
        this.selectedTypes = [];
        this.filtersOpen = false;
        this.invalidate = invalidate;
        this.spaceChecked="checked";
        this.invalidate();
    }


    beforeRender() {
        const tagifyFlow = (flow, applicationName) => {
            flow.tags = [applicationName];
            return flow;
        };

        const createUIFlowFilter = (applicationName) => `
        <div class="filter">
            <label for="${applicationName}">${applicationName}</label>
            <input type="checkbox" id="${applicationName}" name="${applicationName}" data-id="${applicationName}" value="${applicationName}">
        </div>`;

        const generateTableRow = (item) => `
        <flow-unit data-id="${item.class.id}" data-name="${item.class.name}" data-description="${item.class.description}" data-local-action="editAction"></flow-unit>`;

        const sortFlows = (flows) => flows.sort((a, b) => a.class.name.toLowerCase().localeCompare(b.class.name.toLowerCase()));

        const generateApplicationFlowsUI = () => {
            return (webSkel.appServices.getInstalledApplications() || []).map(application => createUIFlowFilter(application.name)).join("");
        };

        if (this.filteredFlows === undefined) {
            this.filteredFlows = webSkel.currentUser.space.flows || [];
            const applicationFlows = webSkel.appServices.getInstalledApplicationFlows(tagifyFlow);
            this.filteredFlows = [...this.filteredFlows, ...applicationFlows];
        }

        if (this.filteredFlows.length > 0) {
            this.filteredFlows = sortFlows(this.filteredFlows);
            this.tableRows = this.filteredFlows.map(generateTableRow).join("");
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
        this.applicationsFlows = generateApplicationFlowsUI();
    }

    afterRender() {
        this.filters = this.element.querySelector(".filters");
        if (this.filtersOpen) {
            this.openFilters();
        }
        for (let filter of this.filters.children) {
            let checkbox = filter.children[1];
            if (this.selectedTypes.includes(checkbox.getAttribute("name"))) {
                checkbox.checked = true;
            }
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getFlowId(_target) {
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }

    async showAddFlowModal() {
        await showModal("add-flow-modal", {presenter: "add-flow-modal"});
    }

    async editAction(_target) {
        await showModal("edit-flow-modal", {presenter: "edit-flow-modal", id: this.getFlowId(_target)});
    }

    async deleteAction(_target) {
        this.filteredFlows = this.filteredFlows.filter(flow => flow.id !== this.getFlowId(_target));
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteFlow");
        await webSkel.appServices.callFlow(flowId, this.getFlowId(_target));
        this.invalidate();
    }

    importFlows() {
        alert("To be implemented.");
    }

    exportFlows() {
        alert("To be implemented.");
    }

    openFilters(_target) {
        this.filters.style.display = "flex";
        let controller = new AbortController();
        document.addEventListener("click", this.manageFilters.bind(this, controller), {signal: controller.signal});
    }

    async manageFilters(controller, event) {
        if (this.filters.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            if (event.target.tagName === "LABEL") {
                let checkbox = this.filters.querySelector(`#${event.target.getAttribute("for")}`);
                checkbox.checked = !checkbox.checked;
            }
            if (!event.target.classList.contains("filter")) {
                let formInfo = await extractFormInformation(event.target);
                let selectedTypes = [];
                for (const [key, value] of Object.entries(formInfo.elements)) {
                    if (value.element.checked) {
                        selectedTypes.push(value.element.value);
                    }
                }

                this.selectedTypes = selectedTypes;
                if(!this.selectedTypes.includes("space")){
                    this.spaceChecked="";
                }
                this.filtersOpen = true;
                this.filteredFlows = [...webSkel.currentUser.space.tagifyAllSpaceFlows(), ...webSkel.appServices.getInstalledApplicationFlows()]
                    .filter(flow => selectedTypes.some(type => flow.tags.includes(type)));
                this.invalidate();
                controller.abort();
            }
        } else {
            this.filters.style.display = "none";
            this.filtersOpen = false;
            controller.abort();
        }
    }

}