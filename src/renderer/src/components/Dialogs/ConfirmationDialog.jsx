import DialogBase from "./DialogBase";

const ConfirmationDialog = ({ confirmLabelText = "Yes", cancelLabelText = "Cancel", headerLabelText = "Are you sure?", onCancel, onConfirm, children, displayStatus = false, isConfirmDangerous=false }) => {
    return <DialogBase displayStatus={displayStatus} title={headerLabelText}>
        {children}
        <div className='buttons'>
            <button onClick={onConfirm} className={`${isConfirmDangerous ? 'warning' : ''}`}>{confirmLabelText}</button>
            <button onClick={onCancel}>{cancelLabelText}</button>
        </div>
    </DialogBase>
}

export default ConfirmationDialog;