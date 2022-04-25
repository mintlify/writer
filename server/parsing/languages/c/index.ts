import { TreeNode, PL, Synopsis, FunctionSynopsis, Param, TypedefSynopsis, Property } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import { findChildByKind,
  returnSynopsisIfNotNull,
  checkNodeByKind,
  getValueOfChildByKind,
  findIfKindExistsInTree,
  findKindWithinRange,
  getNodeByPath, 
  getProgressHelper,
  getFirstNodeByKind,
} from '../helpers';

const C_SYNOPSIS = {
  FUNCTION: {
    path: ['function_definition'],
    excludes: ['translation_unit'],
  },
  TYPEDEF: {
    path: ['type_definition'],
    excludes: ['translation_unit'],
  },
  STRUCT: {
    path: ['struct_specifier'],
    excludes: ['translation_unit'],
  }
}

const VALID_TYPES = ['primitive_type', 'type_identifier', 'sized_type_specifier'];

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(tree, C_SYNOPSIS.FUNCTION);
  if (functionNode == null) return null;

  const functionDeclaratorNode = getNodeByPath(functionNode, {
    path: ['function_declarator'],
    excludes: ['pointer_declarator'],
  });
  const paramatersList = findChildByKind(functionDeclaratorNode, 'parameter_list');
  const params: Param[] = paramatersList?.children
    .filter((paramChild) => checkNodeByKind(paramChild, 'parameter_declaration') && paramChild.value !== 'void')
    .map((paramNode) => {
      const type = getValueOfChildByKind(paramNode, ...VALID_TYPES) || undefined;
      // C does not support optional params
      const required = true;

      return {
        name: getFirstNodeByKind(paramNode, 'identifier')?.value || '',
        type,
        required,
      }
    });
  const returns = findIfKindExistsInTree(functionNode, 'return_statement') || undefined;
  return {
    kind: 'function',
    params,
    returns
  };
}

export const getTypedef = (tree: TreeNode): TypedefSynopsis | null => {
  const typedefNode = getNodeByPath(tree, C_SYNOPSIS.TYPEDEF);
  const structNode = getNodeByPath(tree, C_SYNOPSIS.STRUCT);
  if (typedefNode == null && structNode == null) return null;

  const structSpecifierNode = structNode || findChildByKind(typedefNode, 'struct_specifier');

  let properties: Property[] = [];
  if (structSpecifierNode != null) {
    const fieldDeclarations = findChildByKind(structSpecifierNode, 'field_declaration_list');
    properties = fieldDeclarations.children
      .filter((fieldNode) => checkNodeByKind(fieldNode, 'field_declaration'))
      .map((fieldNode) => {
        const type = getValueOfChildByKind(fieldNode, ...VALID_TYPES) || undefined;
        const name = getFirstNodeByKind(fieldNode, 'field_identifier')?.value || undefined;
        return {
          name,
          type,
        }
      })
  }

  return {
    kind: 'typedef',
    properties
  };
}

export default class C implements PL {
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getTypedef(tree),
    );
  }
  getCode(fileTree: TreeNode, location: number): string | null {
    const func = findKindWithinRange(fileTree, location, 'function_definition', 'type_definition', 'struct_specifier');
    return func ? func.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}