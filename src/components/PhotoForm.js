import { cn } from '../utils/cn';

const FIELD_COLORS = [
    'border-l-red-500',
    'border-l-orange-500',
    'border-l-green-500',
    'border-l-emerald-700',
    'border-l-blue-500',
    'border-l-purple-500',
    'border-l-pink-500',
    'border-l-gray-500',
];

export default function PhotoForm({
    form,
    brandOptions = [],
    lensOptions = [],
    onChange,
    onBrandChange,
    onBrandCustomChange,
    onLensChange,
    onLensCustomChange
}) {
    const handleChange = (field) => (e) => onChange(field, e.target.value);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-dark mb-4">Photo Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera Name */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[0], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="cameraName" className="text-xs uppercase tracking-wider text-cream-700">
                        Camera Name
                    </label>
                    <input
                        id="cameraName"
                        type="text"
                        placeholder="Sony ILCE-7RM2"
                        value={form.cameraName}
                        onChange={handleChange('cameraName')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500"
                    />
                </div>

                {/* Brand */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[1], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="brand" className="text-xs uppercase tracking-wider text-cream-700">
                        Brand
                    </label>
                    <select
                        id="brand"
                        value={form.brandChoice}
                        onChange={onBrandChange}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100"
                    >
                        <option value="none">None</option>
                        {brandOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                        <option value="other">Other</option>
                    </select>
                    {form.brandChoice === 'other' && (
                        <input
                            type="text"
                            placeholder="Custom brand"
                            value={form.brandCustom}
                            onChange={onBrandCustomChange}
                            className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500"
                        />
                    )}
                </div>

                {/* Lens */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[2], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="lens" className="text-xs uppercase tracking-wider text-cream-700">
                        Lens Used
                    </label>
                    <select
                        id="lens"
                        value={form.lensChoice}
                        onChange={onLensChange}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100"
                    >
                        <option value="">None</option>
                        {lensOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                        <option value="other">Other</option>
                    </select>
                    {form.lensChoice === 'other' && (
                        <input
                            type="text"
                            placeholder="Custom lens"
                            value={form.lensCustom}
                            onChange={onLensCustomChange}
                            className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500"
                        />
                    )}
                </div>

                {/* Aperture */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[3], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="aperture" className="text-xs uppercase tracking-wider text-cream-700">
                        f
                    </label>
                    <input
                        id="aperture"
                        type="text"
                        placeholder="4"
                        value={form.aperture}
                        onChange={handleChange('aperture')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500 tabular-nums"
                    />
                </div>

                {/* Shutter Speed */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[4], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="shutterSpeed" className="text-xs uppercase tracking-wider text-cream-700">
                        Shutter Speed
                    </label>
                    <input
                        id="shutterSpeed"
                        type="text"
                        placeholder="1/125"
                        value={form.shutterSpeed}
                        onChange={handleChange('shutterSpeed')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500 tabular-nums"
                    />
                </div>

                {/* Focal Length */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[5], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="focalLength" className="text-xs uppercase tracking-wider text-cream-700">
                        mm
                    </label>
                    <input
                        id="focalLength"
                        type="text"
                        placeholder="46.1"
                        value={form.focalLength}
                        onChange={handleChange('focalLength')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500 tabular-nums"
                    />
                </div>

                {/* ISO */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[6], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="iso" className="text-xs uppercase tracking-wider text-cream-700">
                        ISO
                    </label>
                    <input
                        id="iso"
                        type="text"
                        placeholder="1000"
                        value={form.iso}
                        onChange={handleChange('iso')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100 placeholder:text-cream-500 tabular-nums"
                    />
                </div>

                {/* Orientation */}
                <div className={cn('bg-white rounded-2xl p-4 border border-cream-300 border-l-4', FIELD_COLORS[7], 'flex flex-col gap-2 min-h-[92px]')}>
                    <label htmlFor="orientation" className="text-xs uppercase tracking-wider text-cream-700">
                        Orientation
                    </label>
                    <select
                        id="orientation"
                        value={form.orientation}
                        onChange={handleChange('orientation')}
                        className="border-none outline-none text-base bg-transparent font-semibold text-dark-100"
                    >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
