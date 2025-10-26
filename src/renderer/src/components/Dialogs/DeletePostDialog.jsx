import DialogBase from "./DialogBase";

const DeletePostDialog = ({ post, setPostToDelete }) => {
    const deletePost = (event, post) => {
        event.stopPropagation();
        window.api.deleteFile(post.path);
        setPostToDelete(null);
    }
    if (post)
        return <DialogBase displayStatus={post} title="Are you sure?">
            <p>Are you sure you want to delete <b>{post.data.title}</b>?</p>
            <div className='buttons'>
                <button onClick={(e) => deletePost(e, post)}>Yes, delete it</button>
                <button onClick={()=>setPostToDelete(null)}>No</button>
            </div>
        </DialogBase>
    else
        return ''
}

export default DeletePostDialog;