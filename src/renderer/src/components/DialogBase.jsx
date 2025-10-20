import {useState, useEffect} from 'react';
function DialogBase({displayStatus, title, children}){
    if(!displayStatus)
        return ''
    return <div className='dialog-modal-bg'>
        <div className="dialog">
            {title ? <h1>{title}</h1> : ''}
            <div className='content'>
                {children}
            </div>
        </div>
    </div>
}

export default DialogBase;