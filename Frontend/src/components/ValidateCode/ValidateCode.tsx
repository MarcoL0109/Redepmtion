import { useLocation, useNavigate } from "react-router-dom"
import React, { useState, useEffect } from "react";
import "./ValidateCode.css"



function ValidateResetPasswordCode() {

    const location = useLocation();
    const navigate = useNavigate();
    const { inputEmail } = location.state || {};
    const [incorrectCode, setIncorrectCode] = useState<boolean>(false);
    const [inputValidationCode, setInputValidationCode] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [countDown, setCountDown] = useState<number>(60);
    const USER_API_URL = process.env.VITE_USER_API_URL;


    const handleValidateCode = async (email: string, validationCode: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const validateResult = await fetch(`${USER_API_URL}/ValidateCode`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({email: email, validationCode: validationCode}),
            });
            setIncorrectCode(validateResult.status === 401);
            if (validateResult.status === 200) {
                navigate("/ResetPassword", { state: { inputEmail, validationCode } });
            }
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            console.error(error);
        }
        
    }

    useEffect(() => {
        if (countDown === 0) return;
        const intervalId = setInterval(() => {
            setCountDown(prevCountdown => prevCountdown - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [countDown]);


    useEffect(() => {
        if (location.state === null) {
            navigate('/ForgotPassword');
        }
    }, [location.state]);


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleValidateCode(inputEmail, inputValidationCode);
    }


    const handleResend = async () => {
        if (countDown === 0) {
            const resendCodeResponse = await fetch(`${USER_API_URL}/forgotPassword`, {
                method: "POST",
                headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({email: inputEmail})
            })
            if (resendCodeResponse.status === 200) {
                console.log(`Code resend to ${inputEmail} successfully`);
            }
            setCountDown(60);
        }
    }

    return (
        <div className="ValidateCodeContainer">
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="ValidateCodeBox">
                <form className="ValidateCodeForm" onSubmit={handleSubmit}>
                    <div className="email_span_container">
                        <span className="email_span">{inputEmail}</span>
                    </div>
                    <div className="valdation_code_input_container">
                        <input className="validation_code_inputs" type="text" required value={inputValidationCode} onChange={(e) => {setInputValidationCode(e.target.value)}}/>
                        <a onClick={handleResend} className={`resend_tag_${countDown > 0 ? 'disabled' : ''}`}>Resend {`${countDown > 0 ? '(' + countDown + ')': ""}`}</a>
                    </div>
                    <button type="submit" className="ValidateCodeButton" disabled={inputValidationCode === "" || isSubmitting}>
                        <strong>Validate</strong>
                    </button>
                    <div className="IncorrectValidationCode">
                        {incorrectCode && <div className="IncorrectValidationCodeContainer"><span className="AccoutNotFoundMessage">Incorrect Validation Code</span></div>}
                    </div>
                    
                </form>
            </div>
        </div>
    )
}


export default ValidateResetPasswordCode;