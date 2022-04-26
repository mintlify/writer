import { DAVINCI_CODEX_COMPLETIONS } from 'brain/codex/helpers';

export type CustomComponent = {
  parameter?: string,
  property?: string,
  context?: string,
}

export type CodexCall = {
  id: string,
  engineEndpoint: string,
  prompt: (code: string, languageCommented: string, custom?: CustomComponent) => string,
  stop: string[]
  temperature: number,
  maxTokens: number
}

export const EXPLAIN_PARAM: CodexCall = {
  id: 'explain-param',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, _, { parameter }: CustomComponent): string => `${code}
###
Here's what the above parameters are:
${parameter}: `,
stop: ['###', '\n'],
  temperature: 0,
  maxTokens: 60,
}

export const SUMMARIZE_FUNCTION: CodexCall = {
  id: 'summarize-function',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, languageCommented: string): string => `${languageCommented}
${code}
###
Here's a one sentence summary of the above function: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '.\n\n']
}

export const SUMMARIZE_FUNCTION_SIMPLE: CodexCall = {
  id: 'summarize-function-simple',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, language: string): string => `${language}
${code}
###
Question: What does the above function do?
Answer: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '\n\n']
}

export const GET_RETURN: CodexCall = {
  id: 'return',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string): string => `${code}
###
Question: What is being returned?
Answer: `,
  temperature: 0,
  maxTokens: 80,
  stop: ['###', '\n\n']
}

// class
export const SUMMARIZE_CLASS: CodexCall = {
  id: 'summarize-function',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, languageCommented: string): string => `${languageCommented}
${code}
###
Here's a one sentence summary of the above class: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '.\n\n']
}

export const SUMMARIZE_CLASS_SIMPLE: CodexCall = {
  id: 'summarize-function-simple',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, language: string): string => `${language}
${code}
###
Question: What does the above class do?
Answer: `,
  temperature: 0,
  maxTokens: 200,
  stop: ['##', '``', '\n\n']
}

// typedef
export const SUMMARIZE_TYPE: CodexCall = {
  id: 'summarize-type',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, language: string): string => `${language}
${code}
###
Here's a one sentence summary of the above type: `,
  temperature: 0,
  maxTokens: 120,
  stop: ['###', '##', '```']
}


export const EXPLAIN_PROPERTY: CodexCall = {
  id: 'explain-property',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, _, { property }: CustomComponent): string => `${code}
###
Here's what the above properties are:
${property}: `,
  temperature: 0,
  maxTokens: 60,
  stop: ['###', '\n'],
}

// unspecified
export const EXPLAIN_SIMPLE: CodexCall = {
  id: 'simple',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, language: string): string => `${language}
${code}
###
Question: What is the above code doing?
Answer: `,
  temperature: 0,
  maxTokens: 120,
  stop: ['###', 'Question:', '```', '\n\n']
}

export const EXPLAIN_CONTEXT: CodexCall = {
  id: 'context',
  engineEndpoint: DAVINCI_CODEX_COMPLETIONS,
  prompt: (code: string, language: string, { context }: CustomComponent): string => `${language}
${context}
###
Question: What is \`${code}\` doing?
Answer: `,
  temperature: 0,
  maxTokens: 240,
  stop: ['###', 'Question:', '```', '\n\n'] 
}