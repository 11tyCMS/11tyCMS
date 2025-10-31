import { useState, useRef, useEffect } from 'react'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import SiteView from './components/SiteView';
import SelectSiteView from './components/SelectSiteView';

function App() {
  return (
    <Routes>
      <Route index exact path="/" element={<SelectSiteView/>} />
      <Route exact path="site" element={<SiteView />}>
        <Route path="" exact element={<h1>Select collection</h1>} />
        <Route path=":collectionName/posts" exact element={<PostsList />} />
        <Route path=":collectionName/posts/:postFileName" exact element={<PostEditor />} />
      </Route>
    </Routes>
  )
}

export default App
