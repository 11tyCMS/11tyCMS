import { useNavigate } from "react-router-dom";
import { useResetSelection, useSelectedSiteInfo } from "../../stores/Site";
import FeatherIcon from "feather-icons-react";

function SiteInfoPill() {
    const resetSelectedSite = useResetSelection();
    const selectedSiteInfo = useSelectedSiteInfo();
    const navigate = useNavigate();
    return <button className='siteInfo' onClick={() => navigate('/site/dashboard')}>
        <div className='favicon-container'>
            <div className='favicon'>
                <img src={selectedSiteInfo['base64Favicon']}></img>
            </div>
        </div>
        <div className='info'>
            <h1>{selectedSiteInfo.title}</h1>
            <button onClick={() => resetSelectedSite(navigate)} className='darkest'><FeatherIcon icon="log-out" size={14} /></button>
        </div>
    </button>;
}

export default SiteInfoPill;