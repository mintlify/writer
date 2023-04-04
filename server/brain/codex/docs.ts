import { getLanguageContextById } from 'brain/languages';
import { addComments } from 'brain/helpers';
import {
  Synopsis,
  Property,
  ParamExplained,
  FunctionSynopsis,
  TypedefSynopsis,
} from 'parsing/types';
import {
  EXPLAIN_PARAM,
  EXPLAIN_SIMPLE,
  SUMMARIZE_FUNCTION,
  EXPLAIN_CONTEXT,
  EXPLAIN_PROPERTY,
  SUMMARIZE_TYPE,
  GET_RETURN,
  SUMMARIZE_FUNCTION_SIMPLE,
  SUMMARIZE_CLASS,
  OpenAPICall,
  SUMMARIZE_CLASS_SIMPLE,
} from 'brain/codex/prompt';
import { writeFunctionInFormat } from 'formatting/functions';
import { formatTypedef } from 'formatting/typedef';
import { DocFormat } from 'constants/enums';
import {
  chooseDocstringPrompt,
  formatReturnExplained,
  getSummaryFromMultipleResponses,
  makeCodexCall,
  OpenAIResponse,
} from 'brain/codex/helpers';
import { AxiosResponse } from 'axios';
import { Custom } from 'routes/writer/helpers';
import { getMultipleTranslations } from 'services/translate';

const MAX_CHARACTER_COUNT = 12000;

export type DocstringPrompt = {
  docstring: string;
  promptId: string;
};

const responseToDocstringPrompt = (
  responses: AxiosResponse<OpenAIResponse>[],
  callTypes: OpenAPICall[]
): DocstringPrompt[] => {
  const docstringPrompts: DocstringPrompt[] = [];
  for (let i = 0; i < responses.length; i++) {
    docstringPrompts.push({
      docstring: responses[i]?.data?.choices[0].message.content,
      promptId: callTypes[i].id,
    });
  }
  return docstringPrompts;
};

const getFunctionDocstringPrompt = async (
  synopsis: FunctionSynopsis,
  code: string,
  languageCommented: string,
  docFormat: DocFormat,
  custom: Custom
): Promise<DocstringPrompt> => {
  const paramPromises =
    synopsis.params?.map((param) => {
      return makeCodexCall(EXPLAIN_PARAM, code, languageCommented, { parameter: param.name });
    }) ?? [];

  const returnPromise = synopsis.returns
    ? makeCodexCall(GET_RETURN, code, languageCommented)
    : null;
  const summaryPromise = makeCodexCall(SUMMARIZE_FUNCTION, code, languageCommented);
  const summarySimplePromise = makeCodexCall(SUMMARIZE_FUNCTION_SIMPLE, code, languageCommented);
  const docPromises = [returnPromise, summaryPromise, summarySimplePromise, ...paramPromises];
  const docResponses = await Promise.all(docPromises);

  let paramsExplained: ParamExplained[] =
    paramPromises.length > 0
      ? docResponses.slice(3).map((param, i) => {
          const explained = param.data.choices[0].message.content.trim();
          return {
            ...synopsis.params[i],
            explanation: explained,
          };
        })
      : [];

  const [returnRes, summaryRes, summarySimpleRes] = docResponses;
  const docstringPrompts = responseToDocstringPrompt(
    [summaryRes, summarySimpleRes],
    [SUMMARIZE_FUNCTION, SUMMARIZE_FUNCTION_SIMPLE]
  );
  const docstringPrompt = chooseDocstringPrompt(docstringPrompts);
  let returnExplained = formatReturnExplained(returnRes?.data?.choices[0].message.content);

  // Adding premium feature for additional language translation
  if (custom.language) {
    const paramsExplinations = paramsExplained.map((paramExplained) => paramExplained.explanation);
    const translatedResults = await getMultipleTranslations(
      [docstringPrompt.docstring, returnExplained, ...paramsExplinations],
      custom.language
    );
    const [translatedDocstring, translatedReturnExplained, ...translatedParamsExplained] =
      translatedResults;
    docstringPrompt.docstring = translatedDocstring;
    returnExplained = translatedReturnExplained;
    paramsExplained = paramsExplained.map((paramExplained, i) => {
      return {
        ...paramExplained,
        explanation: translatedParamsExplained[i],
      };
    });
  }

  const docstring = writeFunctionInFormat(
    docFormat,
    docstringPrompt.docstring,
    paramsExplained,
    returnExplained,
    synopsis.returnsType,
    custom
  );
  return { docstring, promptId: docstringPrompt.promptId };
};

