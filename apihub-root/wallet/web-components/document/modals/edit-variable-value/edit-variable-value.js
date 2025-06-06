let spaceModule = assistOS.loadModule("space");
export class EditVariableValue {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.varName = this.element.getAttribute('data-var-name');
        let docViewPage = document.querySelector("document-view-page");
        this.documentPresenter = docViewPage.webSkelPresenter;
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }

    async beforeRender() {
        this.variable = this.documentPresenter.variables.find(v => v.varName === this.varName);
        this.docId = this.documentPresenter._document.docId;
    }
    renderEditTable(){
        let columns = this.variable.value.columnDescription;
        let tableHeaders = `<div class="cell table-header first-column-cell">${columns[0]}</div>`;
        for(let i = 1; i < columns.length; i++){
            tableHeaders+= `<div class="cell table-header">${columns[i]}</div>`;
        }
        let rows = this.variable.value.data;
        let rowsHTML = "";
        for(let i = 0; i < rows.length; i++){
            for(let j = 0; j < columns.length; j++){
                let firstColumnClass = "";
                if(j === 0){
                    firstColumnClass = "first-column-cell";
                }
                let value = rows[i][columns[j]];
                if(value === undefined){
                    value = "";
                }
                rowsHTML+= `<input type="text" class="cell ${firstColumnClass}" value="${value}">`;
            }
        }
        let tableHTML = tableHeaders + rowsHTML;
        let table = document.createElement("div", );
        table.classList.add("table");
        table.style.display = "grid";
        table.style.gridTemplateColumns = `repeat(${columns.length}, 1fr)`;
        table.innerHTML = tableHTML;
        let tableContainer = this.element.querySelector('.table-container');
        tableContainer.insertAdjacentElement("beforeend", table);
        let contextMenu = this.element.querySelector('.context-menu');
        contextMenu.addEventListener("mousedown", (e) => {
            e.preventDefault();
        })
        table.addEventListener("contextmenu", (e)=>{
            if(e.target.classList.contains("table-header")){
                return;
            }
            e.preventDefault();

            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            if(!contextMenu.classList.contains("hidden")){
                return;
            }
            contextMenu.classList.remove("hidden");
            const controller = new AbortController();
            document.addEventListener('click', (e) => {
                if(e.target.closest('.context-menu')){
                    return;
                }
                contextMenu.classList.add("hidden");
                controller.abort();
            }, { signal: controller.signal });
        });

    }
    async afterRender(){
        if(this.variable.command === ":="){
            let textAreaItem = this.element.querySelector('.textarea');
            textAreaItem.classList.remove('hidden');
            let textarea = this.element.querySelector('#value');
            textarea.value = this.variable.value || "";
            textarea.addEventListener("input",(e) => {
                let value = e.target.value;
                let saveButton = this.element.querySelector('.general-button');
                if(value.trim() === ""){
                    saveButton.classList.add("disabled");
                } else {
                    saveButton.classList.remove("disabled");
                }
            })
        } else if(this.variable.command === "new"){
            if(this.variable.customType === "Table"){
                this.renderEditTable();
            }
        }
    }
    async insertRow(button, direction) {
        button.classList.add("disabled");
        let newRow = {};
        for(let column of this.variable.value.columnDescription){
            newRow[column] = "";
        }
        await spaceModule.insertTableRow(assistOS.space.id, this.docId, this.variable.varName, newRow, position);
        await this.documentPresenter.refreshVariables();
        this.documentPresenter.notifyObservers("variables");
        this.invalidate();
    }
    async deleteRow(button){
        let cell = document.activeElement;
        //find row based on truid and delete it
    }
    saveVarValue(targetElement) {
        let varValue;
        if(this.variable.command === ":="){
            varValue = this.element.querySelector('#value').value;
        }
        assistOS.UI.closeModal(this.element, varValue);
    }
    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
}