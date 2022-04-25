import { PL, Synopsis } from 'parsing/types';
import TypeScript from 'parsing/languages/typescript';
import JavaScript from 'parsing/languages/javascript';
import Python from 'parsing/languages/python';
import PHP from 'parsing/languages/php';
import Java from 'parsing/languages/java';
import Kotlin from 'parsing/languages/kotlin';
import C from 'parsing/languages/c';
import CPP from 'parsing/languages/cpp';
import CSharp from 'parsing/languages/csharp';
import Dart from './dart';
import Ruby from './ruby';
import Rust from './rust';
import Go from './go';

class UnknownPL implements PL {
  getSynopsis(): Synopsis {
    return { kind: 'unspecified' };
  }
  getCode() {
    return null
  }
  getProgress() {
    return null;
  }
}

export default (languageId: string): PL => {
  switch (languageId) {
    case 'typescript':
    case 'typescriptreact':
      return new TypeScript();
    case 'javascript':
    case 'javascriptreact':
      return new JavaScript();
    case 'python':
      return new Python();
    case 'php':
      return new PHP();
    case 'java':
      return new Java();
    case 'kotlin':
      return new Kotlin();
    case 'c':
      return new C();
    case 'cpp':
      return new CPP();
    case 'csharp':
      return new CSharp();
    case 'dart':
      return new Dart();
    case 'ruby':
      return new Ruby();
    case 'rust':
      return new Rust();
    case 'go':
      return new Go();
    default:
      return new UnknownPL();
  }
}