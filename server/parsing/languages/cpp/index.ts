import { TreeNode, PL, Synopsis, FunctionSynopsis, Param, ClassSynopsis } from 'parsing/types';
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
  stripQuotes,
  findIfKindIsChild
} from '../helpers';
import { getTypedef } from '../c';

const CPP_SYNOPSIS = {
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
  },
  CLASS: {
    path: ['class_specifier'],
    excludes: ['translation_unit'],
  }
}

const VALID_TYPES = ['primitive_type', 'type_identifier', 'sized_type_specifier', 'template_type'];

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(tree, CPP_SYNOPSIS.FUNCTION);
  if (functionNode == null) return null;

  const functionDeclaratorNode = getNodeByPath(functionNode, {
    path: ['function_declarator'],
    excludes: ['pointer_declarator'],
  });
  const paramatersList = findChildByKind(functionDeclaratorNode, 'parameter_list');
  const params: Param[] = paramatersList?.children
    .filter((paramChild) => checkNodeByKind(paramChild, 'parameter_declaration', 'optional_parameter_declaration') && paramChild.value !== 'void')
    .map((paramNode) => {
      const type = findIfKindIsChild(paramNode, 'qualified_identifier')
        ? getValueOfChildByKind(findChildByKind(paramNode, 'qualified_identifier'), ...VALID_TYPES)
        : getValueOfChildByKind(paramNode, ...VALID_TYPES)
        
      const defaultValue = paramNode.kind === 'optional_parameter_declaration'
        ? stripQuotes(getValueOfChildByKind(paramNode, 'string_literal', 'number_literal', 'true', 'false'))
        : undefined;

      const required = defaultValue == null;

      return {
        name: getFirstNodeByKind(paramNode, 'identifier')?.value || '',
        type: type || undefined,
        defaultValue,
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

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(tree, CPP_SYNOPSIS.CLASS);
  if (classNode == null) return null;

  const baseClassClauseNode = findChildByKind(classNode, 'base_class_clause');
  const baseClassType = getValueOfChildByKind(baseClassClauseNode, 'type_identifier');

  return {
    kind: 'class',
    extends: baseClassType || undefined
  }
}

export default class CPP implements PL {
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      // Methods are treated same as functions
      getFunction(tree),
      getClass(tree),
      // Using from C parser
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