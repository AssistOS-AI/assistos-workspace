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
        if(this.variable.command === "new"){
            if(this.variable.customType === "Table"){
                this.renderEditTable();
            }
        }
    }
    renderEditTable(){
        let columns = this.variable.value.columnDescription;
        let tableHeaders = `<div class="cell table-header first-column-cell">${columns[0]}</div>`;
        for(let i = 1; i < columns.length; i++){
            tableHeaders+= `<div class="cell table-header">${columns[i]}</div>`;
        }
        this.columns = [];
        for(let column of columns){
            let splitName = column.split(":");
            if(splitName.length > 1){
                let command = splitName[1].trim().split(" ")[0].trim();
                this.columns.push({
                    name: splitName[0],
                    command: command
                });
            } else {
                this.columns.push({
                    name: column
                });
            }
        }
        this.computedColumns = this.columns.filter(column => column.command);
        let rows = this.variable.value.data;
        let rowsHTML = "";
        for(let i = 0; i < rows.length; i++){
            rowsHTML+= this.getRowHTML(rows[i]);
        }
        let tableHTML = tableHeaders + rowsHTML;
        this.tableHTML = `<div class="table">${tableHTML}</div>`
    }
    getRowHTML(row){
        let rowHTML = "";
        for(let j = 0; j < this.columns.length; j++){
            let firstColumnClass = "";
            if(j === 0){
                firstColumnClass = "first-column-cell";
            }
            let value = row[this.columns[j].name];
            let truid = row.truid;
            if(value === undefined){
                value = "";
            }
            let readOnlyClass = "";
            if(this.columns[j].command){
                readOnlyClass = "read-only";
            }
            rowHTML+= `<input data-id="${truid}" data-column="${this.columns[j].name}" type="text" class="cell ${firstColumnClass} ${readOnlyClass}" value="${value}">`;
        }
        return rowHTML;
    }
    async afterRender(){
        if(this.variable.command === ":="){
            let textAreaItem = this.element.querySelector('.textarea');
            textAreaItem.classList.remove('hidden');
            let textarea = this.element.querySelector('#value');
            textarea.value = this.variable.value || "";
            textarea.addEventListener("input",(e) => {
                let value = e.target.value;
                let saveButton = this.element.querySelector('.save-button');
                if(value.trim() === ""){
                    saveButton.classList.add("disabled");
                } else {
                    saveButton.classList.remove("disabled");
                }
            })
            let tableContainer = this.element.querySelector('.table-container');
            tableContainer.classList.add('hidden');
        } else {
            let modalFooter = this.element.querySelector('.modal-footer');
            modalFooter.classList.add('hidden');
            let contextMenu = this.element.querySelector('.context-menu');
            contextMenu.addEventListener("mousedown", (e) => {
                e.preventDefault();
            })
            this.addTableEventListeners(contextMenu);
            this.timers = new Map();
            this.lastValues = new Map();
            let cells = this.element.querySelectorAll('.cell');
            for(let cell of cells){
                if(cell.classList.contains("read-only")){
                    continue;
                }
                this.lastValues.set(cell, cell.value);
            }
        }
    }
    addTableEventListeners(contextMenu) {
        let table = this.element.querySelector('.table');
        let columns = this.variable.value.columnDescription;
        table.style.gridTemplateColumns = `repeat(${columns.length}, 1fr)`;
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
                contextMenu.classList.add("hidden");
                controller.abort();
            }, { signal: controller.signal });
        });
        table.addEventListener("input", (e)=>{
            let cell = e.target;
            clearTimeout(this.timers.get(cell));
            const timeout = setTimeout(() => this.saveCellValue(cell), 2000);
            this.timers.set(cell, timeout);
        })
        table.addEventListener("focusout", async (e)=>{
            let cell = e.target;
            clearTimeout(this.timers.get(cell));
            await this.saveCellValue(cell);
            this.timers.delete(cell);
        });
    }
    isNumber(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }
    async saveCellValue(cell) {
        let value = cell.value;
        let truid = cell.getAttribute("data-id");

        let rowIndex = this.variable.value.data.findIndex(row => row.truid === truid);
        let columnName = cell.getAttribute("data-column");
        let sanitizedValue = assistOS.UI.sanitize(value.trim());
        const lastValue = this.lastValues.get(cell);
        if(this.isNumber(value)){
            value = parseFloat(value);
        }
        if(lastValue !== sanitizedValue){
            this.lastValues.set(cell, sanitizedValue);
            //update variable value
            let row = this.variable.value.data[rowIndex];
            row[columnName] = value;
            //update server side
            let computedRow = await spaceModule.updateTableRow(assistOS.space.id, this.docId, this.variable.varName, row);
            for(let column of this.computedColumns){
                let cellToUpdate = this.element.querySelector(`input[data-id="${truid}"][data-column="${column.name}"]`);
                if(cellToUpdate){
                    if(computedRow[column.name] !== undefined){
                        cellToUpdate.value = computedRow[column.name];
                    }
                }
            }
        }
    }
    async insertRow(button, direction) {
        button.classList.add("disabled");
        let position;
        if(direction === "above"){
            let cell = document.activeElement;
            let truid = cell.getAttribute("data-id");
            position = this.variable.value.data.findIndex(row => row.truid === truid);

        } else if(direction === "below"){
            let cell = document.activeElement;
            let truid = cell.getAttribute("data-id");
            position = this.variable.value.data.findIndex(row => row.truid === truid);
            position += 1;
        }
        let newRow = {};
        for(let column of this.columns){
            newRow[column.name] = "";
        }
        let computedRow = await spaceModule.insertTableRow(assistOS.space.id, this.docId, this.variable.varName, newRow, position);
        if(position == null){
            position = this.variable.value.data.length; // Default to append
        }
        this.variable.value.data.splice(position, 0, computedRow);
        //TODO update UI without invalidate maybe
        this.invalidate();
    }
    async deleteRow(button){
        let cell = document.activeElement;

        let truid = cell.getAttribute("data-id");
        //delete from UI
        let rowCells = this.element.querySelectorAll(`input[data-id="${truid}"]`);
        for(let rowCell of rowCells){
            //cell set for save
            if(this.timers.get(cell)){
                clearTimeout(this.timers.get(cell));
                this.timers.delete(cell);
            }
            rowCell.remove();
        }
        //delete from variable value
        let rowIndex = this.variable.value.data.findIndex(row => row.id === truid);
        this.variable.value.data.splice(rowIndex, 1);
        //update server side
        await spaceModule.deleteTableRow(assistOS.space.id, this.docId, this.variable.varName, truid);
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