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

const wrapAround = (code: string, start: string, end: string, newLine?: boolean): string => {
  if (newLine) {
    return `${start}\n${code}\n${end}`;
  }

  return `${start} ${code} ${end}`;
};

const singleLine = (code: string, comment: string): string => {
  return code.split('\n').map((line) => `${comment} ${line}`).join('\n');
};

export const getFileExtension = (filename: string): string => {
  const fileExtensionRegex = /(?:\.([^.]+))?$/;
  const fileExtension = fileExtensionRegex.exec(filename);
  if (fileExtension == null || fileExtension.length === 0) {
    return '';
  }
  return fileExtension[1];
};

export const addComments = (code: string, filename: string): string => {
  const extension = getFileExtension(filename);

  if (!extension) {
    return code;
  }

  switch (`.${extension}`) {
  case '.html':
    return wrapAround(code, '<!--', '-->');
  case '.c':
  case '.cpp':
  case '.rs':
  case '.rlib':
  case '.js':
  case '.jsx':
  case '.ts':
  case '.tsx':
  case '.go':
  case '.css':
  case '.scss':
  case '.php':
  case '.kt':
  case '.kts':
  case '.ktm':
    return wrapAround(code, '/*', '*/', true);
  case '.hs':
    return wrapAround(code, '{-', '-}');
  case '.rb':
  case '.py':
  case '.r':
  case '.plx':
  case '.pl':
  case '.pm':
    return singleLine(code, '#');
  case '.erl':
  case '.hrl':
    return singleLine(code, '%');
  case '.java':
    return singleLine(code, '//');
  default:
    return code;
  }
};
