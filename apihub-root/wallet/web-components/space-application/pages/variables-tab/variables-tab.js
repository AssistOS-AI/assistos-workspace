const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
const constants = require("assistos").constants;
export class VariablesTab{
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender(){
        this.variables = await spaceModule.getVariables(assistOS.space.id);
        this.documents = await documentModule.getDocuments(assistOS.space.id);
        let variablesHTML = "";
        for (let variable of this.variables) {
            variablesHTML +=
                 `<div class="cell">${variable.varId}</div>
                 <div class="cell">${variable.varName}</div>
                 <div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>
                 <div class="cell pointer details" data-local-action="showDetails ${variable.id}">.........</div>`;
        }
        this.variablesHTML = variablesHTML;
        let categoryOptions = `<option value="">All</option>`;
        for(let category of Object.keys(constants.DOCUMENT_CATEGORIES)){
            categoryOptions += `<option value="${constants.DOCUMENT_CATEGORIES[category]}">${category}</option>`;
        }
        this.categoryOptions = categoryOptions;
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
            variablesHTML +=
                `<div class="cell">${variable.varName}</div>
                 <div class="cell">${variable.varId}</div>
                 <div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>
                 <div class="cell pointer details" data-local-action="showDetails ${variable.id}">.........</div>`;
        }
        variablesTable.innerHTML = variablesHTML;
    }
    afterRender(){
        let categorySelect = this.element.querySelector("#category");
        let documentSelect = this.element.querySelector("#docId");
        categorySelect.addEventListener("change", (event) => {
            let category = event.target.value;
            this.selectedCategory = category;
            this.selectedDocument = "";
            let docIdOptions = `<option value="">All</option>`;
            this.renderVariables();
            let documents;
            if(category === ""){
                documents = [];
            } else {
                documents = this.documents.filter(doc => doc.category === category);
            }
            for(let document of documents){
                docIdOptions += `<option value="${document.docId}">${document.docId}</option>`;
            }
            documentSelect.innerHTML = docIdOptions;
        });
        documentSelect.addEventListener("change", (event) => {
            this.selectedDocument = event.target.value;
            this.renderVariables();
        })
        let selectedCategory = categorySelect.querySelector(`option[value="${this.selectedCategory}"]`);
        if(selectedCategory){
            selectedCategory.selected = true;
        }
        let selectedDocument = documentSelect.querySelector(`option[value="${this.selectedDocument}"]`);
        if(selectedDocument){
            selectedDocument.selected = true;
        }
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