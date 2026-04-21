// Updated BookServiceForm.js
import React, { useState, useEffect } from "react";
import apiFetch from "../utils/apiFetch";
import "../Screens/Styles/BookServiceForm.css";

const BookServiceForm = ({ selectedService, onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
        service: selectedService,
        numGuards: "",
        durationType: "hours",
        durationValue: "",
        cameraRequired: false,
        vehicleRequired: false,
        firstAid: false,
        walkieTalkie: false,
        bulletProof: false,
        fireSafety: false,
    });

    const [cost, setCost] = useState(0);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const baseGuardCost = 1000;
        const serviceCharge = 1000;
        const optionalCosts = {
            cameraRequired: 500,
            vehicleRequired: 2500,
            firstAid: 150,
            walkieTalkie: 500,
            bulletProof: 2000,
            fireSafety: 750,
        };

        let calculatedCost = formData.numGuards * baseGuardCost;
        Object.entries(optionalCosts).forEach(([key, value]) => {
            if (formData[key]) calculatedCost += value;
        });

        calculatedCost += serviceCharge;
        calculatedCost *= 1.18; // GST 18%
        setCost(Math.round(calculatedCost));
    }, [formData]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === "checkbox" ? checked : value;
        setFormData({ ...formData, [name]: fieldValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailParams = {
            ...formData,
            cost,
        };

        try {
            const response = await apiFetch("/api/add-query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailParams),
            });

            if (response.ok) {
                setShowPopup(true);
                setTimeout(() => {
                    setShowPopup(false);
                    onClose();
                }, 3000);
            } else {
                console.error("Server error:", response.statusText);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div className="overlay">
            <div className="form-container">
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Book Your Service</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required />

                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required />

                    <label htmlFor="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} required />

                    <label htmlFor="service">Service</label>
                    <select id="service" name="service" value={formData.service} disabled>
                        <option>{formData.service}</option>
                    </select>

                    <label htmlFor="numGuards">Number of Guards</label>
                    <input type="number" id="numGuards" name="numGuards" value={formData.numGuards} onChange={handleFormChange} required />

                    <label>Service Duration</label>
                    <div className="duration-wrapper">
                        <input type="number" name="durationValue" value={formData.durationValue} onChange={handleFormChange} required />
                        <select name="durationType" value={formData.durationType} onChange={handleFormChange}>
                            <option value="hours">Hours</option>
                            <option value="months">Months</option>
                        </select>
                    </div>

                    {["cameraRequired", "vehicleRequired", "firstAid", "walkieTalkie", "bulletProof", "fireSafety"].map((item) => (
                        <div className="checkbox-wrapper" key={item}>
                            <input type="checkbox" id={item} name={item} checked={formData[item]} onChange={handleFormChange} />
                            <label htmlFor={item}>{item.replace(/([A-Z])/g, ' $1')}</label>
                        </div>
                    ))}

                    <label htmlFor="message">Message (Optional)</label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleFormChange} />

                    <p><strong>Estimated Cost:</strong> ₹{cost}</p>

                    <button type="submit" className="submit-button">Submit</button>
                </form>

                {showPopup && (
                    <div className="popup">
                        <div className="popup-message">
                            <p>Thank you! We'll get back to you soon.</p>
                            <button className="close-popup" onClick={() => setShowPopup(false)}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookServiceForm;