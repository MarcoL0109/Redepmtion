import { useEffect } from "react"
import LeaderBoardIcon from "../../assets/leaderboard.svg";
import TerminateRoomIcon from "../../assets/exit_door.svg"
import "./HostNavBar.css";


interface HostNavBarProps {
    handleDisplayLeaderBoard: () => void,
    handleOpenTerminateOverlay: () => void,
}


function HostNavBar({handleDisplayLeaderBoard, handleOpenTerminateOverlay}: HostNavBarProps) {

    return (
        <nav className="hostNavBar">
            <div className="hostNavBarContainer">
                <div className="hostNavBarButton">
                    <div className="leaderboardClassContainer">
                        <img className="leaderboardClass" src={LeaderBoardIcon} alt="Rank Icon" onClick={handleDisplayLeaderBoard}/>
                    </div>
                    <div className="terminateRoomClassContainer">
                        <img className="terminateRoomClass" src={TerminateRoomIcon} alt="Terminate Room Icon" onClick={handleOpenTerminateOverlay}/>
                    </div>
                </div>
            </div>    
        </nav>
    )

}


export default HostNavBar