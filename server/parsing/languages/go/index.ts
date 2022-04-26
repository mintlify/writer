import { TreeNode, PL, Synopsis, FunctionSynopsis, TypedefSynopsis, Param, Property } from 'parsing/types';
import { Progress } from 'routes/writer/progress';
import {
    getNodeByPath,
    returnSynopsisIfNotNull,
    findKindWithinRange,
    findChildByKind,
    checkNodeByKind,
    getValueOfChildByKind,
    findAllChildsByKind,
    getFirstNodeByKind
} from '../helpers';

const GO_SYNOPSIS = {
    FUNCTION: {
        path: ['function_declaration'],
        excludes: ['source_file']
    },
    TYPEDEF: {
        path: ['type_declaration'],
        excludes: ['source_file']
    }
}

const getFunctionSynopsis = (functionNode: TreeNode): FunctionSynopsis => {
    if (functionNode == null) { return null; }

    const paramList = findChildByKind(functionNode, 'parameter_list')?.children
        .filter((paramChild) => checkNodeByKind(paramChild, 'parameter_declaration'));
    const params: Param[] = [];
    paramList.forEach((paramChild) => {
        const type = getValueOfChildByKind(paramChild, 'type_identifier', 'slice_type');
        const identifiers: TreeNode[] = findAllChildsByKind(paramChild, 'identifier');
        identifiers.forEach((identifier) => {
            params.push({
                name: identifier.value,
                required: true,
                type
            });
        });
    });
    const returnsType = getValueOfChildByKind(functionNode, 'type_identifier', 'slice_type') || undefined;
    const returns = returnsType != null;
    return { 
        kind: 'function',
        params,
        returns,
        returnsType
    };
}

const getFunction = (tree: TreeNode): FunctionSynopsis => {
    const functionNode = getNodeByPath(tree, GO_SYNOPSIS.FUNCTION);
    return getFunctionSynopsis(functionNode);
}

const getStructTypedef = (structNode: TreeNode): TypedefSynopsis => {
    const fields = getFirstNodeByKind(structNode, 'field_declaration_list');
    if (fields == null) {
        return { kind: 'typedef' };
    }
    const fieldDeclarations = fields?.children
        .filter((fieldChild) => checkNodeByKind(fieldChild, 'field_declaration'));
    
    const properties: Property[] = fieldDeclarations.map((field) => {
        const name = getValueOfChildByKind(field, 'field_identifier');
        const type = getValueOfChildByKind(field, 'type_identifier', 'slice_type');
        return {
            name,
            type
        }
    });
    return {
        kind: 'typedef',
        properties
    };
}

const getInterfaceTypedef = (interfaceNode: TreeNode): TypedefSynopsis => {
    const methods = getFirstNodeByKind(interfaceNode, 'method_spec_list');
    if (methods == null) {
        return { kind: 'typedef' };
    }
    const fieldDeclarations = methods?.children
        .filter((fieldChild) => checkNodeByKind(fieldChild, 'method_spec'));
    
    const properties: Property[] = fieldDeclarations.map((field) => {
        const name = getValueOfChildByKind(field, 'field_identifier');
        const type = getValueOfChildByKind(field, 'type_identifier', 'slice_type');
        return {
            name,
            type
        }
    });
    return {
        kind: 'typedef',
        properties
    };
}

const getTypedefSynopsis = (typedefNode: TreeNode): TypedefSynopsis => {
    if (typedefNode == null) { return null; }
    const structNode = getFirstNodeByKind(typedefNode, 'struct_type');
    if (structNode != null) {
        return getStructTypedef(structNode);
    }
    const interfaceNode = getFirstNodeByKind(typedefNode, 'interface_type');
    if (interfaceNode != null) {
        return getInterfaceTypedef(interfaceNode);
    }
    return { kind: 'typedef' };
    
}

const getTypedef = (tree: TreeNode): TypedefSynopsis => {
    const typedefNode = getNodeByPath(tree, GO_SYNOPSIS.TYPEDEF);
    return getTypedefSynopsis(typedefNode);
}

export default class Go implements PL {
    getSynopsis(tree: TreeNode): Synopsis {
        return returnSynopsisIfNotNull(
            getFunction(tree),
            getTypedef(tree)
        );   
    }
    getCode(fileTree: TreeNode, location: number): string {
        const desiredNode = findKindWithinRange(fileTree, location, ...GO_SYNOPSIS.FUNCTION.path, ...GO_SYNOPSIS.TYPEDEF.path)
        return desiredNode ? desiredNode.value : null;
    }
    getProgress(): Progress {
        return null;
    }
}