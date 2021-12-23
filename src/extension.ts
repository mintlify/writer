import * as vscode from 'vscode';
import axios from 'axios';
import { getHighlightedText, getInsertPosition, addComments } from './helpers';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "docs" is now active!');

	const disposable = vscode.commands.registerCommand('docs.write', async () => {

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating docstring',
      cancellable: true,
    }, () => new Promise(async (resolve, reject) => {
			const editor = vscode.window.activeTextEditor;
			if (editor != null) {
				const highlightedText = getHighlightedText(editor);
				const { data: docstring } = await axios.post('http://localhost:5000/docs/generate/function', { code: highlightedText });
				const docstringWithComments = addComments(docstring, editor.document.fileName);
				const snippet = new vscode.SnippetString(`${docstringWithComments}\n`);
				const insertPosition = getInsertPosition(editor);
        editor.insertSnippet(snippet, insertPosition);
				resolve('Completed');
			} else {
				reject('No code selected');
			}
		}));
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
