import { useState, useRef, useEffect } from 'react'
import FeatherIcon from 'feather-icons-react';
import { ClipLoader, SyncLoader } from 'react-spinners';
import { Navigate, useNavigate } from 'react-router-dom';
import useCollectionsStore, { useCollections } from '../../stores/Collections';
import useSiteStore, { useCwd, useResetSelection, useSelectedSiteInfo } from '../../stores/Site';
import SiteInfoPill from './SiteInfoPIll';

const Sidebar = ({ setCollectionToDelete, setIsAddingCollection }) => {
    const navigate = useNavigate();
    const collections = useCollections();
    const selectedSiteInfo = useSelectedSiteInfo()
    const resetSelectedSite = useResetSelection();
    const cwd = useCwd()
    const [isBuilding, setIsBuilding] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const build = (pubBuild) => {
        setIsBuilding(true);
        return window.api.buildSite().then(() => {
            setIsBuilding(false);
        })
    }
    const publish = () => {
        return new Promise((resolve) => {
            build(true).then(() => {
                setIsPublishing(true);
                window.api.publishSite().then(() => {
                    setIsPublishing(false)
                    resolve();
                })
            });
        })
    }


    return <div className="sidebar">
        <SiteInfoPill/>
        <ul>
            <span class="listHeader">Collections <button onClick={() => setIsAddingCollection(true)}>+</button></span>
            {Object.keys(collections).map((collectionName) => (
                <li className="parent">
                    <button className='parent' onClick={({target}) => { navigate(`/site/${collectionName}/posts`); target.blur(); target.parentElement.blur(); }}>
                        <FeatherIcon icon="folder" size={15} fill="#547fdb" />
                        <span className="collectionLabel">{collectionName}</span>
                    </button>
                    <div className='buttons'>
                        <button className='no-style' onClick={() => setCollectionToDelete(collectionName)}><FeatherIcon icon='trash' size={10} /></button>
                    </div>
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