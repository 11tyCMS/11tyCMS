import { useState } from "react";
import DialogBase from "./DialogBase";
import useCollectionsStore from "../../stores/Collections";

const AddCollectionDialog = ({ siteInfo, displayStatus = false, setDisplayStatus, cwd }) => {
    const [formData, setFormData] = useState(null);
    const addCollection = useCollectionsStore(({actions})=>actions.addCollection)
    const formHandler = ({ target }) => {
        let updatedFormData
        const { value, name } = target;
        if (!formData)
            updatedFormData = {}
        else
            updatedFormData = { ...formData };
        updatedFormData[name] = value;
        setFormData(updatedFormData);
    }
    if (displayStatus)
        return <DialogBase displayStatus={displayStatus} title="Create collection">
            <form style={{ display: 'flex', flexDirection: 'column' }}>
                <input name="name" placeholder="Name" onChange={formHandler} />
                <select name="layout" placeholder="Template" onChange={formHandler}>
                    <option disabled selected value={undefined}>Select template</option>
                    {Object.keys(siteInfo.layouts).map(layoutKey => <option value={layoutKey}>{siteInfo.layouts[layoutKey].layoutTitle ? siteInfo.layouts[layoutKey].layoutTitle : layoutKey.split('.html')[0]}</option>)}
                </select>
            </form>
            <div className='buttons'>
                <button onClick={(e) => {
                    addCollection(cwd, formData);
                    setDisplayStatus(false);
                }}>Create</button>
                <button onClick={() => { setDisplayStatus(false) }}>Cancel</button>
            </div>
        </DialogBase>
    else
        return ''
}

export default AddCollectionDialog;