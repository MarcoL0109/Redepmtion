import "./HomePage.css";
import NavBar from "../NavBar/NavBar";
import ProblemSetCard from "../ProblemSetCard/ProblemSetCard";
import { Mosaic } from 'react-loading-indicators';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


export interface ProblemSetModificationMap {
    "problem_set_title" ?: string,
    "problem_set_description" ?: string,
}

interface ProblemSet {
    "problem_set_id": number,
    "problem_set_title": string,
    "problem_set_description": string,
    "problem_counts": number,
    "created_by": number,
    "created_at"?: string,
    "last_update_at"?: string,
    "is_temp" ?: boolean,
}


function HomePage() {

    const nevagate = useNavigate();
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL;
    const USER_API_URL = process.env.VITE_USER_API_URL;
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL;
    const [userData, setUserData] = useState<{ username: string; email: string; user_id: number; created_at: string, user_icon: string }>({
        username: "",
        email: "",
        user_id: -1,
        created_at: "",
        user_icon: "",
    });
    const [problemSets, setProblemSets] = useState<ProblemSet[]>([
        {
        problem_set_id: -1, problem_set_title: "", problem_set_description: "", 
        problem_counts: -1, created_by: -1, created_at: "", 
        last_update_at: ""
        }
    ])
    const [isloaded, setIsLoaded] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [problemSetModMap, setProblemSetModMap] = useState<{[key: number]: {attributes: ProblemSetModificationMap}}>({});
    const [potentialCreateProblemSet, setpotentialCreateProblemSet] = useState<{[key: number]: {attributes: ProblemSetModificationMap}}>({});
    const [snapShotProblemSet, setSnapShotProblemSet] = useState([
        {
        problem_set_id: -1, problem_set_title: "", problem_set_description: "", 
        problem_counts: -1, created_by: -1, created_at: "", 
        last_update_at: ""
        }
    ])
    const [createIndex, setCreateIndex] = useState<number>(0);


    const fetch_problem_sets = async (session_user_id: number) => {
        const fecth_problem_set_response = await fetch(`${PROBLEM_SET_API_URL}/getProblemSets`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: "include",
                    body: JSON.stringify({user_id: session_user_id}),
                })
        const fetched_problem_sets_json = await fecth_problem_set_response.json();
        const fetched_problem_sets_data = fetched_problem_sets_json.problem_sets;
        setProblemSets(fetched_problem_sets_data);
        setSnapShotProblemSet(fetched_problem_sets_data);
        setIsLoaded(true);
    }

    
    useEffect(() => {
        const checkUserValidation = async () => {
            const getSessionInfoRepsonse = await fetch(`${UTILS_API_URL}/SessionInfo`, {
                method: "GET",
                credentials: "include"
            })
            const session_info_body = await getSessionInfoRepsonse.json();
            const session_user_id = session_info_body.session.user_id || null
            if (session_user_id === null) {
                nevagate("/SignIn");
            } else {
                const get_user_data_response = await fetch(`${USER_API_URL}/getUserInfo`, {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({user_id: session_user_id}),
                });

                const user_data_json = await get_user_data_response.json();
                const user_data_content = user_data_json.userData;

                let image_url = "";
                if (user_data_content.user_icon !== null) {
                    const arrayBuffer = new Uint8Array(user_data_content.user_icon.data);
                    const image_blob = new Blob([arrayBuffer], { type: 'image/jpg' });
                    image_url = URL.createObjectURL(image_blob);
                }
                setUserData({
                    username: user_data_content.username,
                    email: user_data_content.email,
                    user_id: user_data_content.user_id,
                    created_at: user_data_content.create_date.toString(),
                    user_icon: image_url,
                })
                await fetch_problem_sets(session_user_id);
            }
        }
        checkUserValidation();
    }, []);


    const handleEditMode = async () => {
        setEditMode(true);
    }


    const handleSaveUpdate = async () => {
        const update_problem_set_status = await fetch(`${PROBLEM_SET_API_URL}/UpdateProblemSets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({problemSetModMap})
        })

        if (update_problem_set_status.status === 500) {
            console.log("Internal Server Error");
        } else {
            console.log(userData);
            await fetch_problem_sets(userData.user_id);
        }
    }


    const handleSaveCreate = async () => {
        const create_problem_set_status = await fetch(`${PROBLEM_SET_API_URL}/CreateNewProblemSet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({potentialCreateProblemSet})
        })

        if (create_problem_set_status.status === 200) {
            await fetch_problem_sets(userData.user_id);
        } else {
           console.log("Internal Server Error") ;
        }
    }


    const handleSave = async () => {
        setEditMode(false);
        await handleSaveCreate();
        await handleSaveUpdate();
    }


    const handleAddProblemSet = async () => {
        setEditMode(true);
        const new_problem_set: ProblemSet = {
            "problem_set_id": createIndex,
            "problem_set_title": "",
            "problem_set_description": "",
            "problem_counts": 0,
            "created_by": userData.user_id,
            "is_temp": true,
        };
        setProblemSets(prev => [
            ...prev,
            new_problem_set
        ]);
        setpotentialCreateProblemSet(prev => ({
            ...prev,
            [createIndex]: {
                attributes: {
                    ...(prev[createIndex]?.attributes || {}),
                    ...new_problem_set,
                },
            },
        }));
        setCreateIndex(prev => prev + 1);
    };


    const handleCancel = () => {
        setProblemSets(snapShotProblemSet);
        setEditMode(false);
    }


    const handleProblemSetChange = (problem_set_id: number, change: ProblemSetModificationMap, is_temp: boolean) => {
        if (!is_temp) {
            setProblemSetModMap(prev => ({
                ...prev,
                [problem_set_id]: {
                    attributes: {
                        ...(prev[problem_set_id]?.attributes || {}),
                        ...change,
                    }
                }
            }))
        }
        else {
            setpotentialCreateProblemSet(prev => ({
                ...prev,
                [problem_set_id]: {
                    attributes: {
                        ...(prev[problem_set_id]?.attributes || {}),
                        ...change,
                    }
                }
            }))
        }
    }


    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData}/>
            {
                isloaded ?
                <div className="">
                    {
                        editMode ?
                        <div className="SaveRevertButtonContainer">
                            <button className="SaveButton" onClick={handleSave}>Save</button>
                            <button className="RevertButton" onClick={handleCancel}>Cancel</button>
                        </div>:
                        <div className="SaveRevertButtonContainer">
                            <button className="SaveButton" onClick={handleEditMode}>Edit</button>
                        </div>
                    }
                </div> :
                <div></div>
            }
            {
                isloaded ?
                <div className="problemSetCardsContainer">
                    {
                    problemSets.map(problem_set => (
                        <div key={problem_set.problem_set_id}>
                            <ProblemSetCard problem_set={problem_set} editMode={editMode} handleChange={handleProblemSetChange} is_temp={problem_set.is_temp ?? false}/>
                        </div>
                    ))
                    }
                </div> :
                <div className="LoadingAnimationContainer">
                    <Mosaic color="#d6af37" size="large"/>
                </div>
            }
            {
                isloaded && 
                <div className="AddDivButtonContainer">
                    <div className="circle" onClick={handleAddProblemSet}>
                        <div className="add-symbol">+</div>
                    </div>
                </div>
            }
        </div>
    )
}




export default HomePage;