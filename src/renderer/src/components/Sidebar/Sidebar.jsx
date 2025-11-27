import { useState, useRef, useEffect } from 'react'
import FeatherIcon from 'feather-icons-react';
import { ClipLoader, SyncLoader } from 'react-spinners';
import { Navigate, useNavigate } from 'react-router-dom';
import useCollectionsStore, { useCollections } from '../../stores/Collections';
import useSiteStore from '../../stores/Site';

const Sidebar = ({ setCollectionToDelete, setIsAddingCollection }) => {
    const navigate = useNavigate();
    const collections = useCollections();
    const selectedSiteInfo = useSiteStore((state) => state.selectedSiteInfo);
    const resetSelectedSite = useSiteStore((state) => state.actions.resetSelection);
    const cwd = useSiteStore((state) => state.cwd);
    const [isBuilding, setIsBuilding] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const build = (pubBuild) => {
        setIsBuilding(true);
        return window.api.buildSite(cwd).then(() => {
            setIsBuilding(false);
        })
    }
    const publish = () => {
        return new Promise((resolve) => {
            build(true).then(() => {
                setIsPublishing(true);
                window.api.publishSite(cwd).then(() => {
                    setIsPublishing(false)
                    resolve();
                })
            });
        })
    }


    return <div className="sidebar">
        <button className='siteInfo' onClick={() => navigate('/site/dashboard')}>
            <div className='favicon-container'>
                <div className='favicon'>
                    <img src={selectedSiteInfo['base64Favicon']}></img>
                </div>
            </div>
            <div className='info'>
                <h1>{selectedSiteInfo.title}</h1>
                <button onClick={() => resetSelectedSite(navigate)}><FeatherIcon icon="log-out" size={14} /></button>
            </div>
        </button>
        <ul className="containingList">
            <span class="listHeader">Collections <button onClick={() => setIsAddingCollection(true)}>+</button></span>
            {Object.keys(collections).map((collectionName) => (
                <li className="parent">
                    <button className='parent' onClick={() => { navigate(`/site/${collectionName}/posts`) }}>
                        <FeatherIcon icon="folder" size={15} fill="#547fdb" />
                        <span className="collectionLabel">{collectionName}</span>
                        <div style={{ flexGrow: 1 }}></div>
                        <button onClick={() => setCollectionToDelete(collectionName)}><FeatherIcon icon='trash' size={10} /></button>
                    </button>
                </li>
            ))}
        </ul>
        <div className='site-buttons'>
            <button onClick={() => build()} disabled={isBuilding || isPublishing ? true : false}>{isBuilding ? <ClipLoader size={10} color="#a0afc2" /> : <FeatherIcon icon="tool" size={15} />} Build</button>
            <button onClick={() => publish()} disabled={isBuilding || isPublishing ? true : false}>{isPublishing ? <ClipLoader size={10} color="#a0afc2" /> : <FeatherIcon icon="upload-cloud" size={15} />} Publish</button>
        </div>
    </div>
}

export default Sidebar