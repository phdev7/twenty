import { render } from '@react-email/render';
import { type JSONContent, reactMarkupFromJSON } from 'diex-emails';

export const renderRichTextToHtml = async (
  jsonContent: JSONContent,
): Promise<string> => {
  const reactMarkup = reactMarkupFromJSON(jsonContent);

  return render(reactMarkup);
};
