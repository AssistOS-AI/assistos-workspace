export function parseURL(){
    let url = window.location.hash.split('/');
    const documents = "#documents", personalities = "#personalities-page", chatbots = "#chatbots-page";
    switch(url[0]) {
        case documents: {
            let documentId = url[1];
            let chapterId = url[3];
            let paragraphId = url[4];
            if(chapterId){
                return [documentId, chapterId, paragraphId];
            }else {
                return documentId;
            }

        }
        case personalities:{
            if(url[1] === "edit-personality-page"){
                return url[2];
            }
            break;
        }
        case chatbots:{
            return url[1];
        }
        default:{
            console.error("no parameters for this url");
        }
    }
}