export class ValidationService{
    validateSchema(object, schema, schemaType){
        let failedFields = [];
        if(schema.type){
            this.parseSchema(object, schema, schemaType, failedFields);
        } else {
            this.parseSimpleSchema(object, schema);
        }
        if(failedFields.length > 0){
            schema.isValid = false;
            throw new Error(JSON.stringify(failedFields));
        }else {
            schema.isValid = true;
        }
    }

    parseSchema(object, schema, schemaType, failedFields){
        if(typeof object !== schema.type){
            if(Array.isArray(object))
            {
                if(schema.type !== "array"){
                    failedFields.push({field:object, type: "array", expectedType: schema.type});
                }
                for(let item of object){
                    this.parseSchema(item, schema.items, schemaType, failedFields);
                }
            } else {
                failedFields.push({field:object, type: typeof object, expectedType: schema.type});
            }
        }
        let properties = schema.properties;
        for(let key of Object.keys(properties)){
            if(schemaType === "output"){
                properties[key].required = true;
            }
            if(!object[key] && properties[key].required){
                failedFields.push({field:properties[key], type: typeof object[key], expectedType: properties[key].type});
            }
            if (object.hasOwnProperty(key) && properties[key].properties) {
                this.parseSchema(object[key], properties[key], schemaType, failedFields);
            }
        }
    }

    parseSimpleSchema(object, schema, failedFields){
        if(Array.isArray(schema)){
            if(!Array.isArray(object)){
                failedFields.push({field:object, type:typeof object, expectedType: "array"});
                return;
            }
            for(let item of object){
                this.parseSimpleSchema(item, schema[0], failedFields);
                if(typeof item !== schema[0]){
                    failedFields.push({field:item, type:typeof item, expectedType: schema[0]});
                }
            }
        }else {
            for(let key of Object.keys(schema)){
                if(typeof object[key] !== schema[key]){
                    failedFields.push({field:object[key], type:typeof object[key], expectedType: schema[key]});
                }
                this.parseSimpleSchema(object[key], schema[key], failedFields);
            }
        }
    }
}