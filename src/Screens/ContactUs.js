import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import './Styles/ContactUs.css';

function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear previous messages
        setSuccessMessage('');
        setErrorMessage('');
        setIsSubmitting(true);

        emailjs
            .send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                'template_8ynvqxx', // Replace with your EmailJS template ID
                formData,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            )
            .then(
                (response) => {
                    console.log('SUCCESS!', response.status, response.text);
                    setSuccessMessage('Your message has been sent successfully!');
                    setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
                    setIsSubmitting(false);
                },
                (error) => {
                    console.error('FAILED...', error);
                    setErrorMessage('Failed to send message. Please try again or contact us directly.');
                    setIsSubmitting(false);
                }
            );
    };

    return (
        <div className="contact-us">
            <h1 className="title">Contact Us</h1>

            <div className="contact-details">
                <h2>Reach Out to Us</h2>
                <p><strong>Email:</strong> <a href="mailto:mail.rakshak@gmail.com">mail.rakshak@gmail.com</a></p>
                <p><strong>Phone:</strong> <a href="tel:9999999999">9999999999</a></p>
                <p><strong>Team:</strong> Rakshak Team</p>
            </div>

            <div className="social-media">
                <h2>Follow Us</h2>
                <div className="social-icons">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="twitter">X.com</a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="facebook">Facebook</a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="instagram">Instagram</a>
                </div>
            </div>

            <div className="contact-form">
                <h2>Send Us a Message</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        Subject:
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Message:
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </label>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                </form>
                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
        </div>
    );
}

export default ContactUs;
