import { visit } from 'unist-util-visit'

import type { Plugin } from 'unified'
import type { Node } from 'unist'
import type { Element } from 'hast'

const ATTRS_BY_TAG: Record<string, string[]> = {
  a: ['href'],
  img: ['src'],
  source: ['src'],
  video: ['src', 'poster'],
  audio: ['src'],
}

const absolutizeUrls = (base: string): Plugin => () => {
  return (tree: Node) => {
    visit(tree, 'element', (node: Element) => {
      const attrs = ATTRS_BY_TAG[node.tagName]
      if (!attrs || !node.properties) return
      for (const attr of attrs) {
        const value = node.properties[attr]
        if (typeof value !== 'string') continue
        if (!value.startsWith('/') || value.startsWith('//')) continue
        node.properties[attr] = new URL(value, base).toString()
      }
    })
  }
}

export { absolutizeUrls }
