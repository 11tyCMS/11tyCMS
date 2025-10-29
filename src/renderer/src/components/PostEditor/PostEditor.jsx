import { useState, useEffect, useRef } from 'react'
import { getMarkdown, insert, replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

import MilkdownEditorWrapper from '../MilkdownEditor';
import FeatherIcon from 'feather-icons-react';
import Metadata from './Metadata/Metadata';
import { useNavigate, useParams } from 'react-router-dom';

function PostEditor({ cwd }) {
  const markdownRef = useRef(null);
  const typingRef = useRef(null)
  const editorRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null);
  const {collectionName, postFileName} = useParams();
  const navigate = useNavigate()
  console.log(postFileName);
  const fetchFile = (fileName) => {
    console.log(fileName);
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
    let updatedMetadata = { ...selectedFile.data }
    updatedMetadata['title'] = value
    saveMetadata(updatedMetadata);
  }

  const updateFileName = (title) => {

    const fileName = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll(' ', '-')

    window.api.renameFile(selectedFile.fileName, cwd + `/${fileName}.md`).then(() => {
      fetchFile(cwd + `/${fileName}.md`)
    })
  }

  useEffect(() => {
    fetchFile(`${cwd}/${collectionName}/${postFileName}`);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
    }
  }, [])

  const saveJustContent = (content) => {
    window.api.saveFile(selectedFile.fileName, null, content).then((test) => {
    })
  }
  const saveMetadata = (metadata) => {
    let updatedSelectedFile = { ...selectedFile, data: metadata };

    const markdown = editorRef.current.action(getMarkdown());
    updatedSelectedFile['content'] = markdown
    updatedSelectedFile['contents'] = markdown
    setSelectedFile(updatedSelectedFile);
    window.api.saveFileMetadata(updatedSelectedFile.fileName, metadata)
  }
  if(selectedFile)
    return (
      <>
        <div className='title-bar'>
          <FeatherIcon icon={"arrow-left"} size={25} color="#7c8ad6" className='back-button' onClick={() => navigate(`/${collectionName}/posts`)} />
          <input
            className="title"
            value={selectedFile ? selectedFile.data.title : ''}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
          ></input>
        </div>
        <Metadata selectedFile={selectedFile} saveMetadata={saveMetadata} />
        <div>
          <MilkdownEditorWrapper selectedFile={selectedFile} editorRef={editorRef} markdownRef={markdownRef} saveFile={saveJustContent} cwd={cwd} />
        </div>

      </>
    )
    else
      return ''
}

export default PostEditor
