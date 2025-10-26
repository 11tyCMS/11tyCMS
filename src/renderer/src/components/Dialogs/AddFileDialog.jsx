import {useState} from 'react';
import DialogBase from './DialogBase';
function AddFileDialog({displayStatus, setDisplayStatus, fetchFile, cwd, collection}){
    const [slug, setSlug] = useState('');
    const createPost = (slug)=>{
        slug = slug
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replaceAll(' ', '-')
        const filePath = `${cwd}/${collection}/${slug}.md`
        window.api.saveFile(filePath, {}, "").then(()=>{
            setDisplayStatus(false);
            fetchFile(filePath)
        })
    }
    return <DialogBase displayStatus={displayStatus}>
        <input placeholder='File name here' onChange={(e)=>setSlug(e.target.value)}></input>
        <button onClick={()=>createPost(slug)}>Save</button>
    </DialogBase>

}

export default AddFileDialog;