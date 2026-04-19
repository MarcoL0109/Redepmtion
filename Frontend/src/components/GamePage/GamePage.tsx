import { io, type Socket } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GamePage.css";
import { Problem } from "../ProblemList/ProblemList";
import ProgressLine from "../ProgressBar/ProgressBar"
import RankPage from "../RankPage/RankPage";
import {RankPageProps} from "../RankPage/RankPage";
import HostNavBar from "../HostNavBar/HostNavBar";
import Overlays from "../Overlays/Overlay";


function GamePage() {

    const socketRef = useRef<Socket | null>(null);
    //@ts-ignore
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    //@ts-ignore
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    //@ts-ignore
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const navigate = useNavigate();
    const {userId, username, roomId, problem_set_id} = useParams();
    const [isHost, setIsHost] = useState<boolean>(false);
    const isHostRef = useRef(isHost);
    const [countDown, setCountDown] = useState<number>(3);
    const [currentDisplayProblem, setCurrentDisplayProblem] = useState<Problem>();
    const [currentTime, setCurrentTime] = useState<number>(100);
    const [submittedAnswer, setSubmittedAnswer] = useState<boolean>(false);
    const [blankAnswerInput, setBlankAnswerInput] = useState<string>("");
    const [displayRankingPage, setDisplayRankingPage] = useState<boolean>(false);
    const [rankingList, setRankingList] = useState<RankPageProps>({players: [{playerIndex: 1, playerName: "", playerScore: 0, playerRank: 1}], isHost: false});
    const rankListRef = useRef(rankingList);
    const [pendingResultScreen, setPendingResultScreen] = useState<boolean>(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
    const [hostLeave, setHostLeave] = useState<boolean>(false);
    const [isRankListOverlayOpen, setIsRankListOverlayOpen] = useState<boolean>(false);
    const [playerIndex, setPlayerIndex] = useState<number>(-1);
    const playerIndexRef = useRef(-1);
    const [displayCorrectAnswer, setDisplayCorrectAnswer] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<string>("");
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


    useEffect(() => {
        isHostRef.current = isHost;
    }, [isHost]);


    useEffect(() => {
        playerIndexRef.current = playerIndex;
    }, [playerIndex]);


    useEffect(() => {
        rankListRef.current = rankingList;
    }, [rankingList]);


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



    useEffect(() => {
        if (socketRef.current) return;
        let mounted = true;
        const socket = io(SOCKET_SERVER_URL, { autoConnect: false });
        socketRef.current = socket;

        (async () => {
            const roomExist = await fetch(`${ROOM_API_URL}/checkRoomCodeExist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({roomCode: roomId}),
            })
            if (roomExist.status !== 200) {
                navigate("/");
            }

            const session = await getSessionID();

            socket.emit("init-game-info", {
                roomCode: roomId,
                sessionId: session,
            });
            
            try {
                if (!mounted) return;
                
                socket.on("receive-problem", async ({ currProblem }) => {
                    setSubmittedAnswer(false);
                    setCurrentDisplayProblem(currProblem);
                });

                socket.on("receive-timer-update", ({ timeAllowed }) => {
                    setCurrentTime(timeAllowed);
                });

                socket.on("receive-count-down-update", ({secondsLeft}) => {
                    setCountDown(secondsLeft);
                })

                socket.on("set-ranklist-ref", ({rankList}) => {
                    setRankingList(rankList);
                })

                socket.on("set-player-index", ({playerIndex}) => {
                    setPlayerIndex(playerIndex);
                })

                socket.on("room-closed", ({reason, message}) => {
                    console.log(message);
                    if (reason === "Terminated") {
                        navigate("/", { state: {roomClosed: true, isHost: isHostRef.current} });
                    } else {
                        navigate("/", { state: {inActiveRoomClosed: true} });
                    }     
                })

                socket.on("kick-player-message", (message) => {
                    console.log(message);
                    navigate("/", { state: {kickMessage: true} });
                })

                socket.on("receive-rank-list", async ({rankList}) => {
                    setBlankAnswerInput("");
                    setSelectedOption("");
                    setDisplayCorrectAnswer(false);
                    setCurrentTime(100);
                    setRankingList(rankList);
                    setDisplayRankingPage(true);
                    await sleep(6000);
                    setDisplayRankingPage(false);
                })

                socket.on("display-correct-answer", async () => {
                    // If the user did not submit anything, we still need to set the answer as null or whatever. So a socket emit is needed in here maybe
                    setPendingResultScreen(false);
                    setDisplayCorrectAnswer(true);
                })

                socket.on("redirect-player-result-page", async ({playerRank, rankingList}) => {
                    navigate(`/ResultPage/${userId}/${username}/${roomId}`, { state: {rankList: rankingList, playerRank: playerRank, isHost: isHostRef.current, playerIndex: playerIndexRef.current} });
                })

                socket.on('connect', async () => {
                    await handleStoreRoomCodeRedis(socket.id, session);
                    const checkIsHost = await handleSetRoomHost(roomId || "", session);
                    const join_room_socket = await getRoomSocketId(roomId || "");
                    setIsHost(checkIsHost);
                    socket.emit('join-room', { 
                        socketId: join_room_socket,
                        roomCode: roomId,
                        sessionId: session,
                        playerName: username,
                        isLocked: "1",
                        checkStream: true,
                        problemSetId: problem_set_id,
                    }, (err: Error, playerList: String[]) => {
                        if (err) {
                            console.error('join-room error', err);
                            navigate("/");
                            return;
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


    const handleSubmitClientAnswer = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!submittedAnswer && currentTime > 0) {
            const selectedId = e.currentTarget.dataset.id;
            const session = await getSessionID();
            if (selectedId && socketRef.current) {
                const splitAnswer = selectedId.split("-");
                setSelectedOption(splitAnswer[splitAnswer.length - 1])
                socketRef.current.emit("submit-client-answer", {
                    question_type: "MC",
                    clientAnswer: splitAnswer[splitAnswer.length - 1],
                    roomCode: roomId,
                    sessionId: session,
                });
                setPendingResultScreen(true);
            }
        }
    }


    const handleSubmitFormAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const session = await getSessionID();
        if (socketRef.current) {
            socketRef.current.emit("submit-client-answer", {
                question_type: "Blanks",
                clientAnswer: blankAnswerInput,
                roomCode: roomId,
                timeSubmitted: currentTime,
                sessionId: session
            });
            setPendingResultScreen(true);
        }
    }


    const handleCloseOverlay = () => {
        setHostLeave(false);
        setIsOverlayOpen(false);
    }


    const handleOpenTerminateOverlay = () => {
        setHostLeave(true);
        setIsOverlayOpen(true)
    }


    const handleLeaveRoom = async () => {
        if (socketRef.current) {
            const session = await getSessionID();
            socketRef.current.emit("leave-room", {
                roomCode: roomId,
                isHost: isHost,
                clientSessionId: session
            })
        }
    }


    const handleDisplayLeaderBoard = () => {
        setIsRankListOverlayOpen(true);
    }


    const handleCloseRankListOverlay = () => {
        setIsRankListOverlayOpen(false);
    }


    const handleKickPlayer = async (targetIndex: string) => {
        if (socketRef.current) {
            const updatedList = rankListRef.current.players.filter(
                player => player.playerIndex.toString() !== targetIndex
            );
            setRankingList({ players: updatedList, isHost: isHostRef.current }); 
            rankListRef.current.players = updatedList;
            socketRef.current.emit("kick-player", {
                roomCode: roomId,
                playerIndex: targetIndex,
            })
        }
    }


    return (
        <div className="GamePageContainer">

            <Overlays isOpen={isOverlayOpen}>
                <div>
                    <div>
                        <h2>{hostLeave ? "Ending" : "Leaving"} the Party Before It Ends?</h2>
                        <p>You are about to {hostLeave ? "terminate" : "leave"} this room. Are you sure you want to {hostLeave ? "end" : "leave"} this party before it starts?</p>
                    </div>
                    <div className="overlay__buttons">
                        <button className="confirmDelete" onClick={handleLeaveRoom}>Confirm</button>
                        <button className="cancelDelete" onClick={handleCloseOverlay}>Cancel</button>
                    </div>
                </div> 
            </Overlays>

            <Overlays isOpen={isRankListOverlayOpen}>
                <div>
                    <div className="RankListOverlay">
                        <RankPage players={rankListRef.current.players} isHost={isHostRef.current} handleKickPlayer={handleKickPlayer}/>
                    </div>
                    <div className="overlay__buttons">
                        <button className="cancelDelete" onClick={handleCloseRankListOverlay}>Cancel</button>
                    </div>
                </div>  
            </Overlays> 

            {
                countDown > 0 &&
                <div className="CountDownContainer">
                    <h1>{countDown}</h1> 
                </div>
            }

            {
                ((countDown === 0 && !displayRankingPage && !pendingResultScreen) || displayCorrectAnswer) &&
                
                <div className="ProblemAnswerContainer">
                    {
                        isHost &&
                        <HostNavBar 
                            handleOpenTerminateOverlay={handleOpenTerminateOverlay}
                            handleDisplayLeaderBoard={handleDisplayLeaderBoard}
                        />
                    }
                    <div className="ProgressBarContainer">
                        <ProgressLine
                            label={displayRankingPage}
                            key={currentTime}
                            duration={currentTime}
                            backgroundColor="white"
                            visualParts={[
                                {
                                    percentage: "100%",
                                    color: "deepskyblue",
                                }
                            ]}
                        />
                    </div>
                    <div className="ProblemTextSection">
                        <div className="ProblemTextContainer">
                            <span>{currentDisplayProblem?.question_text}</span>
                        </div>
                    </div>
                    <div className="AnswerOptionContainer">
                        {
                            currentDisplayProblem?.question_type === "Multiple Choice" ?
                            <div className="OptionsContainer">
                                <div className={displayCorrectAnswer ? `OptionADiv${currentDisplayProblem.correct_answer.MC === 'A' ? "_correct" : "_wrong"}${selectedOption === 'A' ? "_selected" : ""}` : "OptionADiv"} data-id="option-A" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.A}</div>
                                <div className={displayCorrectAnswer ? `OptionBDiv${currentDisplayProblem.correct_answer.MC === 'B' ? "_correct" : "_wrong"}${selectedOption === 'B' ? "_selected" : ""}` : "OptionBDiv"} data-id="option-B" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.B}</div>
                                <div className={displayCorrectAnswer ? `OptionCDiv${currentDisplayProblem.correct_answer.MC === 'C' ? "_correct" : "_wrong"}${selectedOption === 'C' ? "_selected" : ""}` : "OptionCDiv"} data-id="option-C" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.C}</div>
                                <div className={displayCorrectAnswer ? `OptionDDiv${currentDisplayProblem.correct_answer.MC === 'D' ? "_correct" : "_wrong"}${selectedOption === 'D' ? "_selected" : ""}` : "OptionDDiv"} data-id="option-D" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.D}</div>
                            </div> :
                            <div className="BlankAnswerContainer">
                                <form className="BlankFormContainer" onSubmit={handleSubmitFormAnswer}>
                                    <div className="InputSubmitContainer">
                                        {
                                            currentDisplayProblem?.case_sensitive ?
                                            <span className="CaseSensitiveNoti">{"Note: Case Sensitive"}</span> :
                                            null
                                        }
                                        <div>
                                            {
                                                <input className="BlankAnswerInput" 
                                                type="text"
                                                placeholder="Type Your Answer"
                                                readOnly={submittedAnswer}
                                                value={blankAnswerInput}
                                                required
                                                onChange={(e) => {setBlankAnswerInput(e.target.value)}}/> 
                                            }
                                            
                                        </div>
                                        {
                                            !displayCorrectAnswer ?
                                            <button className="BlankAnswerSubmitButton" type="submit" disabled={submittedAnswer || currentTime === 0}>
                                                <strong>Confirm</strong>
                                            </button> :
                                            <span className="BlankCorrectAnswer">{`Correct Answer: ${currentDisplayProblem?.correct_answer.Blanks}`}</span>
                                        }
                                    </div>
                                </form>
                            </div>
                        }
                    </div> 
                </div>
            }

            {
                displayRankingPage &&
                <RankPage players={rankingList.players} isHost={false} clientPlayerIndex={playerIndex}/>
            }

            {
                pendingResultScreen &&
                <div className="LoadingAnimationContainer">
                    <h3 className="CatchUpSpan">You're too Fast, Others are Still Thinking. Give Them Some Time to Catch Up</h3>
                </div>
            }
        </div>
    )
}


export default GamePage;