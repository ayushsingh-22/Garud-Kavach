import React from 'react';
import SEO from '../SEO';
import { Card, CardContent } from '../Components/ui/card';
import { CheckCircle2, Shield, Users, Target } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white dark:bg-slate-950 transition-colors duration-300 pb-20">
            <SEO title="About Us | Garud Kavach" description="Learn more about Garud Kavach, the leading security service provider." />

            {/* Hero Banner */}
            <div className="relative bg-slate-900 py-24 mb-16 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://raw.githubusercontent.com/bvestx/Eye-Craft-Security/main/scollable4.jpg')] bg-cover bg-center"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">About Garud Kavach</h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Leading the way in professional security solutions across Delhi NCR and beyond for over a decade.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                {/* Intro Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Legacy of Protection</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Garud Kavach has been at the forefront of providing reliable and efficient security services in Delhi, Noida, Gurgaon, Faridabad, Ghaziabad, Patna, and Muzaffarpur for over <strong>10 years</strong>.
                        </p>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            We are proud to have a dedicated team of security professionals and cutting-edge technology to safeguard your business, home, or events.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card className="bg-slate-50 dark:bg-slate-900 border-0 shadow-sm">
                            <CardContent className="p-6">
                                <Shield className="w-10 h-10 text-orange-500 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Responsiveness</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Quick deployment of security personnel wherever and whenever needed.</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 dark:bg-slate-900 border-0 shadow-sm">
                            <CardContent className="p-6">
                                <Users className="w-10 h-10 text-orange-500 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Professionalism</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Rigorously trained agents undergo regular assessments.</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 dark:bg-slate-900 border-0 shadow-sm sm:col-span-2">
                            <CardContent className="p-6 flex items-start gap-4">
                                <Target className="w-10 h-10 text-orange-500 shrink-0" />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tailored Services</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Whether it’s for a corporate event or high-risk assignment, we offer custom solutions.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Services List */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-10 md:p-16 mb-20">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">Comprehensive Solutions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            'Trained security guards',
                            'Surveillance and monitoring',
                            'Transport and travel security',
                            'Event security and crowd control',
                            'Data protection & site security',
                            'High-tech security systems',
                            'Gunmen and guard dogs'
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Founders Section */}
                <div className="mb-20 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Our Founders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                        {/* Founder 1 */}
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 ring-4 ring-orange-100 dark:ring-orange-900/30">
                                <img 
                                    src="/images/founder1.png" 
                                    alt="Ayush" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src='/Logo4.png' }}
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ayush</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Co-founder of Garud Kavach, committed to building a company that puts customer safety and satisfaction first.
                            </p>
                        </div>

                        {/* Founder 2 */}
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 ring-4 ring-orange-100 dark:ring-orange-900/30">
                                <img 
                                    src="/images/founder2.png" 
                                    alt="Mayur" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src='/Logo4.png' }}
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mayur</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Co-founder of Garud Kavach, passionate about integrating technology with security services for better protection.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Coverage & CTA */}
                <div className="text-center max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Coverage Areas</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        Garud Kavach proudly serves clients across Delhi, Noida, Gurgaon, Faridabad, Ghaziabad, Patna, and Muzaffarpur, offering quick response times and personalized security services tailored to your requirements.
                    </p>
                    
                    <div className="pt-8">
                        <a 
                            href="/contact-us"
                            className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-orange-600/30"
                        >
                            Get in Touch with Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
