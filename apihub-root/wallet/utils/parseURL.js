export function parseURL(){
    let url = window.location.hash.split('/');
    const documents = "#documents", space = "#space", chatbots = "#chatbots-page";
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
        case space:{
            if(url[2] === "edit-personality-page"){
                return url[3];
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