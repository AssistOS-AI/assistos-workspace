export function getVarDefinitionCommand(varName, varType, command){
    let typeDefinition = "";
    if(varType){
        let upperCaseType = varType.charAt(0).toUpperCase() + varType.slice(1);
        typeDefinition = ` new ${upperCaseType}`;
        return `@${varName}${typeDefinition} ${command}`
    }
    return `@${varName} := ${command}`;
}