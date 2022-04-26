import { fileExtensionMap } from 'brain/languages';
import { CodeFile } from 'parsing/types';

export type LineRange = {
  lineStart: number;
  lineEnd: number;
}

export interface MatchedContent extends LineRange {
  matchedContent: string;
}

/**
 * It takes a filename as a string and returns the file extension as a string
 * @param {string} filename - The name of the file you want to get the extension of.
 * @returns The file extension of the file name.
 */
export const getFileExtension = (filename: string): string => {
  const fileExtensionRegex = /(?:\.([^.]+))?$/;
  const fileExtension = fileExtensionRegex.exec(filename)[1];
  return fileExtension;
}

/**
* Remove all new lines and indents from a string.
* @param {string} content - The content of the file to be formatted.
* @returns The string with all new lines and indents removed.
*/
export const removeNewLinesAndIndents = (content: string): string => {
  return content.replace(/\n\s*/gm, ' ');
}

/**
* Given a list of files, return a list of all the file extensions used in the files.
* @param {arraytype} files - The array of files to be analyzed.
* @returns An array of strings.
*/
export const getLanguagesFromFiles = (files: CodeFile[]) => {
  const fileExtensions = {};
  files.forEach((file) => {
    const extension = getFileExtension(file.filename);
    fileExtensions[extension] = true;
  });
  return Object.keys(fileExtensions);
}

export const potentiallyReplaceLanguageId = (filename?: string, languageId?: string): string => {
  if (!filename) return languageId;

  const fileExtension = getFileExtension(filename);
  const languageContext = fileExtensionMap[fileExtension];
  if (!languageContext?.languageId) {
    return null;
  }

  return languageContext.languageId;
}