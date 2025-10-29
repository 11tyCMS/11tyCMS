import { useState, useRef, useEffect } from 'react'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import FeatherIcon from 'feather-icons-react';
import { ClipLoader, SyncLoader } from 'react-spinners';
import AddCollectionDialog from './components/Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './components/Dialogs/DeleteCollectionDialog';
import Sidebar from './components/Sidebar/Sidebar';

function App() {
  const [cwd, setCwd] = useState('')
  const [collections, setCollections] = useState({})
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [selectedSiteInfo, setSelectedSiteInfo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
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
  useEffect(() => {
    console.log("collectionFileAdded useEffect called!")
    window.ipcRenderer
      .on("collectionFileAdded", (event, event1) => {
        console.log("collectionFileAdded called!", event1)
        let updatedCollections = { ...collections };
        updatedCollections[event1.collection] = [...updatedCollections[event1.collection], event1];
        setCollections(updatedCollections);
      })
    window.ipcRenderer.on('collectionFileRemoved', (event, event1) => {
      let updatedCollections = { ...collections }
      updatedCollections[event1.collection] = updatedCollections[event1.collection].filter(post => event1.path != post.path)
      setCollections(updatedCollections);
    });
    window.ipcRenderer.on("collectionFileModified", (event, eventData) => {
      console.log("collectionFileMOdified!");
      const { collection, fileName, metadata } = eventData;
      let updatedCollections = { ...collections };
      let targetPostIndex = null;
      targetPostIndex = updatedCollections[collection].findIndex(({ name }) => {
        console.log()
        return fileName == name
      })
      console.log(updatedCollections[collection][targetPostIndex], fileName, updatedCollections[collection], eventData);
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

  return (
    <>
      <Sidebar setCollectionToDelete={setCollectionToDelete} collections={collections} ipcHandle={ipcHandle} selectedSiteInfo={selectedSiteInfo} setIsAddingCollection={setIsAddingCollection} setSelectedCollection={setSelectedCollection} cwd={cwd} />
      <div className="mdxeditor-container">
        <AddCollectionDialog siteInfo={selectedSiteInfo} displayStatus={isAddingCollection} setDisplayStatus={setIsAddingCollection} cwd={cwd} setCollections={setCollections} collections={collections} />
        <DeleteCollectionDialog collection={collectionToDelete} collections={collections} setCollections={setCollections} setCollectionToDelete={setCollectionToDelete} />
        {!selectedFile ? <PostsList cwd={cwd} collection={selectedCollection} posts={collections[selectedCollection] ? collections[selectedCollection] : []} setSelectedFile={setSelectedFile} /> : ''}
        {selectedFile ? <PostEditor {...{ selectedFile, markdownEditorRef, cwd, setCwd, setSelectedFile, selectedCollection }} /> : ""}
      </div>
    </>
  )
}

export default App
