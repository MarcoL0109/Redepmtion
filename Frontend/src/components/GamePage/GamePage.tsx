import { io, type Socket } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GamePage.css";
import { Problem } from "../ProblemList/ProblemList";


function GamePage() {


    const socketRef = useRef<Socket | null>(null);
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL as string;
    const navigate = useNavigate();
    const {userId, username, roomId, problem_set_id} = useParams();
    const [isHost, setIsHost] = useState<boolean>(false);
    const [countDown, setCountDown] = useState<number>(3);
    const [currentDisplayProblem, setCurrentDisplayProblem] = useState<Problem>();
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


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
            return check_is_host_repsonse_json.is_host;
        }
        return false;
    }


    const getSessionID = async () => {
        const getSessionInfoRepsonse = await fetch(`${UTILS_API_URL}/SessionInfo`, {
            method: "GET",
            credentials: "include"
        })
        const session_info_body = await getSessionInfoRepsonse.json();
        return session_info_body.sessionID;
    }


    const handleFetchProblemList = async () => {
        const fetch_problem_list_response = await fetch(`${PROBLEM_SET_API_URL}/getProblems`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ problem_set_id }),
        });
        if (fetch_problem_list_response.status === 500) {
            console.log("Internal Server Error");
            return []
        } else {
            const problemListJson = await fetch_problem_list_response.json();
            const problemContent = problemListJson.problem_list;
            return problemContent;
        }
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

                socket.on("receive-problem", ({ problem }) => {
                    console.log("Received problems:", problem);
                    setCurrentDisplayProblem(problem);
                });

                socket.on('connect', async () => {
                    await handleStoreRoomCodeRedis(socket.id, session);
                    const checkIsHost = await handleSetRoomHost(roomId || "", session);
                    const join_room_socket = await getRoomSocketId(roomId || "");
                    const problemList = await handleFetchProblemList();
                    setIsHost(checkIsHost);
                    socket.emit('join-room', { 
                        socketId: join_room_socket,
                        roomCode: roomId,
                        sessionId: session,
                        playerName: username,
                        isLocked: "0",
                    }, (err: Error, playerList: String[]) => {
                        if (err) {
                            console.error('join-room error', err);
                            navigate("/");
                            return;
                        }
                        // What I should do is fetch the problem list in the useEffect if is the host, And iterate the problem list
                        // and emit them to the socket server, the server will broadcast the received problem. Rmb only the host is requesting such thing
                        // Note: Everything above should be done in the useEffect, 1 state is used to track to current displayed problem
                        if (checkIsHost === true) {
                            (async () => {
                                for (const problem of problemList) {
                                    const timeAllowed = problem.time_allowed_in_seconds;
                                    socket.emit("request-send-problems", {
                                        roomCode: roomId,
                                        currProblem: problem,
                                    });
                                    await sleep(timeAllowed * 1000);
                                }
                                console.log("All problems have been sent.");
                            })();
                        }
                    });
                });
                socket.connect();

            } catch (err) {
                console.error('Failed to get user info or connect socket', err);
            }
        })();

        return () => {
            mounted = false;
            const s = socketRef.current;
            if (s) {
                s.removeAllListeners(); 
                s.disconnect();
                socketRef.current = null;
            }
        };
    }, []);


    useEffect(() => {
        if (countDown === 0) return;
        const intervalId = setInterval(() => {
            setCountDown(prevCountdown => prevCountdown - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [countDown]);


    return (
        <div className="GamePageContainer">
            {
                countDown > 0 ?
                <div className="CountDownContainer">
                    <h1>{countDown}</h1> 
                </div>
                :
                <div className="ProblemAnswerContainer">
                    <div className="ProgressBarContainer">
                        <progress className="ProgressBar" value={0.5}/>
                    </div>
                    <div className="ProblemTextSection">
                        <div className="ProblemTextContainer">
                            <span>Something in here</span>
                        </div>
                    </div>
                    
                    <div className="AnswerOptionContainer">
                        <div className="OptionsContainer">
                            <div className="OptionADiv">A</div>
                            <div className="OptionBDiv">B</div>
                            <div className="OptionCDiv">C</div>
                            <div className="OptionDDiv">D</div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}


export default GamePage;