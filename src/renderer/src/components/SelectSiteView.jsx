import { useNavigate } from "react-router-dom";
import useSiteStore from "../stores/Site";
import { useEffect, useState } from "react";

const SelectSiteView = () => {
    const [selectedSiteHistory, setSelectedSiteHistory] = useState([]);
    const openSiteFolder = useSiteStore(({ actions }) => actions.openSiteFolder);
    const openSiteByDir = useSiteStore(({ actions }) => actions.openSiteByDir);
    const navigate = useNavigate();
    useEffect(() => {
        const selectedSiteHistoryJSON = localStorage.getItem('selectedSiteHistory');
        if (selectedSiteHistoryJSON)
            setSelectedSiteHistory(JSON.parse(localStorage.getItem('selectedSiteHistory')));
    }, []);
    return <div style={{width:'100vw', display:'flex', alignItems:'center', justifyContent:'center'}}>
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