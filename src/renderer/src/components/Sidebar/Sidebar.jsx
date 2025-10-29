import { useState, useRef, useEffect } from 'react'
import FeatherIcon from 'feather-icons-react';
import { ClipLoader, SyncLoader } from 'react-spinners';
import { Navigate, useNavigate } from 'react-router-dom';

const Sidebar = ({ setCollectionToDelete, collections, ipcHandle, selectedSiteInfo, setIsAddingCollection, setSelectedCollection, cwd}) => {
    const navigate = useNavigate();
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
        <div className='siteInfo' onClick={() => ipcHandle()}>
            {Object.keys(collections).length != 0 ? <><div className='favicon-container'>
                <div className='favicon'>
                    <img src={selectedSiteInfo['base64Favicon']}></img>
                </div>
            </div>
                <div className='info'>
                    <h1>{selectedSiteInfo.title}</h1>
                </div> </> : <><div className='info select-button'>
                    <h1>Select 11ty site</h1>
                </div></>}
        </div>
        <ul className="containingList">
            <span class="listHeader">Collections <button onClick={() => setIsAddingCollection(true)}>+</button></span>
            {Object.keys(collections).map((collectionName) => (
                <li className="parent">
                    <FeatherIcon icon="folder" size={15} fill="#547fdb" />
                    <span className="collectionLabel" onClick={() => {setSelectedCollection(collectionName); navigate(`/${collectionName}/posts`)}}>{collectionName}</span>
                    <div style={{ flexGrow: 1 }}></div>
                    <button onClick={() => setCollectionToDelete(collectionName)}><FeatherIcon icon='trash' size={10} /></button>
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