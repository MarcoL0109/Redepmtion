import { io, type Socket } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GamePage.css";
import { Problem } from "../ProblemList/ProblemList";
import ProgressLine from "../ProgressBar/ProgressBar"
import RankPage from "../RankPage/RankPage";
import {RankPageProps} from "../RankPage/RankPage";
import { Mosaic } from "react-loading-indicators";


function GamePage() {

    const socketRef = useRef<Socket | null>(null);
    //@ts-ignore
    const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL as string;
    //@ts-ignore
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    //@ts-ignore
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    //@ts-ignore
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL as string;
    const navigate = useNavigate();
    const {userId, username, roomId, problem_set_id} = useParams();
    const [isHost, setIsHost] = useState<boolean>(false);
    const [countDown, setCountDown] = useState<number>(3);
    const [currentDisplayProblem, setCurrentDisplayProblem] = useState<Problem>();
    const [currentTime, setCurrentTimer] = useState<number>(100);
    const [submittedAnswer, setSubmittedAnswer] = useState<boolean>(false);
    const [blankAnswerInput, setBlankAnswerInput] = useState<string>("");
    const [displayRankingPage, setDisplayRankingPage] = useState<boolean>(false);
    const [rankingList, setRankingList] = useState<RankPageProps>({players: [{playerName: "", playerScore: 0}]});
    const [allProblemsStreamed, setAllProblemStreamed] = useState<boolean>(false); // Not in use yet
    const [pendingResultScreen, setPendingResultScreen] = useState<boolean>(false);
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


    useEffect(() => {
        if (countDown === 0) return;
        const intervalId = setInterval(() => {
            setCountDown(prevCountdown => prevCountdown - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [countDown]);


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
            await sleep((2) * 1000);
            const session = await getSessionID();
            try {
                if (!mounted) return;

                socket.on("receive-problem", ({ problem }) => {
                    setSubmittedAnswer(false);
                    setCurrentDisplayProblem(problem);
                });

                socket.on("receive-new-timer-percentage", ({ newPercentage }) => {
                    setCurrentTimer(newPercentage);
                });

                socket.on("check-answer-response", ({correct, score}) => {
                    console.log(`Your answer is ${correct ? "correct" : "incorrect"} and current score is ${score}`);
                    // Need to return the ranking in set and set the states. Once the timer runs out, just pass in the state
                    // And render the component.
                })

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
                        if (checkIsHost === true) {
                            (async () => {
                                for (const problem of problemList) {
                                    setCurrentTimer(100);
                                    socket.emit("request-send-problems", {
                                        roomCode: roomId,
                                        currProblem: problem,
                                    });
                                    await sleep((problem.time_allowed_in_seconds + 3) * 1000);
                                    setPendingResultScreen(false);
                                    setDisplayRankingPage(true);
                                    await sleep(5000); // Set to the ranking page for 6s
                                    setDisplayRankingPage(false);
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


    const handleSubmitClientAnswer = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!submittedAnswer) {
            const selectedId = e.currentTarget.dataset.id;
            const session = await getSessionID();
            if (selectedId && socketRef.current) {
                const splitAnswer = selectedId.split("-");
                socketRef.current.emit("submit-client-answer", {
                    question_type: "MC",
                    clientAnswer: splitAnswer[splitAnswer.length - 1],
                    roomCode: roomId,
                    timeSubmitted: currentTime,
                    sessionId: session,
                });
                setPendingResultScreen(true);
            }
        }
    }


    const handleSubmitFormAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (socketRef.current) {
            socketRef.current.emit("submit-client-answer", {
                question_type: "Blanks",
                clientAnswer: blankAnswerInput,
                roomCode: roomId,
                timeSubmitted: currentTime,
            });
            setPendingResultScreen(true);
        }
    }


    return (
        <div className="GamePageContainer">
            {
                countDown > 0 &&
                <div className="CountDownContainer">
                    <h1>{countDown}</h1> 
                </div>
            }

            {
                (countDown === 0 && !displayRankingPage && !pendingResultScreen) &&
                <div className="ProblemAnswerContainer">
                    <div className="ProgressBarContainer">
                        <ProgressLine
                            label={displayRankingPage}
                            backgroundColor="white"
                            visualParts={[
                                {
                                    percentage: `${currentTime}%`,
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
                                <div className="OptionADiv" data-id="option-A" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.A}</div>
                                <div className="OptionBDiv" data-id="option-B" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.B}</div>
                                <div className="OptionCDiv" data-id="option-C" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.C}</div>
                                <div className="OptionDDiv" data-id="option-D" onClick={handleSubmitClientAnswer}>{currentDisplayProblem?.answer_options.D}</div>
                            </div> :
                            <div className="BlankAnswerContainer">
                                <form className="BlankFormContainer" onSubmit={handleSubmitFormAnswer}>
                                    <div className="InputSubmitContainer">
                                        <div>
                                            <input className="BlankAnswerInput" 
                                            type="text"
                                            placeholder="Type Your Answer"
                                            readOnly={submittedAnswer}
                                            value={blankAnswerInput}
                                            required
                                            onChange={(e) => {setBlankAnswerInput(e.target.value)}}/>
                                        </div>
                                        <button className="BlankAnswerSubmitButton" type="submit" disabled={submittedAnswer}>
                                            <strong>Confirm</strong>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        }
                    </div> 
                </div>
            }

            {
                // I was making this, I forgot...
                displayRankingPage &&
                <RankPage players={rankingList.players}/>
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