import { useNavigate } from "react-router-dom";
import { useResetSelection, useSelectedSiteInfo } from "../../stores/Site";
import FeatherIcon from "feather-icons-react";

function SiteInfoPill() {
    const resetSelectedSite = useResetSelection();
    const selectedSiteInfo = useSelectedSiteInfo();
    const navigate = useNavigate();
    return <div className='siteInfo' onClick={() => navigate('/site/dashboard')}>
        <button className="no-style infoContainer">
            <div className='favicon-container'>
                <div className='favicon'>
                    {
                        !selectedSiteInfo['base64Favicon'] ? <FeatherIcon icon="globe" size={20} /> : <img src={selectedSiteInfo['base64Favicon']}/>
                    }
                </div>
            </div>
            <div className='info'>
                <h1>{selectedSiteInfo.title}</h1>
            </div>
        </button>
        <button onClick={() => resetSelectedSite(navigate)} className='icon darkest exit'><FeatherIcon icon="log-out" size={12} /></button>
    </div>;
}

export default SiteInfoPill;