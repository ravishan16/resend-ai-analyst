import React from 'react';
import parse, { domToReact } from 'html-react-parser';

function domParserUsable() {
  if (typeof DOMParser === 'undefined') {
    return true;
  }

  try {
    const parser = new DOMParser();
    if (typeof parser.parseFromString !== 'function') {
      return false;
    }

    parser.parseFromString('<!doctype html><html></html>', 'text/html');
    return true;
  } catch (error) {
    console.warn('[email-renderer] DOMParser is present but unusable; fallback to HTML payload only.', error);
    return false;
  }
}

function styleStringToObject(styleString = '') {
  return styleString
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((acc, declaration) => {
      const [property, value] = declaration.split(':').map(token => token.trim());
      if (!property || !value) {
        return acc;
      }

      const camelCaseProperty = property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      acc[camelCaseProperty] = value;
      return acc;
    }, {});
}

export function htmlToReactEmail(html) {
  if (!html || typeof html !== 'string') {
    return null;
  }

  if (!domParserUsable()) {
    return null;
  }

  const sanitizedHtml = html.replace(/<!DOCTYPE[^>]*>/i, '').trim();
  let options;

  options = {
    replace(domNode) {
      if (domNode.type !== 'tag') {
        return undefined;
      }

      if (domNode.name === 'a') {
        const href = domNode.attribs?.href || '';
        if (href.includes('unsubscribe_url')) {
          const style = domNode.attribs?.style ? styleStringToObject(domNode.attribs.style) : undefined;
          const className = domNode.attribs?.class || domNode.attribs?.className;
          const props = {
            href,
            ...(style ? { style } : {}),
            ...(className ? { className } : {})
          };
          return React.createElement(
            'a',
            props,
            domToReact(domNode.children, options)
          );
        }
      }

      return undefined;
    }
  };

  try {
    return parse(sanitizedHtml, options);
  } catch (error) {
    console.warn('[email-renderer] Failed to convert HTML to React email payload:', error);
    return null;
  }
}

export default htmlToReactEmail;
