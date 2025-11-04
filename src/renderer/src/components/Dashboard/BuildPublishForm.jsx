import { useEffect, useState } from "react";
import useSiteStore from "../../stores/Site";

const BuildPublishForm = ()=>{
    const [siteConfig, setSiteConfig] = useState(null)
    const getSiteConfig = useSiteStore(({actions})=>actions.getSiteConfig);
    useEffect(()=>{
        setSiteConfig(getSiteConfig());
    }, [])
    if(siteConfig){
        return <>
            <h2>Build & publish</h2>
            <span><b>Build command:</b> <input name="build" defaultValue={siteConfig.build}/></span><br/>
            <span><b>Publish command:</b> <input name="build" defaultValue={siteConfig.publish}/></span>
        </>
    } else{
        return ''
    }
}

export default BuildPublishForm;