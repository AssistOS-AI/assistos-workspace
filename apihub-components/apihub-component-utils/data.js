function fillTemplate(templateObject, fillObject, depth = 0) {
    /* Todo: Implement a detection mechanism for circular dependencies instead of a hardcoded nested depth limit */

    if (depth > 10) {
        throw new Error("Depth Overreach. Possible Circular Dependency");
    }

    const containsPlaceholder = (templateObjectValueString) => {
        const placeholderPattern = /\$\$[a-zA-Z0-9_]+(\?)?/g;
        return placeholderPattern.test(templateObjectValueString);
    }

    if (typeof templateObject === 'string') {
        if (containsPlaceholder(templateObject)) {
            let resultString = "";
            let buffer = "";
            let placeholder = "";
            let i = 0;

            while (i < templateObject.length) {
                if (templateObject[i] === '$' && templateObject[i + 1] === '$') {
                    if (buffer.length > 0) {
                        resultString += buffer;
                        buffer = "";
                    }
                    i += 2;
                    while (i < templateObject.length &&
                    /[\w?]/.test(templateObject[i])) {
                        placeholder += templateObject[i];
                        i++;
                    }
                    const optionalPlaceholder = placeholder.endsWith('?');
                    const placeholderKey = optionalPlaceholder ? placeholder.slice(0, -1) : placeholder;
                    if (fillObject.hasOwnProperty(placeholderKey)) {
                        let placeholderValue = fillObject[placeholderKey];
                        let isFullReplacement = templateObject.trim() === `$$${placeholderKey}` || templateObject.trim() === `$$${placeholderKey}?`;

                        if (typeof placeholderValue === 'object') {
                            if (!Array.isArray(placeholderValue) && !isFullReplacement) {
                                resultString += JSON.stringify(placeholderValue);
                            } else if (Array.isArray(placeholderValue) && !isFullReplacement) {
                                resultString += JSON.stringify(placeholderValue);
                            } else {
                                return placeholderValue;
                            }
                        } else if (placeholderValue === undefined && optionalPlaceholder) {
                            resultString += "";
                        } else {
                            resultString += placeholderValue.toString();
                        }
                    } else if (!optionalPlaceholder) {
                        throw new Error(`Missing required fill data for "${placeholderKey}"`);
                    }
                    placeholder = "";
                } else {
                    buffer += templateObject[i];
                    i++;
                }
            }
            resultString += buffer;
            return resultString;
        } else {
            return templateObject;
        }
    } else if (Array.isArray(templateObject)) {
        return templateObject.reduce((acc, currentElement) => {
            const replacedElement = fillTemplate(currentElement, fillObject, depth + 1);
            if (replacedElement !== "") {
                acc.push(replacedElement);
            }
            return acc;
        }, []);

    } else if (typeof templateObject === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(templateObject)) {
            newObj[key] = fillTemplate(value, fillObject, depth + 1);
        }
        return newObj;
    }else{
        return templateObject;
    }
}

function validateObject(schema, data) {
    function validateProperty(schema, data) {
        if (Array.isArray(schema.type)) {
            const typeValidationResult = validateTypeArray(schema.type, data);
            if (!typeValidationResult.status) return typeValidationResult;
        } else if (!matchesType(schema.type, data)) {
            return { status: false, errorMessage: `Type mismatch. Expected ${schema.type}.` };
        }

        if (schema.type === "object" && typeof data === 'object') {
            return validateObject(schema, data);
        } else if (schema.type === "array" && Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                const itemValidationResult = validateObject(schema.items, data[i]);
                if (!itemValidationResult.status) {
                    return { status: false, errorMessage: `At index ${i}: ${itemValidationResult.errorMessage}` };
                }
            }
        } else {
            return validateType(schema, data);
        }

        return { status: true };
    }

    function matchesType(type, data) {
        if (type === "array") return Array.isArray(data);
        if (type === "object") return typeof data === "object" && data !== null && !Array.isArray(data);
        if (type === "null") return data === null;
        return typeof data === type || (type === 'number' && typeof data === 'number');
    }

    function validateTypeArray(types, data) {
        for (const type of types) {
            if (matchesType(type, data)) {
                return { status: true };
            }
        }
        return { status: false, errorMessage: `Type mismatch. Expected one of: ${types.join(", ")}.` };
    }

    function validateType(prop, value) {
        if (prop.type === "string") {
            if (typeof value !== "string") return { status: false, errorMessage: "must be a string" };
            if (prop.minLength !== undefined && value.length < prop.minLength) return { status: false, errorMessage: `must have at least ${prop.minLength} characters` };
            if (prop.maxLength !== undefined && value.length > prop.maxLength) return { status: false, errorMessage: `must have no more than ${prop.maxLength} characters` };
            if (prop.pattern !== undefined && !new RegExp(prop.pattern).test(value)) return { status: false, errorMessage: "does not match the required format" };
        } else if (prop.type === "number") {
            if (typeof value !== "number" || isNaN(value)) return { status: false, errorMessage: "must be a number" };
            if (prop.minimum !== undefined && value < prop.minimum) return { status: false, errorMessage: `must be at least ${prop.minimum}` };
            if (prop.maximum !== undefined && value > prop.maximum) return { status: false, errorMessage: `must be no more than ${prop.maximum}` };
        } else if (prop.type === "boolean") {
            if (typeof value !== "boolean") return { status: false, errorMessage: "must be a boolean" };
        } else if (prop.type === "object") {
            if (typeof value !== "object" || Array.isArray(value) || value === null) return { status: false, errorMessage: "must be an object" };
        } else if (prop.type === "array") {
            if (!Array.isArray(value)) return { status: false, errorMessage: "must be an array" };
        }
        return { status: true };
    }

    if (!matchesType(schema.type, data)) {
        return { status: false, errorMessage: `Type mismatch. Expected ${schema.type}.` };
    }

    if (schema.required) {
        for (const property of schema.required) {
            if (data === undefined || !(property in data)) {
                return { status: false, errorMessage: `Missing required property: ${property}` };
            }
        }
    }

    if (typeof data === 'object' && data !== null) {
        for (const property in schema.properties) {
            if (data.hasOwnProperty(property)) {
                const propSchema = schema.properties[property];
                const propData = data[property];
                const validationResult = validateProperty(propSchema, propData);
                if (!validationResult.status) {
                    return { status: false, errorMessage: `In property '${property}': ${validationResult.errorMessage}` };
                }
            }
        }
    }

    return { status: true, errorMessage: "" };
}


module.exports={
    fillTemplate,
    validateObject
}