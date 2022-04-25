import { PL, TreeNode, Synopsis, FunctionSynopsis, Param, ClassSynopsis, TypedefSynopsis, Property } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import { 
  findChildByKind,
  findIfKindExistsInTree,
  getNodeByPath,
  returnSynopsisIfNotNull,
  findKindWithinRange, 
  findAllChildsByKind,
  getProgressHelper,
} from '../helpers';

const KOTLIN_SYNOPSIS = {
  FUNCTION_EXPRESSION: {
    path: ['function_declaration'],
    excludes: ['source_file', 'infix_expression', 'prefix_expression']
  },
  CLASS: {
    path: ['class_declaration'],
    excludes: ['source_file']
  },
  DATA_CLASS: {
    path: ['class_declaration', 'modifiers', 'class_modifier', 'data'],
    excludes: ['source_file']
  }
}

const ALL_DESIRED_TYPES = ['function_declaration', 'class_declaration'];

const getFunctionSynopsis = (functionNode?: TreeNode): FunctionSynopsis | null => {
  if (functionNode == null) return null;
  const formalParameters = findAllChildsByKind(functionNode, 'parameter');
  const params: Param[] = formalParameters?.map((paramNode) => {
      const name = findChildByKind(paramNode, 'simple_identifier')?.value;
      const required = findChildByKind(paramNode, 'nullable_type') == null;
      const type = findChildByKind(paramNode, 'user_type', 'nullable_type')?.value;
      // TODO: Add default value
      return {
        name,
        required,
        type,
      }
    });
  
  const returns = Boolean(findIfKindExistsInTree(functionNode, 'return',
    {
      rootRange: { start: functionNode.start, end: functionNode.end },
      excludesNotRoot: ['function_declaration']
    }
  ));
  
  return {
    kind: 'function',
    params,
    returns
  };
}

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPath(tree, KOTLIN_SYNOPSIS.FUNCTION_EXPRESSION);
  return getFunctionSynopsis(functionNode);
}

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(tree, KOTLIN_SYNOPSIS.CLASS);
  const delegationSpecifier = findChildByKind(classNode, 'delegation_specifier');
  const constructorNode = findChildByKind(delegationSpecifier, 'constructor_invocation');
  const extendsIdentifier = constructorNode
    ? findChildByKind(constructorNode, 'user_type')?.value
    : delegationSpecifier?.value;
  return classNode ? { kind: 'class', extends: extendsIdentifier } : null;
}

const getTypedef = (tree: TreeNode): TypedefSynopsis | null => {
  const classNode = getNodeByPath(tree, KOTLIN_SYNOPSIS.CLASS);
  const classWithDataModifierNode = getNodeByPath(tree, KOTLIN_SYNOPSIS.DATA_CLASS);
  const primaryConstructorNode = findChildByKind(classNode, 'primary_constructor');

  const propertiesNode = findAllChildsByKind(primaryConstructorNode, 'class_parameter');
  const properties: Property[] = propertiesNode?.map((propertyNode) => {
    const name = findChildByKind(propertyNode, 'simple_identifier')?.value;
    const type = findChildByKind(propertyNode, 'user_type', 'nullable_type')?.value;
    return {
      name,
      type,
    }
  })

  return classWithDataModifierNode ? { kind: 'typedef', properties } : null;
}


export default class Kotlin implements PL {  
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      // Typedef in front as it is similar to class but more explicit
      getTypedef(tree),
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