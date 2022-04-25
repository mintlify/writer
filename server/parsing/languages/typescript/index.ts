import { Synopsis, PL, TreeNode, FunctionSynopsis, TypedefSynopsis, ClassSynopsis, Param } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';
import {
  checkNodeByKind,
  findChildByKind,
  findIfKindExistsInTree,
  getFirstNodeByValue,
  getNodeByPath,
  getValueOfChildByKind,
  returnSynopsisIfNotNull,
  stripQuotes,
  findKindWithinRange,
  getProgressHelper,
  getNodeByPathOptions,
} from '../helpers';

const TYPESCRIPT_SYNOPSIS = {
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

const getTypeNameFromAnnotation = (node: TreeNode | null): string | null => {
  const typeAnnotation = findChildByKind(node, 'type_annotation');
  return findChildByKind(typeAnnotation, 'predefined_type', 'type_identifier', 'union_type', 'array_type')?.value;
}

const getFunctionSynopsis = (functionNode?: TreeNode): FunctionSynopsis | null => {
  if (functionNode == null) return null;
  const formalParameters = findChildByKind(functionNode, 'formal_parameters');
  const params: Param[] = formalParameters?.children
    .filter((paramNode) => checkNodeByKind(paramNode, 'required_parameter', 'optional_parameter'))
    .map((paramNode) => {
      // Check if rest pattern
      const restPattern = findChildByKind(paramNode, 'rest_pattern');
      if (restPattern) {
        return {
          name: getValueOfChildByKind(restPattern, 'identifier'),
          type: getTypeNameFromAnnotation(paramNode),
          required: Boolean(checkNodeByKind(paramNode, 'required_parameter')),
        }
      }
      
      const defaultValue = stripQuotes(getValueOfChildByKind(paramNode, 'true', 'false', 'null', 'number', 'string'));
      return {
        name: getValueOfChildByKind(paramNode, 'identifier'),
        type: getTypeNameFromAnnotation(paramNode),
        required: Boolean(checkNodeByKind(paramNode, 'required_parameter')) && defaultValue == null,
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
  // Can be either function, method, arrow function, or constructor
  const functionNode = getNodeByPathOptions(tree, [
    TYPESCRIPT_SYNOPSIS.ARROW_FUNCTION,
    TYPESCRIPT_SYNOPSIS.VAR_FUNCTION,
    TYPESCRIPT_SYNOPSIS.FUNCTION_EXPRESSION
  ]);
  return getFunctionSynopsis(functionNode);
}

const getMethod = (tree: TreeNode, fileTree: TreeNode): FunctionSynopsis | null => {
  const selection = tree.value;
  const foundNode = getFirstNodeByValue(fileTree, selection);
  const methodNode = getNodeByPath(foundNode, TYPESCRIPT_SYNOPSIS.METHOD);

  return getFunctionSynopsis(methodNode);
}

const getTypedef = (tree: TreeNode): TypedefSynopsis | null => {
  const typedefNode = getNodeByPath(tree, TYPESCRIPT_SYNOPSIS.TYPEDEF);
  const formalParameters = findChildByKind(typedefNode, 'object_type');
  const properties = formalParameters?.children
    .filter((propertyNode) => propertyNode.kind === 'property_signature' || propertyNode.kind === 'index_signature')
    .map((propertyNode) => {
      if (propertyNode.kind === 'property_signature') {
        return {
          name: getValueOfChildByKind(propertyNode, 'property_identifier'),
          type: getTypeNameFromAnnotation(propertyNode),
        }
      } else if (propertyNode.kind === 'index_signature') {
        return {
          name: `[${getValueOfChildByKind(propertyNode, 'identifier')}: ${getTypeNameFromAnnotation(propertyNode)}]`,
          type: getTypeNameFromAnnotation(propertyNode),
        }
      }

      return null;
  })
  // Handled in case logic leak
  .filter((propertyNode) => propertyNode != null);

  return typedefNode ? { kind: 'typedef', properties } : null;
}

const getClass = (tree: TreeNode): ClassSynopsis | null => {
  const classNode = getNodeByPath(tree, TYPESCRIPT_SYNOPSIS.CLASS);
  const heritage = findChildByKind(classNode, 'class_heritage');
  const heritageClause = findChildByKind(heritage, 'extends_clause', 'implements_clause');
  const extendsIdentifier = findChildByKind(heritageClause, 'identifier', 'type_identifier')?.value;

  return classNode ? { kind: 'class', extends: extendsIdentifier } : null;
}

export default class TypeScript implements PL {  
  getSynopsis(tree: TreeNode, fileTree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getMethod(tree, fileTree),
      getTypedef(tree),
      getClass(tree)
    );
  }
  getCode(fileTree: TreeNode, location: number): string | null {
    const desiredNode = findKindWithinRange(fileTree, location, ...ALL_DESIRED_TYPES);
    return desiredNode ? desiredNode.value : null;
  }
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress {
    return getProgressHelper(this, tree, types);
  }
}