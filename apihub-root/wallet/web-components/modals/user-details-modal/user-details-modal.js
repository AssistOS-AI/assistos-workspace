import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class userDetailsModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
       this.invalidate();
       this.element = element;
       this.args = [];
        Array.from(this.element.attributes).forEach(attribute => {
                this.args.push(attribute.value)
        });
       this.args.shift();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {

    }
    afterRender(){
        this.form = this.element.querySelector(".form-content");
        let inputs = JSON.parse(this.args[0]);
        for(let [key,value] of Object.entries(inputs)){
            switch (key){
                case "textarea":{
                    let textarea = ` 
                    <div class="form-item">
                      <label class="form-label" for="prompt">${value}</label>
                      <textarea name="prompt" data-id="prompt" id="prompt" maxlength="150"  placeholder="Please generate ... based on the following ...:"></textarea>
                   </div>`
                    this.form.insertAdjacentHTML("beforeend", textarea);
                    break;
                }
                case "number":{
                    let number = `
                    <div class="form-item">
                       <label class="form-label" for="nr">${value}</label>
                       <input type="number" name="nr" data-id="nr" id="nr" min="1" max="9" >
                    </div>`
                    this.form.insertAdjacentHTML("beforeend", number);
                    break;
                }
                case "select":{
                    let options = "";
                    let select = ""
                    if(value.options === "personalities"){
                        for(let personality of webSkel.currentUser.space.personalities){
                            options+=`<option value=${personality.id}>${personality.name}</option>`;
                        }
                        select = `
                        <div class="form-item">
                              <label for="personality" class="form-label">${value.label}</label> <br>
                              <select class="user-detail" name="personality" id="personality" data-id="personality">
                              <option value="" disabled selected hidden>Select personality</option>
                                  ${options}
                              </select>
                          </div>
                        `;
                    }
                    this.form.insertAdjacentHTML("beforeend", select);
                    break;
                }
            }
        }
        this.args.shift();
    }

    async execute(_target){
        let formInfo = await extractFormInformation(_target);
        let userDetails = {};
        for(let [key,value] of Object.entries(formInfo.data)){
            userDetails[key] = value;
        }
        let result = webSkel.getService("LlmsService").callFlow(...this.args, userDetails);
        closeModal(_target);
    }
}