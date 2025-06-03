import { useState, useEffect, useRef } from 'react'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  realmPlugin
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { marked } from 'marked';
import turndown from "turndown";
const turndownService = new turndown();
import Europa from 'europa';
const ieuropa = new Europa();


import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {RichTextLink} from './tiptap-extensions/md-link'
const extensions = [
  
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
  }),
  Image,
  Link,
  RichTextLink
]
function PostEditor({ selectedFile, setSelectedFile, markdownEditorRef, cwd, selectedCollection }) {
  const editor = useEditor({
    extensions,
    content: "hello world editor edition",
    onUpdate(){
      timeoutSave()
    }
  })

  const typingRef = useRef(null)
  const fetchFile = (fileName) => {
    window.api.openFile(fileName).then((fileContents) => {
      setSelectedFile({
        contents: fileContents.content,
        data: fileContents.data,
        content: fileContents.content,
        fileName
      })


    })
  }
  const setTitle = (value) => {
    let updatedSelectedFile = { ...selectedFile }
    updatedSelectedFile['data']['title'] = value
    saveFile(
      selectedFile.fileName,
      updatedSelectedFile.data,
      editor.getHTML()
    )
    setSelectedFile(updatedSelectedFile)
  }
  useEffect(() => {
    editor.commands.setContent(marked.parse(selectedFile.content))

  }, [selectedFile])

  const updateFileName = (title) => {

    const fileName = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll(' ', '-')

    window.api.renameFile(selectedFile.fileName, cwd + `/${fileName}.md`).then(() => {
      fetchFile(cwd + `/${fileName}.md`)

    })
  }
  const saveFile = (path, metadata, contents) => {

    const convertedContents = turndownService.turndown(contents)
    window.api.saveFile(path, metadata, convertedContents).then((test) => {
    })
  }

  const timeoutSave = () => {
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      saveFile(selectedFile.fileName, selectedFile.data, editor.getHTML())
      clearTimeout(typingRef.current)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
      saveFile(selectedFile.fileName, selectedFile.data, editor.getHTML())
    }
  }, [])
  return (
    <>
      <button onClick={() => setSelectedFile(null)}>back</button>
      <input
        className="title"
        value={selectedFile ? selectedFile.data.title : ''}
        onChange={(e) => {
          setTitle(e.target.value)
        }}
      ></input>
      <table className="metadata">
        {selectedFile
          ? Object.keys(selectedFile.data)
              .filter((key) => key != 'title')
              .map((key) => (
                <tr>
                  <td>
                    <b>{key}</b>
                  </td>
                  <td>{String(selectedFile.data[key])}</td>
                </tr>
              ))
          : ''}
      </table>
      {selectedFile ? (
        <button
          onClick={() =>
            saveFile(
              selectedFile.fileName,
              selectedFile.data,
              marked.Parser(editor.getHTML())
            )
          }
        >
          save
        </button>
      ) : (
        ''
      )}
       <EditorContent editor={editor}/>
    </>
  )
}

export default PostEditor
