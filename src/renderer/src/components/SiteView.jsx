import { useState, useRef, useEffect } from 'react'
import { Outlet } from "react-router-dom";
import AddCollectionDialog from './Dialogs/AddCollectionDialog';
import DeleteCollectionDialog from './Dialogs/DeleteCollectionDialog';
import Sidebar from './Sidebar/Sidebar';
import useCollectionsStore from '../stores/Collections';
import useSiteStore from '../stores/Site';

const SiteView = () => {
    const [isAddingCollection, setIsAddingCollection] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    const collections = useCollectionsStore(({ collections }) => collections);
    const colActions = useCollectionsStore(({ actions }) => actions);
    const cwd = useSiteStore((state) => state.cwd);
    const selectedSiteInfo = useSiteStore((state) => state.selectedSiteInfo);

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
    return <>
        <Sidebar setCollectionToDelete={setCollectionToDelete} setIsAddingCollection={setIsAddingCollection} />
        <div className="mdxeditor-container">
            <AddCollectionDialog siteInfo={selectedSiteInfo} displayStatus={isAddingCollection} setDisplayStatus={setIsAddingCollection} cwd={cwd} />
            <DeleteCollectionDialog collection={collectionToDelete} setCollectionToDelete={setCollectionToDelete} />
            <Outlet />
        </div>
    </>
}

export default SiteView;