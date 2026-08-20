import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

export function Modal({ isOpen, onClose, title, children, className }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialogNode = dialogRef.current
    if (isOpen) {
      if (!dialogNode.hasAttribute('open')) {
        dialogNode.showModal()
      }
    } else {
      if (dialogNode.hasAttribute('open')) {
        dialogNode.close()
      }
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
  }

  // Prevent clicks inside the modal from closing it
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      handleClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleDialogClick}
      className={cn(
        "backdrop:bg-slate-900/40 p-0 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 text-foreground border-none outline-none",
        "open:animate-in open:fade-in-90 open:zoom-in-95",
        className
      )}
    >
      <div className="flex flex-col w-full min-w-[300px] max-w-lg p-6">
        {title && (
          <h2 className="text-2xl font-black text-indigo-950 dark:text-indigo-50 mb-6" id="modal-title">
            {title}
          </h2>
        )}
        <div className="flex-1" aria-labelledby={title ? "modal-title" : undefined}>
          {children}
        </div>
      </div>
    </dialog>
  )
}
