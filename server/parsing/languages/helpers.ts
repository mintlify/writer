import { PL, Synopsis, TreeNode } from 'parsing/types';
import { Progress, ProgressIndicator } from 'routes/writer/progress';

type PathOptions = {
  path: string[];
  excludes?: string[];
}

export const getNodeByPath = (tree, options: PathOptions): TreeNode | null => {
  const { path, excludes } = options;

  const traverse = (node: TreeNode | null, remainingPath: string[]): TreeNode | null => {
    if (remainingPath.length === 0) return node;

    const isOnCurrentPath = node?.kind === remainingPath[0];
    if (isOnCurrentPath) {
      return traverse(node, remainingPath.slice(1));
    }

    const childOnValidPath = node?.children?.find((child) => child.kind === remainingPath[0]);
    if (childOnValidPath != null) {
      return traverse(childOnValidPath, remainingPath.slice(1));
    }

    const childOnExcludedPath = node?.children?.find((child) => excludes?.includes(child.kind));
    if (childOnExcludedPath != null) {
      return traverse(childOnExcludedPath, remainingPath);
    }

    return null;
  }

  return traverse(tree, path);
}

export const getNodeByPathOptions = (tree: TreeNode, paths: PathOptions[]): TreeNode | null => {
  for (const path of paths) {
    const node = getNodeByPath(tree, path);
    if (node != null) {
      return node;
    }
  }

  return null;
}

export const checkNodeByKind = (node: TreeNode | null, ...kinds: string[]): boolean => {
  return kinds.includes(node.kind)
}

export const findChildByKind = (node: TreeNode | null, ...kinds: string[]): TreeNode | null => {
  return node?.children?.find((child) => checkNodeByKind(child, ...kinds));
}

export const findAllChildsByKind = (node: TreeNode | null, ...kinds: string[]): TreeNode[] | null => {
  return node?.children?.filter((child) => checkNodeByKind(child, ...kinds));
}

export const getValueOfChildByKind = (node: TreeNode | null, ...kinds: string[]): string => {
  const child = findChildByKind(node, ...kinds);
  return child?.value || '';
}

export const findChildAfterByKind = (node: TreeNode | null, ...kinds: string[]): TreeNode | null => {
  if (node?.children == null) return null;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (checkNodeByKind(child, ...kinds) && i < node.children.length - 1) {
      return node.children[i + 1];
    }
  }

  return null;
}

export const getFirstNodeByValue = (node: TreeNode | null, value: string): TreeNode | null => {
  if (node?.value === value.trim()) {
    return node;
  }
  if (node?.children == null) {
    return null;
  }

  let i = 0;
  let result = null;
  for (i = 0; result == null && i < node.children.length; i++){
    result = getFirstNodeByValue(node.children[i], value);
  }
  return result;
}

export const getFirstNodeByKind = (node: TreeNode | null, kind: string): TreeNode | null => {
  if (node?.kind === kind.trim()) {
    return node;
  }
  if (node?.children == null) {
    return null;
  }

  let i = 0;
  let result = null;
  for (i = 0; result == null && i < node.children.length; i++){
    result = getFirstNodeByKind(node.children[i], kind);
  }
  return result;
}

type IfKindExistsInTreeOptions = {
  rootRange: {
    start: number;
    end: number;
  }
  excludesNotRoot: string[]
}

