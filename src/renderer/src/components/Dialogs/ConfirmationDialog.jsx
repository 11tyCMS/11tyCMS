import DialogBase from "./DialogBase";

const ConfirmationDialog = ({ confirmLabelText = "Yes", cancelLabelText = "Cancel", headerLabelText = "Are you sure?", onCancel, onConfirm, children, displayStatus = false, isConfirmDangerous = false }) => {
    return <DialogBase displayStatus={displayStatus} title={headerLabelText}>
        {children}
        <div className='buttons'>
            {
                isConfirmDangerous ?
                    <>
                        <button onClick={onConfirm} className={`warning`}>{confirmLabelText}</button>
                        <button onClick={onCancel}>{cancelLabelText}</button>
                    </> 
                :
                <>
                    <button onClick={onCancel}>{cancelLabelText}</button>
                    <button onClick={onConfirm}>{confirmLabelText}</button>
                </>
            }

        </div>
    </DialogBase>
}

export default ConfirmationDialog;