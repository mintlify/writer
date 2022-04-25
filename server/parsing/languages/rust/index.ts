import { TreeNode, PL, Synopsis, FunctionSynopsis, Param, TypedefSynopsis } from 'parsing/types';
import { Progress } from 'routes/writer/progress';
import {
    checkNodeByKind,
    findChildByKind,
    getFirstNodeByKind,
    getNodeByPath,
    getValueOfChildByKind,
    returnSynopsisIfNotNull,
    findKindWithinRange,
} from '../helpers';

const RUST_SYNOPSIS = {
    FUNCTION: {
        path: ['function_item'],
        excludes: ['source_file']
    },
    STRUCT: {
        path: ['struct_item'],
        excludes: ['source_file']
    }
}

const getType = (tree: TreeNode): string => {
    return getValueOfChildByKind(tree, 'type_identifier', 'primitive_type', 'array_type', 'reference_type', 'generic_type');
}

const getFunctionSynopsis = (tree: TreeNode): FunctionSynopsis => {
    const functionNode = getNodeByPath(tree, RUST_SYNOPSIS.FUNCTION)
    if (functionNode == null) { return null; }
    const params: Param[] = findChildByKind(functionNode, 'parameters')?.children
        .filter((paramChild) => checkNodeByKind(paramChild, 'parameter'))
        .map((param) => {
            const type = getType(param);
            const name = getValueOfChildByKind(param, 'identifier');
            return {
                name,
                type,
                required: true
            }
        });
    const returnsType = getType(functionNode) || undefined;
    const returns = returnsType != null;
    return {
        kind: 'function',
        params,
        returns,
        returnsType
    };
};

const getTypedefSynopsis = (tree: TreeNode): TypedefSynopsis => {
    const typedefNode = getNodeByPath(tree, RUST_SYNOPSIS.STRUCT);
    if (typedefNode == null) { return null; }
    const fields = getFirstNodeByKind(typedefNode, 'field_declaration_list');
    if (fields == null) {
        return { kind: 'typedef' };
    }
    const properties = fields?.children
        .filter((fieldChild) => checkNodeByKind(fieldChild, 'field_declaration'))
        .map((field) => {
            const name = getValueOfChildByKind(field, 'field_identifier');
            const type = getType(field);
            return {
                name,
                type
            }
        });
    return {
        kind: 'typedef',
        properties
    }
}

export default class Rust implements PL {
    getSynopsis(tree: TreeNode): Synopsis {
        return returnSynopsisIfNotNull(
            getFunctionSynopsis(tree),
            getTypedefSynopsis(tree)
        );
    }
    getCode(fileTree: TreeNode, location: number): string {
        const desiredNode = findKindWithinRange(fileTree, location, ...RUST_SYNOPSIS.FUNCTION.path, ...RUST_SYNOPSIS.STRUCT.path);
        return desiredNode ? desiredNode.value : null;
    }
    getProgress(): Progress {
        return null;
    }
}
