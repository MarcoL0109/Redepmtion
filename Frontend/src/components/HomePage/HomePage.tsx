import "./HomePage.css";
import NavBar from "../NavBar/NavBar";
import ProblemSetCard from "../ProblemSetCard/ProblemSetCard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


function HomePage() {

    const nevagate = useNavigate();
    const UTILS_API_URL = process.env.VITE_UTILS_API_URL;
    const USER_API_URL = process.env.VITE_USER_API_URL;
    const [userData, setUserData] = useState<{ username: string; email: string; user_id: number; created_at: string, user_icon: string }>({
        username: "",
        email: "",
        user_id: -1,
        created_at: "",
        user_icon: "",
    });
    const [problemSets, setProblemSets] = useState([
        {
        id: -1, title: "", description: "", 
        counts: -1, created_by: -1, created_at: "", 
        last_update_at: ""
        }
    ])

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
            }
        }
        checkUserValidation();
        
    }, []);


    return (
        <div className="HomePageContainer">
            <NavBar user_data={userData}/>
        </div>
    )
}




export default HomePage;