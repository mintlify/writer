import * as vscode from 'vscode';

export const changeProgressColor = () => {
	const workbenchConfig = vscode.workspace.getConfiguration('workbench');
	const currentColorScheme = workbenchConfig.get('colorCustomizations') as any;
	const mintlifyColorScheme = {
		"[*Dark*]": {
      "progressBar.background": "#DCA821",
      "notificationsInfoIcon.foreground": "#DCA821",
			"editor.selectionBackground": "#DCA82133"
    },
    "[*Light*]": {
			"progressBar.background": "#DCA821",
      "notificationsInfoIcon.foreground": "#DCA821",
			"editor.selectionBackground": "#DCA82133"
    }
	};
	workbenchConfig.update('colorCustomizations', {...currentColorScheme, ...mintlifyColorScheme}, true);
};

export const removeProgressColor = () => {
	const workbenchConfig = vscode.workspace.getConfiguration('workbench');
	const currentColorScheme = workbenchConfig.get('colorCustomizations') as any;
	const { ['[*Dark*]']: defaultDark, ['[*Light*]']: defaultLight, ...removedScheme } = currentColorScheme;
	workbenchConfig.update('colorCustomizations', removedScheme, true);
};

export const configUserSettings = () => {
	const httpConfig = vscode.workspace.getConfiguration('http');
	httpConfig.update('systemCertificates', false, true);

	// Remove color scheme in case left over
	removeProgressColor();
};