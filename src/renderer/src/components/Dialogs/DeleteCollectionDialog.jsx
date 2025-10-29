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
        return <DialogBase displayStatus={collection} title={`Delete ${collection}?`}>
            <p>Are you sure you want to delete the collection <b>{collection}</b>? <br /> <i>THIS WILL DELETE ALL POSTS IN THIS COLLECTION</i></p>
            <div className='buttons'>
                <button onClick={(e) => deleteCollection(collection)}>Yes, delete collection and it's posts</button>
                <button onClick={() => setCollectionToDelete(null)}>No</button>
            </div>
        </DialogBase>
    else
        return ''
}

export default DeleteCollectionDialog;