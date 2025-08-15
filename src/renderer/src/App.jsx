import { useState, useRef, useEffect } from 'react'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import FeatherIcon from 'feather-icons-react';
import { ClipLoader, SyncLoader } from 'react-spinners';

function App() {
  const [cwd, setCwd] = useState('')
  const [collections, setCollections] = useState({})
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedSiteInfo, setSelectedSiteInfo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState(null);
  const markdownEditorRef = useRef(null)
  const ipcHandle = () => {
    window.api.openDirectory().then((selected) => {
      window.api.getSiteInfo(selected.rootPath).then((data) => {
        setSelectedSiteInfo(data)
        setCwd(selected.rootPath)
        setCollections(selected.collections)
      })
    })

  }
  const fetchFile = (fileName) => {
    window.api.openFile(fileName).then((fileContents) => {
      setSelectedFile({
        contents: fileContents.content,
        data: fileContents.data,
        content: fileContents.content,
        fileName,
      })

    })
  }

  const setTitle = (value) => {
    let updatedSelectedFile = { ...selectedFile }
    updatedSelectedFile['data']['title'] = value;
    setSelectedFile(updatedSelectedFile);
  }
  // onClick={()=>fetchFile(`${file.rootPath}/+file`)}
  useEffect(() => {
    console.log("collectionFileAdded useEffect called!")
    window.ipcRenderer
      .on("collectionFileAdded", (event, event1) => {
        console.log("collectionFileAdded called!")
        let updatedCollections = { ...collections };
        updatedCollections[event1.collection] = [...updatedCollections[event1.collection], event1.file];
        setCollections(updatedCollections);
      })
    window.ipcRenderer.on('collectionFileRemoved', (event, event1) => {
      let updatedCollections = { ...collections }
      updatedCollections[event1.collection] = updatedCollections[event1.collection].filter(post => event1.path != post.path)
      setCollections(updatedCollections);
    });
    window.ipcRenderer.on("collectionFileModified", (event, eventData)=>{
      const {collection, fileName, metadata} = eventData;
      let updatedCollections = {...collections};
      let targetPostIndex = null;
      targetPostIndex = updatedCollections[collection].findIndex(({name})=>fileName == name)
      updatedCollections[collection][targetPostIndex]['data'] = metadata;
      setCollections[updatedCollections];
    });
    return () => {
      if (window.ipcRenderer) {
        window.ipcRenderer.removeAllListeners("collectionFileAdded")
        window.ipcRenderer.removeAllListeners("collectionFileRemoved")
        window.ipcRenderer.removeAllListeners("collectionFileModified")
      }
    }
  }, [collections])
  console.log(selectedSiteInfo, "testing background test");
  const build = (pubBuild)=>{
    setIsBuilding(true);
    return window.api.build(cwd).then(()=>{
        setIsBuilding(false);
    })
  }
  const publish = ()=>{
    return new Promise((resolve)=>{
       build(true).then(()=>{
        setIsPublishing(true);
        window.api.publish(cwd).then(()=>{
          setIsPublishing(false)
          resolve();
        })
      });
    })
  }
  return (
    <>
      <div className="sidebar">
        <div className='siteInfo' onClick={() => ipcHandle()}>
          {Object.keys(collections).length != 0 ? <><div className='favicon-container'>
            <div className='favicon'>
              <img src={selectedSiteInfo['base64Favicon']}></img>
            </div>
          </div>
            <div className='info'>
              <h1>{selectedSiteInfo.title}</h1>
            </div> </> : <><div className='info select-button'>
              <h1>Select 11ty site</h1>
            </div></>}
        </div>
        <ul className="containingList">
          {Object.keys(collections).map((collectionName) => (
            <li className="parent">
              <FeatherIcon icon="folder" size={15} fill="#547fdb" />
              <span className="collectionLabel" onClick={() => setSelectedCollection(collectionName)}>{collectionName}</span>
            </li>
          ))}
        </ul>
        <div className='site-buttons'>
          <button onClick={()=>build()} disabled={isBuilding || isPublishing ? true : false}>{isBuilding ? <ClipLoader size={10} color="#a0afc2"/> : <FeatherIcon icon="tool" size={15} />} Build</button>
          <button onClick={()=>publish()} disabled={isBuilding || isPublishing ? true : false}>{isPublishing ? <ClipLoader size={10} color="#a0afc2"/> : <FeatherIcon icon="upload-cloud" size={15} />} Publish</button>
        </div>
      </div>
      <div className="mdxeditor-container">
        {!selectedFile ? <PostsList cwd={cwd} fetchFile={fetchFile} collection={selectedCollection} posts={collections[selectedCollection] ? collections[selectedCollection] : []} setSelectedFile={setSelectedFile} /> : ''}
        {selectedFile ? <PostEditor {...{ selectedFile, setTitle, markdownEditorRef, cwd, setCwd, setSelectedFile, selectedCollection }} /> : ""}
      </div>
    </>
  )
}

export default App
