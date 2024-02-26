function createDefaultDocument(documentTitle,documentTopic){

    const {templateReplacer_$$,generateId}= require('../../data-utils/exporter.js')('templateReplacer_$$','generateId');
    const {DEFAULT_DOCUMENT_TEMPLATE}=require('../../data-constants/exporter.js')('space-constants');


    const documentId=generateId();

    return templateReplacer_$$(DEFAULT_DOCUMENT_TEMPLATE,
        {
            documentId:documentId,
            documentTitle:documentTitle,
            documentTopic:documentTopic
        })

}

module.exports=createDefaultDocument