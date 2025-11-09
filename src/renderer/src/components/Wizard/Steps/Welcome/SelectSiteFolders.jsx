import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

function SelectSiteFolders() {
    const [wizardState, updateWizardState, permitNextStep, isNextStepPermitted] = useOutletContext();
    const folderLabels = {
        input: "Input/content folder",
        includes: "Includes folder",
        data: "Data folder",
        output: "Output folder"
    }

    const onChange = ({target})=> updateWizardState({...wizardState, [target.name]:target.value})
    const renderFoldersForm = (folders)=>folders.map(folderKey=><label><b>{folderLabels[folderKey]}:</b> <input name={folderKey} defaultValue={wizardState[folderKey]} type="text" placeholder="/example/directory" onChange={onChange}/> </label>);
    useEffect(()=>{
        const keysToCheck = Object.keys(folderLabels);
        const fieldsComplete = !keysToCheck.map(key=>wizardState[key].length > 0).includes(false);
        if(fieldsComplete && !isNextStepPermitted)
            permitNextStep();
    }, [wizardState])
    return <>
        <p>
            For 11tyCMS to work, we need to specify your 11ty site's folders:
        </p>
        <form>
            {renderFoldersForm(Object.keys(folderLabels))}
        </form>    
    </>
}

export default SelectSiteFolders;