import FeatherIcon from 'feather-icons-react';
import React, { useState } from 'react';
import Field from './Field';
const Metadata = ({ selectedFile, saveMetadata }) => {
    console.log('%c 11tyCMS Debug ', 'background: black; color: violet; font-weight:800;', `Metadata for ${selectedFile.fileName}\n`, selectedFile.data);
    const [newField, setNewField] = useState(null);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const addNewField = () => setNewField({name:null});
    const cancelAdd = ()=>setNewField(null);
    return <table className="metadata">
        {selectedFile
            ? Object.keys(selectedFile.data)
                .filter((key) => key != 'title')
                .map((key) => (
                    <Field metadata={selectedFile.data} itemKey={key} saveMetadata={saveMetadata} setIsEditingStatus={setIsEditingStatus} isEditingStatus={isEditingStatus}/>
                ))
            : ''}
        {newField ? <Field metadata={selectedFile.data} key={undefined} saveMetadata={saveMetadata} cancelAdd={cancelAdd}/> : ''}
        <tr>
            <td style={{ display: 'block' }}>
                <button style={{ width: '100%' }} onClick={addNewField} disabled={newField}>Add new property</button>
            </td>
        </tr>
    </table>;
}

export default Metadata;