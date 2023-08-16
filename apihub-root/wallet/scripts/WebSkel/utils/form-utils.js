import { getClosestParentElement } from "./dom-utils.js";

export async function extractFormInformation(element) {
    const form = getClosestParentElement(element, "form, [data-form]");

    const formData = {
        data: {},
        elements: {},
        isValid: false,
    };

    if (typeof form.checkValidity === "function") {
        formData.isValid = form.checkValidity();
    }

    const namedElements = [...form.querySelectorAll("[name]:not([type=hidden])")];
    for (const element of namedElements) {
        const value = element.tagName === "CHECKBOX" ? element.checked : element.value;
        formData.data[element.name] = value;

        if(element.getAttribute("type")==="file")
        {
            formData.data[element.name] = await imageUpload(element.files[0]);
        }
        let isValid = false;
        if (typeof element.checkValidity === "function") {
            isValid = element.checkValidity();
        } else if (typeof element.getInputElement === "function") {
            const inputElement = await element.getInputElement();
            isValid = inputElement.checkValidity();
        }

        formData.elements[element.name] = {
            isValid,
            element,
        };
    }
    if(!form.checkValidity()) {
        form.reportValidity();
    }
    return formData;
}

async function imageUpload(file) {
    let base64String = "";
    let reader = new FileReader();

    return await new Promise((resolve,reject)=>{
        reader.onload = function () {
            base64String = reader.result;
            resolve(base64String);
        }
        reader.readAsDataURL(file);
    })
}

export function checkValidityFormInfo(formInfo) {
  if(!formInfo.isValid) {
      let entries=Object.entries(formInfo.elements)
      for(const entry of entries) {
         if(!entry[1].isValid) {
             let input=document.querySelector("#"+entry[1].element.getAttribute("data-id"));
             //console.log(input);

             input.classList.add("input-invalid");
         }
      }
      return false;
  }
  return true;
}