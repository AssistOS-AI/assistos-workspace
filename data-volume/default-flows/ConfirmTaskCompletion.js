class IFlow {
   constructor() {
      const schema = this.constructor.flowParametersSchema;
      const metadata = this.constructor.flowMetadata;

      if (!schema) {
         throw new Error("Flow inputParametersValidationSchema is required");
      }
      if (!metadata) {
         throw new Error("Flow metadata is required");
      } else {
         if (!metadata.intent) {
            throw new Error("Flow flowMetadata.intent is required");
         }
         if (!metadata.action) {
            throw new Error("Flow flowMetadata.action is required");
         }
      }
   }

   loadModule(moduleName) {
      return require("assistos").loadModule(moduleName, this.__securityContext);
   }

   validateParameters(flowParameters) {
      const schema = this.constructor.flowParametersSchema;
      for (let key in schema) {
         if (schema[key].required && !flowParameters[key]) {
            throw new Error(`Parameter ${key} is required`);
         }
      }
   }

   genericReject(promiseFnc, error) {
      promiseFnc.reject({
         success: false,
         message: error.message,
         statusCode: error.statusCode || 500
      });
   }

   resolve(promiseFnc, data) {
      promiseFnc.resolve({
         success: true,
         data: data
      });
   }

   reject(promiseFnc, error) {
      promiseFnc.reject({
         success: false,
         message: error.message,
         statusCode: error.statusCode || 500
      });
   }
}

class ConfirmTaskCompletion extends IFlow {
   static flowMetadata = {
      action: "Formulates a statement summarizing the completed task",
      intent: "Confirm task completion",
   };

   static flowParametersSchema = {};

   constructor() {
      super();
   }

   async userCode(apis, parameters) {
      try {
         let prompt = "Your task right now is to formulate a statement in which you confirm and sum up the task that you have completed. The statement should be clear and concise.";
         let agent = assistOS.space.getAgent();
         let llm = assistOS.space.getLLM();
         let response = await llm.chatbot(prompt, "", agent.getContext());
         apis.success(response);
      } catch (e) {
         apis.fail(e);
      }
   }

   async execute(parameters) {
      return new Promise(async (resolve, reject) => {
         const apis = {
            success: (data) => this.resolve({ resolve }, data),
            fail: (error) => this.reject({ reject }, error),
            loadModule: (moduleName) => this.loadModule(moduleName, this.__securityContext)
         };
         try {
            this.validateParameters(parameters);
            await this.userCode(apis, parameters);
         } catch (error) {
            this.genericReject(reject, error);
         }
      });
   }
}

module.exports = ConfirmTaskCompletion;
