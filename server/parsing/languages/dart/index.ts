import { ClassSynopsis, FunctionSynopsis, Param, PL, Synopsis, TreeNode } from 'parsing/types';
import { Progress } from 'routes/writer/progress';
import {
  returnSynopsisIfNotNull,
  getNodeByPath,
  findChildByKind,
  checkNodeByKind,
  getValueOfChildByKind,
  stripQuotes,
  findIfKindExistsInTree,
} from '../helpers';

const DART_SYNOPSIS = {
  FUNCTION_SIGNATURE: {
    path: ['function_signature'],
    excludes: ['program']
  },
  FUNCTION_BODY: {
    path: ['function_body'],
    excludes: ['program']
  },
  CLASS: {
    path: ['class_definition'],
    excludes: ['program']
  }
}

const extractParamFromFormatParamaeter = (paramNode: TreeNode, defaultValue?: string, isOptional = false): Param => {
  let type = findChildByKind(paramNode, 'type_identifier', 'function_type')?.value;
  const typeArguments = findChildByKind(paramNode, 'type_arguments')?.value;
  if (typeArguments) type += typeArguments;
  const name = getValueOfChildByKind(paramNode, 'identifier');
    return {
      name,
      type,
      required: !isOptional,
      defaultValue
    }
}

const getFunction = (tree?: TreeNode): FunctionSynopsis | null => {
  if (tree == null) return null;

  const functionSignatureNode = getNodeByPath(tree, DART_SYNOPSIS.FUNCTION_SIGNATURE);
  const functionBodyNode = getNodeByPath(tree, DART_SYNOPSIS.FUNCTION_BODY);

  if (functionSignatureNode == null || functionBodyNode == null) return null;

  const paramsList = findChildByKind(functionSignatureNode, 'formal_parameter_list');
  const params: Param[] = [];
  paramsList?.children
    .filter((paramNode) => checkNodeByKind(paramNode, 'formal_parameter', 'optional_formal_parameters'))
    .forEach((paramNode) => {
      if (paramNode.kind === 'optional_formal_parameters') {
        paramNode.children.forEach((parameterNode, i) => {
          if (parameterNode.kind === 'formal_parameter') {
            const nextParamNode = paramNode.children[i + 1];
            const afterNextParamNode = paramNode.children[i + 2];
            const defaultValue = nextParamNode?.kind === '=' && afterNextParamNode?.value != null ? stripQuotes(afterNextParamNode.value) : undefined;
            params.push(extractParamFromFormatParamaeter(parameterNode, defaultValue, true));
          }
        });
        return;
      }

      params.push(extractParamFromFormatParamaeter(paramNode));
    });
  
  const returns = Boolean(findIfKindExistsInTree(functionBodyNode, 'return_statement',
    {
      rootRange: { start: functionBodyNode.start, end: functionBodyNode.end },
      excludesNotRoot: ['function_body']
    }
  ));

  return {
    kind: 'function',
    params,
    returns
  }
};

const getClass = (tree?: TreeNode): ClassSynopsis | null => {
  if (tree == null) return null;

  const classNode = getNodeByPath(tree, DART_SYNOPSIS.CLASS);
  if (classNode == null) return null;

  const superClassNode = findChildByKind(classNode, 'superclass');
  const extendsIdentifier = findChildByKind(superClassNode, 'type_identifier');

  return {
    kind: 'class',
    extends: extendsIdentifier?.value
  }
}

export default class Dart implements PL {
  getSynopsis(tree: TreeNode): Synopsis {
    return returnSynopsisIfNotNull(
      getFunction(tree),
      getClass(tree),
    );
  }
  getCode(): string {
    // Fix for function signatures and blocks handled separately
    return null;
  }
  getProgress(): Progress {
    return null;
  }
}