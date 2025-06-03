import {useState, useEffect} from 'react';
function DialogBase({displayStatus, children}){
    if(!displayStatus)
        return ''
    return <div className='dialog-modal-bg'>
        <div className="dialog">
            {children}
        </div>
    </div>
}

export default DialogBase;