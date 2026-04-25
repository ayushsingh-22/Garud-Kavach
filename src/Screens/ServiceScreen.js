import React from 'react';
import { Link } from 'react-router-dom';
import { services as serviceData } from '../Constants/ServiceData';
import { Card, CardContent } from '../Components/ui/card';
import { Button } from '../Components/ui/button';

const ServiceScreen = () => {
    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                <header className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Our Premium Services</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We provide a wide range of specialized security services designed to meet your unique protection needs.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {serviceData.map((service, index) => (
                        <Card key={index} className="overflow-hidden border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col h-full">
                            <div className="relative h-56 overflow-hidden">
                                <img 
                                    src={service.image} 
                                    alt={service.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <h3 className="absolute bottom-4 left-6 text-xl font-bold text-white z-10">{service.title}</h3>
                            </div>
                            <CardContent className="p-6 flex flex-col flex-1">
                                <p className="text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-3">
                                    {service.shortDescription || service.longDescription}
                                </p>
                                <Button asChild className="w-full bg-slate-100 hover:bg-orange-600 text-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-orange-600 dark:hover:text-white transition-colors">
                                    <Link to="/contact-us">
                                        Book Now
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServiceScreen;
