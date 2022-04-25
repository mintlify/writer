import { TreeNode, PL, Synopsis, FunctionSynopsis, Param, ClassSynopsis } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import { findChildByKind,
  returnSynopsisIfNotNull,
  checkNodeByKind,
  getValueOfChildByKind,
  findIfKindExistsInTree,
  findIfKindIsChild,
  findKindWithinRange,
  getFirstNodeByValue,
  getNodeByPath, 
  getProgressHelper,
  findChildAfterByKind,
} from '../helpers';

const PHP_SYNOPSIS = {
  FUNCTION: {
    path: ['function_definition'],
    excludes: ['program'],
  },
  CLASS: {
    path: ['class_declaration'],
    excludes: ['program']
  },
  METHOD: {
    path: ['method_declaration'],
    excludes: ['program'],
  }
}

const getParamType = (paramNode : TreeNode): string | null => {
  const type = findChildByKind(paramNode, 'type_list');
  if (type == null) return null;

  const namedType = getValueOfChildByKind(type, 'named_type');
  const primitiveType = getValueOfChildByKind(type, 'primitive_type');
  return namedType !== '' ? namedType : primitiveType;
}

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(tree, PHP_SYNOPSIS.FUNCTION);
  return getFunctionSynopsis(functionNode);
}

const getFunctionSynopsis = (functionNode?: TreeNode): FunctionSynopsis | null => {
  if (functionNode == null) return null;

  const formalParameters = findChildByKind(functionNode, 'formal_parameters');
  const params: Param[] = formalParameters?.children
    .filter((paramChild) => checkNodeByKind(paramChild, 'simple_parameter'))
    .map((paramNode) => {
      const type = getParamType(paramNode);
      const required = !(findIfKindIsChild(paramNode, '=')); // if a default value doesn't exist, it's required
      return {
        name: getValueOfChildByKind(findChildByKind(paramNode, 'variable_name'), 'name'),
        ...(type !== null && { type }),
         required
      };
    });
  const returns = findIfKindExistsInTree(functionNode, 'return_statement') || undefined;
  let returnsType = undefined;
  const nodeAfterParameters = findChildAfterByKind(functionNode, 'formal_parameters');
  if (nodeAfterParameters.kind === ':') {
    const nodeAfterColon = findChildAfterByKind(functionNode, ':');
    if (nodeAfterColon.kind === 'type_list') {
      returnsType = nodeAfterColon.value;
    }
  }
  return {
    kind: 'function',
    params,
    returns,
    returnsType
  };
}

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  if (tree == null) return null;
  const classNode = getNodeByPath(tree, PHP_SYNOPSIS.CLASS);
  return classNode ? { kind: 'class' } : null;
}

const getMethod = (tree: TreeNode, fileTree: TreeNode): FunctionSynopsis | null => {
  const selection = tree.value;
  const foundNode = getFirstNodeByValue(fileTree, selection);
  const methodNode = getNodeByPath(foundNode, PHP_SYNOPSIS.METHOD);

  return getFunctionSynopsis(methodNode);
}

export default class PHP implements PL {
  getSynopsis(tree: TreeNode, fileTree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getClass(tree),
      getMethod(tree, fileTree)
    );
  }
  getCode(fileTree: TreeNode, location: number): string | null {
    const func = findKindWithinRange(fileTree, location, 'function_definition', 'method_declaration');
    return func ? func.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}