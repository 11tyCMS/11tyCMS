import { useState, useRef, useEffect } from 'react'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor/PostEditor'
import SiteView from './components/SiteView';
import SelectSiteView from './components/SelectSiteView';
import DashboardView from './components/Dashboard/DashboardView';
import WelcomeWizardConstructorRoutes from './components/Wizard/Steps/Welcome/WelcomeWizardConstructor';
import Wizard from './components/Wizard/Wizard';
import { defaultWelcomeWizardState } from './components/Wizard/Steps/Welcome/WelcomeWizardConstructor';
function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route index exact path="/" element={<SelectSiteView />} />
      <Route exact path="welcome" element={<Wizard routes={WelcomeWizardConstructorRoutes} rootRoute={"/welcome"} defaultState={defaultWelcomeWizardState}/>}>
        {WelcomeWizardConstructorRoutes.map(route => <Route exact path={route.path} element={route.element} />)}
      </Route>
      <Route exact path="site" element={<SiteView />}>
        <Route path="" exact element={<h1>Select collection <button onClick={()=>navigate('/welcome')}>nav</button></h1>} />
        <Route path="dashboard" exact element={<DashboardView />} />
        <Route path=":collectionName/posts" exact element={<PostsList />} />
        <Route path=":collectionName/posts/:postFileName" exact element={<PostEditor />} />
      </Route>
    </Routes>
  )
}

export default App
