import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import "./ProblemList.css";
import NavBar from "../NavBar/NavBar";
import Sortable from "../SortableList/SortableList";
import { Mosaic } from "react-loading-indicators";


interface Problem {
    problem_id: number;
    sequence_no: number;
    question_type: string;
    question_text: string;
    answer_options: Record<string, any>;
    correct_answer: Record<string, any>;
}

interface UserData {
    username: string,
    email: string,
    user_id: number,
    created_at: string,
    user_icon: string,
}

function ProblemList() {
    const location = useLocation();
    const problem_set_id = location.state?.problem_set_id as number | null;
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL as string;
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL as string;
    const USER_API_URL = process.env.VITE_USER_API_URL as string;
    const navigate = useNavigate();

    const [displayError, setDisplayError] = useState<boolean>(false);
    const [problemList, setProblemList] = useState<Problem[]>([]);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData>({
        username: "",
        email: "",
        user_id: -1,
        created_at: "",
        user_icon: "",
    });


    useEffect(() => {
        const fetch_problem_list = async () => {
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
            }
        };

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over) {
            setProblemList((current) => {
                const oldIndex = current.findIndex(problem => problem.problem_id === active.id);
                const newIndex = current.findIndex(problem => problem.problem_id === over.id);
                
                return arrayMove(current, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData} />
            {
                isLoaded ? 
                <DndContext onDragEnd={handleDragEnd}>
                    <ul className="ProblemList">
                        {problemList.map((problem, index) => (
                            <Sortable key={problem.problem_id} id={problem.problem_id} index={index} question_text={problem.question_text} 
                            question_type={problem.question_type} sequence_no={problem.sequence_no} answer_options={problem.answer_options}
                            correct_answer={problem.correct_answer}/>
                        ))}
                    </ul>
                </DndContext>:
                <div className="LoadingAnimationContainer">
                    <Mosaic color="#d6af37" size="large"/>
                </div>
            }
            
        </div>
    );
}

export default ProblemList;