import { PL, TreeNode, Synopsis, FunctionSynopsis, Param, ClassSynopsis } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import { 
  checkNodeByKind,
  findChildByKind,
  findIfKindExistsInTree,
  getFirstNodeByValue,
  getNodeByPath,
  getNodeByPathOptions,
  getValueOfChildByKind,
  returnSynopsisIfNotNull,
  stripQuotes,
  findKindWithinRange, 
  getProgressHelper
} from '../helpers';

const JAVASCRIPT_SYNOPSIS = {
  ARROW_FUNCTION: {
    path: ['lexical_declaration', 'variable_declarator', 'arrow_function'],
    excludes: ['program', 'export_statement']
  },
  VAR_FUNCTION: {
    path: ['lexical_declaration', 'variable_declarator', 'function'],
    excludes: ['program', 'export_statement']
  },
  FUNCTION_EXPRESSION: {
    path: ['function_declaration'],
    excludes: ['program', 'export_statement']
  },
  METHOD: {
    path: ['method_definition'],
    excludes: ['program'],
  },
  TYPEDEF: {
    path: ['type_alias_declaration'],
    excludes: ['program', 'export_statement']
  },
  CLASS: {
    path: ['class_declaration'],
    excludes: ['program', 'export_statement']
  }
}

const ALL_DESIRED_TYPES = ['lexical_declaration', 'variable_declarator', 'arrow_function', 
  'function_declaration', 'method_definition', 'type_alias_declaration', 'class_declaration'];

const getFunctionSynopsis = (functionNode?: TreeNode): FunctionSynopsis | null => {
  if (functionNode == null) return null;
  const formalParameters = findChildByKind(functionNode, 'formal_parameters');
  const params: Param[] = formalParameters?.children
    .filter((paramNode) => checkNodeByKind(paramNode, 'identifier', 'assignment_pattern', 'rest_pattern'))
    .map((paramNode) => {
      let name = undefined;
      let required = undefined;
      let defaultValue = undefined;
      if (paramNode.kind === 'identifier') {
        name = paramNode.value;
        required = true;
      } else if (paramNode.kind === 'assignment_pattern') {
        name = getValueOfChildByKind(paramNode, 'identifier');
        required = false;
        defaultValue = stripQuotes(getValueOfChildByKind(paramNode, 'true', 'false', 'null', 'number', 'string'));
      } else if (paramNode.kind === 'rest_pattern') {
        name = getValueOfChildByKind(paramNode, 'identifier');
        required = true;
      }
      return {
        name,
        required,
        defaultValue
      }
    });
  
  const returns = Boolean(findIfKindExistsInTree(functionNode, 'return_statement',
    {
      rootRange: { start: functionNode.start, end: functionNode.end },
      excludesNotRoot: ['arrow_function', 'function_declaration']
    }
  ));
  
  return {
    kind: 'function',
    params,
    returns
  };
}

const getFunction = (tree: TreeNode): FunctionSynopsis | null => {
  const functionNode = getNodeByPathOptions(tree, [
    JAVASCRIPT_SYNOPSIS.ARROW_FUNCTION,
    JAVASCRIPT_SYNOPSIS.VAR_FUNCTION,
    JAVASCRIPT_SYNOPSIS.FUNCTION_EXPRESSION
  ]);
  return getFunctionSynopsis(functionNode);
}

const getMethod = (tree: TreeNode, fileTree: TreeNode): FunctionSynopsis | null => {
  const selection = tree.value;
  const foundNode = getFirstNodeByValue(fileTree, selection);
  const methodNode = getNodeByPath(foundNode, JAVASCRIPT_SYNOPSIS.METHOD);
  return getFunctionSynopsis(methodNode);
}

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(tree, JAVASCRIPT_SYNOPSIS.CLASS);
  const heritage = findChildByKind(classNode, 'class_heritage');
  const extendsIdentifier = findChildByKind(heritage, 'identifier')?.value;
  return classNode ? { kind: 'class', extends: extendsIdentifier } : null;
}


export default class JavaScript implements PL {  
  getSynopsis(tree: TreeNode, fileTree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getMethod(tree, fileTree),
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