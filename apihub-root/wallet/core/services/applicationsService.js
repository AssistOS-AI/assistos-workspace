export class ApplicationsService {
    constructor() {}
    // Creates a new branch for the space in the application's repository and clones the application into the space's folder
    async installApplication(spaceId,applicationId) {
            let result;
            try {
                result = await fetch(`/space/${spaceId}/applications/${applicationId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json; charset=UTF-8"
                        }
                    });
            } catch (err) {
                console.error(err);
            }
            return await result.text();

    }
    // Deletes the application's folder from the space's folder and deletes the branch from the application's repository
    async uninstallApplication(spaceId,applicationId) {
        let result;
        try {
            result = await fetch(`/spaces/${spaceId}/applications/${applicationId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }


    // Sends a request to commit+push (update) changes to the space's branch for a specific flow
    async updateApplicationFlow(spaceId,applicationId, flowId, flowContent) {
        let result;
        try {
            result = await fetch(`/spaces/${spaceId}/applications/${applicationId}/flows/${flowId}`,
                {
                    method: "PUT",
                    body: flowContent,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    // Deletes the old application/branch and clones the new application/branch into the space's folder
    async resetApplication(){
            let result;
            try{
                result=await fetch(`/spaces/${spaceId}/applications/${applicationId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json; charset=UTF-8"
                        }
                    });
            }catch(err){
                console.error(err);
            }
            return await result.text();
    }
}
