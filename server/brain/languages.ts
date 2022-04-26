import { getFileExtension } from 'parsing/helpers';

type LanguageIdContext = {
  name: string;
  extension: string;
}
type LanguageExtensionContext = {
  name: string;
  languageId: string;
}
type LanguageIdMap = {
  [key: string]: LanguageIdContext;
}
type LanguageExtensionMap = {
  [key: string]: LanguageExtensionContext;
}

const languagesIdMap: LanguageIdMap = {
  abap: {
    name: 'ABAP',
    extension: 'abap'
  },
  bat: {
    name: 'Windows Bat',
    extension: 'bat'
  },
  bibtex: {
    name: 'BibTeX',
    extension: 'bib'
  },
  clojure: {
    name: 'Clojure',
    extension: 'clj',
  },
  coffeescript: {
    name: 'Coffeescript',
    extension: 'coffee'
  },
  c: {
    name: 'C',
    extension: 'c'
  },
  cpp: {
    name: 'C++',
    extension: 'cpp'
  },
  csharp: {
    name: 'C#',
    extension: 'cs',
  },
  css: {
    name: 'CSS',
    extension: 'css',
  },
  diff: {
    name: 'Diff',
    extension: 'diff'
  },
  dockerfile: {
    name: 'Dockerfile',
    // No extension
    extension: 'Dockerfile'
  },
  fsharp: {
    name: 'F#',
    extension: 'fs'
  },
  'git-commit': {
    name: 'Git',
    extension: 'git'
  },
  'git-rebase': {
    name: 'Git',
    extension: 'git'
  },
  go: {
    name: 'Go',
    extension: 'go'
  },
  groovy: {
    name: 'Groovy',
    extension: 'groovy'
  },
  handlebars: {
    name: 'Handlebars',
    extension: 'handlebars'
  },
  haml: {
    name: 'Haml',
    extension: 'haml'
  },
  html: {
    name: 'HTML',
    extension: 'html'
  },
  ini: {
    name: 'Ini',
    extension: 'ini'
  },
  javascript: {
    name: 'JavaScript',
    extension: 'js'
  },
  javascriptreact: {
    name: 'JavaScript React',
    extension: 'jsx'
  },
  json: {
    name: 'JSON',
    extension: 'json'
  },
  jsonc: {
    name: 'JSON with Comments',
    extension: 'jsonc'
  },
  latex: {
    name: 'LaTeX',
    extension: 'tex'
  },
  less: {
    name: 'Less',
    extension: 'less'
  },
  lua: {
    name: 'Lua',
    extension: 'lua'
  },
  makefile: {
    name: 'Makefile',
    // No file extension
    extension: 'Makefile'
  },
  markdown: {
    name: 'Markdown',
    extension: 'md'
  },
  'objective-c': {
    name: 'Objective-C',
    extension: 'm'
  },
  'objective-cpp': {
    name: 'Object-C ++',
    extension: 'mm'
  },
  perl: {
    name: 'Perl',
    extension: 'pl'
  },
  php: {
    name: 'PHP',
    extension: 'php'
  },
  plaintext: {
    name: 'Plain Text',
    extension: 'txt'
  },
  powershell: {
    name: 'PowerShell',
    extension: 'ps1'
  },
  pug: {
    name: 'Pug',
    extension: 'pug'
  },
  jade: {
    name: 'Pug',
    extension: 'pug'
  },
  python: {
    name: 'Python',
    extension: 'py'
  },
  r: {
    name: 'R',
    extension: 'r'
  },
  razor: {
    name: 'Razor',
    extension: 'cshtml'
  },
  ruby: {
    name: 'Ruby',
    extension: 'rb'
  },
  rust: {
    name: 'Rust',
    extension: 'rs'
  },
  scss: {
    name: 'SCSS',
    extension: 'scss',
  },
  sass: {
    name: 'SASS',
    extension: 'sass'
  },
  shaderlab: {
    name: 'ShaderLab',
    extension: 'shader'
  },
  shellscript: {
    name: 'Shell Script',
    extension: 'sh'
  },
  slim: {
    name: 'Slim',
    extension: 'slim'
  },
  sql: {
    name: 'SQL',
    extension: 'sql'
  },
  stylus: {
    name: 'Stylus',
    extension: 'styl'
  },
  swift: {
    name: 'Swift',
    extension: 'swift'
  },
  typescript: {
    name: 'TypeScript',
    extension: 'ts'
  },
  typescriptreact: {
    name: 'TypeScript React',
    extension: 'tsx'
  },
  tex: {
    name: 'TeX',
    extension: 'tex'
  },
  vb: {
    name: 'Visual Basic',
    extension: 'vb'
  },
  vue: {
    name: 'Vue',
    extension: 'vue'
  },
  'vue-html': {
    name: 'Vue HTML',
    extension: 'vue'
  },
  xml: {
    name: 'XML',
    extension: 'xml'
  },
  xsl: {
    name: 'XSL',
    extension: 'xsl'
  },
  yaml: {
    name: 'YAML',
    extension: 'yaml'
  },
  dart: {
    name: 'Dart',
    extension: 'dart'
  },
  java: {
    name: 'Java',
    extension: 'java'
  },
  /* Others not specified by VSCode */
  kotlin: {
    name: 'Kotlin',
    extension: 'kt'
  },
};

export const fileExtensionMap: LanguageExtensionMap = Object.entries(languagesIdMap).reduce((acc, [key, value]) => {
  const context: LanguageExtensionContext = {
    languageId: key,
    name: value.name
  }
  return {
    ...acc,
    [value.extension]: context
   };
}, {});

export const getLanguageContextById = (languageId: string): LanguageIdContext | null => {
  return languagesIdMap[languageId] || { name: '', extension: '' };
}

export const getLanguageIdByFilename = (filename: string): string | null => {
  const extension = getFileExtension(filename);
  return fileExtensionMap[extension]?.languageId;
}

export default languagesIdMap;