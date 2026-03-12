import './SignInPage.css';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';


function SignInPage() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()
    const [incorrectLoginInfo, setincorrectLoginInfo] = useState<boolean>(false);
    const [notActivated, setNotActivated] = useState<boolean>(false);
    const USER_API_URL = process.env.VITE_USER_API_URL;


    const HandleSignIn = async (email: string, password: string) => {
        try {
            const login_status = await fetch(`${USER_API_URL}/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })
            setincorrectLoginInfo(login_status.status === 401 || login_status.status === 404);
            setNotActivated(login_status.status === 400);
            if (login_status.status === 200) {
                navigate("/HomePage");
            }
        } catch (error) {
            console.log(error);
        }
    };

    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        HandleSignIn(email, password)
    }

    return (
        <div className="SignInContainer">
            <button onClick={() => navigate("/")} className="HomeButton">
                <strong>Join Room</strong>
            </button>
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="SignInBox">
                <form className="SignInForm" onSubmit={handleSubmit}>
                    <input className="email_form_inputs" type="text" placeholder="Email" required value={email} onChange={(e) => {setEmail(e.target.value)}}/>
                    <input className="password_form_inputs" type="password" placeholder="Password" required value={password} onChange={(e) => {setPassword(e.target.value)}}/>
                    <button type="submit" className="SignInButton">
                        <strong>Sign In</strong>
                    </button>
                    <div className="AccountManagementTags">
                        {incorrectLoginInfo && <div className="AccoutNotFoundMessageContainer"><span className="AccoutNotFoundMessage">Incorrect Username or Password</span></div>}
                        {notActivated && <div className="AccoutNotFoundMessageContainer"><span className="AccoutNotFoundMessage">Account Not Activated</span></div>}
                        <a onClick={() => (navigate("/ForgotPassword"))} className="ForgotPasswordTag"><strong>Forgot Password?</strong></a>
                        <a onClick={() => {navigate('/SignUp')}} className="SignUpTag"><strong>Sign Up</strong></a>
                    </div>
                    
                </form>
            </div>
        </div>
    )
}


export default SignInPage