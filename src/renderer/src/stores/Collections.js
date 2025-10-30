import { create } from 'zustand'

const useCollectionsStore = create((set) => ({
    collections: {},
    actions: {
        setCollections: (collections) => set(state => ({ collections: { ...collections } })),
        addFileEntryToCollection: (fileEntry) => set(state => {
            const currentStateCollection = state['collections'][fileEntry.collection]
            let updatedCollection = [...currentStateCollection]
            updatedCollection.push(fileEntry);
            return { collections: { ...state.collections, [fileEntry.collection]:updatedCollection} };
        }),
        removeFileEntryFromCollection: (fileEntry) => set(state=> {
            const currentStateCollection = state['collections'][fileEntry.collection]
            console.log(currentStateCollection, state['collections'], fileEntry);
            let updatedCollection = [...currentStateCollection];
            updatedCollection = updatedCollection.filter(post => fileEntry.path != post.path)
            return { collections: { ...state.collections, [fileEntry.collection]:updatedCollection } };
        }),
        modifyFileEntryFromCollection: (eventData) => set(state=> {
            const { collection, fileName, metadata } = eventData;
            const currentStateCollection = state['collections'][collection]
            let updatedCollection = [...currentStateCollection];
            let targetPostIndex = null;
            targetPostIndex = updatedCollection.findIndex(({ name }) => {
                return fileName == name
            })
            updatedCollection[targetPostIndex]['data'] = metadata;
            return { collections: { ...state.collections, [collection]:updatedCollection } };
        })
    }
}));

export default useCollectionsStore;