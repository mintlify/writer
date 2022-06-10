import { getDocFormat, writeFunctionInFormat } from 'formatting/functions';
import { DocFormat } from 'constants/enums';
import { ParamExplained } from 'parsing/types';
import { Custom } from 'routes/writer/helpers';

describe('Auto-detect settings', () => {
  const AutoDocFormat = DocFormat.Auto;
  test('JavaScript to JSDoc' , () => {
    const format = getDocFormat(AutoDocFormat, 'javascript');
    expect(format).toBe('JSDoc');
  });
  
  test('TypeScript to JSDoc' , () => {
    const format = getDocFormat(AutoDocFormat, 'typescript');
    expect(format).toBe('JSDoc');
  });

  test('Python to reST' , () => {
    const format = getDocFormat(AutoDocFormat, 'python');
    expect(format).toBe('reST');
  });

  test('PHP to DocBlock', () => {
    const format = getDocFormat(AutoDocFormat, 'php');
    expect(format).toBe('DocBlock');
  })

  test('Java to Javadoc', () => {
    const format = getDocFormat(AutoDocFormat, 'java');
    expect(format).toBe('Javadoc');
  })

  test('Undetected to Google' , () => {
    const format = getDocFormat(AutoDocFormat, 'bruh');
    expect(format).toBe('Google');
  });

})

describe('JSDoc function formatter', () => {
  const JSFormat = DocFormat.JSDoc;
  test('JSDoc simple with types', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'number', explanation: 'This is a param 2' }];
    const returnSummary = 'This is a return';

    const docstring = writeFunctionInFormat(JSFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n@param {string} param1 - This is a param 1\n@param {number} param2 - This is a param 2\n@returns This is a return');
  });

  test('JSDoc simple no types', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: true, explanation: 'This is a param 2' }];
    const returnSummary = 'This is a return';

    const docstring = writeFunctionInFormat(JSFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe(
      'This is a function\n@param param1 - This is a param 1\n@param param2 - This is a param 2\n@returns This is a return'
    );
  });

  test('JSDoc with optional params', () => {
    const summary = 'Wrap the code';
    const paramsExplained: ParamExplained[] = [
      { name: 'end', required: true, type: 'number', explanation: 'The string to be appended to the end of the code.' },
      { name: 'newLine', type: 'boolean', required: false, explanation: 'Whether to wrap in multiple lines' },
    ];
    const returnSummary = 'The function is returning the string.';
    const docstring = writeFunctionInFormat(JSFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe(
      'Wrap the code\n@param {number} end - The string to be appended to the end of the code.\n@param {boolean} [newLine] - Whether to wrap in multiple lines\n@returns The function is returning the string.'
    );
  });

  test('JSDoc with param default values', () => {
    const summary = 'Code summary here.';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', type: 'string', required: true, explanation: 'This is a param 1' }, { name: 'param2', type: 'number', required: false, defaultValue: '42', explanation: 'This is a param 2' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(JSFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe(
      'Code summary here.\n@param {string} param1 - This is a param 1\n@param {number} [param2=42] - This is a param 2\n@returns This is a return'
    );
  });

  test('JSDoc with no return', () => {
    const summary = 'Wrap the given code in the given start and end strings.';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is the first param' }, { name: 'param2', required: true, type: 'number', explanation: 'This is a param 2' }];
    const returnSummary = null;
    const docstring = writeFunctionInFormat(JSFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe(
      'Wrap the given code in the given start and end strings.\n@param {string} param1 - This is the first param\n@param {number} param2 - This is a param 2'
    );
  });
})

