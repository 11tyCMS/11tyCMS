import { create } from 'zustand'
import useCollectionsStore from './Collections';

const useSiteStore = create((set) => ({
    cwd: "",
    selectedSiteInfo: null,
    actions: {
        openSiteFolder: async () => {
            const selectedSite = await window.api.openDirectory();
            const siteInfoData = await window.api.getSiteInfo(selectedSite.rootPath);
            set({ cwd: selectedSite.rootPath, selectedSiteInfo: siteInfoData })
            useCollectionsStore.getState().actions.setCollections(selectedSite.collections)
        }
    }
}))

export default useSiteStore;