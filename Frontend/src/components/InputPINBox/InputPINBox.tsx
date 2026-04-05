import "./InputPINBox.css"
import { useState } from "react"
import { useNavigate } from "react-router-dom";


interface InputPINProps {
    username: string,
    userId: number,
}


function InputPinBox({username, userId}: InputPINProps) {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState<string>("");
    const [displayRoomNotFound, setDisplayRoomNotFound] = useState<boolean>(false);
    const [displayRoomLocked, setDisplayRoomLocked] = useState<boolean>(false);
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
        } else if (check_room_exist.status === 200) {
            navigate(userId === -1 ? `/PlayerNamePendingPage/${roomCode}`: `/PendingStartRoom/${userId}/${username}/${roomCode}`)
        } else {
            setDisplayRoomLocked(true);
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
                    <div className="RoomNotFoundErrorMessageContainer">
                        <span className="RoomNotFoundErrorMessage">Room Not Found</span>
                    </div>
                    
                }

                {
                    displayRoomLocked &&
                    <div className="RoomNotFoundErrorMessageContainer">
                        <span className="RoomNotFoundErrorMessage">The Room is Locked By the Host</span>
                    </div>
                    
                }
            </form>
            
        </div>
    )
}



export default InputPinBox