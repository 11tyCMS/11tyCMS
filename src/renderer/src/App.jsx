import { useState, useRef, useEffect } from 'react'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import AddCollectionDialog from './components/Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './components/Dialogs/DeleteCollectionDialog';
import Sidebar from './components/Sidebar/Sidebar';
import { HashRouter, Route, Routes } from 'react-router-dom';
import useCollectionsStore from './stores/Collections';
import useSiteStore from './stores/Site';
import { shallow } from 'zustand/shallow';

function App() {
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const collections = useCollectionsStore(({ collections }) => collections);
  const colActions = useCollectionsStore(({ actions }) => actions);
  const cwd = useSiteStore((state) => state.cwd);
  const selectedSiteInfo = useSiteStore((state) => state.selectedSiteInfo);
  const openSiteFolder = useSiteStore(({ actions }) => actions.openSiteFolder);
  const ipcHandle = () => {
    openSiteFolder();
  }

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
          <Route path=":collectionName/posts" exact element={<PostsList/>} />
          <Route path=":collectionName/posts/:postFileName" exact element={<PostEditor/>} />
        </Routes>
      </div>
    </>
  )
}

export default App