const getTypedefDocstring = async (
  synopsis: TypedefSynopsis,
  code: string,
  languageCommented: string,
  docFormat: DocFormat,
  custom: Custom
): Promise<string> => {
  const propertiesPromises = synopsis.properties?.map((property) => {
    return makeCodexCall(EXPLAIN_PROPERTY, code, languageCommented, { property: property.name });
  });

  const summaryPromise = makeCodexCall(SUMMARIZE_TYPE, code, languageCommented);
  const docPromises = [summaryPromise, ...propertiesPromises];
  const docResponses = await Promise.all(docPromises);

  let propertiesWithExplanation: Property[] = docResponses.slice(1)?.map((param, i) => {
    return {
      ...synopsis.properties[i],
      explanation: param.data.choices[0].message.content.trim(),
    };
  });
  const [summaryRes] = docResponses;
  let summary = getSummaryFromMultipleResponses(summaryRes.data.choices[0].message.content);

  // Adding languages feature
  if (custom.language) {
    const propertiesExplanations = propertiesWithExplanation.map(
      (propertyExplained) => propertyExplained.explanation
    );
    const translatedResults = await getMultipleTranslations(
      [summary, ...propertiesExplanations],
      custom.language
    );
    const [translatedSummary, ...translatedPropertiesExplained] = translatedResults;
    summary = translatedSummary;
    propertiesWithExplanation = propertiesWithExplanation.map((propertyExplained, i) => {
      return {
        ...propertyExplained,
        explanation: translatedPropertiesExplained[i],
      };
    });
  }

  return formatTypedef(docFormat, summary, propertiesWithExplanation);
};

const getTypedefDocstringPrompt = async (
  synopsis: TypedefSynopsis,
  code: string,
  languageCommented: string,
  docFormat: DocFormat,
  custom: Custom
): Promise<DocstringPrompt> => {
  const docstring = await getTypedefDocstring(synopsis, code, languageCommented, docFormat, custom);
  return { docstring, promptId: SUMMARIZE_TYPE.id };
};

const getClassDocstring = async (
  code: string,
  languageCommented: string,
  custom: Custom
): Promise<DocstringPrompt> => {
  const callOptions: OpenAPICall[] = [SUMMARIZE_CLASS, SUMMARIZE_CLASS_SIMPLE];
  const promises = callOptions.map((option) => {
    return makeCodexCall(option, code, languageCommented);
  });
  const responses = await Promise.all(promises);
  const docstringPrompts: DocstringPrompt[] = callOptions.map((option, i) => {
    return {
      docstring: responses[i]?.data?.choices[0].message.content,
      promptId: option.id,
    };
  });

  const selectedPrompt = chooseDocstringPrompt(docstringPrompts);

  if (custom.language) {
    const translatedResults = await getMultipleTranslations(
      [selectedPrompt.docstring],
      custom.language
    );
    const [translatedDocstring] = translatedResults;
    selectedPrompt.docstring = translatedDocstring;
  }

  return selectedPrompt;
};

const getSimpleSummary = async (
  code: string,
  languageCommented: string,
  context: string,
  custom: Custom
): Promise<DocstringPrompt> => {
  let summaryContextPromise;
  if (context.length + code.length <= MAX_CHARACTER_COUNT) {
    summaryContextPromise = makeCodexCall(EXPLAIN_CONTEXT, code, languageCommented, { context });
  }
  const summarySimplePromise = makeCodexCall(EXPLAIN_SIMPLE, code, languageCommented);

  const [summaryContext, summarySimple] = await Promise.all([
    summaryContextPromise,
    summarySimplePromise,
  ]);
  const docstringOptions: DocstringPrompt[] = [
    { docstring: summaryContext?.data.choices[0]?.message.content, promptId: EXPLAIN_CONTEXT.id },
    { docstring: summarySimple?.data.choices[0]?.message.content, promptId: EXPLAIN_SIMPLE.id },
  ];
  const selectedPrompt = chooseDocstringPrompt(docstringOptions);

  if (custom.language) {
    const translatedResults = await getMultipleTranslations(
      [selectedPrompt.docstring],
      custom.language
    );
    const [translatedDocstring] = translatedResults;
    selectedPrompt.docstring = translatedDocstring;
  }

  return selectedPrompt;
};

export const getDocstringPrompt = async (
  code: string,
  synopsis: Synopsis,
  languageId: string | null,
  docFormat: DocFormat,
  context: string,
  custom: Custom = {}
): Promise<DocstringPrompt> => {
  const languageContext = getLanguageContextById(languageId);
  const languageCommented = addComments(languageContext.name, languageId);
  switch (synopsis.kind) {
    case 'function':
      return await getFunctionDocstringPrompt(synopsis, code, languageCommented, docFormat, custom);
    case 'class':
      return await getClassDocstring(code, languageCommented, custom);
    case 'typedef':
      return await getTypedefDocstringPrompt(synopsis, code, languageCommented, docFormat, custom);
    default:
      return await getSimpleSummary(code, languageCommented, context, custom);
  }
};
