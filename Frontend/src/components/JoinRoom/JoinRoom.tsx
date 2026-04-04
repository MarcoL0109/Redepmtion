import InputPinBox from "../InputPINBox/InputPINBox";
import Overlays from "../Overlays/Overlay";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./JoimRoom.css";



function JoinRoom() {

  const navigate = useNavigate();
  const location = useLocation();
  const kickState = location.state?.kickMessage;
  const closeRoom = location.state?.roomClosed;
  console.log("Kick State:", kickState);
  console.log("Close Room:", closeRoom);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);


  useEffect(() => {
    if (kickState || closeRoom) {
      setIsOverlayOpen(true);
    }
  }, [])


  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  }


  return (

    <div className="JoinRoomContainer">
      {
        kickState &&
        <Overlays isOpen={isOverlayOpen}>
          <h2>Uh Oh! You have been Removed from the Room</h2>
          <p>You may have joined a party that you are not invited to. Sure there are no hard feelings.</p>
          <div className="overlay__buttons">
              <button className="cancelDelete" onClick={handleCloseOverlay}>Close</button>
          </div>
        </Overlays>
      }

      {
        closeRoom &&
        <Overlays isOpen={isOverlayOpen}>
          <h2>Well...The Host Shut the Party Down Early</h2>
          <p>The host shut the room down. Maybe join another one</p>
          <div className="overlay__buttons">
              <button className="cancelDelete" onClick={handleCloseOverlay}>Close</button>
          </div>
        </Overlays>
      }
      
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