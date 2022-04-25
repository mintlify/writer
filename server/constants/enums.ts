export enum DocFormat {
  Auto = 'Auto-detect',
  JSDoc = 'JSDoc',
  ReST = 'reST',
  Numpy = 'NumPy',
  DocBlock = 'DocBlock',
  Doxygen = 'Doxygen',
  Google = 'Google',
  JavaDoc = 'Javadoc',
  XML = 'XML',
  GoDoc = 'GoDoc',
  RustDoc = 'RustDoc',
  Custom = 'Custom',
}

export enum CommentFormat {
  JSDoc = 'JSDoc',
  PythonDocstring = 'PythonDocstring',
  Numpy = 'NumPy',
  XML = 'XML',
  RDoc = 'RDoc',
  Line = 'line',
}

export enum CommentPosition {
  Above = 'above',
  BelowStartLine = 'belowStartLine'
}

export enum LogMode {
  Off = 'off',
  On = 'on',
  Preview = 'preview'
}