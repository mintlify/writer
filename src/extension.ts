import * as vscode from 'vscode';
import axios from 'axios';
import { getHighlightedText, getInsertPosition } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';
import { DOCS_WRITE } from './helpers/api';
import { configUserSettings } from './helpers/ui';
import { OptionsProvider } from './options';

export function activate(context: vscode.ExtensionContext) {
	// All active events can be put herex
	configUserSettings();

	const createConfigTree = () => {
		const searchHistoryTree = new OptionsProvider();
		vscode.window.createTreeView('docsOptions', {
			treeDataProvider: searchHistoryTree
		});
	};

	const write = vscode.commands.registerCommand('docs.write', async () => {
		changeProgressColor();
		const editor = vscode.window.activeTextEditor;
		if (editor == null) {
			removeProgressColor();
			return;
		}

		const highlightedText = getHighlightedText(editor);
		if (!highlightedText) {
			vscode.window.showErrorMessage('Please select code and enter ⌘. again');
			return;
		}

		const { languageId } = editor.document;

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				try {
					const docStyle = vscode.workspace.getConfiguration('docwriter').get('style');
					const { data: docstring } = await axios.post(DOCS_WRITE,
						{
							code: highlightedText,
							languageId,
							commented: true,
							userId: vscode.env.machineId,
							docStyle
						});
					const snippet = new vscode.SnippetString(`${docstring}\n`);
					const insertPosition = getInsertPosition(editor);
					editor.insertSnippet(snippet, insertPosition);
					
					removeProgressColor();
					return resolve('Completed');
				} catch {
					vscode.window.showErrorMessage('Error occurred while generating docs');
					return resolve('Error');
				}
			});

			const timeout = new Promise((resolve, _) => {
				setTimeout(() => {
					resolve('Timeout');
				}, 15000);
			});

			const firstToFinish = await Promise.race([docsPromise, timeout]);
			if (firstToFinish === 'Timeout') {
				vscode.window.showErrorMessage('Error: Generating documentation timed out');
			}
			resolve('Either time out or completed');
		});
	});

	const updateStyleConfig = vscode.commands.registerCommand('docs.styleConfig', async (newStyle) => {
		if (!newStyle) {return;}
		await vscode.workspace.getConfiguration('docwriter').update('style', newStyle);
		createConfigTree();
	});

	createConfigTree();
	context.subscriptions.push(write, updateStyleConfig);
}

// this method is called when your extension is deactivated
export function deactivate() {}
