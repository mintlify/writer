import { v2 } from '@google-cloud/translate'
import dotenv from 'dotenv';

dotenv.config();

export type TargetLanguage = 'English' | 'Chinese' | 'French' | 'Spanish' | 'Russian' | 'Korean' | 'Turkish';

const { Translate } = v2;
const projectId = 'mintlify';
const key = process.env.CLOUD_TRANSLATE_API_KEY;
const translate = new Translate({projectId, key});

const getTargetCode = (targetLanguage: TargetLanguage): string => {
  switch (targetLanguage.toLowerCase()) {
    case 'english':
      return 'en';
    case 'chinese':
      return 'zh';
    case 'french':
      return 'fr';
    case 'spanish':
      return 'es';
    case 'russian':
      return 'ru';
    case 'korean':
      return 'ko';
    case 'turkish':
      return 'tr';
    default:
      return 'en';
  }
}

const getTranslateTextPromise = (text: string, targetCode: string) => {
  return translate.translate(text, targetCode);
}

export const getMultipleTranslations = async (texts: string[], targetLanguage: TargetLanguage) => {
  const targetCode = getTargetCode(targetLanguage);
  if (targetCode === 'en') {
    return texts;
  }

  const translationPromises = texts.map((text) => {
    return getTranslateTextPromise(text, targetCode);
  });
  const translatedText = await Promise.all(translationPromises);
  const translations = translatedText.map((translated) => {
    let translation = translated[0];
    if (targetCode === 'ko') {
      translation = translation.replace(/\s?(합|입)니다\.?$/, '');
    }
    return translation;
  });

  return translations;
}