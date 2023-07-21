import { GPT_COMPLETIONS, GPT_MODEL } from 'brain/codex/helpers';

export type CustomComponent = {
  parameter?: string;
  property?: string;
  context?: string;
};

export type OpenAPICall = {
  id: string;
  model: string;
  engineEndpoint: string;
  systemRoleContent: string;
  userRoleContent: (code: string, languageCommented: string, custom?: CustomComponent) => string;
  stop: string[];
  temperature: number;
  maxTokens: number;
};

export const EXPLAIN_PARAM: OpenAPICall = {
  id: 'explain-param',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, _, { parameter }: CustomComponent): string => `${code}
###
Here's what the above parameters are:
${parameter}: `,
  stop: ['###', '\n'],
  temperature: 0,
  maxTokens: 60,
};

export const SUMMARIZE_FUNCTION: OpenAPICall = {
  id: 'summarize-function',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, languageCommented: string): string => `${languageCommented}
${code}
###
Here's a one sentence summary of the above function: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '.\n\n'],
};

export const SUMMARIZE_FUNCTION_SIMPLE: OpenAPICall = {
  id: 'summarize-function-simple',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, language: string): string => `${language}
${code}
###
Question: What does the above function do?
Answer: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '\n\n'],
};

export const GET_RETURN: OpenAPICall = {
  id: 'return',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string): string => `${code}
###
Question: What is being returned?
Answer: `,
  temperature: 0,
  maxTokens: 80,
  stop: ['###', '\n\n'],
};

// class
export const SUMMARIZE_CLASS: OpenAPICall = {
  id: 'summarize-function',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, languageCommented: string): string => `${languageCommented}
${code}
###
Here's a one sentence summary of the above class: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '.\n\n'],
};

export const SUMMARIZE_CLASS_SIMPLE: OpenAPICall = {
  id: 'summarize-function-simple',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, language: string): string => `${language}
${code}
###
Question: What does the above class do?
Answer: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '\n\n'],
};

// typedef
export const SUMMARIZE_TYPE: OpenAPICall = {
  id: 'summarize-type',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, language: string): string => `${language}
${code}
###
Here's a one sentence summary of the above type: `,
  temperature: 0,
  maxTokens: 120,
  stop: ['###', '##', '```'],
};

export const EXPLAIN_PROPERTY: OpenAPICall = {
  id: 'explain-property',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, _, { property }: CustomComponent): string => `${code}
###
Here's what the above properties are:
${property}: `,
  temperature: 0,
  maxTokens: 60,
  stop: ['###', '\n'],
};

// unspecified
export const EXPLAIN_SIMPLE: OpenAPICall = {
  id: 'simple',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (code: string, language: string): string => `${language}
${code}
###
Question: What is the above code doing?
Answer: `,
  temperature: 0,
  maxTokens: 120,
  stop: ['###', 'Question:', '```', '\n\n'],
};

export const EXPLAIN_CONTEXT: OpenAPICall = {
  id: 'context',
  engineEndpoint: GPT_COMPLETIONS,
  model: GPT_MODEL,
  systemRoleContent: 'You are a helpful coding assistant',
  userRoleContent: (
    code: string,
    language: string,
    { context }: CustomComponent
  ): string => `${language}
${context}
###
Question: What is \`${code}\` doing?
Answer: `,
  temperature: 0,
  maxTokens: 240,
  stop: ['###', 'Question:', '```', '\n\n'],
};
