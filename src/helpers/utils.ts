import * as vscode from 'vscode';
import axios from 'axios';
import { WORKER_STATUS } from './api';

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

export const getCustomConfig = () => {
  return {
    template: vscode.workspace.getConfiguration('docwriter').get('customTemplate') || null,
    author: vscode.workspace.getConfiguration('docwriter').get('customTemplateAuthor') || null,
  };
};

export const getWidth = (offset: number) => {
  const rulers = vscode.workspace.getConfiguration('editor').get('rulers') as number[] | null;
  const maxWidth = rulers != null && rulers.length > 0 ? rulers[0] : 100;
  const width = maxWidth - offset;
  return width;
};

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const checkWorkerStatus = async (id: string): Promise<any> => {
  const status = await axios.get(WORKER_STATUS(id));
  return status.data;
};

export const monitorWorkerStatus = async (id: string) => {
  let workerStatus = null;
  let millisecondsPassed = 0;
  const intervalMs = 100;

  while (workerStatus == null && millisecondsPassed < 25000) {
    const status = await checkWorkerStatus(id);
    if (status.state === 'completed' && status.data) {
      workerStatus = status.data;
      break;
    }
    else if (status.state === 'failed') {
      throw new Error('Unable to generate documentation');
    }

    millisecondsPassed += intervalMs;
    await sleep(intervalMs);
  }

  return workerStatus;
};