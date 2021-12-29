import * as vscode from 'vscode';

export const getHighlightedText = (editor: vscode.TextEditor) => {
  const { selection } = editor;
  const highlightRange = new vscode.Range(editor.selection.start, editor.selection.end);
  const highlighted = editor.document.getText(highlightRange);
  return { selection, highlighted };
};

export const getFileExtension = (filename: string): string => {
  const fileExtensionRegex = /(?:\.([^.]+))?$/;
  const fileExtension = fileExtensionRegex.exec(filename);
  if (fileExtension == null || fileExtension.length === 0) {
    return '';
  }
  return fileExtension[1];
};

export const wrapStr = (str: string, width: number) => str.replace(
  new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, 'g'), '$1\n'
);