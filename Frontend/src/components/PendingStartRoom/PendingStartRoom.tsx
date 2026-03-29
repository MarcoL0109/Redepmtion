import { io, type Socket } from "socket.io-client";
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./PendingStartRoon.css";

/**
 * 
 * Username needs to be inserted to redis, if no username -> need to input in next page (Done)
 * Make useState to store play list table (real time update) (Done)
 * But need to fix refresh no need to add new ourself in there -> Store the session_id: username in redis hashsets (Done)
 * Maybe that's all for now, if the above 2 takes too long
 * 
 * 
 * 
 */



function PendingStartRoom() {
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    const USER_API_URL = process.env.VITE_USER_API_URL as string;
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const location = useLocation();
    let username = location.state?.username || null;
    const socketRef = useRef<Socket | null>(null);
    const {userId, roomId} = useParams();
    const [playerList, setPlayerList] = useState<string[]>([]);
    const [isHost, setIsHost] = useState<boolean>(false);


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


    const getUserInfo = async () => {
         const get_user_data_response = await fetch(`${USER_API_URL}/getUserInfo`, {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({user_id: userId}),
        });
        const user_data_json = await get_user_data_response.json();
        const user_data_content = user_data_json.userData;
        return user_data_content.username;
    }


    useEffect(() => {
        if (socketRef.current) return;
        let mounted = true;
        (async () => {
            try {
                if (username === null) {
                    username = await getUserInfo();
                }
                const session = await getSessionID();
                if (!mounted) return;

                const socket = io(SOCKET_SERVER_URL, { autoConnect: false });
                socketRef.current = socket;
                socket.on('returned-player-list', (list) => {
                    setPlayerList(list);
                });

                socket.connect();
                socket.on('connect', async () => {
                    await handleStoreRoomCodeRedis(socket.id, session);
                    await handleSetRoomHost(roomId || "", session);
                    const join_room_socket = await getRoomSocketId(roomId || "");
                    socket.emit('join-room', { socketId: join_room_socket, roomCode: roomId, sessionId: session, playerName: username }, (err: Error, playerList: string[]) => {
                        if (err) {
                            console.error('join-room error', err);
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
                            <th className="PlayerListRow">Player No.</th>
                            <th className="PlayerListRow">Player Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            playerList.map((player, index) => 
                                <tr key={index}>
                                    <td className="PlayerListRow">{index + 1}</td>
                                    <td className="PlayerListRow">{player}</td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
            {
                isHost &&
                <div className="startButtonContainer">
                    <button className="startRoomButton">Start</button>
                </div>
            }        
        </div>
    )
}



export default PendingStartRoom