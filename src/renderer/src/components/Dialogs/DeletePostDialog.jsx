import ConfirmationDialog from "./ConfirmationDialog";
import DialogBase from "./DialogBase";

const DeletePostDialog = ({ post, setPostToDelete }) => {
    const deletePost = (event, post) => {
        event.stopPropagation();
        window.api.deleteFile(post.path);
        setPostToDelete(null);
    }
    if (post)
        return <ConfirmationDialog confirmLabelText="Yes, delete this post" onConfirm={(e) => deletePost(e, post)} onCancel={() => setPostToDelete(null)} displayStatus={post} isConfirmDangerous={true}>
            <p>Are you sure you want to delete <b>{post.data.title}</b>?</p>
        </ConfirmationDialog>
    else
        return ''
}

export default DeletePostDialog;