import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { Mail, MapPin, Send, MessageSquare, PhoneCall } from 'lucide-react';
import { Card, CardContent } from '../Components/ui/card';
import { Button } from '../Components/ui/button';
import { Input } from '../Components/ui/input';
import { Label } from '../Components/ui/label';

function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        setIsSubmitting(true);

        emailjs
            .send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                'template_8ynvqxx',
                formData,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            )
            .then(
                () => {
                    setStatus({ type: 'success', msg: 'Your message has been sent successfully!' });
                    setFormData({ name: '', email: '', subject: '', message: '' });
                    setIsSubmitting(false);
                },
                () => {
                    setStatus({ type: 'error', msg: 'Failed to send message. Please try again or contact us directly.' });
                    setIsSubmitting(false);
                }
            );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Get in Touch</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Have questions about our security services? We're here to help. Contact us today for a free consultation.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                            <CardContent className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Contact Information</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                                <Mail className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</p>
                                                <a href="mailto:contact@rakshakservice.com" className="text-base font-semibold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                                    contact@rakshakservice.com
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                                <PhoneCall className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</p>
                                                <a href="tel:+919876543210" className="text-base font-semibold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                                    +91 98765 43210
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                                <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Office Location</p>
                                                <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                    Block D, West Vinod Nagar<br/>Mandawali, New Delhi 110092
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                            <CardContent className="p-8 sm:p-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Send Us a Message</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-slate-900 dark:text-white">Full Name</Label>
                                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-900 dark:text-white">Email Address</Label>
                                            <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-slate-900 dark:text-white">Subject</Label>
                                        <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help you?" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400/60 dark:placeholder:text-slate-500/60" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-slate-900 dark:text-white">Message</Label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="flex w-full rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-500/60 dark:focus-visible:ring-slate-300 transition-colors"
                                            placeholder="Write your message here..."
                                        />
                                    </div>

                                    {status.msg && (
                                        <div className={`p-4 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                            {status.msg}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-700 text-white">
                                        {isSubmitting ? 'Sending...' : (
                                            <>
                                                Send Message
                                                <Send className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;
