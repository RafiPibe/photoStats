import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

// Array of logos with positions and parallax speeds
const PARALLAX_LOGOS = [
    { src: '/logos/Sony.svg', alt: 'Sony', x: '8%', y: '15%', speed: 0.5, rotation: -12 },
    { src: '/logos/Canon.svg', alt: 'Canon', x: '78%', y: '10%', speed: 0.3, rotation: 8 },
    { src: '/logos/Nikon.svg', alt: 'Nikon', x: '15%', y: '60%', speed: 0.4, rotation: 15 },
    { src: '/logos/Fujifilm.svg', alt: 'Fujifilm', x: '85%', y: '65%', speed: 0.6, rotation: -8 },
    { src: '/logos/Leica.svg', alt: 'Leica', x: '50%', y: '25%', speed: 0.35, rotation: -5 },
    { src: '/logos/Apple.svg', alt: 'Apple', x: '25%', y: '40%', speed: 0.45, rotation: 10 },
    { src: '/logos/Olympus.svg', alt: 'Olympus', x: '70%', y: '45%', speed: 0.55, rotation: -15 },
    { src: '/logos/Hasselblad.svg', alt: 'Hasselblad', x: '40%', y: '70%', speed: 0.5, rotation: 12 },
    { src: '/logos/Sigma.svg', alt: 'Sigma', x: '60%', y: '80%', speed: 0.4, rotation: -10 },
];

function ParallaxLogo({ src, alt, x, y, speed, rotation }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll();

    // Transform scroll progress to parallax movement
    const yPos = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [0.15, 0.1, 0]);

    return (
        <motion.img
            ref={ref}
            src={src}
            alt={alt}
            className="absolute w-16 h-16 object-contain pointer-events-none select-none"
            style={{
                left: x,
                top: y,
                y: yPos,
                opacity,
                rotate: rotation,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
        />
    );
}

export default function Hero() {
    return (
        <section className="relative min-h-dvh flex items-center justify-center overflow-hidden px-6 py-20">
            {/* Parallax Logo Background */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {PARALLAX_LOGOS.map((logo, index) => (
                    <ParallaxLogo key={index} {...logo} />
                ))}
            </div>

            {/* Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-orange-200/30 to-transparent blur-3xl" />
                <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-200/30 to-transparent blur-3xl" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                >
                    <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-dark mb-6 tracking-tight">
                        Beautiful EXIF Data
                        <br />
                        <span className="text-dark-100">for Your Photos</span>
                    </h1>
                </motion.div>

                <motion.p
                    className="text-lg sm:text-xl text-cream-700 max-w-2xl mx-auto mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] }}
                >
                    Upload your photos and automatically extract camera, lens, and shooting data.
                    Create stunning overlays with professional EXIF information in seconds.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0, 0, 0.2, 1] }}
                >
                    <a
                        href="#upload"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-dark text-white font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200"
                    >
                        Get Started
                    </a>
                    <a
                        href="#features"
                        className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-dark font-semibold border border-cream-300 hover:border-cream-400 transition-colors duration-200"
                    >
                        Learn More
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
