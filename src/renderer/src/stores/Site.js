import { create } from 'zustand'
import useCollectionsStore from './Collections';

const updateSelectedSitesHistory = (siteCwd, siteData) => {
    const storedHistoryJSON = localStorage.getItem('selectedSiteHistory');
    const selectedSiteHistory = JSON.parse(storedHistoryJSON ? storedHistoryJSON : "[]");
    console.log('Checking for site', siteData, 'at', siteCwd);
    if (!selectedSiteHistory.some(historySiteData => historySiteData.cwd == siteCwd)) {
        const updatedSiteData = { ...siteData, cwd: siteCwd };
        localStorage.setItem("selectedSiteHistory", JSON.stringify([...selectedSiteHistory, updatedSiteData]))
    }
}
const updateSiteInSiteHistory = (siteCwd, siteData) => {
    let selectedSiteHistory = JSON.parse(localStorage.getItem('selectedSiteHistory'));
    selectedSiteHistory.forEach((siteEntry, index) => {
        if (siteEntry.cwd == siteCwd)
            selectedSiteHistory[index] = { ...siteEntry, ...siteData };
    })
    localStorage.setItem('selectedSiteHistory', JSON.stringify(selectedSiteHistory))
}
const deleteSiteInSiteHistory = (siteCwd) => {
    let selectedSiteHistory = JSON.parse(localStorage.getItem('selectedSiteHistory'));
    let updatedSelectedSiteHistory = selectedSiteHistory.filter((site)=>site.cwd != siteCwd);
    localStorage.setItem('selectedSiteHistory', JSON.stringify(updatedSelectedSiteHistory));
    return updatedSelectedSiteHistory;
}
const useSiteStore = create((set) => ({
    cwd: "",
    selectedSiteInfo: null,
    selectedSiteConfig: null,
    actions: {
        createSiteConfigFile: async (siteConfigData) => await window.api.createSiteConfigFile(siteConfigData),
        openSiteFolder: async (navigate) => {
            const selectedSite = await window.api.openDirectoryWithDialog();
            if (selectedSite.status == "NEW") {
                set({ cwd: selectedSite.selectedDirectory })
                navigate('/welcome')
                return
            }
            const siteInfoData = await window.api.getSelectedSiteInfo();
            const siteConfigData = await window.api.getSiteConfig();
            set({ cwd: selectedSite.rootPath, selectedSiteInfo: siteInfoData, selectedSiteConfig: siteConfigData })
            updateSelectedSitesHistory(selectedSite.rootPath, siteInfoData);
            useCollectionsStore.getState().actions.setCollections(selectedSite.collections)
            navigate('/site/')
        },
        openSiteByDir: async (navigate, dir, newSiteConfigData) => {
            const selectedSite = await window.api.openDirectory(dir, newSiteConfigData);
            const siteConfigData = await window.api.getSiteConfig();
            const siteInfoData = await window.api.getSelectedSiteInfo();
            set({ cwd: selectedSite.rootPath, selectedSiteInfo: siteInfoData, selectedSiteConfig: siteConfigData })
            updateSelectedSitesHistory(selectedSite.rootPath, siteInfoData);
            useCollectionsStore.getState().actions.setCollections(selectedSite.collections)
            navigate('/site/')
        },
        updateSelectedSiteInfo: async (data) => {
            await window.api.setSiteInfo(data);
            set({ selectedSiteInfo: { ...useSiteStore.getState()['selectedSiteInfo'], ...data } })
            updateSiteInSiteHistory(useSiteStore.getState().cwd, data)
        },
        setSelectedSiteConfig: async (data) => {
            await window.api.setSiteConfig(data);
            set({ selectedSiteConfig: data });
        },
        resetSelection: async (navigate) => {
            set(useSiteStore.getInitialState());
            useCollectionsStore.setState(useCollectionsStore.getInitialState())
            navigate('/')
        },
        getInputDir: () => {
            const state = useSiteStore.getState();
            console.log(state)
            return `${state.cwd}/${state.selectedSiteConfig.input ? state.selectedSiteConfig.input : ''}/`
        }
    }
}))

export default useSiteStore;
export const useCwd = () => useSiteStore(({ cwd }) => cwd);
export const useSelectedSiteInfo = () => useSiteStore(({ selectedSiteInfo }) => selectedSiteInfo);
export const useSelectedSiteConfig = () => useSiteStore(({ selectedSiteConfig }) => selectedSiteConfig);

// Actions:
export const useOpenSiteFolder = () => useSiteStore(({ actions }) => actions.openSiteFolder);
export const useOpenSiteByDir = () => useSiteStore(({ actions }) => actions.openSiteByDir);
export const useUpdateSelectedSiteInfo = () => useSiteStore(({ actions }) => actions.updateSelectedSiteInfo);
export const useSetSelectedSiteConfig = () => useSiteStore(({ actions }) => actions.setSelectedSiteConfig);
export const useResetSelection = () => useSiteStore(({ actions }) => actions.resetSelection);
export const useGetInputDir = () => useSiteStore(({ actions }) => actions.getInputDir);
export const useDeleteSiteFromSiteHistory = deleteSiteInSiteHistory;