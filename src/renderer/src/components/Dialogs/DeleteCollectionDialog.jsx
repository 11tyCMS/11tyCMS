import useCollectionsStore, { useDeleteCollection } from "../../stores/Collections";
import ConfirmationDialog from "./ConfirmationDialog";
import DialogBase from "./DialogBase";

const DeleteCollectionDialog = ({collection, setCollectionToDelete }) => {
    const removeCollection = useDeleteCollection();
    const deleteCollection = (collectionName) => {
        removeCollection(collectionName)
        setCollectionToDelete(null);
    }
    if (collection)
        return <ConfirmationDialog confirmLabelText={`Yes, delete ${collection} and all its posts.`} onConfirm={() => deleteCollection(collection)} onCancel={() => setCollectionToDelete(null)} displayStatus={collection} isConfirmDangerous={true}>
            <p>
                Are you sure you want to delete the collection <b>{collection}</b>?
                <br />
                <i>THIS WILL DELETE ALL POSTS IN THIS COLLECTION</i>
            </p>
        </ConfirmationDialog>
    else
        return ''
}

export default DeleteCollectionDialog;