import { useState, useEffect, useRef } from 'react'
import { Editor, rootCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useInstance } from "@milkdown/react";
import { getMarkdown, insert, replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

import turndown from "turndown";
const turndownService = new turndown();
import Europa from 'europa';
const ieuropa = new Europa();

import MilkdownEditorWrapper from '../MilkdownEditor';
import FeatherIcon from 'feather-icons-react';
import Metadata from './Metadata/Metadata';



function PostEditor({ selectedFile, setSelectedFile, markdownEditorRef, cwd, selectedCollection }) {
  const markdownRef = useRef(null);
  const typingRef = useRef(null)
  const editorRef = useRef(null)
  const fetchFile = (fileName) => {
    window.api.openFile(fileName).then((fileContents) => {
      setSelectedFile({
        contents: fileContents.content,
        data: fileContents.data,
        content: fileContents.content,
        fileName
      })


    })
    console.log("fetching fileee")
  }
  const setTitle = (value) => {
    let updatedMetadata = { ...selectedFile.data }
    updatedMetadata['title'] = value
    saveMetadata(updatedMetadata);
  }
  useEffect(() => {
    // console.log(getInstance(), isLoading)
    // if(!isLoading)
    //   getInstance().action(replaceAll(selectedFile.content))
    console.log('updating the selectedfile state!', selectedFile)
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
  const saveJustContent = (content) => {
    console.log("updating file contents with this fucking bullshit", selectedFile,)
    window.api.saveFile(selectedFile.fileName, null, content).then((test) => {
    })
  }
  const saveMetadata = (metadata)=>{

    let updatedSelectedFile = {...selectedFile, data:metadata};
    
    const markdown = editorRef.current.action(getMarkdown());
    updatedSelectedFile['content'] = markdown
    updatedSelectedFile['contents'] = markdown
    console.log("updating metadata with this bullshit", updatedSelectedFile);
    setSelectedFile(updatedSelectedFile);
    window.api.saveFileMetadata(updatedSelectedFile.fileName, metadata)
  }
  return (
    <>
      <div className='title-bar'>
        <FeatherIcon icon={"arrow-left"} size={25} color="#7c8ad6" className='back-button' onClick={() => setSelectedFile(null)} />
        <input
          className="title"
          value={selectedFile ? selectedFile.data.title : ''}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
        ></input>
      </div>
      <Metadata selectedFile={selectedFile} saveMetadata={saveMetadata}/>
      <div>
        <MilkdownEditorWrapper selectedFile={selectedFile} editorRef={editorRef} markdownRef={markdownRef} saveFile={saveJustContent} cwd={cwd} />

      </div>

    </>
  )
}

export default PostEditor
