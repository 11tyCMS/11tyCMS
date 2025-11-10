import useSiteStore from "../../../../stores/Site";
import BuildAndPublishConfig from "./BuildAndPublishConfig"
import Finished from "./Finished";
import SelectSiteFolders from "./SelectSiteFolders"
import Welcome from "./Welcome"

const routes = [
    { path: '', element: <Welcome />, label: "Welcome!", root: true, layoutDirection: 'row' },
    { path: 'folders', element: <SelectSiteFolders />, label: "Site folders", layoutDirection: 'column' },
    { path: 'build-publish-config', element: <BuildAndPublishConfig />, label: "Build & publish", layoutDirection: 'column' },
    { path: 'finished', element: <Finished />, label: "Finished!", layoutDirection: 'row' },
]
export default routes;
export const defaultWelcomeWizardState = {
    input: "",
    includes: "",
    data: "",
    output: "",
    build: "npx @11ty/eleventy",
    publish: ""
}

export const finalAction = (wizardState, navigate)=>{
    const cwd = useSiteStore.getState().cwd;
    useSiteStore.getState().actions.openSiteByDir(navigate, cwd, wizardState);
}