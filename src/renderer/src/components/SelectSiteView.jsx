import { useNavigate } from "react-router-dom";
import useSiteStore, { useDeleteSiteFromSiteHistory, useOpenSiteByDir, useOpenSiteFolder } from "../stores/Site";
import { useEffect, useState } from "react";
import logo from '../assets/logo.png'
import FeatherIcon from "feather-icons-react";
const SelectSiteView = () => {
    const [selectedSiteHistory, setSelectedSiteHistory] = useState([]);
    const openSiteFolder = useOpenSiteFolder();
    const openSiteByDir = useOpenSiteByDir();
    const navigate = useNavigate();
    const deleteSiteFromHistory = (cwd)=>{
        setSelectedSiteHistory(useDeleteSiteFromSiteHistory(cwd));
    }
    useEffect(() => {
        const selectedSiteHistoryJSON = localStorage.getItem('selectedSiteHistory');
        if (selectedSiteHistoryJSON)
            setSelectedSiteHistory(JSON.parse(localStorage.getItem('selectedSiteHistory')));
    }, []);
    return <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', gap: 50, alignItems: 'center', justifyContent: 'center' }}>
        <img src={logo} width={200} />
        <ul className="siteSelector">
            {selectedSiteHistory.map((site) => <li><button className='siteInfo' onClick={() => openSiteByDir(navigate, site.cwd)}>
                <div className='favicon-container'>
                    <div className='favicon'>
                        {
                            site['base64Favicon'] ? <img src={site['base64Favicon']} alt={`${site.title}'s favicon`} /> : <FeatherIcon icon="globe" size={20} />
                        }
                    </div>
                </div>
                <div className='info'>
                    <span>{site.title}</span>
                </div>
            </button><div className="buttons">
                <button className='no-style' onClick={() => {deleteSiteFromHistory(site.cwd);}}><FeatherIcon icon='trash' size={13} /></button>
                </div></li>)}
            <button onClick={() => openSiteFolder(navigate)} style={{ marginTop: 10 }}>Open 11ty site</button>
        </ul>

    </div>
}

export default SelectSiteView;