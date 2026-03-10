import "./HomePage.css";
import NavBar from "../NavBar/NavBar";
import ProblemSetCard from "../ProblemSetCard/ProblemSetCard";
import { Mosaic } from 'react-loading-indicators';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AddIcon from "../../assets/add.svg";


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
    const [problemSets, setProblemSets] = useState([
        {
        problem_set_id: -1, problem_set_title: "", problem_set_description: "", 
        problem_counts: -1, created_by: -1, created_at: "", 
        last_update_at: ""
        }
    ])
    const [isloaded, setIsLoaded] = useState<boolean>(false);

    
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
                const fetch_user_info_response = await fetch(`${USER_API_URL}/getUserInfo`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: "include",
                    body: JSON.stringify({user_id: session_user_id}),
                })
                const user_data_json = await fetch_user_info_response.json();
                const fetchedUserData = user_data_json.userData
                let image_url = "";
                if (fetchedUserData.user_icon !== null) {
                    const arrayBuffer = new Uint8Array(fetchedUserData.user_icon.data);
                    const image_blob = new Blob([arrayBuffer], { type: 'image/jpg' });
                    image_url = URL.createObjectURL(image_blob);
                }
                setUserData({
                    username: fetchedUserData.username,
                    email: fetchedUserData.email,
                    user_id: fetchedUserData.user_id,
                    created_at: fetchedUserData.create_date.toString(),
                    user_icon: image_url
                })
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
                setIsLoaded(true);
            }
        }
        checkUserValidation();
        
    }, []);


    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData}/>
            {
                isloaded ?
                <div className="problemSetCardsContainer">
                    {
                        problemSets.map(problem_set => (
                            <div key={problem_set.problem_set_id}>
                                <ProblemSetCard problem_set={problem_set}/>
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
                    <div className="circle">
                        <div className="add-symbol">+</div>
                    </div>
                </div>
            }
        </div>
    )
}




export default HomePage;