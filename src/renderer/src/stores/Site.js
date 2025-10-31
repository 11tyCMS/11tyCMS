import { create } from 'zustand'
import useCollectionsStore from './Collections';

const updateSelectedSitesHistory = (siteCwd, siteData) => {
    const storedHistoryJSON = localStorage.getItem('selectedSiteHistory');
    const selectedSiteHistory = JSON.parse(storedHistoryJSON ? storedHistoryJSON : "[]");
    console.log('Checking for site', siteData, 'at', siteCwd);
    if(!selectedSiteHistory.some(historySiteData=>historySiteData.cwd == siteCwd)){
        const updatedSiteData = { ...siteData, cwd: siteCwd };
        localStorage.setItem("selectedSiteHistory", JSON.stringify([...selectedSiteHistory, updatedSiteData]))
    }
}
const useSiteStore = create((set) => ({
    cwd: "",
    selectedSiteInfo: null,
    actions: {
        openSiteFolder: async (navigate) => {
            const selectedSite = await window.api.openDirectoryWithDialog();
            const siteInfoData = await window.api.getSiteInfo(selectedSite.rootPath);
            set({ cwd: selectedSite.rootPath, selectedSiteInfo: siteInfoData })
            updateSelectedSitesHistory(selectedSite.rootPath, siteInfoData);
            useCollectionsStore.getState().actions.setCollections(selectedSite.collections)
            navigate('/site/')
        },
        openSiteByDir: async(navigate, dir)=>{
            const selectedSite = await window.api.openDirectory(dir);
            const siteInfoData = await window.api.getSiteInfo(selectedSite.rootPath);
            set({ cwd: selectedSite.rootPath, selectedSiteInfo: siteInfoData })
            updateSelectedSitesHistory(selectedSite.rootPath, siteInfoData);
            useCollectionsStore.getState().actions.setCollections(selectedSite.collections)
            navigate('/site/')
        },
        resetSelection: async(navigate)=>{
            set(useSiteStore.getInitialState());
            useCollectionsStore.setState(useCollectionsStore.getInitialState())
            navigate('/')
        }
    }
}))

export default useSiteStore;