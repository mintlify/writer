import { FunctionSynopsis, PL, Synopsis, TreeNode, Param, ClassSynopsis } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import {
  returnSynopsisIfNotNull,
  findChildByKind,
  checkNodeByKind,
  getValueOfChildByKind,
  getFirstNodeByValue,
  getNodeByPath,
  findKindWithinRange,
  getProgressHelper,
} from '../helpers';

const JAVA_SYNOPSIS = {
  CLASS: {
    path: ['class_declaration'],
    excludes: ['program']
  }
}

const JAVA_TYPES = ['type_identifier', 'integral_type', 'array_type', 'boolean_type',
'floating_point_type', 'generic_type'];

const getMethodSynopsis = (tree ?: TreeNode): FunctionSynopsis | null => {
  if (tree == null) return null;

  const funcNode = checkNodeByKind(tree, 'method_declaration');
  if (!funcNode) return null;
  
  const formalParameters = findChildByKind(tree, 'formal_parameters');
  const params: Param[] = formalParameters.value === '(String[] args)' ? [] : formalParameters?.children
    .filter((paramChild) => checkNodeByKind(paramChild, 'formal_parameter'))
    .map((paramNode) => {
      const type = getValueOfChildByKind(paramNode, ...JAVA_TYPES);
      const name = getValueOfChildByKind(paramNode, 'identifier');
      return {
        name,
        type,
        required: true
      };
    });
  const returns = findChildByKind(tree, 'void_type') == null;
  
  return {
    kind: 'function',
    params,
    returns
  };
};

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  if (tree == null) return null;
  const classNode = getNodeByPath(tree, JAVA_SYNOPSIS.CLASS);
  return classNode ? { kind: 'class'} : null;
}

// All functions should be within a class in Java so we should always be looking for methods
// else it's an error.
const getMethodInClass = (tree: TreeNode, fileTree: TreeNode): FunctionSynopsis | null => {
  const selection = tree.value;
  const foundNode = getFirstNodeByValue(fileTree, selection);
  const methodNode = getNodeByPath(foundNode, {
    path: ['method_declaration'],
    excludes: ['program']
  });
  return getMethodSynopsis(methodNode);
}

export default class Java implements PL {
  getSynopsis(tree: TreeNode, fileTree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getMethodInClass(tree, fileTree),
      getClass(tree)
    );
  }
  getCode(fileTree: TreeNode, location: number): string {
    const desiredNode = findKindWithinRange(fileTree, location, 'method_declaration', 'class_declaration');
    return desiredNode ? desiredNode.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}