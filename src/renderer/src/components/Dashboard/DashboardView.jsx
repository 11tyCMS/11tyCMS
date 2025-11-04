import { useState, useEffect } from "react";
import useSiteStore from "../../stores/Site";
const excludedKeys = ['layouts', 'base64Favicon']
const excludedSiteInfoKeysFilter = key => !excludedKeys.includes(key)
const DashboardView = () => {
    const selectedSiteInfo = useSiteStore(({ selectedSiteInfo }) => selectedSiteInfo);
    const updateSelectedSiteInfo = useSiteStore(({ actions }) => actions.updateSelectedSiteInfo);
    const setSelectedSiteConfig = useSiteStore(({ actions }) => actions.setSelectedSiteConfig);
    const siteConfig = useSiteStore(({ selectedSiteConfig }) => selectedSiteConfig);
    const [formData, setFormData] = useState({});
    const [siteConfigForm, setSiteConfig] = useState(siteConfig)
    useEffect(() => {
    }, [])
    useEffect(() => {
        setFormData(selectedSiteInfo);
    }, [selectedSiteInfo])
    const onFormChangeValue = ({ target }) => setFormData({ ...formData, [target.name]: target.value })
    const onSiteConfigFormChange = (({target})=>setSiteConfig({...siteConfigForm, [target.name]:target.value}))
    const renderForm = (data) => {
        const dataKeys = Object.keys(data).filter(excludedSiteInfoKeysFilter)
        return dataKeys.map(key => {
            if (typeof data[key] != "object") {
                return <><span><b>{key}:</b> <input type="text" name={key} defaultValue={data[key]} onChange={onFormChangeValue} /></span>  </>
            } else {
                return <><h2>{key}</h2> <br /> {renderForm(data[key])}</>
            }
        })
    }
    const saveSiteInfo = () => {
        let updatedSiteInfo = { ...formData }
        excludedKeys.forEach(key => {
            delete updatedSiteInfo[key];
        })
        updateSelectedSiteInfo(updatedSiteInfo)
        console.log(siteConfigForm);
        setSelectedSiteConfig(siteConfigForm);
    }
    if (selectedSiteInfo && siteConfig)
        return <>
            <h1>{selectedSiteInfo.title}</h1>
            {renderForm(selectedSiteInfo)}
            <h2>Build & publish</h2>
            <span><b>Build command:</b> <input name="build" defaultValue={siteConfig.build} onChange={onSiteConfigFormChange}/></span><br />
            <span><b>Publish command:</b> <input name="build" defaultValue={siteConfig.publish} onChange={onSiteConfigFormChange}/></span>
            <button onClick={saveSiteInfo}>Save site info</button>
        </>
    else
        return ''
}

export default DashboardView;