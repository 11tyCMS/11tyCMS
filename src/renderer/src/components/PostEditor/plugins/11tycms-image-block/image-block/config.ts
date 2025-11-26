import { $ctx } from '@milkdown/utils'

import { withMeta } from '../__internal__/meta'

export interface ImageBlockConfig {
  imageIcon: string | undefined
  altIcon: string | undefined
  uploadButton: string | undefined
  confirmButton: string | undefined
  uploadPlaceholderText: string
  altPlaceholderText: string
  onUpload: (file: File) => Promise<string>
  proxyDomURL?: (url: string) => Promise<string> | string
}

export const defaultImageBlockConfig: ImageBlockConfig = {
  imageIcon: '🌌',
  altIcon: '♿',
  uploadButton: 'Upload file',
  confirmButton: 'Confirm ⏎',
  uploadPlaceholderText: 'or paste the image link ...',
  altPlaceholderText: 'Image alternative description',
  onUpload: (file) => Promise.resolve(URL.createObjectURL(file)),
}

export const imageBlockConfig = $ctx(
  defaultImageBlockConfig,
  'imageBlockConfigCtx'
)

withMeta(imageBlockConfig, {
  displayName: 'Config<image-block>',
  group: 'ImageBlock',
})
