import { useState } from 'react';
import DialogBase from './DialogBase';
import { useNavigate } from 'react-router-dom';
import useSiteStore, { useGetInputDir } from '../../stores/Site';
import ConfirmationDialog from './ConfirmationDialog';
import { useGetCollectionDefaultMetadata } from '../../stores/Collections';
function AddFileDialog({ displayStatus, setDisplayStatus, fetchFile, cwd, collection }) {
    const [slug, setSlug] = useState('');
    const navigate = useNavigate();
    const getInputDir = useGetInputDir()
    const getCollectionDefaultMetadata = useGetCollectionDefaultMetadata();
    const createPost = (slug) => {
        slug = slug
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replaceAll(' ', '-')
        getCollectionDefaultMetadata(collection).then(collectionDefaultMetadata => {
            window.api.saveFile(collection, `${slug}.md`, collectionDefaultMetadata, "").then(() => {
                setDisplayStatus(false);
                navigate(`/site/${collection}/posts/${slug}.md`)
            })
        })
    }
    return <ConfirmationDialog displayStatus={displayStatus} confirmLabelText="Save" headerLabelText={`Add post to ${collection}`} onConfirm={() => createPost(slug)} onCancel={() => setDisplayStatus(false)}>
        <input placeholder='File name here' onChange={(e) => setSlug(e.target.value)}></input>
    </ConfirmationDialog>

}

export default AddFileDialog;