import FeatherIcon from 'feather-icons-react';
import React, { useState } from 'react';
const Metadata = ({ selectedFile, saveMetadata }) => {
    const [newField, setNewField] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const addNewField = () => setNewField({name:null});
    const deleteField = ()=> {
        setNewField(null)
        setSelectedType(null);
    };
    const saveField = ()=>{
        saveMetadata({...selectedFile.data, [newField.name]:newField.value})
        deleteField();
    }
    const saveRemoveField = (field)=>{
        let updatedMetadata = {...selectedFile.data}
        delete updatedMetadata[field];
        saveMetadata(updatedMetadata);
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
        switch (type) {
            case "text":
                return <input name={field} type="text" placeholder="Text value" onChange={standardOnChange} />
                break;
            case "boolean":
                return <select name={field} onChange={standardOnChange}>
                    <option value={null} disabled selected>Select value</option>
                    <option value={true}>true</option>
                    <option value={false}>false</option>
                </select>
                break;
            default:
                break;
        }
    }
    return <table className="metadata">
        {selectedFile
            ? Object.keys(selectedFile.data)
                .filter((key) => key != 'title')
                .map((key) => (
                    <tr>
                        <td>
                            <b>{key}</b>
                        </td>
                        <td>
                            {String(selectedFile.data[key])}
                        </td>
                        <td className='buttons'>
                            <button onClick={()=>saveRemoveField(key)}><FeatherIcon icon="trash-2" color="#7c8ad6" size={12}/></button>
                        </td>
                    </tr>
                ))
            : ''}
        {newField ? <tr>
            <td>
                <input type="text" placeholder="Key" onChange={({target})=>setNewField({...newField, name:target.value})} />
            </td>
            <td>
                <select placeholder="of type" onChange={({ target }) => setSelectedType(target.value)} disabled={[null, undefined, ""].includes(newField["name"])}>
                    <option disabled selected>of type</option>
                    <option value="text">Text</option>
                    <option value="boolean">Boolean</option>
                </select>
            </td>
            {
                selectedType ? (<>
                    <td>
                        {renderFieldValueArea(selectedType, newField['name'])}
                    </td>
                    <td>
                        <button onClick={deleteField}>Delete</button>
                    </td>
                    <td>
                        <button onClick={saveField}>Save</button>
                    </td>
                </>) : ''
            }

        </tr> : ''}
        <tr>
            <td style={{ display: 'block' }}>
                <button style={{ width: '100%' }} onClick={addNewField} disabled={newField}>Add new property</button>
            </td>
        </tr>
    </table>;
}

export default Metadata;