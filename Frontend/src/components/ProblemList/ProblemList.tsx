import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { closestCorners, DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import "./ProblemList.css";
import NavBar from "../NavBar/NavBar";
import Sortable from "../SortableList/SortableList";
import { Mosaic, Commet } from "react-loading-indicators";


interface Problem {
    problem_id: number;
    problem_set_id: number,
    sequence_no: number;
    question_type: string;
    question_text: string;
    answer_options: AnswerOptions;
    correct_answer: CorrectAnswer;
    case_sensitive: number,
    time_allowed_in_seconds: number,
    is_temp ?: boolean
}

interface UserData {
    username: string,
    email: string,
    user_id: number,
    created_at: string,
    user_icon: string,
}

interface ObejctForAPI {
    [key: string]: string; // All values are strings after JSON.stringify
}

export interface AnswerOptions {
    "A": string,
    "B": string,
    "C": string,
    "D": string
}

export interface CorrectAnswer {
    "MC": string,
    "Blanks": string
}

export interface UpdatedValues {
    "question_type" ?: string,
    "question_text" ?: string,
    "answer_options" ?: AnswerOptions,
    "correct_answer" ?: CorrectAnswer,
    "sequence_no" ?: number,
    "case_sensitive" ?: number,
    "time_allowed_in_seconds" ?: number,
}


function ProblemList() {
    const location = useLocation();
    const problem_set_id = location.state?.problem_set_id as number | null;
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL as string;
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const USER_API_URL = process.env.VITE_USER_API_URL as string;
    const ROOM_API_URL = process.env.VITE_ROOM_MANAGEMENT_API_URL as string;
    const navigate = useNavigate();

    const [displayError, setDisplayError] = useState<boolean>(false);
    const [problemList, setProblemList] = useState<Problem[]>([]);
    const [snapShotProblemList, setSnapShotProblemList] = useState<Problem[]>([]);
    const [isLoaded, setIsLoaded] = useState<boolean>(true);   
    const [userData, setUserData] = useState<UserData>({
        username: "",
        email: "",
        user_id: -1,
        created_at: "",
        user_icon: "",
    });
    const [modifiedProblems, setModifiedProblems] = useState<{ [key: number]: { attributes: UpdatedValues } }>({});
    const [potentialDelete, setPotentialDelete] = useState<number[]>([]);
    const [potentialCreate, setPotentialCreate] = useState<{ [key: number]: { attributes: UpdatedValues } }>({});
    const [sequenceMap, setSequenceMap] = useState<Record<number, number>>({});
    const [isSaved, setIsSaved] = useState<boolean>(true);
    const [revertCount, setRevertCount] = useState<number>(0);
    const [index, setIndex] = useState<number>(0);
    const [maxSequence, setMaxSequence] = useState<number>(0);


    const fetch_problem_list = async () => {
        setIsLoaded(false);
        const fetch_problem_list_response = await fetch(`${PROBLEM_SET_API_URL}/getProblems`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ problem_set_id }),
        });

        if (fetch_problem_list_response.status === 500) {
            setDisplayError(true);
        } else if (fetch_problem_list_response.status === 200) {
            const fetched_problems_json = await fetch_problem_list_response.json();
            const fetched_problems_list: Problem[] = fetched_problems_json.problem_list;
            setProblemList(fetched_problems_list);
            setSnapShotProblemList(fetched_problems_list);
            setIsLoaded(true);
            setMaxSequence(fetched_problems_list[fetched_problems_list.length - 1].sequence_no + 1);
            setSequenceMap(prev => {
                const next = { ...prev };
                for (let i = 0; i < fetched_problems_list.length; i++) {
                    const id = fetched_problems_list[i].problem_id;
                    next[id] = fetched_problems_list[i].sequence_no;
                }
                return next;
            });
        }
    };


    useEffect(() => {
        const fetch_user_data_from_session = async () => {
            const fetch_session_info_response = await fetch(`${UTILS_API_URL}/SessionInfo`, {
                method: "GET",
                credentials: "include"
            });
            if (fetch_session_info_response.status === 200) {
                const fetched_session_json = await fetch_session_info_response.json();
                const fetched_user_id = fetched_session_json.session.user_id || null;
                if (fetched_user_id === null) {
                    navigate("/SignIn");
                }
                const get_user_data_response = await fetch(`${USER_API_URL}/getUserInfo`, {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({user_id: fetched_user_id}),
                });
                const user_data_json = await get_user_data_response.json();
                const user_data_content = user_data_json.userData;
                let image_url = "";
                if (user_data_content.user_icon !== null) {
                    const arrayBuffer = new Uint8Array(user_data_content.user_icon.data);
                    const image_blob = new Blob([arrayBuffer], { type: 'image/jpg' });
                    image_url = URL.createObjectURL(image_blob);
                }
                user_data_content.user_icon = image_url;
                setUserData(user_data_content);
                setIsLoaded(true);
            }
        }
        fetch_problem_list();
        fetch_user_data_from_session();
    }, []);


    useEffect(() => {
        const cleanedProblems = { ...modifiedProblems };

        Object.keys(cleanedProblems).forEach((key: string) => {
            const numericKey = Number(key)
            if (Object.keys(cleanedProblems[numericKey]?.attributes || {}).length === 0) {
                delete cleanedProblems[numericKey];
            }
        });
        if (Object.keys(cleanedProblems).length !== Object.keys(modifiedProblems).length) {
            setModifiedProblems(cleanedProblems);
        }
    }, [modifiedProblems])


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        setProblemList((current) => {
            const oldIndex = current.findIndex(p => p.problem_id === Number(active.id));
            const newIndex = current.findIndex(p => p.problem_id === Number(over.id));

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
                return current;
            }
            const newList = arrayMove(current, oldIndex, newIndex);
            const min_index = Math.min(oldIndex, newIndex);
            const max_index = Math.max(oldIndex, newIndex);

            setModifiedProblems(prev => {
                let start = 1e9;
                for (let i = min_index; i <= max_index; i++) {
                    start = Math.min(newList[i].sequence_no, start);
                }
                const next = { ...prev };
                for (let i = min_index; i <= max_index; i++) {
                    const key = newList[i].problem_id;
                    next[key] = {
                        ...(next[key] || {}),
                        attributes: {
                            ...(next[key]?.attributes || prev[key]?.attributes || {}),
                            sequence_no: start,
                        },
                    };
                    start++;
                }
                // Need to remove records that went back to their original places, save db write time
                for (const problem_id in next) {
                    const attributes = next[problem_id]["attributes"];
                    if ("sequence_no" in attributes && attributes["sequence_no"] === sequenceMap[Number(problem_id)]) {
                        delete attributes["sequence_no"];
                    }
                }
                return next;
            });
            
            return newList;
        });
    };


    const handleUpdateProblemSet = (problemId: number, changes: UpdatedValues, is_temp: boolean) => {
        if (!is_temp) {
            setModifiedProblems(prev => ({
                ...prev,
                [problemId]: {
                    attributes: {
                        ...(prev[problemId]?.attributes || {}),
                        ...changes,
                    },
                },
            }));
        } else {
            setPotentialCreate(prev => ({
                ...prev,
                [problemId]: {
                    attributes: {
                        ...(prev[problemId]?.attributes || {}),
                        ...changes,
                    },
                },
            }));
        }
    }


    const handleRemoveAttribute = (problemId: number, attribute: keyof UpdatedValues) => {
        setModifiedProblems(prev => {
            const updatedProblems = { ...prev };
            delete updatedProblems[problemId]?.attributes[attribute];
            return updatedProblems;
        });
    };


    const handleSaveUpdate = async () => {
        let objectForAPICall: ObejctForAPI = {}
        for (let key in modifiedProblems) {
            if (typeof modifiedProblems[key] === "object") {
                objectForAPICall[key] = JSON.stringify(modifiedProblems[key]);
            } else {
                objectForAPICall[key] = modifiedProblems[key];
            }
        }
        const update_problems_response = await fetch(`${PROBLEM_SET_API_URL}/SaveUpdatedProblems`, {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({update_values: objectForAPICall})
        });

        if (update_problems_response.status === 200) {
            setModifiedProblems({});
        } else if (update_problems_response.status === 500) {
            console.log("Internal Server Error");
        }
    }


    const handleSaveDelete = async () => {
        const delete_response = await fetch(`${PROBLEM_SET_API_URL}/DeleteProblems`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({problemsToBeDeleted: potentialDelete})
        });

        if (delete_response.status === 200) {
            setPotentialDelete([]);
        } else if (delete_response.status === 500) {
            console.log("Internal Server Error");
        }
    }


    const handleTempAddProblems = async () => {
        if (problem_set_id !== null)  {
            const new_problem: Problem = {"problem_set_id": problem_set_id,"problem_id": index, "sequence_no": maxSequence, "question_type": "Multiple Choice", 
                            "question_text": "", "answer_options": {"A": "", "B": "", "C": "", "D": ""},
                            "correct_answer": {"MC": "", "Blanks": ""}, "case_sensitive": 0,
                            "time_allowed_in_seconds": 10, "is_temp": true,
                            };
            // Update the potential create for API creation call
            setPotentialCreate(prev => ({
                ...prev,
                [index]: {
                    attributes: {
                        ...(prev[index]?.attributes || {}),
                        ...new_problem,
                    },
                },
            }));

            // Set the problem list state for rendering in the frontend
            setProblemList(prev => [
                ...prev,
                new_problem
            ]);
            setIndex(prev => prev + 1);
            setMaxSequence(prev => prev + 1);
        } 
    }


    const handleSaveAddedProblems = async () => {
        const insert_problem_repsonse = await fetch(`${PROBLEM_SET_API_URL}/CreateNewProblem`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }, 
            credentials: "include",
            body: JSON.stringify({"problemsToBeCreated": potentialCreate})
        });

        if (insert_problem_repsonse.status === 200) {
            setPotentialCreate([]);
        } else {
            console.log("Internal Server Error");
        } 
    }

    
    const handleSave = async () => {
        // Save order: insert -> update -> delete
        setIsSaved(false);
        await handleSaveAddedProblems();
        await handleSaveUpdate();
        await handleSaveDelete();
        setIsSaved(true);
        await fetch_problem_list();
    }


    const handlePotentialDelete = (problem_id: number) => {
        setPotentialDelete(prevItems => [
            ...prevItems,
            problem_id,
        ])
    }


    const handleRevert = () => {
        setIsSaved(false);
        setPotentialCreate({});
        setModifiedProblems({});
        setPotentialDelete([]);
        setProblemList(snapShotProblemList);
        setRevertCount(prev => prev ^ 1);
        setMaxSequence(snapShotProblemList[problemList.length - 1].sequence_no + 1)
        setIsSaved(true);
    }


    const handleStartRoom = async () => {
        const get_room_code = await fetch(`${ROOM_API_URL}/getRoomCode`, {
            method: "GET",
            credentials: "include",
        })
        const room_code_json = await get_room_code.json();
        const room_code = room_code_json.code;
        navigate(`/PendingStartRoom/${userData.user_id}/${room_code}`);
    }

    
    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData} />
            {
                
                <div className="ButtonsContainer">
                    {
                        ((Object.keys(modifiedProblems).length > 0 || potentialDelete.length > 0 || Object.keys(potentialCreate).length > 0) && isSaved) &&
                        <div className="SaveRevertButtonContainer">
                            <button className="SaveButton" onClick={handleSave}>Save</button>
                            <button className="RevertButton" onClick={handleRevert}>Revert</button>
                        </div>
                    }
                    <div className="startQuizButtonContainer">
                        <button className="StartButton" onClick={handleStartRoom}>Start</button>
                    </div>
                </div>
                
            }

            {
                ((Object.keys(modifiedProblems).length > 0 || potentialDelete.length > 0 || Object.keys(potentialCreate).length > 0) && !isSaved) &&
                <Commet color="#59acef" size="small" />
            }
            
            {
                isLoaded ? 
                (
                    <div className="ProblemListContainer">
                        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                            <SortableContext items={problemList.map(p => String(p.problem_id))} strategy={verticalListSortingStrategy}>
                                <ul className="ProblemList">
                                {problemList.map((problem, index) =>
                                    !potentialDelete.includes(problem.problem_id) ? (
                                    <Sortable
                                        key={String(problem.problem_id)}
                                        id={problem.problem_id}
                                        index={index}
                                        question_text={problem.question_text}
                                        question_type={problem.question_type}
                                        sequence_no={problem.sequence_no}
                                        answer_options={problem.answer_options}
                                        correct_answer={problem.correct_answer}
                                        case_sensitive={problem.case_sensitive}
                                        time_allowed_in_seconds={problem.time_allowed_in_seconds}
                                        is_temp={problem.is_temp ?? false}
                                        ProblemsChange={handleUpdateProblemSet}
                                        RemoveProblemChange={handleRemoveAttribute}
                                        PotentialDelete={handlePotentialDelete}
                                        RevertCount={revertCount}
                                    />
                                    ) : null
                                )}
                                </ul>
                            </SortableContext>
                        </DndContext>
                        <div className="AddDivButtonContainer">
                            <div className="circle" onClick={handleTempAddProblems}>
                                <div className="add-symbol">+</div>
                            </div>
                        </div>
                    </div>
                )
                
                :<div className="LoadingAnimationContainer">
                    <Mosaic color="#d6af37" size="large"/>
                </div>
            }
            
        </div>
    );
}

export default ProblemList;