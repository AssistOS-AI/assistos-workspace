export class CustomRadio{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.name = this.element.getAttribute('data-name');
        this.value = this.element.getAttribute('data-value');
        let selected = this.element.getAttribute('data-selected');
        this.selectedClass = selected === "true" ? "selected" : "";
        this.element.removeAttribute('data-selected');
        this.invalidate();
    }
    beforeRender() {}
    selectRadio(radio) {
        radio.classList.add('selected');
        let name = radio.getAttribute('data-name');
        let value = radio.getAttribute('data-value');
        let radioButtons = document.querySelectorAll(`.custom-radio[data-name="${name}"]`);
        let others = Array.from(radioButtons).filter(otherRadio => otherRadio !== radio);
        others.forEach(radio => {
            radio.classList.remove('selected');
        });
        let changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        changeEvent.value = value;
        this.element.dispatchEvent(changeEvent);
    }
}