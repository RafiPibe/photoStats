# PhotoStats

Made with ❤️ for photographers (Including me)

**Beautiful EXIF Data Overlays for Your Photos**

The main reason on why I made this is I can't find that photo metadata thing that people usually use for their photos. Hence I said to myself, hey what about I make it myself, and share it to others that is also in pain of searching it (lmao).

PhotoStats is a web application that automatically extracts EXIF metadata from your photos and creates visual overlays with camera, lens, and shooting information. Perfect for those who want to share their work with their technical details of camera and settings.

![PhotoStats Hero](https://via.placeholder.com/1200x600/f6f1ea/1b1712?text=PhotoStats)

## Features

- **Automatic EXIF Extraction** - Upload any photo and instantly extract camera settings
- **Clean Overlays** - Clean, professional design with camera branding (Can do custom too)
- **Complete Metadata** - Camera name, lens, aperture, shutter speed, focal length, and ISO
- **Multiple Formats** - Supports JPG, PNG, RAW files (ARW, DNG, NEF, CR2, CR3, ORF, RAF, RW2, PEF), and HEIC
- **Brand Logos** - Automatic logo detection for major camera brands (Sony, Canon, Nikon, Fujifilm, Leica, and more)
- **In-Browser Processing** - All processing happens locally - your photos never leave your device
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Portrait & Landscape** - Support for both orientations

## Quick Start

### Prerequisites

- Node.js 14+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/rafipibe/photostats.git

# Navigate to the project directory
cd photostats

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a Photo** - Click "Choose a Photo" or drag and drop your image
2. **Review EXIF Data** - The app automatically extracts and displays camera settings
3. **Edit if Needed** - Manually adjust any fields that weren't detected correctly
4. **Choose Orientation** - Select portrait or landscape layout
5. **Download** - Click "Download PNG" to save your image with the EXIF overlay

## Supported Camera Brands

PhotoStats includes logo assets for the following brands:

- 7Artisans
- Apple
- Canon
- DJI
- Fujifilm
- Google
- GoPro
- Hasselblad
- Huawei
- Laowa
- Leica
- Lumix (Panasonic)
- Minolta
- Nikon
- Olympus
- Pentax
- Ricoh
- Samsung
- Samyang
- Sigma
- Sony
- Tamron
- TTArtisan
- Zeiss
- Xiaomi

## Project Structure

```
photostats/
├── public/
│   ├── logos/          # Camera brand logos (SVG/PNG)
│   └── index.html
├── src/
│   ├── utils/
│   │   └── exif.js     # EXIF parsing utilities
│   ├── App.js          # Main application component
│   ├── App.css         # Application styles
│   └── index.js        # Entry point
└── package.json
```

## Built With

- **React** - UI framework
- **exifr** - EXIF metadata extraction
- **libraw-wasm** - RAW file processing in the browser
- **Plus Jakarta Sans** - Typography
- **Canvas API** - Image rendering and overlay generation

## Adding Custom Logos

To add a new camera brand logo:

1. Add your logo file (SVG or PNG) to `public/logos/`
2. Update the `BRAND_LOGOS` object in `src/App.js`:

```javascript
const BRAND_LOGOS = {
  // ... existing logos
  'YourBrand': '/logos/YourBrand.svg',
};
```

3. Add the brand to `BRAND_MATCHERS` for auto-detection:

```javascript
const BRAND_MATCHERS = [
  // ... existing matchers
  { pattern: /yourbrand/i, label: 'YourBrand' },
];
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Camera brand logos are property of their respective owners
- EXIF parsing powered by [exifr](https://github.com/MikeKovarik/exifr)
- RAW file support via [libraw-wasm](https://github.com/WiseLibs/libraw-wasm)
