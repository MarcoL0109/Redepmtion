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
import GamePage from "./components/GamePage/GamePage";
import ResultPage from "./components/ResultPage/ResultPage";


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
        <Route path="/Home" element={<HomePage/>} />
        <Route path="/ProblemList/:problem_set_id" element={<ProblemList/>} />
        <Route path="/PendingStartRoom/:userId/:username/:roomId/:problem_set_id" element={<PendingStartRoom/>} />
        <Route path="/PlayerNamePendingPage/:roomId" element={<PlayerNamePendingPage/>}/>
        <Route path="/GamePage/:userId/:username/:roomId/:problem_set_id" element={<GamePage/>} />
        <Route path="/ResultPage/:userId/:username/:roomId" element={<ResultPage/>} />
      </Routes>
    </BrowserRouter>
  );
  
}

export default App