import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

export default function Tutorial({ isOpen, onClose }) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tutorial-title"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-cream-100 hover:bg-cream-200 transition-colors duration-200"
                aria-label="Close tutorial"
              >
                <svg
                  className="w-5 h-5 text-dark"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="p-8 sm:p-12">
                <h2
                  id="tutorial-title"
                  className="font-display text-3xl sm:text-4xl font-bold text-dark mb-4"
                >
                  How to Use PhotoStats
                </h2>
                <p className="text-lg text-cream-700 mb-8">
                  Follow these simple steps to create stunning EXIF overlays for your photos.
                </p>

                {/* Tutorial Steps */}
                <div className="space-y-8 mb-12">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Upload Your Photo</h3>
                      <p className="text-cream-700">
                        Click the upload area or drag and drop your photo. Supports JPG, PNG, RAW, and HEIC formats.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Review Auto-Extracted Data</h3>
                      <p className="text-cream-700">
                        PhotoStats automatically reads EXIF data from your photo, including camera model, lens, aperture, shutter speed, focal length, and ISO.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Customize Settings</h3>
                      <p className="text-cream-700">
                        Adjust any field as needed. Choose your camera brand, lens, and orientation (portrait or landscape).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Download Your Image</h3>
                      <p className="text-cream-700">
                        Click "Download PNG" to save your photo with the professional EXIF overlay.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Demo */}
                <div className="mb-8">
                  <h3 className="font-semibold text-dark mb-4 text-xl">Watch it in Action</h3>
                  <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-50">
                    <img
                      src="/tutorial.gif"
                      alt="Tutorial demonstration showing the workflow"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Example Result */}
                <div>
                  <h3 className="font-semibold text-dark mb-4 text-xl">Example Result</h3>
                  <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-50">
                    <img
                      src="/example.png"
                      alt="Example result showing EXIF overlay with camera settings"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
