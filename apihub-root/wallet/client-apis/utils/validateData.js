export function validateData(schema, data) {
    if (schema.type === "object" && typeof data !== "object") {
        return { status: "false", errorMessage: "Data must be an object." };
    }

    if (schema.required) {
        for (const property of schema.required) {
            if (!(property in data)) {
                return { status: "false", errorMessage: `Missing required property: ${property}` };
            }
        }
    }

    for (const property in schema.properties) {
        const prop = schema.properties[property];
        const value = data[property];

        const validationResponse = validateType(prop, value);
        if (validationResponse.status === "false") {
            return { status: "false", errorMessage: `Property ${property}: ${validationResponse.errorMessage}` };
        }

        if (prop.type === "object") {
            const nestedValidationResult = validateData(prop, value);
            if (nestedValidationResult.status === "false") {
                return nestedValidationResult;
            }
        }

        if (prop.type === "array") {
            if (!Array.isArray(value)) {
                return { status: "false", errorMessage: `Property ${property} must be an array.` };
            }
            for (let i = 0; i < value.length; i++) {
                const itemValidationResult = validateData(prop.items, value[i]);
                if (itemValidationResult.status === "false") {
                    return { status: "false", errorMessage: `Item ${i} in array ${property}: ${itemValidationResult.errorMessage}` };
                }
            }
        }
    }

    return { status: "true", errorMessage: "" };
}

function validateType(prop, value) {
    if (prop.type === "string") {
        if (typeof value !== "string") return { status: "false", errorMessage: "must be a string" };
        if (prop.minLength !== undefined && value.length < prop.minLength) return { status: "false", errorMessage: `must have at least ${prop.minLength} characters` };
        if (prop.maxLength !== undefined && value.length > prop.maxLength) return { status: "false", errorMessage: `must have no more than ${prop.maxLength} characters` };
        if (prop.pattern !== undefined && !new RegExp(prop.pattern).test(value)) return { status: "false", errorMessage: "does not match the required format" };
    } else if (prop.type === "number") {
        if (typeof value !== "number") return { status: "false", errorMessage: "must be a number" };
        if (prop.minimum !== undefined && value < prop.minimum) return { status: "false", errorMessage: `must be at least ${prop.minimum}` };
        if (prop.maximum !== undefined && value > prop.maximum) return { status: "false", errorMessage: `must be no more than ${prop.maximum}` };
    } else if (prop.type === "boolean") {
        if (typeof value !== "boolean") return { status: "false", errorMessage: "must be a boolean" };
    } else if (prop.type === "object") {
        if (typeof value !== "object" || Array.isArray(value) || value === null) return { status: "false", errorMessage: "must be an object" };
    } else if (prop.type === "array") {
        if (!Array.isArray(value)) return { status: "false", errorMessage: "must be an array" };
    }

    return { status: "true" };
}
