import { useState, useRef, useEffect } from 'react'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import AddCollectionDialog from './components/Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './components/Dialogs/DeleteCollectionDialog';
import Sidebar from './components/Sidebar/Sidebar';
import { HashRouter, Route, Routes } from 'react-router-dom';
import useCollectionsStore from './stores/Collections';

function App() {
  const [cwd, setCwd] = useState('')
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [selectedSiteInfo, setSelectedSiteInfo] = useState(null)
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const collections = useCollectionsStore(({collections})=>collections);
  const colActions = useCollectionsStore(({actions})=>actions);
  const ipcHandle = () => {
    window.api.openDirectory().then((selected) => {
      window.api.getSiteInfo(selected.rootPath).then((data) => {
        setSelectedSiteInfo(data)
        setCwd(selected.rootPath)
        colActions.setCollections(selected.collections)
      })
    })
  }

  useEffect(()=>{
    console.log(collections, 'collectionsss');
  }, [collections])
  useEffect(() => {
    window.ipcRenderer
      .on("collectionFileAdded", (event, event1) => {
        colActions.addFileEntryToCollection(event1);
      })
    window.ipcRenderer.on('collectionFileRemoved', (event, event1) => {
      colActions.removeFileEntryFromCollection(event1);
    });
    window.ipcRenderer.on("collectionFileModified", (event, eventData) => {
      colActions.modifyFileEntryFromCollection(eventData);
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
      <Sidebar setCollectionToDelete={setCollectionToDelete} ipcHandle={ipcHandle} selectedSiteInfo={selectedSiteInfo} setIsAddingCollection={setIsAddingCollection} cwd={cwd} />
      <div className="mdxeditor-container">
        <AddCollectionDialog siteInfo={selectedSiteInfo} displayStatus={isAddingCollection} setDisplayStatus={setIsAddingCollection} cwd={cwd} />
        <DeleteCollectionDialog collection={collectionToDelete} setCollectionToDelete={setCollectionToDelete} />
        <Routes>
          <Route path="/" exact element={<h1>Select collection</h1>} />
          <Route path=":collectionName/posts" exact element={<PostsList cwd={cwd}/>} />
          <Route path=":collectionName/posts/:postFileName" exact element={<PostEditor cwd={cwd} />} />
        </Routes>
      </div>
    </>
  )
}

export default App
