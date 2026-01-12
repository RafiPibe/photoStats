export default function FileUpload({ onFileChange, accept, currentFile }) {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-dark mb-4">Upload Photo</h2>

            <label className="relative flex flex-col gap-2 p-4 rounded-2xl border border-dashed border-cream-400 bg-cream-50 cursor-pointer hover:border-cream-500 hover:bg-cream-100 transition-colors duration-150">
                <input
                    type="file"
                    accept={accept}
                    onChange={onFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="text-center">
                    <div className="font-semibold text-dark">Choose a Photo</div>
                    <div className="text-sm text-cream-700 mt-1">
                        or drag and drop here
                    </div>
                    <div className="text-xs text-cream-600 mt-2">
                        Supports JPG, PNG, RAW, and HEIC formats
                    </div>
                </div>
            </label>

            {currentFile && (
                <div className="mt-4 text-sm text-cream-800">
                    <span className="font-medium">Selected:</span> {currentFile.name}
                </div>
            )}
        </div>
    );
}
