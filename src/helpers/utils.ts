import * as vscode from 'vscode';

export const getHighlightedText = (editor: vscode.TextEditor): string => {
  const highlightRange = new vscode.Range(editor.selection.start, editor.selection.end);
  const highlightedText = editor.document.getText(highlightRange);
  return highlightedText;
};

export const getInsertPosition = (editor: vscode.TextEditor): vscode.Position => {
  const firstLine = editor.document.lineAt(editor.selection.start.line);
  const insertPosition = new vscode.Position(editor.selection.start.line, firstLine.firstNonWhitespaceCharacterIndex);
  return insertPosition;
};

export const getFileExtension = (filename: string): string => {
  const fileExtensionRegex = /(?:\.([^.]+))?$/;
  const fileExtension = fileExtensionRegex.exec(filename);
  if (fileExtension == null || fileExtension.length === 0) {
    return '';
  }
  return fileExtension[1];
};
