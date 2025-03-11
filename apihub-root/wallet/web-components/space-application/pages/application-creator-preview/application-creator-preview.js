
const getApplicationIndex = (spaceId,applicationId)=>{
    return `<iframe
        id="chatFrame"
        src="http://localhost:8080/iframes/chat?spaceId=7cPmfUgzxyA5M89W&personalityId=7gGRveu4G3BcjVuT"
        allowfullscreen
        style="width: 100%; height: 100%; border: none;"
        loading="lazy">
    </iframe>`
}

export class ApplicationCreatorPreview{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageName="Preview"
        this.invalidate();

    }

    async beforeRender(){
        this.spaceId =assistOS.space.id;
        this.applicationId = "ApplicationCreator"
        this.applicationIndex=getApplicationIndex(this.spaceId,this.applicationId)
    }

    async afterRender(){
        this.element.querySelector('#preview-content').innerHTML = this.applicationIndex;
    }
}
