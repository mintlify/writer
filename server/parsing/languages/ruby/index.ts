import { PL, TreeNode, Synopsis, FunctionSynopsis, Param, ClassSynopsis } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import { 
  findChildByKind,
  findIfKindExistsInTree,
  getNodeByPath,
  returnSynopsisIfNotNull,
  findKindWithinRange,
  getProgressHelper,
  findChildAfterByKind,
  stripQuotes,
} from '../helpers';

const RUBY_SYNOPSIS = {
  METHOD: {
    path: ['method'],
    excludes: ['program']
  },
  CLASS: {
    path: ['class'],
    excludes: ['program']
  }
}

const ALL_DESIRED_TYPES = ['method', 'class'];

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const methodNode = getNodeByPath(tree, RUBY_SYNOPSIS.METHOD);
  if (methodNode == null) return null;

  const parametersNode = findChildByKind(methodNode, 'method_parameters');
  const params: Param[] = [];
  parametersNode?.children?.forEach((paramNode) => {
    if (paramNode.kind === 'identifier') {
      const name = paramNode.value;
      params.push({
        name,
        required: true,
      })
    }

    else if (paramNode.kind === 'splat_parameter') {
      const name = paramNode.value;
      params.push({
        name,
        required: false,
      })
    }

    else if (paramNode.kind === 'optional_parameter') {
      const name = findChildByKind(paramNode, 'identifier')?.value;
      const nodeAfterName = findChildAfterByKind(paramNode, 'identifier');
      let defaultValue;
      if (nodeAfterName?.kind === '=') {
        defaultValue = stripQuotes(findChildAfterByKind(paramNode, '=')?.value);
      }
      params.push({
        name,
        required: false,
        defaultValue
      })
    }
  });

  const returns = Boolean(
    findIfKindExistsInTree(
      methodNode,
      'return',
      { rootRange: { start: methodNode.start, end: methodNode.end }, excludesNotRoot: ['method'] }
    )
  );

  return {
    kind: 'function',
    params,
    returns
  };
}

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(tree, RUBY_SYNOPSIS.CLASS);
  if (classNode == null) return null;

  const superClassNode = findChildByKind(classNode, 'superclass');
  const constantNode = findChildByKind(superClassNode, 'constant');
  
  return {
    kind: 'class',
    extends: constantNode?.value
  };
}

export default class Ruby implements PL {  
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getClass(tree)
    )
  }
  getCode(fileTree: TreeNode, location: number): string | null {
      const desiredNode = findKindWithinRange(fileTree, location, ...ALL_DESIRED_TYPES);
      return desiredNode ? desiredNode.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}