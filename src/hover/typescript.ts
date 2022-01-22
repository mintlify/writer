import axios from 'axios';
import { HoverProvider, TextDocument, Position, CancellationToken, Hover, window, env, ProviderResult, MarkdownString } from 'vscode';
import { getHighlightedText } from '../helpers/utils';
import { DOCS_WRITE } from '../helpers/api';

export default class TypescriptHoverProvider implements HoverProvider {
  provideHover(document: TextDocument): ProviderResult<Hover> {
    return new Promise(async resolve => {
      const editor = window.activeTextEditor;
      if (editor == null) {return resolve(null);}
      
      const { highlighted } = getHighlightedText(editor);
      if (!highlighted) {return resolve(null);}

      const { data: { docstring } } = await axios.post(DOCS_WRITE,
        {
          code: highlighted,
          languageId: editor.document.languageId,
          commented: false,
          userId: env.machineId,
          docStyle: 'Auto-detect',
          source: 'vscode',
          context: editor.document.getText(),
        });

      const markdownDocstring = new MarkdownString(`<img src="https://res.cloudinary.com/mintlify/image/upload/v1642834133/docwriter-smol_hg8sxd.png" height="24" />${docstring.replace(/\n/g, '<br>')}`);
      markdownDocstring.supportHtml = true;
      const footer = new MarkdownString('[$(pencil) Add as comments](https://google.com)&nbsp;&nbsp;|&nbsp;&nbsp;[$(file-code) Change format](https://google.com)', true);
      resolve(new Hover([markdownDocstring, footer]));
    });
  }
}