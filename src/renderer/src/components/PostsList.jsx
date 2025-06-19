import {useState, useRef, useEffect} from "react"
import AddFileDialog from './AddFileDialog'
import { MDXEditor } from "@mdxeditor/editor";
function PostsList({collection, posts, setSelectedFile, fetchFile, cwd}){
    const [displayAddFileDialog, setDisplayAddFileDialog] = useState(false);
    
    return <div className="postsList">
        
        <AddFileDialog displayStatus={displayAddFileDialog} setDisplayStatus={setDisplayAddFileDialog} fetchFile={fetchFile} collection={collection} cwd={cwd}></AddFileDialog>
        <h1>{collection} <button onClick={()=>setDisplayAddFileDialog(!displayAddFileDialog)}>+</button></h1>
        <ul>
            {posts.sort((a,b)=> b.data.date - a.data.date).map((post)=><li onClick={()=>fetchFile(post.path)}><label>{post.data.title ? post.data.title : post.path}</label> <span style={{justifySelf:"end"}}>{new Date(post.data.date).toLocaleDateString('en-US')}</span></li>)}
        </ul>
    </div>
}

export default PostsList