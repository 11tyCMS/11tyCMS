import { useState, useEffect, useRef } from 'react'
import { Editor, rootCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useInstance } from "@milkdown/react";
import { insert, replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

import turndown from "turndown";
const turndownService = new turndown();
import Europa from 'europa';
const ieuropa = new Europa();

import MilkdownEditorWrapper from './MilkdownEditor';



function PostEditor({ selectedFile, setSelectedFile, markdownEditorRef, cwd, selectedCollection }) {

  const editorRef = useRef(null);
  const typingRef = useRef(null)
  const editorContainer = useRef(null)
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
    // console.log(getInstance(), isLoading)
    // if(!isLoading)
    //   getInstance().action(replaceAll(selectedFile.content))
    console.log(editorRef.current, editorContainer);
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
    window.api.saveFile(path, metadata, contents).then((test) => {
    })
  }

  const timeoutSave = () => {
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      //saveFile(selectedFile.fileName, selectedFile.data, editor.getHTML())
      clearTimeout(typingRef.current)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
      //saveFile(selectedFile.fileName, selectedFile.data, editor.getHTML())
    }
  }, [])
  const saveJustContent = (content)=>{
    window.api.saveFile(selectedFile.fileName, selectedFile.data, content).then((test) => {
    })
  }
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

      <div ref={editorContainer}>
        <MilkdownEditorWrapper selectedFile={selectedFile} editorContainerRef={editorContainer} editorRef={editorRef} saveFile={saveJustContent} cwd={cwd}/>

      </div>
      
    </>
  )
}

export default PostEditor
