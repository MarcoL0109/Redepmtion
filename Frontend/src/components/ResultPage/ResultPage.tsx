import { useParams, useLocation, useNavigate } from "react-router-dom"
import { io, type Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import RankPage from "../RankPage/RankPage";
import "./ResultPage.css";


function ResultPage() {

    const {userId, username, roomId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const playerRank = location.state?.playerRank;
    const rankList = location.state?.rankList;
    const isHost = location.state?.isHost;
    const playerIndex = location.state?.playerIndex;

    const socketRef = useRef<Socket | null>(null);
    //@ts-ignore
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    //@ts-ignore
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;


    const getSessionID = async () => {
        const getSessionInfoRepsonse = await fetch(`${UTILS_API_URL}/SessionInfo`, {
            method: "GET",
            credentials: "include"
        })
        const session_info_body = await getSessionInfoRepsonse.json();
        return session_info_body.sessionID;
    }


    useEffect(() => {
        if (socketRef.current) return;
        let mounted = true;
        const socket = io(SOCKET_SERVER_URL, { autoConnect: false });
        socketRef.current = socket;

        (async () => {
            if (!mounted) return;

            socket.connect(); 
            socket.on("receive-player-answer-history", ({answerHistory}) => {
                console.log("Received answer history", answerHistory);
            });

            // It is safer to wait for the 'connect' event before emitting
            socket.on("connect", async () => {
                const sessionId = await getSessionID();
                console.log("Socket connected, emitting request...");
                socket.emit("request-player-answer-history", { sessionId: sessionId, roomCode: roomId });
            });
        }) ()
        return () => {
            mounted = false;
            const s = socketRef.current;
            if (s) {
                s.removeAllListeners(); 
                s.disconnect();
                socketRef.current = null;
            }
        };
    }, [])


    const handleBackHome = () => {
        navigate("/");
    }

    return (
        <div className="ResultPageContainer">
            <h1>
                {isHost ? (
                    "All Problems are Streamed!"
                ) : (
                    <>
                        {`You Ranked ${playerRank}`}
                        {playerRank === 1 ? "st" : 
                        playerRank === 2 ? "nd" : 
                        playerRank === 3 ? "rd" : "th"}
                    </>
                )}
            </h1>
            <RankPage players={rankList.players} isHost={false} clientPlayerIndex={playerIndex}/>
            <div className="BackToHomeButtonContainer">
                <button className="BackToHomeButton" onClick={handleBackHome}>Back To Home</button>
            </div>
            

        </div>
    )
}



export default ResultPage