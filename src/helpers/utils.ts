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

export const getDocStyleConfig = () => {
  return vscode.workspace.getConfiguration('docwriter').get('style') || 'Auto-detect';
};

export const getWidth = (offset: number) => {
  const rulers = vscode.workspace.getConfiguration('editor').get('rulers') as number[] | null;
  const maxWidth = rulers != null && rulers.length > 0 ? rulers[0] : 100;
  const width = maxWidth - offset;
  return width;
};