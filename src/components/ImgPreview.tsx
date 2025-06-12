import React, { useState, useEffect, useRef } from 'react';
import { createPortal, render, unmountComponentAtNode } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ImgPreviewProps {
  src: string;
  alt: string;
  className?: string;
  onClose?: () => void;
}

// Create global modal container
const modalRoot = document.createElement('div');
modalRoot.className = 'modal-root';
document.body.appendChild(modalRoot);

const ImgPreview: React.FC<ImgPreviewProps> = ({ src, alt, className, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const portalRef = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    portalRef.current = document.createElement('div');
    modalRoot.appendChild(portalRef.current);
    return () => {
      if(!portalRef.current)return
      modalRoot.removeChild(portalRef.current);
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };
  if (hasError) {
    return createPortal(
      <motion.div
        className="fixed inset-0 z-5000 flex items-center justify-center bg-white dark:bg-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative flex items-center justify-center border-2 border-dashed border-red-500 rounded-lg p-4">
          <div className="text-red-500 font-medium">Failed to load image</div>
        </div>
      </motion.div>,
      portalRef.current!
    );
  }

  return createPortal(
    <AnimatePresence>
      {!isLoading && (
        <motion.div
          className="fixed inset-0 z-5000 flex items-center justify-center bg-white dark:bg-gray-900"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={onClose}
        >
          <motion.img
            src={src}
            alt={alt}
            className={`max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-xl ${className}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    portalRef.current!
  );
};

// Static control methods
export const showImagePreview = (props: Omit<ImgPreviewProps, 'onClose'>) => {
  const container = document.createElement('div');
  const closeHandler = () => {
    unmountComponentAtNode(container);
    document.body.removeChild(container);
  };

  render(
    <ImgPreview {...props} onClose={closeHandler} />,
    container
  );
  document.body.appendChild(container);
};

export default ImgPreview;
