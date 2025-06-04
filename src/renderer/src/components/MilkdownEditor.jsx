import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { Milkdown, MilkdownProvider, useEditor} from '@milkdown/react';
import { replaceAll, getMarkdown } from '@milkdown/utils';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { automd } from '@milkdown/plugin-automd'
import { clipboard } from '@milkdown/plugin-clipboard'

import { useEffect, useRef, useState, StrictMode } from 'react'
function MilkdownEditor({ editorContainerRef, selectedFile, saveFile }) {
   const [content, setContent] = useState("");
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  
  const {loading, get} = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, "# Hello World");
        
        // Set up listeners
        ctx.get(listenerCtx)
          .markdownUpdated((ctx, markdown, prevMarkdown) => {
            if(saveTimerRef.current){
                clearTimeout(saveTimerRef.current)
                saveTimerRef.current = null
            }
            saveTimerRef.current = setTimeout(()=>saveFile(markdown), 1000)
          });
      })
      .use(commonmark)
      .use(listener)
      .use(automd)
      .use(clipboard)
  );

  // Example function to get current content
  const getCurrentContent = async () => {
    const editor = await get();
    const markdown = editor.action(getMarkdown());
    console.log('Current content:', markdown);
    return markdown;
  };

  // Example function to set content
  const setEditorContent = async (newContent) => {
    const editor = await get();
    console.log(editor, get())
    editor.action(replaceAll(newContent));
  };

  useEffect(() => {
    if(selectedFile && !loading)
        setEditorContent(selectedFile.content)
  }, [selectedFile, loading]);

  return (
    
      <div ref={editorRef}>
        <Milkdown />
      </div>
  );
}

export default function MilkdownWrapper(props){
    return <MilkdownProvider><MilkdownEditor {...props}/></MilkdownProvider>
}