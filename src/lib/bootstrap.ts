import { visit } from 'unist-util-visit';

import type { Plugin } from 'unified';
import type { Node } from 'unist';
import type { Element } from 'hast';

const bootstrapize: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'blockquote', (node: Element) => {
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
