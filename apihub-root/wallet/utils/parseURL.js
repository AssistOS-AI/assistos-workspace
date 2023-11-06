export function parseURL(){
    let url = window.location.hash;
    switch(url.split('/')[0]) {
        case "#documents": {
            let documentId = url.split('/')[1];
            let chapterId = url.split('/')[3];
            let paragraphId = url.split('/')[4];
            if(chapterId){
                return [documentId, chapterId, paragraphId];
            }else {
                return documentId;
            }

        }
        case "#space-page":{
            if(url.split("/")[1] === "edit-personality-page"){
                return url.split("/")[2];
            }
            break;
        }
    }
}