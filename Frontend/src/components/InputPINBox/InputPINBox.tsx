import "./InputPINBox.css"
import { useState } from "react"
import { useNavigate } from "react-router-dom";


function InputPinBox(){
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState<string>("");
    const [displayRoomNotFound, setDisplayRoomNotFound] = useState<boolean>(false);
    const ROOM_MANAGEMENT_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL;


    const handleSearchRoom = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const check_room_exist = await fetch(`${ROOM_MANAGEMENT_API_URL}/checkRoomCodeExist`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({roomCode})
        });
        if (check_room_exist.status === 404) {
            setDisplayRoomNotFound(true);
        } else {
            setDisplayRoomNotFound(false);
            navigate(`/PlayerNamePendingPage/${roomCode}`)
        }
    }


    const handleRoomCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const room_code = event.target.value;
        setRoomCode(room_code);
    }
    
    
    return (    
        <div className="InputPINBoxDiv">
            <form className="PINForm" onSubmit={handleSearchRoom}>
                <input className="RoomCodeInput" 
                        type="text"
                        placeholder="Enter PIN Code"
                        required
                        onChange={handleRoomCodeChange}/>
                <button className="ConfirmButton">
                    <strong>Enter</strong>
                </button>
                {
                    displayRoomNotFound && 
                    <span className="RoomNotFoundErrorMessage">Room Not Found</span>
                }
            </form>
            
        </div>
    )
}



export default InputPinBox