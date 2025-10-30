import {useState} from 'react';
import DialogBase from './DialogBase';
import { useNavigate } from 'react-router-dom';
function AddFileDialog({displayStatus, setDisplayStatus, fetchFile, cwd, collection}){
    const [slug, setSlug] = useState('');
    const navigate = useNavigate();
    const createPost = (slug)=>{
        slug = slug
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replaceAll(' ', '-')
        const filePath = `${cwd}/${collection}/${slug}.md`
        window.api.saveFile(filePath, {}, "").then(()=>{
            setDisplayStatus(false);
            navigate(`/${collection}/posts/${slug}.md`)
        })
    }
    return <DialogBase displayStatus={displayStatus}>
        <input placeholder='File name here' onChange={(e)=>setSlug(e.target.value)}></input>
        <button onClick={()=>createPost(slug)}>Save</button>
    </DialogBase>

}

export default AddFileDialog;