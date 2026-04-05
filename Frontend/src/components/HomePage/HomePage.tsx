import "./HomePage.css";
import NavBar from "../NavBar/NavBar";
import ProblemSetCard from "../ProblemSetCard/ProblemSetCard";
import Overlays from "../Overlays/Overlay";
import { Mosaic } from 'react-loading-indicators';
import { useNavigate, useLocation } from "react-router-dom";
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

    const navigate = useNavigate();
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL;
    const USER_API_URL = process.env.VITE_USER_API_URL;
    const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL;
    const location = useLocation();
    const kickState = location.state?.kickMessage || false;
    const closeRoom = location.state?.roomClosed || false;
    const isHost = location.state?.isHost || false;
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
    const [potentialCreateProblemSet, setPotentialCreateProblemSet] = useState<{[key: number]: {attributes: ProblemSetModificationMap}}>({});
    const [snapShotProblemSet, setSnapShotProblemSet] = useState([
        {
            problem_set_id: -1, problem_set_title: "", problem_set_description: "", 
            problem_counts: -1, created_by: -1, created_at: "", 
            last_update_at: ""
        }
    ])
    const [createIndex, setCreateIndex] = useState<number>(0);
    const [deleteMode, setDeleteMode] = useState<boolean>(false);
    const [potentialDeleteList, setPotentialDeleteList] = useState<number[]>([]);
    const [clearToggle, setClearToggle] = useState<number>(0);
    const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
    const [isCloseRoomOverlayOpen, setIsCloseRoomOverlayOpen] = useState<boolean>(false);
    const [isKickRoomOverlayOpen, setIsKickRoomOverlayOpen] = useState<boolean>(false);


    useEffect(() => {
        if (closeRoom && !isHost) {
            setIsCloseRoomOverlayOpen(true);
        } else if (kickState) {
            setIsKickRoomOverlayOpen(true);
        }
        navigate(location.pathname, { 
            replace: true, 
            state: {} 
        });
    }, [closeRoom, isHost, navigate, location.pathname]);


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
                navigate("/SignIn");
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
            setProblemSetModMap({});
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
            setPotentialCreateProblemSet({});
        } else {
           console.log("Internal Server Error") ;
        }
    }


    const handleSaveDelete = async () => {
        const delete_problems_response = await fetch(`${PROBLEM_SET_API_URL}/DeleteProblemSets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({potentialDeleteList})
        })

        if (delete_problems_response.status === 200) {
            setPotentialDeleteList([]);
        } else {
            console.log("Internal Server Error");
        }
    }


    const handleSave = async () => {
        if (Object.keys(potentialCreateProblemSet).length > 0) {
            await handleSaveCreate();
        }
        if (Object.keys(problemSetModMap).length > 0) {
            await handleSaveUpdate();
        }
        if (potentialDeleteList.length > 0) {
            setIsOverlayOpen(true);
        } else {
            await fetch_problem_sets(userData.user_id);
            setEditMode(false);
            setDeleteMode(false);
        }
    }


    const handleDelete = async () => {
        setDeleteMode(true);
    }


    const handleAddPotentialDelete = (problem_set_id: number) => {
        setPotentialDeleteList(prev => [
            ...prev,
            problem_set_id
        ])
    }


    const handleRemovePotentialDelete = (problem_set_id: number) => {
        setPotentialDeleteList(prev => prev.filter(id => id != problem_set_id));
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
        setPotentialCreateProblemSet(prev => ({
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
        setPotentialDeleteList([]);
        setPotentialCreateProblemSet({});
        setProblemSetModMap({});
        setClearToggle(prev => prev ^ 1)
        setProblemSets(snapShotProblemSet);
        setEditMode(false);
        setDeleteMode(false);
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
            setPotentialCreateProblemSet(prev => ({
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


    const handleCloseOverlay = () => {
        setPotentialDeleteList([]);
        setIsOverlayOpen(false);
        setDeleteMode(false);
    }


    const handlePureCloseOverlay = () => {
        setIsKickRoomOverlayOpen(false);
        setIsCloseRoomOverlayOpen(false);
    }


    const handleConfirmDelete = async () => {
        await handleSaveDelete();
        setIsOverlayOpen(false);
        setDeleteMode(false);
        await fetch_problem_sets(userData.user_id);
    }


    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData}/>
            <Overlays isOpen={isOverlayOpen}>
                <h1>Bye Bye Records</h1>
                <p>{`${potentialDeleteList.length} Problem Set(s) Selected For Deletion. Once they are deleted, they are gone forever. Are you
                        sure you want to delete those records?`}</p>
                <div className="overlay__buttons">
                    <button className="confirmDelete" onClick={handleConfirmDelete}>Confirm</button>
                    <button className="cancelDelete" onClick={handleCloseOverlay}>Cancel</button>
                </div>
            </Overlays>

            {
                <Overlays isOpen={isKickRoomOverlayOpen}>
                    <h2>Uh Oh! You have been Removed from the Room</h2>
                    <p>You may have joined a party that you are not invited to. Sure there are no hard feelings.</p>
                    <div className="overlay__buttons">
                        <button className="cancelDelete" onClick={handlePureCloseOverlay}>Close</button>
                    </div>
                </Overlays>
            }

            {
                <Overlays isOpen={isCloseRoomOverlayOpen}>
                    <h2>Well...The Host Shut the Party Down Early</h2>
                    <p>The host shut the room down. Maybe join another one</p>
                    <div className="overlay__buttons">
                        <button className="cancelDelete" onClick={handlePureCloseOverlay}>Close</button>
                    </div>
                </Overlays>
            }

            {
                (isloaded && problemSets.length > 0) ?
                <div className="">
                    {
                        editMode || deleteMode ?
                        <div className="SaveRevertButtonContainer">
                            <button className="SaveButton" onClick={handleSave}>Save</button>
                            <button className="RevertButton" onClick={handleCancel}>Cancel</button>
                        </div>:
                        <div className="SaveRevertButtonContainer">
                            <button className="SaveButton" onClick={handleEditMode}>Edit</button>
                            <button className="HomePageDeleteButton" onClick={handleDelete}>Delete</button>
                        </div>
                    }
                </div> :
                null
            }

            {
                (isloaded && problemSets.length == 0) &&
                <div className="CreateFirstProblemTextMessageContainer">
                    <h2 className="CreateFirstProblemTextMessage">Create your first Problem Set Now!!</h2>
                </div>
            }

            {
                isloaded ?
                <div className="problemSetCardsContainer">
                    {
                    problemSets.map(problem_set => (
                        <div key={problem_set.problem_set_id}>
                            <ProblemSetCard problem_set={problem_set} editMode={editMode} deleteMode={deleteMode} is_temp={problem_set.is_temp ?? false}
                            handleChange={handleProblemSetChange}
                            handleAddPotentialDeleteProblems={handleAddPotentialDelete}
                            handleRemovePotentialDeleteProblems={handleRemovePotentialDelete}
                            handleClearToggle={clearToggle}/>
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