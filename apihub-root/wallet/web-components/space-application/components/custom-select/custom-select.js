export class CustomSelect{
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.defaultSelected = this.element.getAttribute("data-selected");
        this.name = this.element.getAttribute("data-name");
        this.invalidate();
    }
    beforeRender() {

    }
    afterRender() {
        this.renderOptions(this.props.options);
        if(this.defaultSelected){
            let selectedOption = this.element.querySelector(`.option[data-value="${this.defaultSelected}"]`);
            if (selectedOption) {
                this.selectOption(selectedOption);
            }
        }
        this.width = parseInt(this.element.getAttribute("data-width"));
        this.element.style.width = this.width + "px" || "auto";
    }
    openSelect(){
        let optionsList = this.element.querySelector(".options-list");
        if(!optionsList.classList.contains("hidden")){
            return;
        }
        this.element.firstElementChild.classList.add("focused");
        optionsList.classList.remove("hidden");
        this.controller = new AbortController();
        let boundCloseSelect = this.closeSelect.bind(this);
        document.addEventListener("click", boundCloseSelect, {signal: this.controller.signal});
    }
    closeSelect(event){
        if(!event.target.closest(`custom-select[data-name="${this.name}"]`)){
            let optionsList = this.element.querySelector(".options-list");
            optionsList.classList.add("hidden");
            this.element.firstElementChild.classList.remove("focused");
            this.controller.abort();
        }
    }
    renderOptions(options){
        let firstOption = options[0];
        let currentOption = this.element.querySelector(".current-option");
        currentOption.innerHTML = firstOption.name;
        this.options = options;
        let optionsList = this.element.querySelector(".options-list");
        let optionsHTML = "";
        for(let i = 0; i < options.length; i++){
            let option = options[i];
            if(i === 0){
                optionsHTML += `<div data-local-action="selectOption" class="option" data-value="${option.value}" data-selected="true">${option.name}</div>`;
            } else {
                optionsHTML += `<div data-local-action="selectOption" class="option" data-value="${option.value}">${option.name}</div>`;
            }
        }
        optionsList.innerHTML = optionsHTML;
    }
    selectOption(option){
        let selectedOption = this.element.querySelector(".option[data-selected='true']");
        if(selectedOption){
            selectedOption.removeAttribute("data-selected");
        }
        option.setAttribute("data-selected", "true");
        let currentOption = this.element.querySelector(".current-option");
        currentOption.innerHTML = option.innerHTML;

        let value = option.getAttribute("data-value");
        let changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        changeEvent.value = value;
        let optionsList = this.element.querySelector(".options-list");
        optionsList.classList.add("hidden");
        this.element.firstElementChild.classList.remove("focused");
        if(this.controller){
            this.controller.abort();
        }
        this.element.dispatchEvent(changeEvent);
    }
}