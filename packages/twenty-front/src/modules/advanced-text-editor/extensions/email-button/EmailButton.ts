import { mergeAttributes, Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emailButton: {
      insertEmailButton: (attributes: {
        href: string;
        label: string;
      }) => ReturnType;
    };
  }
}

export const EmailButton = Node.create({
  name: 'emailButton',
  group: 'block',
  atom: true,

  addAttributes: () => ({
    href: {
      default: '#',
      parseHTML: (element) => element.getAttribute('href'),
    },
    label: {
      default: 'Saiba mais',
      parseHTML: (element) => element.textContent,
    },
  }),

  parseHTML: () => [{ tag: 'a[data-email-button]' }],

  renderHTML: ({ node, HTMLAttributes }) => [
    'a',
    mergeAttributes(HTMLAttributes, {
      'data-email-button': 'true',
      href: node.attrs.href,
      target: '_blank',
      rel: 'noopener noreferrer',
      style:
        'background:#2563eb;border-radius:8px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;line-height:20px;margin:12px 0;padding:10px 18px;text-decoration:none;',
    }),
    node.attrs.label,
  ],

  renderText: ({ node }) => `${node.attrs.label}: ${node.attrs.href}`,

  addCommands: () => ({
    insertEmailButton:
      (attributes) =>
      ({ commands }) =>
        commands.insertContent({
          type: 'emailButton',
          attrs: attributes,
        }),
  }),
});
