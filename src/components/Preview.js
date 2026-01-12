export default function Preview({ canvasRef, imageUrl, layout, onDownload, fileName }) {
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-cream-300 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-base font-semibold text-dark m-0">Output Preview</h2>
                    <p className="text-sm text-cream-700 mt-1 m-0">
                        {layout ? `${layout.canvasWidth} x ${layout.canvasHeight}px` : 'Waiting for image'}
                    </p>
                </div>

                {imageUrl && (
                    <button
                        onClick={onDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark text-white text-sm font-semibold hover:bg-dark-100 transition-colors duration-200"
                        aria-label="Download PNG"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Download PNG</span>
                    </button>
                )}
            </div>

            <div className="rounded-3xl p-5 bg-gradient-to-br from-white to-cream-100 border border-cream-300 min-h-[420px] flex items-center justify-center">
                {imageUrl ? (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-auto rounded-2xl bg-white shadow-2xl"
                    />
                ) : (
                    <div className="text-center text-cream-700 max-w-60">
                        Upload a photo to see the final frame.
                    </div>
                )}
            </div>
        </div>
    );
}
