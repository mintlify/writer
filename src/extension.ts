import * as vscode from 'vscode';
import axios from 'axios';
import { getHighlightedText, getInsertPosition } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';
import { DOCS_WRITE } from './helpers/api';

export function activate(context: vscode.ExtensionContext) {
	// All active events can be put herex
	const disposable = vscode.commands.registerCommand('docs.write', async () => {

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				changeProgressColor();
				const editor = vscode.window.activeTextEditor;
	
				if (editor == null) {
					removeProgressColor();
					return resolve('No code selected');
				}
	
				const highlightedText = getHighlightedText(editor);
				const { languageId } = editor.document;
				const { data: docstring } = await axios.post(DOCS_WRITE,
					{
						code: highlightedText,
						languageId,
						commented: true,
					});
				const snippet = new vscode.SnippetString(`${docstring}\n`);
				const insertPosition = getInsertPosition(editor);
				editor.insertSnippet(snippet, insertPosition);
				
				removeProgressColor();
				return resolve('Completed');
			});

			const timeout = new Promise((resolve, _) => {
				setTimeout(() => {
					resolve('Timeout');
				}, 8000);
			});

			const firstToFinish = await Promise.race([docsPromise, timeout]);
			console.log(firstToFinish);
			if (firstToFinish === 'Timeout') {
				vscode.window.showErrorMessage('Error: Generating documentation timed out');
			}
			resolve('Either time out or completed');
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
