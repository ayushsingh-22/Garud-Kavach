import React from 'react';
import { Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-4 flex flex-col items-start">
            <Link to="/" className="inline-block mb-6 bg-white rounded-lg p-2">
                <img src="/Logo4.png" alt="Garud Kavach" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Your trusted partner for professional and reliable security personnel. We provide unparalleled protection for your peace of mind.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 md:col-start-6">
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about-us" className="hover:text-orange-500 transition-colors">About Us</Link></li>
              <li><Link to="/our-services" className="hover:text-orange-500 transition-colors">Our Services</Link></li>
              <li><Link to="/contact-us" className="hover:text-orange-500 transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="hover:text-orange-500 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-6">Reach Out to Us</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                <a href="mailto:contact@rakshakservice.com" className="hover:text-white transition-colors">
                  contact@rakshakservice.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                <span>
                  Block D, West Vinod Nagar,<br />
                  Mandawali, New Delhi, 110092
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {currentYear} Garud Kavach. All Rights Reserved.</p>
          <div className="mt-4 md:mt-0 flex gap-4">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
