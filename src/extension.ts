import * as vscode from 'vscode';
import axios from 'axios';
import { getHighlightedText, getInsertPosition, addComments } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "docs" is now active!');

	const disposable = vscode.commands.registerCommand('docs.write', async () => {

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, reject) => {
				changeProgressColor();
				const editor = vscode.window.activeTextEditor;
	
				if (editor == null) {
					removeProgressColor();
					return resolve('No code selected');
				}
	
				const highlightedText = getHighlightedText(editor);
				const { data: docstring } = await axios.post('http://localhost:5000/docs/generate/function', { code: highlightedText });
				const docstringWithComments = addComments(docstring, editor.document.fileName);
				const snippet = new vscode.SnippetString(`${docstringWithComments}\n`);
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
