import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TempPageForActivation() {
    const [countDown, setCountDown] = useState<number>(10);
    const navigate = useNavigate();

    useEffect(() => {        
        if (countDown === 0) {
            navigate("/SignIn");
            return;
        }

        const timer = setTimeout(() => {
            setCountDown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countDown, navigate]);

    return (
        <div>
            <h1>An email has been sent to you to activate your newly registered account.</h1>
            <p>Please note that the link in the email will expire after 24 hours.</p>
            <p>You will be redirected to the sign-in page in {countDown} seconds.</p>
        </div>
    );
}

export default TempPageForActivation;