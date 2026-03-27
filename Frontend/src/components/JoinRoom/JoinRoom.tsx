import InputPinBox from "../InputPINBox/InputPINBox";
import { useNavigate } from "react-router-dom";
import "./JoimRoom.css";

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


export default JoinRoom