export const stripQuotes = (value: string): string | null => {
  if (!value) return undefined;
  return value.replace(/^["'](.*)["']$/, '$1');
}

export const findIfKindExistsInTree = (node: TreeNode | null, kind: string, options?: IfKindExistsInTreeOptions): boolean => {
  const isExcludedPath = options != null
    && node.start !== options.rootRange.start
    && node.end !== options.rootRange.end
    && checkNodeByKind(node, ...options.excludesNotRoot);
  if (node?.kind === kind) {
    return true;
  }
  if (node?.children == null || isExcludedPath) {
    return null;
  }
  let i = 0;
  let result = null;
  for(i = 0; result == null && i < node.children.length; i++){
    result = findIfKindExistsInTree(node.children[i], kind, options);
  }
  return result;
}

export const findIfKindIsChild = (tree: TreeNode, kind: string): boolean => {
  let isChild = false
  tree.children.forEach(child => {
    if (child.kind === kind) {
      isChild = true;
    }
  });
  return isChild;
}

export const returnSynopsisIfNotNull = (...synopsis): Synopsis => {
  for (const s of synopsis) {
    if (s != null) return s;
  }

  return { kind: 'unspecified' };
}

const locationInFirstLineRange = (tree: TreeNode, location: number): boolean => {
  if (tree.start <= location && location <= tree.end) {
    const indexOfNewline = tree.value.indexOf('\n');
    if (indexOfNewline == -1) {
      return true;
    }
    const endOfFirstLine = tree.start + indexOfNewline;
    return location <= endOfFirstLine
  }
  return false;
};

export const findAllInstancesOfKindInTree = (root: TreeNode, ...kinds: string[]): TreeNode[] => {
  const stack = [];
  let node, ii;
  stack.push(root);
  const allInstances = [];
  while (stack.length > 0) {
      node = stack.pop();
      if (checkNodeByKind(node, ...kinds)) {
        allInstances.push(node);
      }
      if (node.children && node.children.length) {
          for (ii = 0; ii < node.children.length; ii += 1) {
              stack.push(node.children[ii]);
          }
      }
  }
  return allInstances;
};

export const findKindWithinRange = (tree: TreeNode, location: number, ...kinds: string[]): TreeNode | null => {
  if (tree == null) return null;
  if (checkNodeByKind(tree, ...kinds) && locationInFirstLineRange(tree, location)) return tree;
  const allInstances = findAllInstancesOfKindInTree(tree, ...kinds);
  const desiredKind = allInstances.filter((func) => locationInFirstLineRange(func, location));
  return desiredKind.length > 0 ? desiredKind[0] : null;
};

export const getLineNumberOfSubstring = (content: string, substring: string, returnsEndLine = false): number => {
  const indexOfSubstring = content.indexOf(substring);
  const upToindex = content.substring(0, indexOfSubstring);
  const linesBeforeIndex = upToindex.split('\n').length - 1;
  const linesOfSubstring = substring.split('\n').length;

  if (returnsEndLine) {
    return linesBeforeIndex + linesOfSubstring;  
  }
  
  return linesBeforeIndex;
}

const checkIfTypesIncludesMatchedSynopsisKind = (
  synopsis: Synopsis,
  types: ProgressIndicator[],
  isNestedInClass: boolean
): { isMatched: boolean, type: ProgressIndicator } => {
  let typeFromSynopsis: ProgressIndicator | null = null;
  switch (synopsis.kind) {
    case 'function':
      if (isNestedInClass) {
        typeFromSynopsis = 'Methods';
        break;  
      }
      typeFromSynopsis = 'Functions';
      break;
    case 'class':
      typeFromSynopsis = 'Classes';
      break;
    case 'typedef':
      typeFromSynopsis = 'Types';
      break;
    default:
      typeFromSynopsis = null;
      break;
  }

  return {
    isMatched: types.map((type) => type?.toLowerCase()).includes(typeFromSynopsis?.toLowerCase()),
    type: typeFromSynopsis
  };
}

export const getProgressHelper = (
  pl: PL,
  root: TreeNode,
  types: ProgressIndicator[],
  checkTripleQuotesDocstring = false,
  isNestedInClass = false,
): Progress => {
  const childNodes = root.children;
  
  let totalProgressNodes = 0
  let totalCommentedProgressNodes = 0;
  const breakdown: Record<ProgressIndicator, { current: number, total: number }> = {
    Functions: {
      current: 0,
      total: 0,
    },
    Methods: {
      current: 0,
      total: 0,
    },
    Classes: {
      current: 0,
      total: 0,
    },
    Types: {
      current: 0,
      total: 0,
    },
  }

  childNodes?.forEach((node, i) => {
    const synopsis = pl.getSynopsis(node, root);

    const typeChecking = checkIfTypesIncludesMatchedSynopsisKind(synopsis, types, isNestedInClass);
    const isProgressNode = synopsis.kind !== 'unspecified';
    let hasCommentBefore = false;

    if (i !== 0 && ['comment', 'block_comment'].includes(childNodes[i - 1].kind)) {
      hasCommentBefore = getLineNumberOfSubstring(root.value, childNodes[i - 1].value, true) === getLineNumberOfSubstring(root.value, node.value);
    }
    if (checkTripleQuotesDocstring) {
      hasCommentBefore = hasCommentBefore || /(""")|(''')/gm.test(node.value);
    }

    /* Show current/total progress for all breakdowns
    Only count all selected current/total progress for totalProgress */
    if (isProgressNode) {
      breakdown[typeChecking.type].total++;
      if (typeChecking.isMatched) {
        totalProgressNodes++;
      }
      if (hasCommentBefore) {
        breakdown[typeChecking.type].current++;
        if (typeChecking.isMatched) {
          totalCommentedProgressNodes++;
        }
      }
    }

    if (synopsis.kind === 'class') {
      const addToTopLevelProgress = (blockedProgress: Progress) => {
        const { total, current, breakdown: blockBreakdown } = blockedProgress;
        totalProgressNodes += total;
        totalCommentedProgressNodes += current;
        Object.keys(blockBreakdown).forEach((breakdownType) => {
          breakdown[breakdownType].current += blockBreakdown[breakdownType].current;
          breakdown[breakdownType].total += blockBreakdown[breakdownType].total;
        });
      }

      const blockNode = findChildByKind(node, 'block', 'class_body', 'declaration_list');

      if (blockNode) {
        const nestedProgressInBlock = getProgressHelper(pl, blockNode, types, checkTripleQuotesDocstring, true);
        addToTopLevelProgress(nestedProgressInBlock);
        return;
      }

      const nestedProgressInClass = getProgressHelper(pl, node, types, checkTripleQuotesDocstring, true);
      addToTopLevelProgress(nestedProgressInClass);
    }
  });
  
  return {
    current: totalCommentedProgressNodes,
    total: totalProgressNodes,
    breakdown,
  };
}