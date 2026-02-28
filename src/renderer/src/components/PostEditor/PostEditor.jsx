import { useState, useEffect, useRef } from 'react'
import { getMarkdown, insert, replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";


import MilkdownEditorWrapper from '../MilkdownEditor';
import FeatherIcon from 'feather-icons-react';
import Metadata from './Metadata/Metadata';
import { useNavigate, useParams } from 'react-router-dom';
import useSiteStore, { useCwd, useGetInputDir } from '../../stores/Site';

function PostEditor() {
  const markdownRef = useRef(null);
  const typingRef = useRef(null)
  const editorRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null);
  const { collectionName, postFileName } = useParams();
  const cwd = useCwd()
  const getInputDir = useGetInputDir()
  const navigate = useNavigate()
  console.log(postFileName);
  useEffect(() => {
    document.getElementsByClassName('main-view')[0].classList.toggle("thin-padding")
    return () => {
      const mainViewDiv = document.getElementsByClassName('main-view')[0];
      if(mainViewDiv)
        document.getElementsByClassName('main-view')[0].classList.remove('thin-padding')
    }
  }, []);
  const fetchFile = (collectionName, fileName) => {
    console.log(fileName);
    window.api.openFile(collectionName, fileName).then((fileContents) => {
      console.log(fileContents, "this is the selected file");
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

  useEffect(() => {
    fetchFile(collectionName, postFileName);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
    }
  }, [])

  const saveJustContent = (content) => {
    window.api.saveFile(collectionName, postFileName, null, content).then((test) => {
    })
  }
  const saveMetadata = (metadata) => {
    let updatedSelectedFile = { ...selectedFile, data: metadata };
    const markdown = editorRef.current.action(getMarkdown());
    updatedSelectedFile['content'] = markdown
    updatedSelectedFile['contents'] = markdown
    setSelectedFile(updatedSelectedFile);
    window.api.saveFileMetadata(collectionName, postFileName, metadata)
  }
  if (selectedFile)
    return (
      <>
        <div className='title-bar'>
          <button onClick={() => navigate(`/site/${collectionName}/posts`)}>
            <FeatherIcon icon={"arrow-left"} size={25} color="#7c8ad6" className='back-button' />
          </button>

          <input
            placeholder='Post title'
            className="title"
            value={selectedFile ? selectedFile.data.title : ''}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
          ></input>
        </div>
        <Metadata selectedFile={selectedFile} saveMetadata={saveMetadata} />
        <MilkdownEditorWrapper selectedFile={selectedFile} editorRef={editorRef} markdownRef={markdownRef} saveFile={saveJustContent} cwd={cwd} />
      </>
    )
  else
    return ''
}

export default PostEditor
