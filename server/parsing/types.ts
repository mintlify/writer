import { Progress, ProgressIndicator } from 'routes/writer/progress';

export type CodeFile = {
	path: string;
	filename: string;
	content: string;
  isCurrentActiveFile?: boolean;
}

export type Options = {
  linesIncrement?: number;
  showNodeType?: boolean;
}

// Mint is information about a processed piece of information
export type Mint = {
  path: string;
  filename: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  type?: string;
}

// Used for DocWriter
export type Param = {
  name: string;
  required: boolean;
  type?: string;
  defaultValue?: string;
}

export type ParamExplained = Param & { explanation: string };

export type Property = {
  name: string;
  type?: string;
  explanation?: string;
}

export type PropertyExplaied = Property & { explanation: string };

export type FunctionSynopsis = {
  kind: 'function';
  params?: Param[];
  returns?: boolean;
  returnsType?: string;
}

export type TypedefSynopsis = {
  kind: 'typedef';
  properties?: Property[];
}

export type ClassSynopsis = {
  kind: 'class';
  extends?: string;
}

export type UnspecifiedSynopsis = {
  kind: 'unspecified';
}

export type Synopsis = FunctionSynopsis | TypedefSynopsis | ClassSynopsis | UnspecifiedSynopsis;

export type UndefinedElement = {
  name: string;
  line: number;
  character: number;
}

export type TreeNode = {
  kind: string;
  value: string;
  start: number;
  end: number;
  is_error: boolean,
  children: TreeNode[],
}

export type Program = {
  has_error: boolean;
  root: TreeNode;
}
export interface PL {
  // Getting synopsis from tree sitter
  getSynopsis(tree: TreeNode, fileTree: TreeNode): Synopsis;
  // Used for identifying larger code chunks for no-select
  getCode(fileTree: TreeNode, location: number): string | null;
  // Getting the progress bar
  getProgress(tree: TreeNode, types: ProgressIndicator[]): Progress | null;
}
