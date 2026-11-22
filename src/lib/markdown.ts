import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

/**
 * Markdown é escrito apenas no painel admin (conteúdo confiável), mas ainda
 * removemos scripts, iframes e atributos de evento antes de renderizar.
 */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
