import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

function BuildAndPublishConfig() {
    const [wizardState, updateWizardState, permitNextStep, isNextStepPermitted] = useOutletContext();
    const formLabels = {
        'build': 'Build command',
        'publish': 'Publish command'
    }
    const onChange = ({ target }) => updateWizardState({ ...wizardState, [target.name]: target.value });
    const renderForm = (formKeys) => formKeys.map(formKey => <label><b>{formLabels[formKey]}:</b> <input name={formKey} defaultValue={wizardState[formKey]} onChange={onChange} /></label>)
    useEffect(() => {
        const keysToCheck = Object.keys(formLabels);
        const fieldsComplete = !keysToCheck.map(key => wizardState[key].length > 0).includes(false);
        if (fieldsComplete && !isNextStepPermitted)
            permitNextStep();
    }, [wizardState])
    return <>
        <p>
            Now we need to configure the build and publish commands. Remember that the publish command needs to take place in your output folder (typically "_site").
        </p>
        <form>
            {renderForm(Object.keys(formLabels))}
        </form>
    </>;
}

export default BuildAndPublishConfig;