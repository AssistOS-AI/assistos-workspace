/**
 * Shared utility for indexing documents in SOLR
 */
const SOLR_DOCUMENT_INDEX_URL = 'http://localhost:3002/index/document';
const SOLR_DELETE_URL = 'http://localhost:3002/delete';

/**
 * Index a document in SOLR using a unified approach
 * @param {string} spaceId - The space ID
 * @param {string} documentId - The document ID
 * @param {string} operation - The operation type ('create', 'update', 'delete')
 * @param {string} sourceType - The source type ('document', 'chapter', 'paragraph')
 * @param {Function} getDocumentFn - Function to retrieve the document
 */
async function indexDocumentInSolr(spaceId, documentId, operation, sourceType, getDocumentFn) {
    console.log(`SOLR operation ${operation} has been triggered for document ${documentId} (${sourceType}).`);
    
    try {
        // For delete operations, use the delete endpoint
        if (operation === "delete") {
            await deleteFromSolr(documentId, spaceId);
            return;
        }
        
        // For create/update operations, get the complete document
        let document = null;
        try {
            document = await getDocumentFn(spaceId, documentId);
        } catch (err) {
            console.log(`No document available for indexing: ${err.message}`);
            return;
        }
        
        if (!document) {
            console.log(`Document ${documentId} not found for indexing.`);
            return;
        }
        
        // Add additional metadata for Solr
        const documentWithMetadata = {
            ...document,
            spaceId: spaceId,
            operation: operation
        };
        
        // Send complete document to Solr
        // await indexToSolr(documentWithMetadata);
        indexToSolr(documentWithMetadata).then(res => console.log(res)).catch(err => console.log(err));

    } catch (error) {
        console.error(`SOLR indexing error for ${operation} operation:`, error);
    }
}

/**
 * Index document to SOLR using the document endpoint
 * @param {Object} document - The complete document object with metadata
 */
async function indexToSolr(document) {
    try {
        const response = await fetch(SOLR_DOCUMENT_INDEX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(document)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SOLR indexing failed: ${response.status} - ${errorText}`);
        }
        
        console.log(`Document ${document.id} indexed successfully.`);
        return await response.json();
    } catch (err) {
        console.error(`SOLR indexing error: ${err.message}`);
        throw err;
    }
}

/**
 * Delete document from SOLR
 * @param {string} documentId - The document ID to delete
 * @param {string} spaceId - The space ID
 */
async function deleteFromSolr(documentId, spaceId) {
    try {
        const response = await fetch(SOLR_DELETE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                documentId, 
                spaceId 
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SOLR deletion failed: ${response.status} - ${errorText}`);
        }
        
        console.log(`Document ${documentId} deleted from SOLR.`);
        return await response.json();
    } catch (err) {
        console.error(`SOLR deletion error: ${err.message}`);
        throw err;
    }
}

module.exports = {
    indexDocumentInSolr
};