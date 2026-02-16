import { useNavigate } from "react-router-dom";
import useSiteStore, { useOpenSiteByDir, useOpenSiteFolder } from "../stores/Site";
import { useEffect, useState } from "react";
import logo from '../assets/logo.png'
const SelectSiteView = () => {
    const [selectedSiteHistory, setSelectedSiteHistory] = useState([]);
    const openSiteFolder = useOpenSiteFolder();
    const openSiteByDir = useOpenSiteByDir();
    const navigate = useNavigate();
    useEffect(() => {
        const selectedSiteHistoryJSON = localStorage.getItem('selectedSiteHistory');
        if (selectedSiteHistoryJSON)
            setSelectedSiteHistory(JSON.parse(localStorage.getItem('selectedSiteHistory')));
    }, []);
    return <div style={{width:'100vw', display:'flex', flexDirection:'column', gap:50, alignItems:'center', justifyContent:'center'}}>
        <img src={logo} width={200}/>
        <div className="siteSelector">
            {selectedSiteHistory.map((site) => <button className='siteInfo' onClick={()=>openSiteByDir(navigate, site.cwd)}>
                <div className='favicon-container'>
                    <div className='favicon'>
                        <img src={site['base64Favicon']}></img>
                    </div>
                </div>
                <div className='info'>
                    <span>{site.title}</span>
                </div>
            </button>)}
            <button onClick={()=>openSiteFolder(navigate)} style={{marginTop:10}}>Open 11ty site</button>
        </div>

    </div>
}

export default SelectSiteView;