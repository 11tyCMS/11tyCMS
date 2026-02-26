import { useState } from 'react';
import FeatherIcon from 'feather-icons-react';
const Field = ({ metadata, itemKey, saveMetadata, cancelAdd }) => {
    const key = itemKey;
    const creating = !key;
    const [selectedType, setSelectedType] = useState(null);
    const [newField, setNewField] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const deleteField = () => {
        setNewField({})
        setSelectedType(null);
    };
    const saveRemoveField = (field) => {
        let updatedMetadata = { ...metadata }
        delete updatedMetadata[field];
        saveMetadata(updatedMetadata);
    }
    const saveField = (key, value, newKey) => {
        let updatedMetadata = {...metadata}
        if(newKey){
            delete updatedMetadata[key];
            saveMetadata({ ...updatedMetadata, [newKey]: value })
        } else{
            saveMetadata({ ...updatedMetadata, [key]: value })
        }
        setIsEditing(false);
        deleteField();
        cancelAdd();
    }
    const standardOnChange = (event) => {
        let updatedNewField = { ...newField };
        updatedNewField['name'] = event.target.name;
        switch (event.target.value) {
            case "true":
                updatedNewField['value'] = true
                break;
            case "false":
                updatedNewField['value'] = false
                break
            default:
                updatedNewField['value'] = event.target.value;
                break;
        }
        setNewField(updatedNewField);
    }
    const renderFieldValueArea = (type, field) => {
        let value = null;
        if (metadata[field]) {
            value = metadata[field];
        }
        switch (type) {
            case "string":
                return <textarea defaultValue={value} name={field} type="text" placeholder="Text value" onChange={standardOnChange} />
                break;
            case "boolean":
                return <select defaultValue={value} name={field} onChange={standardOnChange}>
                    <option value={null} disabled selected>Select value</option>
                    <option value={true}>true</option>
                    <option value={false}>false</option>
                </select>
                break;
            default:
                break;
        }
    }
    if (creating)
        return <tr>
            <td>
                <textarea type="text" placeholder="Key" onChange={({ target }) => setNewField({ ...newField, name: target.value })} />
            </td>
            <td>
                <select placeholder="of type" onChange={({ target }) => setSelectedType(target.value)} disabled={[null, undefined, ""].includes(newField["name"])}>
                    <option disabled selected>of type</option>
                    <option value="string">Text</option>
                    <option value="boolean">Boolean</option>
                </select>
            </td>
            {
                selectedType ? (<>
                    <td className='value'>
                        {renderFieldValueArea(selectedType, newField['name'])}
                    </td>
                    <td>
                        <button onClick={cancelAdd}>Cancel</button>
                    </td>
                    <td>
                        <button onClick={() => saveField(newField['name'], newField['value'])}>Save</button>
                    </td>
                </>) : <td>
                    <button onClick={cancelAdd}>Cancel</button>
                </td>
            }
        </tr>
    if (isEditing)
        return <tr>
            <td>
                <input defaultValue={key} type="text" placeholder="Key" onChange={({ target }) => setNewField({ ...newField, name: target.value })} />
            </td>
            <td className='value'>
                {renderFieldValueArea(typeof metadata[key], key)}
            </td>
            <td>
                <button onClick={() => { setIsEditing(false) }}>Cancel</button>
            </td>
            <td>
                <button onClick={() => saveField(key, newField['value'], newField['name'] != key ? newField['name'] : undefined)}>Save</button>
            </td>
        </tr>
    return <tr tabIndex={0} onClick={({target})=>{target.blur();  target.parentElement.blur();}}>
        <td>
            <b>{key}</b>
        </td>
        <td className='value'>
            <p className='limitedHeight'>{String(metadata[key])}</p>
        </td>
        <td className='buttons'>
            <button onClick={() => {setIsEditing(true); setNewField({name:key, value:metadata[key]})}}><FeatherIcon icon="edit-2" color="#7c8ad6" size={12} /></button>
            <button onClick={() => saveRemoveField(key)}><FeatherIcon icon="trash-2" color="#7c8ad6" size={12} /></button>
        </td>
    </tr>
}

export default Field;