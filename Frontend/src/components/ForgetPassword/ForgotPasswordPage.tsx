import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./ForgotPasswordPage.css";
import { FourSquare } from 'react-loading-indicators';


function ForgotPasswordPage() {

    const navigate = useNavigate()
    const [inputEmail, setInputEmail] = useState<string>("");
    const [userAccountNotFound, setuserAccountNotFound] = useState<boolean>(false);
    const [displayLoading, setDisplayLoading] = useState<boolean>(false);
    const USER_API_URL = process.env.VITE_USER_API_URL;

    const handleForgotPassword = async (email: string) => {
        const resetPassword = await fetch(`${USER_API_URL}/forgotPassword`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({ email }),
        })
        if (resetPassword.status === 401) {
            setuserAccountNotFound(true);
            setDisplayLoading(false);
        }
        
        if (resetPassword.status === 200) {
            navigate("/ValidateResetPasswordCode", { state: { inputEmail } });
        }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setDisplayLoading(true);
        handleForgotPassword(inputEmail);
    }

    return (
        <div className="ForgotPasswordContainer">
            <button onClick={() => navigate("/")} className="HomeButton">
                <strong>Join Room</strong>
            </button>
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="ForgotPasswordBox">
                <form onSubmit={handleSubmit} className="ForgotPasswordForm">
                    <input 
                        className="email_form_inputs"
                        type="email" placeholder="Email"
                        required
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                    />
                    {
                        userAccountNotFound &&
                        <div className="AccoutNotFoundMessageContainer">
                            <span className="AccoutNotFoundMessage">Account Not Found</span>
                        </div>
                    }
                    {
                        !displayLoading &&
                        <button type="submit" className="SendCodeButton">
                            <strong>Send Code</strong>
                        </button>
                    }

                    {
                        displayLoading &&
                        <div className="loading_icon_animations">
                            <FourSquare color="#ffbc05" size="medium" text="" textColor="" />
                        </div>
                    }
                </form>
            </div>
        </div>
    )

}

export default ForgotPasswordPage