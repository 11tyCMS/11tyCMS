function SelectSiteFolders() {
    const folderLabels = {
        input: "Input/content folder",
        includes: "Includes folder",
        data: "Data folder",
        output: "Output folder"
    }
    const renderFoldersForm = (folders)=>folders.map(folderKey=><label><b>{folderLabels[folderKey]}:</b> <input name={folderKey} type="text" placeholder="/example/directory"/> </label>);

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