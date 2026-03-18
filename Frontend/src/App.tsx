import InputPinBox from "./components/InputPINBox/InputPINBox";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SignInPage from "./components/SignIn/SignInPage";
import SignUpPage from "./components/SignUp/SignupPage";
import ForgotPasswordPage from "./components/ForgetPassword/ForgotPasswordPage";
import ValidateResetPasswordCode from "./components/ValidateCode/ValidateCode";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import HomePage from "./components/HomePage/HomePage";
import TempPageForActivation from "./components/TempPageForActivation/TempPageForActivation";
import ProblemList from "./components/ProblemList/ProblemList";


function JoinRoom() {
  const navigate = useNavigate()
  return (
    <div className="JoinRoomContainer">
      <button onClick={() => navigate("/SignIn")} className="SigninButton">
        <strong>Sign in</strong>
      </button>
      <div className="BoxContainer">
        <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
        <InputPinBox/>
      </div>
    </div>
    
  )
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/SignIn" element={<SignInPage />} />
        <Route path="/SignUp" element={<SignUpPage/>} />
        <Route path="/ActivationTempPage" element={<TempPageForActivation/>} />
        <Route path="/ForgotPassword" element={<ForgotPasswordPage/>}/>
        <Route path="/ValidateResetPasswordCode" element={<ValidateResetPasswordCode/>} />
        <Route path="/ResetPassword" element={<ResetPassword/>} />
        <Route path="/HomePage" element={<HomePage/>} />
        <Route path="/ProblemList" element={<ProblemList/>} />
      </Routes>
    </BrowserRouter>
  );
  
}

export default App
