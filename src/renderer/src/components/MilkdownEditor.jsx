import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { replaceAll, getMarkdown, insert } from '@milkdown/utils'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { automd } from '@milkdown/plugin-automd'
import { clipboard } from '@milkdown/plugin-clipboard'
import fs from 'fs';
import FeatherIcon from 'feather-icons-react'
import { useEffect, useRef, useState, StrictMode } from 'react'
function MilkdownEditor({ editorRef, selectedFile, saveFile, cwd, markdownRef }) {
  const [content, setContent] = useState('')
  const saveTimerRef = useRef(null)

  const { loading, get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, '# Hello World')

        // Set up listeners
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
          markdownRef.current = markdown;
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current)
            saveTimerRef.current = null
          }
          saveTimerRef.current = setTimeout(() => saveFile(markdown), 1000)
        })
      })
      .use(commonmark)
      .use(listener)
      .use(automd)
      .use(clipboard)
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
    if (selectedFile && !loading){
      editorRef.current = get();
      setEditorContent(selectedFile.content)

    } 
  }, [selectedFile, loading])
  const insertImage = ()=>{
    const fileUpload = document.createElement('input');
    fileUpload.type = 'file'
    fileUpload.onchange = event =>{
        const reader = new FileReader();
        reader.onload = (e)=>{
            console.log(fileUpload.files[0], e.target.result)
            const fileName = fileUpload.files[0].name.split(" ").join("-").toLowerCase();
            window.api.saveImage(`${cwd}/media/${fileName}`, e.target.result).then( async ()=>{
                
                const editor = await get();
                console.log('done!', editor);
                editor.action(insert(`![image](eleventy:///media/${fileName})`))
            })
        }
        reader.readAsArrayBuffer(fileUpload.files[0])
        
    }
    fileUpload.click()

  }
  return (
    <>
      <div className="toolbar">
        <button onClick={insertImage}><FeatherIcon icon={"image"} size={15} color="#7c8ad6"/></button>
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
