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
  stripQuotes
} from '../helpers';

const CSHARP_SYNOPSIS = {
  FUNCTION: {
    path: ['local_function_statement'],
    excludes: ['compilation_unit', 'global_statement'],
  },
  CLASS: {
    path: ['class_declaration'],
    excludes: ['compilation_unit']
  }
}

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(tree, CSHARP_SYNOPSIS.FUNCTION);
  if (functionNode == null) return null;

  const paramatersList = findChildByKind(functionNode, 'parameter_list');
  const params: Param[] = paramatersList?.children
    .filter((paramChild) => checkNodeByKind(paramChild, 'parameter') && paramChild.value !== 'void')
    .map((paramNode) => {
      const type = findChildByKind(paramNode, 'predefined_type', 'array_type')?.value || undefined;
      const equalsValueClauseNode = findChildByKind(paramNode, 'equals_value_clause');
      const required = equalsValueClauseNode == null;
      const defaultValue = stripQuotes(findChildByKind(equalsValueClauseNode,
        'string_literal', 'integer_literal', 'element_binding_expression', 'boolean_literal')?.value) || undefined;

      return {
        name: getValueOfChildByKind(paramNode, 'identifier'),
        type,
        required,
        defaultValue
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
  const classNode = getNodeByPath(tree, CSHARP_SYNOPSIS.CLASS);
  const baseListNode = findChildByKind(classNode, 'base_list');
  const extendsIdentifier = findChildByKind(baseListNode, 'identifier')?.value || undefined;
  return classNode ? { kind: 'class', extends: extendsIdentifier } : null;
}

export default class CSharp implements PL {
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getClass(tree),
    );
  }
  getCode(fileTree: TreeNode, location: number): string | null {
    const func = findKindWithinRange(fileTree, location, 'local_function_statement');
    return func ? func.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}