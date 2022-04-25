import { DocFormat } from 'constants/enums';
import { Property } from 'parsing/types';

const getJSDocTypedefFormat = (summary: string, properties: Property[]) => {
    const propertiesFormatted = properties.map((property) => {
        const type = property.type ? `{${property.type}} ` : '';
        return `@property ${type}${property.name} - ${property.explanation}`
      }).join('\n');
    return `${summary}
${propertiesFormatted}`;
}

const getRustDocTypedefFormat = (summary: string, properties: Property[]) => {
    const propertiesFormatted = properties.map((property) => `* \`${property.name}\`: ${property.explanation}`).join('\n');
    const propertiesSection = properties.length > 0 ? `\n\nProperties:\n\n${propertiesFormatted}` : '';
    return `${summary}${propertiesSection}`;
}

export const formatTypedef = (docFormat: DocFormat, summary: string, properties: Property[]) => {
    let formatTypedef;
    switch (docFormat) {
      case DocFormat.JSDoc:
        formatTypedef = getJSDocTypedefFormat;
        break;
    case DocFormat.RustDoc:
        formatTypedef = getRustDocTypedefFormat;
        break;
      default:
        formatTypedef = getJSDocTypedefFormat;
        break;
    }

    return formatTypedef(summary, properties);
  }