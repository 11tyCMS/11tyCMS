import { useState, useEffect, useRef } from 'react';
function DialogBase({ displayStatus, title, children }) {
    const modalRef = useRef(null);
    useEffect(() => {
        if (!displayStatus)
            return;
        const modalElement = modalRef.current;
        modalElement.focus()
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKeyPress = (event) => {
            if (event.key != "Tab")
                return;
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };



        modalElement.addEventListener("keydown", handleTabKeyPress);

        return () => {
            modalElement.removeEventListener("keydown", handleTabKeyPress);
        };

    }, [displayStatus])
    if (!displayStatus)
        return ''
    return <div className='dialog-modal-bg'>
        <div className="dialog" ref={modalRef} tabIndex={0}>
            {title ? <h1>{title}</h1> : ''}
            <div className='content'>
                {children}
            </div>
        </div>
    </div>
}

export default DialogBase;