import { visit } from 'unist-util-visit';

import type { Plugin } from 'unified';
import type { Node } from 'unist';
import type { Element } from 'hast';

interface HTMLElement extends Element {
  data: {
    hProperties: {
      class: string[];
    }
  };
}

const bootstrapize: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'blockquote', (node: HTMLElement) => {
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties!.class = node.data.hProperties.class || []
      node.data.hProperties.class.push('blockquote')
    });
  }
}

export {
  bootstrapize,
}
