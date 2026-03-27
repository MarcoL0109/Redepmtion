import InputPinBox from "./components/InputPINBox/InputPINBox";
import "./App.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JoinRoom from "./components/JoinRoom/JoinRoom";
import SignInPage from "./components/SignIn/SignInPage";
import SignUpPage from "./components/SignUp/SignupPage";
import ForgotPasswordPage from "./components/ForgetPassword/ForgotPasswordPage";
import ValidateResetPasswordCode from "./components/ValidateCode/ValidateCode";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import HomePage from "./components/HomePage/HomePage";
import TempPageForActivation from "./components/TempPageForActivation/TempPageForActivation";
import ProblemList from "./components/ProblemList/ProblemList";
import PendingStartRoom from "./components/PendingStartRoom/PendingStartRoom";
import PlayerNamePendingPage from "./components/PlayerNamePendingPage/PlayerNamePendingPage";



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
        <Route path="/ProblemList/:problem_set_id" element={<ProblemList/>} />
        <Route path="/PendingStartRoom/:userId/:roomId" element={<PendingStartRoom/>} />
        <Route path="/PlayerNamePendingPage/:roomId" element={<PlayerNamePendingPage/>}/>
      </Routes>
    </BrowserRouter>
  );
  
}

export default App
