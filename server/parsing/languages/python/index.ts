import { PL, TreeNode, Synopsis, FunctionSynopsis, ClassSynopsis } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import {
  findChildByKind,
  findIfKindExistsInTree,
  getNodeByPath,
  getValueOfChildByKind,
  returnSynopsisIfNotNull,
  stripQuotes,
  findKindWithinRange, 
  getProgressHelper,
} from '../helpers';

const PYTHON_SYNOPSIS = {
  FUNCTION: {
    path: ['function_definition'],
    excludes: ['module', 'decorated_definition']
  },
  CLASS: {
    path: ['class_definition'],
    excludes: ['module']
  }
}

const getFunction = (node: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(node, PYTHON_SYNOPSIS.FUNCTION);
  if (functionNode == null) return null;

  const params = findChildByKind(functionNode, 'parameters')?.children?.
    filter((paramNode) => (paramNode.kind === 'identifier' && paramNode.value !== 'self') || paramNode.kind === 'default_parameter'
      || paramNode.kind === 'typed_parameter' || paramNode.kind === 'typed_default_parameter')
    .map((paramNode) => {
      if (paramNode.kind === 'identifier') {
        return {
          name: paramNode.value,
          required: true,
        }
      }
      const name = getValueOfChildByKind(paramNode, 'identifier');
      const defaultValue = stripQuotes(getValueOfChildByKind(paramNode, 'string', 'integer', 'true', 'false'));
      const typeNode = findChildByKind(paramNode, 'type');
      const type = typeNode ? typeNode.value : undefined;
      return {
        name,
        defaultValue,
        type,
        required: defaultValue == null || defaultValue.length === 0
      }
    })

  const returns = Boolean(findIfKindExistsInTree(functionNode, 'return_statement',
    {
      rootRange: { start: functionNode.start, end: functionNode.end },
      excludesNotRoot: PYTHON_SYNOPSIS.FUNCTION.path
    }
  ));

  return {
    kind: 'function',
    params,
    returns,
  };
}

const getClass = (node: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(node, PYTHON_SYNOPSIS.CLASS);
  if (classNode == null) return null;

  const extendsArgument = findChildByKind(classNode, 'argument_list');
  const extendsClass = extendsArgument ? getValueOfChildByKind(extendsArgument, 'attribute', 'identifier') : null;

  return {
    kind: 'class',
    extends: extendsClass
  }
}


export default class Python implements PL {  
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getClass(tree),
    )
  }
  getCode(fileTree: TreeNode, location: number): string | null {
    const func = findKindWithinRange(fileTree, location, 'function_definition');
    return func ? func.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types, true);
  }
}