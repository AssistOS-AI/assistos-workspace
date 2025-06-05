import {isEditableValue} from "./../../../../imports.js";

const spaceModule = assistOS.loadModule("space")
const documentModule = assistOS.loadModule("document")
const constants = require("assistos").constants;
export class VariablesTab{
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.selectedCategory = "";
        this.invalidate();
    }
    getVarStatus(variable) {
        let status = "";
        if(variable.value !== undefined){
            status = `<img src="./wallet/assets/icons/success.svg" class="success-icon">`;
        }
        if(variable.errorInfo){
            status = `<img src="./wallet/assets/icons/error.svg" class="error-icon">`;
        }
        return status;
    }
    async beforeRender(){
        this.variables = await spaceModule.getVariables(assistOS.space.id);
        this.documents = await documentModule.getDocuments(assistOS.space.id);
        let variablesHTML = "";
        for (let variable of this.variables) {
            if(variable.value === undefined) {
                variable.value = "";
            }
            let varStatus = this.getVarStatus(variable);
            variablesHTML +=
                 `<div class="cell">${varStatus}</div>
                 <div class="cell">${variable.docId}</div>
                 <div class="cell">${variable.varName}</div>
                 <div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>
                 <div class="cell last-cell">
                    <div class="icon-container pointer" data-local-action="showDetails ${variable.id}">
                        <img src="./wallet/assets/icons/eye.svg" alt="eye" class="eye-icon">
                    </div>
                 </div>`;
        }
        this.variablesHTML = variablesHTML;
        this.docIdOptions = `<option value="">All</option>`;
    }
    renderVariables(){
        let variablesTable = this.element.querySelector(".variables-table");
        let variablesHTML = "";
        let variables;
        if(this.selectedDocument){
            variables = this.variables.filter(variable => variable.docId === this.selectedDocument);
        } else {
            let documents;
            if(this.selectedCategory === ""){
                documents = this.documents;
            } else {
                documents = this.documents.filter(doc => doc.category === this.selectedCategory);
            }

            let docIds = documents.map(doc => doc.docId);
            variables = this.variables.filter(variable => docIds.includes(variable.docId));
        }
        variables = variables.sort((a, b) => a.varId.localeCompare(b.varId));
        for(let variable of variables) {
            let editableValue = isEditableValue(variable.varName,  variables);
            if(variable.value === undefined) {
                variable.value = "";
            }
            let valueCell = `<div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>`
            if(editableValue){
                valueCell = `<div class="cell editable" data-local-action="openEditValue ${variable.varName}">${typeof variable.value === "object" ? "Object": variable.value}</div>`;
            }
            let varStatus = this.getVarStatus(variable);
            variablesHTML +=
                `<div class="cell">${varStatus}</div>
                 <div class="cell">${variable.varName}</div>
                 <div class="cell">${variable.varId}</div>
                 ${valueCell}
                 <div class="cell">
                    <div class="icon-container pointer" data-local-action="showDetails ${variable.id}">
                        <img src="./wallet/assets/icons/eye.svg" alt="eye" class="eye-icon">
                    </div>
                 </div>`;
        }
        variablesTable.innerHTML = variablesHTML;
    }
    insertDocIdSelect(documents){
        let docIdSelect = this.element.querySelector(".doc-id-select");
        docIdSelect.innerHTML = "";
        let options = [{name: "All", value: ""}];
        for(let document of documents) {
            options.push({
                name: document.docId,
                value: document.docId
            })
        }
        assistOS.UI.createElement("custom-select", ".doc-id-select", {
                options: options,
            },
            {
                "data-width": "230",
                "data-name": "docId",
                "data-selected": "",
            });
        let documentSelect = this.element.querySelector(".doc-id-select").firstElementChild;
        documentSelect.addEventListener("change", (event) => {
            this.selectedDocument = assistOS.UI.sanitize(event.value);
            this.renderVariables();
        });
    }
    afterRender(){
        let documentTypesOptions = [{name: "All", value: ""}];
        for(let category of Object.keys(constants.DOCUMENT_CATEGORIES)) {
            documentTypesOptions.push({
                name: category,
                value: constants.DOCUMENT_CATEGORIES[category]
            })
        }
        assistOS.UI.createElement("custom-select", ".category-select", {
                options: documentTypesOptions,
            },
            {
                "data-width": "230",
                "data-name": "type",
                "data-selected": "",
            })
        this.insertDocIdSelect(this.documents);
        let categorySelect = this.element.querySelector(".category-select").firstElementChild;
        categorySelect.addEventListener("change", (event) => {
            let category = event.value;
            this.selectedCategory = category;
            this.selectedDocument = "";
            let docIdOptions = `<option value="">All</option>`;
            this.renderVariables();
            let documents;
            if(category === ""){
                documents = this.documents;
            } else {
                documents = this.documents.filter(doc => doc.category === category);
            }
            this.insertDocIdSelect(documents);
        });
    }

    async showDetails(_eventTarget, variableId) {
        await assistOS.UI.showModal("variable-details", {
             "variable-id": variableId
         })
    }
    getVariable(id){
        return this.variables.find(variable => variable.id === id);
    }
}