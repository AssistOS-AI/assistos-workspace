function validateData(schema, data) {
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

function validateProperty(schema, data) {
    if (Array.isArray(schema.type)) {
        const typeValidationResult = validateTypeArray(schema.type, data);
        if (!typeValidationResult.status) return typeValidationResult;
    } else if (!matchesType(schema.type, data)) {
        return { status: false, errorMessage: `Type mismatch. Expected ${schema.type}.` };
    }

    if (schema.type === "object" && typeof data === 'object') {
        return validateData(schema, data);
    } else if (schema.type === "array" && Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const itemValidationResult = validateData(schema.items, data[i]);
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
module.exports=validateData