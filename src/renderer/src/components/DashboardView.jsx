import { useState, useEffect } from "react";
import useSiteStore from "../stores/Site";
const excludedKeys = ['layouts', 'base64Favicon']
const excludedSiteInfoKeysFilter = key=> !excludedKeys.includes(key)
const DashboardView = ()=>{
    const selectedSiteInfo = useSiteStore(({selectedSiteInfo})=>selectedSiteInfo);
    const updateSelectedSiteInfo = useSiteStore(({actions})=>actions.updateSelectedSiteInfo);
    const [formData, setFormData] = useState({});
    useEffect(()=>{
        setFormData(selectedSiteInfo);
    }, [selectedSiteInfo])
    const onFormChangeValue = ({target})=>setFormData({...formData, [target.name]:target.value})
    const renderForm = (data)=>{
        const dataKeys = Object.keys(data).filter(excludedSiteInfoKeysFilter)
        return dataKeys.map(key=>{
            if(typeof data[key] != "object"){
                return <><span><b>{key}:</b> <input type="text" name={key} defaultValue={data[key]} onChange={onFormChangeValue}/></span>  </>
            } else{
                return <><h2>{key}</h2> <br/> {renderForm(data[key])}</>
            }
        })
    }
    const saveSiteInfo = ()=>{
        let updatedSiteInfo = {...formData}
        excludedKeys.forEach(key=>{
            delete updatedSiteInfo[key];
        })
        updateSelectedSiteInfo(updatedSiteInfo)
    }
    if(selectedSiteInfo)
        return <>
            <h1>{selectedSiteInfo.title}</h1>
            {renderForm(selectedSiteInfo)}
            <button onClick={saveSiteInfo}>Save site info</button>
        </>
    else
        return ''
}

export default DashboardView;