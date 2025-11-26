import { defineComponent, ref, h, Fragment } from 'vue'

import type { MilkdownImageBlockProps } from './image-block'

import { Icon } from '../../../__internal__/components/icon'
import { IMAGE_DATA_TYPE } from '../../schema'

h
Fragment

export const ImageViewer = defineComponent<MilkdownImageBlockProps>({
  props: {
    src: {
      type: Object,
      required: true,
    },
    alt: {
      type: Object,
      required: true,
    },
    selected: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Object,
      required: true,
    },
    setAttr: {
      type: Function,
      required: true,
    },
    config: {
      type: Object,
      required: true,
    },
  },
  setup({ src, alt, readonly, setAttr, config }) {
    const imageRef = ref<HTMLImageElement>()
    const resizeHandle = ref<HTMLDivElement>()
    const showAlt = ref(Boolean(alt.value?.length))
    const timer = ref(0)

    const onImageLoad = () => {
      const image = imageRef.value
      if (!image) return
      const host = image.closest('.milkdown-image-block')
      if (!host) return

      const maxWidth = host.getBoundingClientRect().width
      if (!maxWidth) return

      const height = image.height
      const width = image.width
      image.style.height = `${height}px`
    }

    const onToggleAlt = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (readonly.value) return
      showAlt.value = !showAlt.value
    }

    const onInputAlt = (e: Event) => {
      const target = e.target as HTMLInputElement
      const value = target.value
      if (timer.value) window.clearTimeout(timer.value)

      timer.value = window.setTimeout(() => {
        setAttr('alt', value)
      }, 1000)
    }

    const onBlurAlt = (e: Event) => {
      const target = e.target as HTMLInputElement
      const value = target.value
      if (timer.value) {
        window.clearTimeout(timer.value)
        timer.value = 0
      }

      setAttr('alt', value)
    }

    const onResizeHandlePointerMove = (e: PointerEvent) => {
      e.preventDefault()
      const image = imageRef.value
      if (!image) return
      const top = image.getBoundingClientRect().top
      const height = e.clientY - top
      const h = Number(height < 100 ? 100 : height).toFixed(2)
      image.dataset.height = h
      image.style.height = `${h}px`
    }

    const onResizeHandlePointerUp = () => {
      window.removeEventListener('pointermove', onResizeHandlePointerMove)
      window.removeEventListener('pointerup', onResizeHandlePointerUp)

      const image = imageRef.value
      if (!image) return

      const originHeight = Number(image.dataset.origin)
      const currentHeight = Number(image.dataset.height)
      const ratio = Number.parseFloat(
        Number(currentHeight / originHeight).toFixed(2)
      )
      if (Number.isNaN(ratio)) return
    }

    const onResizeHandlePointerDown = (e: PointerEvent) => {
      if (readonly.value) return
      e.preventDefault()
      e.stopPropagation()
      window.addEventListener('pointermove', onResizeHandlePointerMove)
      window.addEventListener('pointerup', onResizeHandlePointerUp)
    }

    return () => {
      return (
        <>
          <div class="image-wrapper">
            <div class="operation">
              <div class="operation-item" onPointerdown={onToggleAlt}>
                <Icon icon={config.altIcon} />
              </div>
            </div>
            <img
              ref={imageRef}
              data-type={IMAGE_DATA_TYPE}
              onLoad={onImageLoad}
              src={src.value}
              alt={alt.value}
            />
            <div
              ref={resizeHandle}
              class="image-resize-handle"
              onPointerdown={onResizeHandlePointerDown}
            />
          </div>
          {showAlt.value && (
            <input
              draggable="true"
              onDragstart={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              class="caption-input"
              placeholder={config?.altPlaceholderText}
              onInput={onInputAlt}
              onBlur={onBlurAlt}
              value={alt.value}
            />
          )}
        </>
      )
    }
  },
})
