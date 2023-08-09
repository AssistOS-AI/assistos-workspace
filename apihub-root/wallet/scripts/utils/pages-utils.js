function getTableLLMRow(llm) {
    return `<llm-item-renderer data-primary-key="${llm.primaryKey}" data-name="${llm.name}"
    data-key="${llm.key}" data-url="${llm.url}"></llm-item-renderer>`
}

export function llmsListRenderer() {
    let llmsArray = "";
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            for (let i = 0; i < data.llms.length; i++) {
                const obj = data.llms[i];
                llmsArray += getTableLLMRow(obj);
            }
            let listContent = document.querySelector("div.llm-list");
            listContent.innerHTML = llmsArray;
        });
}

// function getTableLLMRow(llm) {
//     return `<llm-item-renderer data-primary-key="${llm.primaryKey}" data-name="${llm.name}"
//     data-key="${llm.key}" data-url="${llm.url}"></llm-item-renderer>`
// }
//
// function llmsListRenderer() {
//     let llmsArray = "";
//     fetch('./data.json')
//         .then(response => response.json())
//         .then(data => {
//             for (let i = 0; i < data.llms.length; i++) {
//                 const obj = data.llms[i];
//                 llmsArray += getTableLLMRow(obj);
//             }
//             let listContent = document.querySelector("div.llm-list");
//             // listContent.innerHTML = llmsArray;
//             return llmsArray;
//         });
//     return null;
// }

// function getLlmsPage() {
//     let toolPage = "";
//     let list = llmsListRenderer();
//     toolPage += `
//                    <page-template data-title="LLMS" data-show-modal="showAddLLMModal" data-adding-item="Add LLM" ></page-template>
//                   `;
//     return toolPage;
// }
//
// export function getPage(path) {
//     let parts = path.split("/");
//     let pageName;
//     if(parts[parts.length - 1] === null) {
//         pageName = parts[parts.length - 2];
//     } else {
//         pageName = parts[parts.length - 1];
//     }
//     switch(pageName) {
//         case "llms-page" : return getLlmsPage();
//     }
// }