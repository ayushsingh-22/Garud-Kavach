import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Shield, Users, Building, ShieldCheck } from 'lucide-react';
import ServiceScreen from './ServiceScreen';
import FaqPage from '../Components/FAQ';
import { images, messages } from '../Constants/HomeScreenData';
import '../index.css';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        let startTimestamp = null;
        let animationFrame;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            
            setCount(Math.floor(easeProgress * end));
            
            if (progress < 1) {
                animationFrame = window.requestAnimationFrame(step);
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    window.requestAnimationFrame(step);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (countRef.current) {
            observer.observe(countRef.current);
            observerRef.current = observer;
        }

        return () => {
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [end, duration]);

    return <span ref={countRef}>{count}{suffix}</span>;
};

export default function HomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const serviceSectionRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const scrollToServiceScreen = () => {
        serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const stats = [
        { icon: Shield, value: 500, suffix: "+", label: "Guards Deployed" },
        { icon: Users, value: 250, suffix: "+", label: "Clients Served" },
        { icon: ShieldCheck, value: 10, suffix: "+", label: "Years Experience" },
        { icon: Building, value: 15, suffix: "", label: "Cities Covered" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
                {/* Background Image Carousel */}
                {images.map((img, idx) => (
                    <div 
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            idx === currentIndex ? 'opacity-50 dark:opacity-50' : 'opacity-0'
                        }`}
                    >
                        <img 
                            src={img} 
                            alt={`Security background ${idx + 1}`}
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/80 via-slate-100/50 to-slate-100/20 dark:from-slate-900/85 dark:via-slate-900/60 dark:to-transparent" />
                    </div>
                ))}

                <div className="container relative z-10 mx-auto px-6 lg:px-12 py-20 flex flex-col items-start max-w-7xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-6 font-medium text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Garud Kavach</span>
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white max-w-3xl leading-tight mb-6 tracking-tight">
                        Your Trusted <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700 dark:from-orange-400 dark:to-orange-600">
                            Security Partner
                        </span>
                    </h1>
                    
                    <div className="min-h-[120px] max-w-2xl mb-10">
                        <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed transition-opacity duration-500">
                            {messages[currentIndex]}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={scrollToServiceScreen}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-orange-600/30 group"
                        >
                            Explore Services
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a 
                            href="/contact-us"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-semibold rounded-lg backdrop-blur-sm transition-all duration-300"
                        >
                            Contact Us
                        </a>
                    </div>
                    
                    {/* Carousel Dots */}
                    <div className="flex gap-2 mt-16">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    idx === currentIndex ? 'w-8 bg-orange-500' : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-white dark:bg-slate-950 py-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors duration-300 group border border-transparent dark:border-slate-800">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-500 group-hover:shadow-md transition-all duration-300 mb-4">
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-geist">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scrollable Service Screen */}
            <div ref={serviceSectionRef} className="bg-slate-50 dark:bg-slate-950 scroll-mt-20">
                <ServiceScreen />
            </div>

            {/* FAQ Section */}
            <div className="bg-white dark:bg-slate-950">
                <FaqPage />
            </div>
        </div>
    );
}
