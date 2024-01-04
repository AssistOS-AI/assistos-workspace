export function parseURL(){
    let url = window.location.hash.split('/');
    const documents = "documents", space = "#space", chatbots = "#chatbots-page";
    debugger;
    switch(url[2]) {
        case documents: {
            let documentId = url[3];
            let chapterId = url[5];
            let paragraphId = url[7];
            if(chapterId){
                return [documentId, chapterId, paragraphId];
            }else {
                return documentId;
            }
        }
        case space:{
            if(url[4] === "edit-personality-page"){
                return url[5];
            }
            break;
        }
        case chatbots:{
            return url[3];
        }
        default:{
            console.error("no parameters for this url");
        }
    }
}