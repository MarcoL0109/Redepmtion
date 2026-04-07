import InputPinBox from "../InputPINBox/InputPINBox";
import Overlays from "../Overlays/Overlay";
import NavBar from "../NavBar/NavBar";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./JoimRoom.css";



function JoinRoom() {

  const navigate = useNavigate();
  const location = useLocation();
  const kickState = location.state?.kickMessage || false;
  const closeRoom = location.state?.roomClosed || false;
  const isHost = location.state?.isHost || false;
  const inActiveRoomClose = location.state?.inActiveRoomClosed || false;
  const [isKickOverlayOpen, setIsKickOverlayOpen] = useState<boolean>(false);
  const [isClosedRoomOverlayOpen, setIsClosedRoomOverlayOpen] = useState<boolean>(false);
  const [isRoomExpiredOverlayOpen, setIsRoomExpiredOverlayOpen] = useState<boolean>(false);
  //@ts-ignore
  const UTILS_API_URL = process.env.VITE_UTILS_API_URL;
  //@ts-ignore
  const USER_API_URL = process.env.VITE_USER_API_URL;
  const [userData, setUserData] = useState<{ username: string; email: string; user_id: number; created_at: string, user_icon: string }>({
      username: "",
      email: "",
      user_id: -1,
      created_at: "",
      user_icon: "",
  });
  const [userId, setUserId] = useState<number>(-1);


  useEffect(() => {
        if (closeRoom && !isHost) {
            setIsClosedRoomOverlayOpen(true);
        } else if (kickState) {
            setIsKickOverlayOpen(true);
        } else if (inActiveRoomClose) {
          setIsRoomExpiredOverlayOpen(true);
        }
        navigate(location.pathname, { 
            replace: true, 
            state: {} 
        });
    }, [closeRoom, navigate, location.pathname]);


  const fetchUserData = async () => {
    const getSessionInfoRepsonse = await fetch(`${UTILS_API_URL}/SessionInfo`, {
        method: "GET",
        credentials: "include"
    })
    const session_info_body = await getSessionInfoRepsonse.json();
    const session_user_id = session_info_body.session.user_id || null
    if (session_user_id) {
      setUserId(session_user_id);
      const get_user_data_response = await fetch(`${USER_API_URL}/getUserInfo`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({user_id: session_user_id}),
      });

      const user_data_json = await get_user_data_response.json();
      const user_data_content = user_data_json.userData;

      let image_url = "";
      if (user_data_content.user_icon !== null) {
          const arrayBuffer = new Uint8Array(user_data_content.user_icon.data);
          const image_blob = new Blob([arrayBuffer], { type: 'image/jpg' });
          image_url = URL.createObjectURL(image_blob);
      }
      setUserData({
          username: user_data_content.username,
          email: user_data_content.email,
          user_id: user_data_content.user_id,
          created_at: user_data_content.create_date.toString(),
          user_icon: image_url,
      })
    }
  }


  useEffect(() => {
    fetchUserData();
  }, [])


  const handleCloseOverlay = () => {
    setIsKickOverlayOpen(false);
    setIsClosedRoomOverlayOpen(false);
    setIsRoomExpiredOverlayOpen(false);
  }


  return (

    <div className="JoinRoomContainer">

      <Overlays isOpen={isRoomExpiredOverlayOpen}>
        <h2>Uh Oh! The Room is Expired Due to Inactivity</h2>
        <p>Have you fallen asleep? Is ok, we have closed the party for you</p>
        <div className="overlay__buttons">
            <button className="cancelDelete" onClick={handleCloseOverlay}>Close</button>
        </div>
      </Overlays>
      
      <Overlays isOpen={isKickOverlayOpen}>
        <h2>Uh Oh! You have been Removed from the Room</h2>
        <p>You may have joined a party that you are not invited to. Sure there are no hard feelings.</p>
        <div className="overlay__buttons">
            <button className="cancelDelete" onClick={handleCloseOverlay}>Close</button>
        </div>
      </Overlays>
      

      <Overlays isOpen={isClosedRoomOverlayOpen}>
        <h2>Well...The Host Shut the Party Down Early</h2>
        <p>The host shut the room down. Maybe join another one</p>
        <div className="overlay__buttons">
            <button className="cancelDelete" onClick={handleCloseOverlay}>Close</button>
        </div>
      </Overlays>
      
      {
        userId === -1 ?
        <button onClick={() => navigate("/SignIn")} className="SigninButton">
          <strong>Sign in</strong>
        </button> :
        <div className="NavbarContainer">
          <NavBar user_data={userData}/>
        </div>
        
      }
      
      <div className="BoxContainer">
        <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
        <InputPinBox username={userData.username} userId={userData.user_id}/>
      </div>
    </div>
  )
}


export default JoinRoom