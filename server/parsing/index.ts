import { Synopsis, Program, TreeNode } from './types';
import getPL from 'parsing/languages';
import parser from '@mintlify/grove';

export const getTreeSitterProgram = (code: string, languageId: string): Program => {
  const parsed = parser(code, languageId);
  return parsed;
}

export const wrapWithPHPTags = (code: string) => {
  return '<?php \n' + code + '?>';
}

export const getSynopsis = (selection: string, languageId: string, file: string = selection): Synopsis => {
  try {
    const formattedSelection = formatCode(languageId, selection);
    const formattedFile = formatCode(languageId, file);
    const selectionTree = getTreeSitterProgram(formattedSelection, languageId);
    const fileTree = getTreeSitterProgram(formattedFile, languageId);
    const desiredPL = getPL(languageId);
    const synopsis = desiredPL.getSynopsis(selectionTree.root, fileTree.root);
    return synopsis;
  } catch {
    return { kind: 'unspecified' }
  }
}

const checkIfTreeHasError = (node: TreeNode): boolean | void => {
  if (node.is_error) {
    return true;
  }

  if (node.children) {
    for (const child of node.children) {
      return checkIfTreeHasError(child)
    }
  }
}

export const formatCode = (languageId: string, code: string): string => {
  let formattedCode = code;
  if (languageId === 'php' && formattedCode.substring(0,5) !== '<?php') {
    formattedCode = wrapWithPHPTags(formattedCode);
  }

  return formattedCode;
}

export const getCode = async (
    context: string,
    languageId: string, 
    location: number,
    line: string
  ): Promise<string> => {
  const program = await getTreeSitterProgram(context, languageId);
  const code = getPL(languageId).getCode(program.root, location) ?? line;
  const formattedLine = formatCode(languageId, line);
  const lineProgram = await getTreeSitterProgram(formattedLine, languageId);
  const hasError = Boolean(checkIfTreeHasError(lineProgram.root));

  if (code === line && hasError) {
    throw 'Select a complete line of code (or the first line of a function)'
  }
  return code;
}