describe('Google function formatter' , () => {
  const GoogleFormat = DocFormat.Google;
  test('Google simple', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: true, explanation: 'This is a param 2' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(GoogleFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nArgs:\n  param1: This is a param 1\n  param2: This is a param 2\n\nReturns:\n  This is a return');
  });

  test('Google with type', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'str', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(GoogleFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nArgs:\n  param1 (str): This is a param 1\n  param2 (int): This is a param 2.\n\nReturns:\n  This is a return');
  });

  test('Google with no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(GoogleFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nArgs:\n  param1 (Param): This is a param 1\n  param2 (int): This is a param 2');
  });

  test('Google with default value', () => {
    const summary = 'This is a summary';
    const paramsExplained: ParamExplained[] = [{ name: 'one', required: true, type: 'Param', explanation: 'This is a param 1' }, { name: 'two', required: false, defaultValue: '8', type: 'number', explanation: 'This is a param 2' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(GoogleFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a summary\n\nArgs:\n  one (Param): This is a param 1\n  two (number): This is a param 2. Defaults to 8');
  });
});

describe('reST function formatter', () => {
  const ReSTFormat = DocFormat.ReST;
  test('reST simple', () => {
    const summary = 'Simple summary';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(ReSTFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('Simple summary\n\n:param param1: This is a param 1\n:return: This is a return');
  });

  test('reST with type', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'str', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(ReSTFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n:param param1: This is a param 1\n:type param1: str\n:param param2: This is a param 2\n:type param2: int\n:return: This is a return');
  });

  test('reST with optional param', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'one', required: true, type: 'str', explanation: 'This is a param 1' }, { name: 'two', required: false, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(ReSTFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n:param one: This is a param 1\n:type one: str\n:param two: This is a param 2\n:type two: int (optional)\n:return: This is a return');
  });

  test('reST with default value', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'str', explanation: 'This is a param 1' }, { name: 'param2', required: false, type: 'int', defaultValue: '10', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(ReSTFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n:param param1: This is a param 1\n:type param1: str\n:param param2: This is a param 2, defaults to 10\n:type param2: int (optional)\n:return: This is a return');
  });

  test('reST with no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(ReSTFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n:param param1: This is a param 1\n:type param1: Param')
  });
});

describe('DocBlock function formatter', () => {
  const DocBlockFormat = DocFormat.DocBlock;
  test('simple', () => {
    const summary = 'Simple summary';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(DocBlockFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('Simple summary\n\n@param param1 This is a param 1\n\n@return This is a return');
  });

  test('typed params', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(DocBlockFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param string param1 This is a param 1\n@param int param2 This is a param 2.\n\n@return This is a return');
  });

  test('no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(DocBlockFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param Param param1 This is a param 1')
  });

  test('with return type', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }];
    const returnSummary = 'This is a return summary';
    const returnType = 'string'
    const docstring = writeFunctionInFormat(DocBlockFormat, summary, paramsExplained, returnSummary, returnType);
    expect(docstring).toBe('This is a function\n\n@param Param param1 This is a param 1\n\n@return string This is a return summary');
  });
});

describe('Doxygen format', () => {
  const DoxyGenFormat = DocFormat.Doxygen;
  test('simple', () => {
    const summary = 'Simple summary';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(DoxyGenFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('Simple summary\n\n@param param1 This is a param 1\n\n@return This is a return');
  });

  test('typed params', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(DoxyGenFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param param1 This is a param 1\n@param param2 This is a param 2.\n\n@return This is a return');
  });

  test('no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(DoxyGenFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param param1 This is a param 1')
  });
})

describe('Javadoc function formatter', () => {
  const JavaDocFormat = DocFormat.JavaDoc;
  test('simple', () => {
    const summary = 'Simple summary';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(JavaDocFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('Simple summary\n\n@param param1 This is a param 1\n@return This is a return');
  });

  test('typed params', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(JavaDocFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param param1 This is a param 1\n@param param2 This is a param 2.\n@return This is a return');
  });

  test('no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'Param', explanation: 'This is a param 1' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(JavaDocFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\n@param param1 This is a param 1');
  });

  test('no return or params', () => {
    const summary = 'This is a function';
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(JavaDocFormat, summary, [], returnSummary);
    expect(docstring).toBe('This is a function');
  });
});

describe('NumPy', () => {
  const NumpyFormat = DocFormat.Numpy;
  test('With parameters and returns', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'string', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(NumpyFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nParameters\n----------\nparam1 : string\n\tThis is a param 1\nparam2 : int\n\tThis is a param 2.\n\nReturns\n-------\n\tThis is a return');
  });

  test('With only parameters with one without types and one optional', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: false, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = null;
    const docstring = writeFunctionInFormat(NumpyFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nParameters\n----------\nparam1\n\tThis is a param 1\nparam2 : int, optional\n\tThis is a param 2.');
  })

  test('No parameters and only return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(NumpyFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nReturns\n-------\n\tThis is a return');
  });

  test('No parameters or returns', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [];
    const returnSummary = null;
    const docstring = writeFunctionInFormat(NumpyFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function');
  });
});

