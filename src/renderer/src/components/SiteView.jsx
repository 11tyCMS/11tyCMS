import { useState, useRef, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useMatch, useMatches} from "react-router-dom";
import AddCollectionDialog from './Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './Dialogs/DeleteCollectionDialog';
import Sidebar from './Sidebar/Sidebar';
import useCollectionsStore, { useCollections, useCollectionsActions } from '../stores/Collections';
import useSiteStore, { useCwd, useSelectedSiteInfo } from '../stores/Site';
import FeatherIcon from 'feather-icons-react';

const SiteView = () => {
    const [isAddingCollection, setIsAddingCollection] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    const collections = useCollections()
    const colActions = useCollectionsActions();
    const cwd = useCwd()
    const selectedSiteInfo = useSelectedSiteInfo();
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

    if(selectedSiteInfo == null){
        return <Navigate to="/"/>
    }
    const toggleSidebar = ()=>{
        document.getElementById("sidebar").classList.toggle('collapsed');
    }
    return <>
        <Sidebar setCollectionToDelete={setCollectionToDelete} setIsAddingCollection={setIsAddingCollection} />
        <div className='pane-gap'>
            <button className='no-style' onClick={toggleSidebar}><FeatherIcon icon='more-vertical' color='white' size={30}/></button>
        </div>
        <div className="main-view">
            <AddCollectionDialog siteInfo={selectedSiteInfo} displayStatus={isAddingCollection} setDisplayStatus={setIsAddingCollection} cwd={cwd} />
            <DeleteCollectionDialog collection={collectionToDelete} setCollectionToDelete={setCollectionToDelete} />
            <Outlet />
        </div>
    </>
}

export default SiteView;