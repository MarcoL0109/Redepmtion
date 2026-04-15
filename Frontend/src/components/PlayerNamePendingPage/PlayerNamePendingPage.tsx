import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./PlayerNamePendingPage.css";

function PlayerNamePendingPage() {

    const navigate = useNavigate();
    const [username, setUsername] = useState<string>("");
    const {roomId} = useParams();


    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value;
        setUsername(username);
    }


    const handleJoinRoom = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate(`/PendingStartRoom/0/${username}/${roomId}/0`)
    }


    return (
        <div className="PlayerNameContainer">
            <h1 className="TitleText"><strong>REDEMPTION</strong></h1>
            <div className="SignInBox">
                <form className="PINForm" onSubmit={handleJoinRoom}>
                    <input className="RoomCodeInput" 
                            type="text"
                            placeholder="Name"
                            required
                            onChange={handleUsernameChange}/>
                    <button className="ConfirmButton">
                        <strong>Join</strong>
                    </button>
                </form>
            </div>
        </div>
    )
}


export default PlayerNamePendingPage