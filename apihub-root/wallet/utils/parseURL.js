export function parseURL(){
    let url = window.location.hash.split('/');
    switch(url[2]) {
        case "personality": {
            return url[3];
        }
        case "applications":{
            return url[3]
        }
        default:{
            console.error("no parameters for this url");
        }
    }
}