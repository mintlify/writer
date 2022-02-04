import { HoverProvider, Hover, window, ProviderResult, MarkdownString, Uri } from 'vscode';
import { KEYBINDING_DISPLAY } from '../constants';
import { getHighlightedText } from '../helpers/utils';

export default class LanguagesHoverProvider implements HoverProvider {
  provideHover(): ProviderResult<Hover> {
    return new Promise(async resolve => {
      const editor = window.activeTextEditor;
      if (editor == null) {return resolve(null);}
      
      const { highlighted } = getHighlightedText(editor);
      if (!highlighted) {return resolve(null);}

      const writeCommandUri = Uri.parse('command:docs.write');
      const showcaseDocstring = new MarkdownString(`[✍️ Generate docs (${KEYBINDING_DISPLAY})](${writeCommandUri})`, true);
      showcaseDocstring.supportHtml = true;
      showcaseDocstring.isTrusted = true;
      return resolve(new Hover([showcaseDocstring]));
    });
  }
}