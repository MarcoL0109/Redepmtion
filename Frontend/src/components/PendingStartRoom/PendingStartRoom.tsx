import { io, type Socket } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Overlays from "../Overlays/Overlay";
import "./PendingStartRoon.css";

/**
 * TODO
 * Make the leave room / terminate room function
 * Make a kick player function for the host as well
 * 
 * 
 */



function PendingStartRoom() {

    //@ts-ignore
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    //@ts-ignore
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    //@ts-ignore
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const socketRef = useRef<Socket | null>(null);
    // Even though user_id is not used in here, but is a good component to identify participant is a logged in user or not
    const {userId, username, roomId, problem_set_id} = useParams();
    const [playerList, setPlayerList] = useState<string[]>([]);
    const [isHost, setIsHost] = useState<boolean>(false);
    const isHostRef = useRef(isHost);
    const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
    const [hostLeave, setHostLeave] = useState<boolean>(false);
    const [partLeave, setPartLeave] = useState<boolean>(false);
    const [toggleLock, setToggleLock] = useState<boolean>(false);
    const navigate = useNavigate();


    useEffect(() => {
        isHostRef.current = isHost;
    }, [isHost]);


    const handleStoreRoomCodeRedis = async (socket_id: any, session: string) => {
        const store_socket_id_redis = await fetch(`${ROOM_API_URL}/storeRoomCodeSocketId`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({room_code: roomId, socket_id: socket_id, session_id: session})
        })

        if (store_socket_id_redis.status === 500) {
            console.log("Cannot store room code in redis");
        }
    }


    const handleSetRoomHost = async (room_code: string, session_id: string) => {
        const check_is_host_repsonse = await fetch(`${ROOM_API_URL}/getRoomHost`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({room_code: room_code, session_id: session_id})
        })
        if (check_is_host_repsonse.status === 200) {
            const check_is_host_repsonse_json = await check_is_host_repsonse.json();
            const check_is_host_repsonse_res = check_is_host_repsonse_json.is_host;
            setIsHost(check_is_host_repsonse_res);
        }
    }


    const getRoomSocketId = async (room_code: string) => {
        const get_socket_id_response = await fetch(`${ROOM_API_URL}/getRoomSocketID`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({room_code: room_code})
        })
        if (get_socket_id_response.status === 200) {
            const socket_json = await get_socket_id_response.json();
            return socket_json.socket_id;
        } else {
            console.log("Internal Server Error");
        }    
    }


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
            try {
                const session = await getSessionID();
                if (!mounted) return;
                socket.on('returned-player-list', (list) => {
                    setPlayerList(list);
                });

                socket.on("room-closed", ({reason, message}) => {
                    console.log(message);
                    if (reason === "Terminated") {
                        navigate("/", { state: {roomClosed: true, isHost: isHostRef.current} });
                    } else {
                        navigate("/", { state: {inActiveRoomClosed: true} });
                    }     
                })

                socket.on("redirect-room-members", () => {
                    navigate(`/GamePage/${userId}/${username}/${roomId}/${problem_set_id}`);
                })

                socket.on("log-leave-message", (message) => {
                    console.log(message);
                })

                socket.on("kick-player-message", (message) => {
                    console.log(message);
                    navigate("/", { state: {kickMessage: true} });
                })

                socket.on("init-room-state", (isLocked) => {
                    setToggleLock(isLocked);
                })

                socket.connect();
                socket.on('connect', async () => {
                    await handleStoreRoomCodeRedis(socket.id, session);
                    await handleSetRoomHost(roomId || "", session);
                    const join_room_socket = await getRoomSocketId(roomId || "");
                    socket.emit('join-room', { 
                        socketId: join_room_socket,
                        roomCode: roomId,
                        sessionId: session,
                        playerName: username,
                        isLocked: Number(toggleLock).toString(),
                        checkStream: false,
                        problemSetId: problem_set_id,
                    }, (err: Error, playerList: string[]) => {
                        if (err) {
                            console.error('join-room error', err);
                            navigate("/")
                            return;
                        }
                        setPlayerList(playerList);
                    });
                });
            } catch (err) {
                console.error('Failed to get user info or connect socket', err);
            }
        })();

        return () => {
            mounted = false;
            const s = socketRef.current;
            if (s) {
                s.off('returned-player-list');
                s.off('connect');
                s.disconnect();
                socketRef.current = null;
            }
        };
        }, []);


    const triggerTerminateOverlay = async () => {
        setIsOverlayOpen(true);
        setHostLeave(true);
    }


    const triggerLeaveOverlay = () => {
        setIsOverlayOpen(true);
        setPartLeave(true);
    }


    const handleLeaveRoom = async () => {
        if (socketRef.current) {
            const session = await getSessionID();
            socketRef.current.emit("leave-room", {
                roomCode: roomId,
                isHost: isHost,
                clientSessionId: session
            });
        }
        if (partLeave) {
            navigate("/")
        }
        setIsOverlayOpen(false);
    }


    const handleCloseOverlay = () => {
        setIsOverlayOpen(false);
        setHostLeave(false);
        setPartLeave(false);
    }


    const handleKickPlayer = async (index: string) => {
        if (socketRef.current) {
            socketRef.current.emit("kick-player", {
                roomCode: roomId,
                playerIndex: index.toString(),
            })
        }
    }


    const handleLockRoom = () => {
        setToggleLock(prev => {
            const newPrev = !prev;
            if (socketRef.current) {
                socketRef.current.emit("set-lock-state", {
                    roomCode: roomId,
                    isLock: Number(newPrev).toString(),
                })
            }
            return newPrev;
        });
    }


    const handleStartRoom = () => {
        if (socketRef.current) {
            socketRef.current.emit("initialize-room-start", {
                roomCode: roomId,
            });
        }
    }

    
    return (
        <div className="HomePageContainer">
            <div className="RoomCodeContainer">
                <div>
                    <h1>Room Code: {roomId}</h1>
                </div>
            </div>
            <div className="JoinerListContainer">
                <table className="JoinerList">
                    <thead>
                        <tr>
                            <th className={`PlayerListRow${isHost ? "" : "_Norm"}`}>Player No.</th>
                            <th className={`PlayerListRow${isHost ? "" : "_Norm"}`}>Player Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            playerList.map((player, index) => 
                                <tr key={index}>
                                    <td className={`PlayerListRow${isHost ? "" : "_Norm"}`}>{index + 1}</td>
                                    <td className={`PlayerListRow${isHost ? "" : "_Norm"}`}>{player}</td>
                                    {
                                        isHost && 
                                        <td className="KickPlayerButtonColumn"> 
                                            {   index !== 0 ?  
                                                <button className="KickPlayerButton" onClick={() => handleKickPlayer((index + 1).toString())}>Kick Player</button>:
                                                null
                                            }
                                        </td>
                                    }
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
            {
                isHost ?
                <div className="roomOperationButtonContainer">
                    <button className="startRoomButton" onClick={handleStartRoom}>Start</button>
                    <button className={toggleLock ? "unlockRoomButton": "lockRoomButton"} onClick={handleLockRoom}>{toggleLock ? "Unlock": "Lock"}</button>
                    <button className="terminateRoomButton" onClick={triggerTerminateOverlay}>Terminate</button>
                </div> :
                <div className="roomOperationButtonContainer">
                    <button className="leaveRoomButton" onClick={triggerLeaveOverlay}>Leave</button>
                </div>
            }
            <Overlays isOpen={isOverlayOpen}>
                <div>
                    <div>
                        <h2>{hostLeave ? "Ending" : "Leaving"} the Party Before It Starts?</h2>
                        <p>You are about to {hostLeave ? "terminate" : "leave"} this room. Are you sure you want to {hostLeave ? "end" : "leave"} this party before it starts?</p>
                    </div>
                    <div className="overlay__buttons">
                        <button className="confirmDelete" onClick={handleLeaveRoom}>Confirm</button>
                        <button className="cancelDelete" onClick={handleCloseOverlay}>Cancel</button>
                    </div>
                </div>  
            </Overlays> 
        </div>
    )
}



export default PendingStartRoom