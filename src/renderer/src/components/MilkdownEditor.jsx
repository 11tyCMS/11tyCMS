import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core'
import { editorStateCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { replaceAll, getMarkdown, insert } from '@milkdown/utils'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { automd } from '@milkdown/plugin-automd'
import { clipboard } from '@milkdown/plugin-clipboard'
import fs from 'fs';
import FeatherIcon from 'feather-icons-react'
import { useEffect, useRef, useState, useCallback, StrictMode } from 'react'
import { defaultKeymap } from '@codemirror/commands'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { imageBlockComponent, imageBlockConfig } from './PostEditor/plugins/11tycms-image-block/image-block'
import {
  codeBlockComponent,
  codeBlockConfig,
} from '@milkdown/components/code-block'
function MilkdownEditor({ editorRef, selectedFile, saveFile, cwd, markdownRef }) {
  const saveTimerRef = useRef(null)
  const editorCtx = useRef(null)

  const { loading, get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        editorCtx.current = ctx
        ctx.set(rootCtx, root)
        // Set up listeners
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
          markdownRef.current = markdown;
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current)
            saveTimerRef.current = null
          }
          saveTimerRef.current = setTimeout(() => saveFile(markdown), 1000)
        })
        ctx.update(codeBlockConfig.key, (defaultConfig) => ({
          ...defaultConfig,
          languages,
          extensions: [basicSetup, oneDark, keymap.of(defaultKeymap)],
          renderLanguage: (language, selected) =>
            selected ? `✔ ${language}` : language,
        }))
        ctx.update(imageBlockConfig.key, (defaultConfig)=>({
          ...defaultConfig,
        }))
      })
      .use(commonmark)
      .use(listener)
      .use(automd)
      .use(clipboard)
      .use(codeBlockComponent)
      .use(imageBlockComponent)
  )

  // Example function to get current content
  const getCurrentContent = async () => {
    const editor = await get()
    const markdown = editor.action(getMarkdown())
    console.log('Current content:', markdown)
    return markdown
  }

  // Example function to set content
  const setEditorContent = async (newContent) => {
    const editor = await get()
    console.log(editor, get())
    editor.action(replaceAll(newContent))
  }

  useEffect(() => {
    if (selectedFile && !loading) {
      editorRef.current = get();
      setEditorContent(selectedFile.content)
      console.log(selectedFile, "updating in the editor")
    }
  }, [selectedFile, loading])
  const insertImage = () => {
    const fileUpload = document.createElement('input');
    fileUpload.type = 'file'
    fileUpload.onchange = event => {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log(fileUpload.files[0], e.target.result)
        const fileName = fileUpload.files[0].name.split(" ").join("-").toLowerCase();
        window.api.saveImage(`${cwd}/media/${fileName}`, e.target.result).then(async () => {

          const editor = await get();
          console.log('done!', editor);
          editor.action(insert(`![image](eleventy:///media/${fileName})`))
        })
      }
      reader.readAsArrayBuffer(fileUpload.files[0])

    }
    fileUpload.click()

  }
  const updateBoldState = useCallback(() => {
    const editor = get();
    if (!editor) return;
    editor.action((ctx) => {
      const active = bold(ctx);
      console.log(active);
    });
  }, [get]);

  const bold = (ctx) => {
    const editorState = editorCtx.current.get(editorStateCtx);
    const { schema, selection } = editorState;
    const strongType = schema.marks.strong;
    let isBoldActive = false;
    const { from, to, empty } = selection;
    if (empty) {
      // If the selection is empty (just a cursor), check two places:
      // 1. storedMarks: Marks that will be applied to the next typed characters.
      // 2. marks at the cursor position: Marks that are already applied to the text *under* the cursor.
      isBoldActive = strongType.isInSet(editorState.storedMarks || selection.$from.marks());
    } else {
      // If there's a range selection, check if any part of the selection has the strong mark.
      isBoldActive = editorState.doc.rangeHasMark(from, to, strongType);
    }

    console.log("Is bold toggled?", isBoldActive);
  }
  return (
    <>
      <div className="toolbar">
        <button onClick={insertImage}><FeatherIcon icon={"image"} size={15} color="#7c8ad6" /></button>
        <button onClick={bold}>b</button>
      </div>
      <div>
        <Milkdown />
      </div>
    </>
  )
}

export default function MilkdownWrapper(props) {
  return (
    <MilkdownProvider>
      <MilkdownEditor {...props} />
    </MilkdownProvider>
  )
}
