import { useState, useRef, useEffect } from 'react'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import AddCollectionDialog from './components/Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './components/Dialogs/DeleteCollectionDialog';
import Sidebar from './components/Sidebar/Sidebar';
import { HashRouter, Route, Routes } from 'react-router-dom';

function App() {
  const [cwd, setCwd] = useState('')
  const [collections, setCollections] = useState({})
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [selectedSiteInfo, setSelectedSiteInfo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
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
        <Routes>
          <Route path="/" exact element={<h1>Select collection</h1>} />
          <Route path=":collectionName/posts" exact element={<PostsList cwd={cwd} posts={collections[selectedCollection] ? collections[selectedCollection] : []} />} />
          <Route path=":collectionName/posts/:postFileName" exact element={<PostEditor  cwd={cwd} />} />
        </Routes>
      </div>
    </>
  )
}

export default App
