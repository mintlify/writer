import { getTreeSitterProgram } from 'parsing';
import getPL from 'parsing/languages';
import { Progress, ProgressIndicator } from 'routes/writer/progress';

export const getProgress = async (code: string, languageId: string, types: ProgressIndicator[]): Promise<Progress> => {
  const tree = await getTreeSitterProgram(code, languageId);
  const desiredPL = getPL(languageId);
  return desiredPL.getProgress(tree.root, types);
}