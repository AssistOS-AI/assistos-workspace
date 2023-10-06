import {closeModal} from "../../../../WebSkel/utils/modal-utils.js";
import {extractFormInformation} from "../../../imports.js";

export class addScriptModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    async addScript(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            let scriptData = {
                name:formInfo.data.name,
                id:webSkel.servicesRegistry.UtilsService.generateId(),
            }
            scriptData.content = `
             async ()=>{
             let prompt = "${formInfo.data.prompt}";
                  let response = await generateResponseLLM(prompt);
                  try{
                  ${formInfo.data.validateCode}
                  return response;
                  }catch(error){
                  await showApplicationError(error, error, error);
                  }   
              }
                 `;
            await webSkel.space.addScript(scriptData);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());


            closeModal(_target);
        }
    }
}