describe('XML', () => {
  const XMLFormat = DocFormat.XML;
  test('No parameters or returns', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [];
    const returnSummary = null;
    const docstring = writeFunctionInFormat(XMLFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('<summary>\nThis is a function\n</summary>');
  });

  test('Multiple typed parameters and return statement', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return explained';
    const docstring = writeFunctionInFormat(XMLFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('<summary>\nThis is a function\n</summary>\n<param name="param1">This is a param 1</param>\n<param name="param2">This is a param 2.</param>\n<returns>\nThis is a return explained\n</returns>');
  });

  test('Only parameters and no return ', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = undefined;
    const docstring = writeFunctionInFormat(XMLFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('<summary>\nThis is a function\n</summary>\n<param name="param1">This is a param 1</param>\n<param name="param2">This is a param 2.</param>');
  });

  test('Multiple typed parameters with default values and return statement', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: false, type: 'int', explanation: 'This is a param 2.', defaultValue: '8' }];
    const returnSummary = 'This is a return';
    const docstring = writeFunctionInFormat(XMLFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('<summary>\nThis is a function\n</summary>\n<param name="param1">This is a param 1</param>\n<param name="param2">This is a param 2.</param>\n<returns>\nThis is a return\n</returns>');
  });
})

describe('Custom', () => {
  const CustomFormat = DocFormat.Custom;
  test('With params and return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', type: 'string', required: true, explanation: 'This is a param 1' }, { name: 'param2', required: false, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const returnType = undefined;
    const custom: Custom = {
      template: '{{summary}}\n\n{{#params}}\n@param {{name}} ({{type}}) - {{paramExplained}}\n{{/params}}\n{{#returnExplained}}\n@returns {{.}}\n{{/returnExplained}}\n\nGenerated on {{date}}',
      date: '01/01/2020',
    }
    const docstring = writeFunctionInFormat(CustomFormat, summary, paramsExplained, returnSummary, returnType, custom);
    expect(docstring).toBe('This is a function\n\n@param param1 (string) - This is a param 1\n@param param2 (int) - This is a param 2.\n@returns This is a return\n\nGenerated on 01/01/2020');
  });

  test('With no params and no return', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [];
    const returnSummary = null;
    const returnType = undefined;
    const custom: Custom = {
      template: '{{summary}}\n\n{{#params}}\n@param {{name}} ({{type}}) - {{paramExplained}}\n{{/params}}\n{{#returnExplained}}\n@returns {{.}}\n{{/returnExplained}}\n\nGenerated on {{date}}',
      date: '01/01/2020',
    }
    const docstring = writeFunctionInFormat(CustomFormat, summary, paramsExplained, returnSummary, returnType, custom);
    expect(docstring).toBe('This is a function\n\n\nGenerated on 01/01/2020');
  })
});

// Should return Google Format
describe('Invalid format', () => {
  test('No formats', () => {
    const summary = 'This is a summary';
    const paramsExplained: ParamExplained[] = [{ name: 'one', required: true, type: 'Param', explanation: 'This is a param 1' }, { name: 'two', required: false, defaultValue: '8', type: 'number', explanation: 'This is a param 2' }];
    const returnSummary = undefined;
    const undefinedFormat = undefined as any;
    const docstring = writeFunctionInFormat(undefinedFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a summary\n\nArgs:\n  one (Param): This is a param 1\n  two (number): This is a param 2. Defaults to 8');
  });

  test('Non-DocFormat format', () => {
    const summary = 'This is a function';
    const paramsExplained: ParamExplained[] = [{ name: 'param1', required: true, type: 'str', explanation: 'This is a param 1' }, { name: 'param2', required: true, type: 'int', explanation: 'This is a param 2.' }];
    const returnSummary = 'This is a return';
    const randomFormat = 'blah' as any;
    const docstring = writeFunctionInFormat(randomFormat, summary, paramsExplained, returnSummary);
    expect(docstring).toBe('This is a function\n\nArgs:\n  param1 (str): This is a param 1\n  param2 (int): This is a param 2.\n\nReturns:\n  This is a return');
  });
})
