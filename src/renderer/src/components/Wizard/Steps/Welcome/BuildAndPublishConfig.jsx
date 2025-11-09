function BuildAndPublishConfig() {
    const formLabels = {
        'build': 'Build command',
        'publish': 'Publish command'
    }
    const renderForm = (formKeys)=>formKeys.map(formKey=><label><b>{formLabels[formKey]}:</b> <input name={formKey}/></label>)
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