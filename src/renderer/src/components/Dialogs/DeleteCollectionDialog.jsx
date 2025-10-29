import ConfirmationDialog from "./ConfirmationDialog";
import DialogBase from "./DialogBase";

const DeleteCollectionDialog = ({ collections, collection, setCollections, setCollectionToDelete }) => {
    const deleteCollection = (collectionName) => {
        window.api.deleteCollection(collectionName);
        let updatedCollections = { ...collections };
        delete updatedCollections[collectionName];
        setCollections(updatedCollections);
        setCollectionToDelete(null);
    }
    if (collection)
        return <ConfirmationDialog confirmLabelText={`Yes, delete ${collection} and all its posts.`} onConfirm={() => deleteCollection(collection)} onCancel={() => setCollectionToDelete(null)} displayStatus={collection}>
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