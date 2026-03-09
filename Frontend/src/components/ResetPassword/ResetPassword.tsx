import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ResetPassword() {

    const location = useLocation();
    const nevagate = useNavigate();
    const { inputEmail, validationCode } = location.state || {};
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [inputPassword, setInputPassword] = useState<string>("");
    const [diffPassword, setDiffPassword] = useState<boolean>(false);
    const USER_API_URL = process.env.VITE_USER_API_URL;

    
    useEffect(() => {
        if (!validationCode) {
            nevagate("/ForgotPassword");
        } else {
            handleValidateCode(inputEmail, validationCode);
        }
    }, [location.state]);


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


    const handleValidateCode = async (email: string, validationCode: string) => {
        const validateCodeStatus = await fetch(`${USER_API_URL}/ValidateCode`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({email, validationCode})
        });
        if (validateCodeStatus.status === 401) {
            nevagate("/ForgotPassword");
        }
    }


    const handleResetPassword = async (inputEmail: string, confirmedPassword: string) => {
        const resetPasswordStatus = await fetch(`${USER_API_URL}/ResetPassword`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({inputEmail, confirmedPassword})
        });
        if (resetPasswordStatus.status === 200) {
            nevagate("/SignIn");
        }
    }


    const handleResetPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleResetPassword(inputEmail, confirmPassword);
    }


    return (
        <div className="SignUpContainer">
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="SignUpBox">
                <form className="SignUpForm" onSubmit={handleResetPasswordSubmit}>
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
                    <button type="submit" className="SignUpButton" disabled={diffPassword}>
                        <strong>Confirm</strong>
                    </button>
                </form>
            </div>
        </div>
    )

}

export default ResetPassword;