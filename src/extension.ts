import * as vscode from 'vscode';
import axios from 'axios';
import { getHighlightedText } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';
import { DOCS_WRITE, FEEDBACK } from './helpers/api';
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

		const { selection, highlighted } = getHighlightedText(editor);
		if (!highlighted) {
			vscode.window.showErrorMessage('Please select code and enter ⌘. again');
			return;
		}

		const { languageId, getText } = editor.document;

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				try {
					const docStyle = vscode.workspace.getConfiguration('docwriter').get('style');
					const rulers = vscode.workspace.getConfiguration('editor').get('rulers') as number[] | null;
					const maxWidth = rulers != null && rulers.length > 0 ? rulers[0] : 100;
					const width = maxWidth - selection.start.character;
					const { data: { docstring, position, shouldShowFeedback, feedbackId } } = await axios.post(DOCS_WRITE,
						{
							code: highlighted,
							languageId,
							commented: true,
							userId: vscode.env.machineId,
							docStyle,
							source: 'vscode',
							context: getText(),
							width
						});

					if (position === 'belowStartLine') {
						const start = selection.start.line;
						const startLine = editor.document.lineAt(start);

						const tabbedDocstring = docstring.split('\n').map((line: string) => `\t${line}`).join('\n');
						const snippet = new vscode.SnippetString(`\n${tabbedDocstring}`);
						editor.insertSnippet(snippet, startLine.range.end);
					} else if (position === 'above') {
						const snippet = new vscode.SnippetString(`${docstring}\n`);
						editor.insertSnippet(snippet, selection.start);
					}

					resolve('Completed generating');
					removeProgressColor();
					
					if (shouldShowFeedback) {
						const feedback = await vscode.window.showInformationMessage('Are the results useful?', '👍 Yes', '👎 No');
						if (feedback == null) {
							return null;
						}
						axios.post(FEEDBACK, {
							id: feedbackId,
							feedback: feedback === '👍 Yes' ? 1 : -1,
						});
					}
				} catch {
					vscode.window.showErrorMessage('Error occurred while generating docs');
					resolve('Error');
					removeProgressColor();
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
