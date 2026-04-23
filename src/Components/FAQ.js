import React, { useState } from 'react';
import faqs from '../Constants/FAQData';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const FaqPage = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const handleClick = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to know about our security services.</p>
                </div>
                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Card 
                            key={index} 
                            className={`border transition-all duration-300 overflow-hidden ${
                                activeIndex === index 
                                    ? 'border-orange-500/50 bg-white dark:bg-slate-900 shadow-md ring-1 ring-orange-500/20' 
                                    : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-sm'
                            }`}
                        >
                            <button
                                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                onClick={() => handleClick(index)}
                                aria-expanded={activeIndex === index}
                            >
                                <span className={`font-semibold text-lg transition-colors ${
                                    activeIndex === index 
                                        ? 'text-orange-600 dark:text-orange-500' 
                                        : 'text-slate-900 dark:text-slate-200'
                                }`}>
                                    {faq.question}
                                </span>
                                {activeIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0 ml-4" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                                )}
                            </button>
                            
                            <div 
                                className={`grid transition-all duration-300 ease-in-out ${
                                    activeIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <CardContent className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {faq.answer}
                                    </CardContent>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FaqPage;
