import Mustache from 'mustache';
import { ParamExplained } from 'parsing/types';
import { DocFormat } from 'constants/enums';
import { Custom } from 'routes/writer/helpers';

export const getDocFormat = (selectedDocStyle: DocFormat, languageId: string | null): DocFormat => {
  if (selectedDocStyle !== DocFormat.Auto) {
    return selectedDocStyle;
  }

  switch (languageId) {
    case 'typescript':
    case 'javascript':
    case 'typescriptreact':
    case 'javascriptreact':
      return DocFormat.JSDoc;
    case 'python':
      return DocFormat.ReST;
    case 'php':
      return DocFormat.DocBlock;
    case 'c':
    case 'cpp':
      return DocFormat.Doxygen;
    case 'java':
    case 'kotlin':
      return DocFormat.JavaDoc;
    case 'csharp':
      return DocFormat.XML;
    case 'go':
      return DocFormat.GoDoc;
    case 'rust':
      return DocFormat.RustDoc;
    default:
      return DocFormat.Google;
  }
};

const getJSDocFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    .map((param) => {
      const type = param.type ? `{${param.type}} ` : '';
      const name =
        param.required == null || param.required
          ? `${param.name}`
          : `[${param.name}${param.defaultValue ? `=${param.defaultValue}` : ''}]`;
      return `@param ${type}${name} - ${param.explanation}`;
    })
    .join('\n');
  const finalParams = paramsExplained ? `\n${paramsExplained}` : '';
  const returnStatement = returnExplained ? `\n@returns ${returnExplained}` : '';
  return `${summary}${finalParams}${returnStatement}`;
};

const getReSTFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    ?.map((param) => {
      const explanation = param.explanation.replace(/\.$/, '');
      const defaultStatement = param.defaultValue ? `, defaults to ${param.defaultValue}` : '';
      const isOptional = param.required === false ? ' (optional)' : '';
      const paramType = param.type ? `\n:type ${param.name}: ${param.type}` : '';
      return `:param ${param.name}: ${explanation}${defaultStatement}${paramType}${isOptional}`;
    })
    .join('\n');
  const finalParams = paramsExplained ? `\n\n${paramsExplained}` : '';
  const returnStatement = returnExplained ? `\n:return: ${returnExplained}` : '';
  return `${summary}${finalParams}${returnStatement}`;
};

const getGoogleFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    ?.map((param) => {
      const paramType = param.type ? ` (${param.type})` : '';
      // Used for default
      const shouldAddPeriod = param.explanation.endsWith('.') ? '' : '.';
      const defaultStatement = param.defaultValue
        ? `${shouldAddPeriod} Defaults to ${param.defaultValue}`
        : '';
      return `  ${param.name}${paramType}: ${param.explanation}${defaultStatement}`;
    })
    .join('\n');
  const finalParams = paramsExplained
    ? `\n\nArgs:
${paramsExplained}`
    : '';
  const returnStatement = returnExplained
    ? `\n\nReturns:
  ${returnExplained}`
    : '';
  return `${summary}${finalParams}${returnStatement}`;
};

const getDocBlockFormat = (
  summary: string,
  params: ParamExplained[],
  returnExplained?: string,
  returnType?: string,
  showTypes = true
) => {
  const paramsExplained = params
    .map((param) => {
      const type = param.type && showTypes ? ` ${param.type}` : '';
      const explanation = param.explanation === param.type ? '' : ` ${param.explanation}`;
      return `@param${type} ${param.name}${explanation}`;
    })
    .join('\n');
  const finalParams = paramsExplained ? `\n\n${paramsExplained}` : '';
  const returnTypeFormatted = returnType ? `${returnType} ` : '';
  const returnStatement = returnExplained
    ? `\n\n@return ${returnTypeFormatted}${returnExplained}`
    : '';
  return `${summary}${finalParams}${returnStatement}`;
};

const getDoxygenFormat = (
  summary: string,
  params: ParamExplained[],
  returnExplained?: string,
  returnType?: string
) => {
  return getDocBlockFormat(summary, params, returnExplained, returnType, false);
};

const getJavadocFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    .map((param) => {
      const name = ` ${param.name}`;
      const explanation = ` ${param.explanation}`;
      return `@param${name}${explanation}`;
    })
    .join('\n');
  const finalParams = paramsExplained ? `\n${paramsExplained}` : '';
  const returnStatement = returnExplained ? `\n@return ${returnExplained}` : '';
  const noParamsOrReturn = finalParams === '' && returnStatement === '';
  const javadoc = noParamsOrReturn ? summary : `${summary}\n${finalParams}${returnStatement}`;
  return javadoc;
};

const getNumPyFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    .map((param) => {
      const name = `${param.name}`;
      const type = param.type ? ` : ${param.type}` : '';
      const isOptional = param.required === false ? ', optional' : '';
      const explanation = `\t${param.explanation}`;
      return `${name}${type}${isOptional}\n${explanation}`;
    })
    .join('\n');
  const paramsSection = params.length > 0 ? `\n\nParameters\n----------\n${paramsExplained}` : '';
  const returnSection = returnExplained ? `\n\nReturns\n-------\n\t${returnExplained}` : '';
  return `${summary}${paramsSection}${returnSection}`;
};

const getXMLFormat = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    .map((param) => `<param name="${param.name}">${param.explanation}</param>`)
    .join('\n');
  const finalParams = paramsExplained ? `\n${paramsExplained}` : '';
  const returnStatement = returnExplained ? `\n<returns>\n${returnExplained}\n</returns>` : '';
  return `<summary>\n${summary}\n</summary>${finalParams}${returnStatement}`;
};

const getGoDoc = (summary: string) => {
  return summary;
};

const getRustDoc = (summary: string, params: ParamExplained[], returnExplained?: string) => {
  const paramsExplained = params
    .map((param) => `* \`${param.name}\`: ${param.explanation}`)
    .join('\n');
  const paramsSection = params.length > 0 ? `\n\nArguments:\n\n${paramsExplained}` : '';
  const returnsSection = returnExplained ? `\n\nReturns:\n\n${returnExplained}` : '';
  return `${summary}${paramsSection}${returnsSection}`;
};

const getCustomFormat = (
  summary: string,
  params: ParamExplained[],
  returnExplained?: string,
  returnType?: string,
  custom?: Custom
) => {
  const paramsFormatted = params.map((param) => {
    return {
      name: param.name,
      type: param.type,
      paramExplained: param.explanation,
      defaultValue: param.defaultValue,
    };
  });
  const content = {
    summary,
    params: paramsFormatted,
    returnExplained,
    author: custom?.author,
    date: custom?.date,
  };
  // @ts-ignore
  Mustache.escape = (value) => value;
  return Mustache.render(custom.template, content);
};

export const writeFunctionInFormat = (
  docStyle: DocFormat,
  summary: string,
  paramsWithExplanation: ParamExplained[],
  returnExplained?: string,
  returnType?: string,
  custom?: Custom
) => {
  let formatFunction;
  switch (docStyle) {
    case DocFormat.JSDoc:
      formatFunction = getJSDocFormat;
      break;
    case DocFormat.ReST:
      formatFunction = getReSTFormat;
      break;
    case DocFormat.Numpy:
      formatFunction = getNumPyFormat;
      break;
    case DocFormat.Google:
      formatFunction = getGoogleFormat;
      break;
    case DocFormat.DocBlock:
      formatFunction = getDocBlockFormat;
      break;
    case DocFormat.Doxygen:
      formatFunction = getDoxygenFormat;
      break;
    case DocFormat.JavaDoc:
      formatFunction = getJavadocFormat;
      break;
    case DocFormat.XML:
      formatFunction = getXMLFormat;
      break;
    case DocFormat.GoDoc:
      formatFunction = getGoDoc;
      break;
    case DocFormat.RustDoc:
      formatFunction = getRustDoc;
      break;
    case DocFormat.Custom:
      formatFunction = getCustomFormat;
      break;
    default:
      formatFunction = getGoogleFormat;
      break;
  }

  return formatFunction(summary, paramsWithExplanation, returnExplained, returnType, custom);
};
