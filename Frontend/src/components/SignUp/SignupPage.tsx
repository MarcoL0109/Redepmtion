import { useNavigate } from 'react-router-dom';
import "./SignUpPage.css"
import React, { useState } from 'react';
import { FourSquare } from 'react-loading-indicators';



function SignUpPage() {

    const navigate = useNavigate()
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [inputPassword, setInputPassword] = useState<string>("");
    const [signUpEmail, setSignUpEmail] = useState<string>("");
    const [userName, setUsername] = useState<string>("");
    const [diffPassword, setDiffPassword] = useState<boolean>(false);
    const [existingAccount, setExistingAccount] = useState<boolean>(false);
    const [displayLoading, setDisplayLoading] = useState<boolean>(false);
    const USER_API_URL = process.env.VITE_USER_API_URL;


    const handleInputPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newInputPassword = e.target.value;
        setInputPassword(newInputPassword);
        setDiffPassword(confirmPassword !== "" && newInputPassword !== confirmPassword);
    };


    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);
        setDiffPassword(inputPassword !== newConfirmPassword);
    };


    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setSignUpEmail(newEmail);
        setExistingAccount(false);
    }


    const handleSignUp = async (email: string, username: string, confirmPassword: string) => {
        try {
            const createUserStatus = await fetch(`${USER_API_URL}/createUsers`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({ email, username, confirmPassword }),
            });

            if (createUserStatus.status === 401) {
                setExistingAccount(true);
                setDisplayLoading(false);
            }
            
            if (createUserStatus.status === 200) {navigate("/SignIn");}

        } catch (error) {
            console.log(error);
        }
    }

    
    const handleSignUpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setDisplayLoading(true);
        handleSignUp(signUpEmail, userName, confirmPassword)
    }

    return (
        <div className="SignUpContainer">
            <button onClick={() => navigate("/")} className="HomeButton">
                <strong>Join Room</strong>
            </button>
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="SignUpBox">
                <form className="SignUpForm" onSubmit={handleSignUpSubmit}>
                    <input 
                        className="email_form_inputs"
                        type="email"
                        placeholder="Email"
                        required
                        value={signUpEmail}
                        onChange={handleEmailChange}
                    />
                    <input 
                        className="email_form_inputs"
                        type="text"
                        placeholder="Username"
                        required
                        value={userName}
                        onChange={(e) => {setUsername(e.target.value)}}
                    />
                    <input 
                        className="password_form_inputs" 
                        type="password" placeholder="Password" 
                        required
                        value={inputPassword}
                        onChange={handleInputPasswordChange}
                    />
                    <input 
                        className="confirm_password_form_inputs" 
                        type="password" 
                        placeholder="Confirm Password" 
                        required 
                        value={confirmPassword} 
                        onChange={handleConfirmPasswordChange} 
                    />
                    {diffPassword && 
                        <div className="DiffPasswordContainer">
                            <span>Confirmed Password not the same with input password</span>
                        </div>
                    }
                    {existingAccount && 
                        <div className="DiffPasswordContainer">
                            <span>An Existing Account is Found under {signUpEmail}</span>
                        </div>
                    }
                    {
                        !displayLoading &&
                        <button type="submit" className="SignUpButton" disabled={diffPassword}>
                            <strong>Sign Up</strong>
                        </button>
                    }

                    {
                        displayLoading &&
                        <div className="loading_icon_animations">
                            <FourSquare color="#32cd32" size="medium" text="" textColor="" />
                        </div>
                    }
                    
                </form>
            </div>
        </div>
    )

}


export default SignUpPage