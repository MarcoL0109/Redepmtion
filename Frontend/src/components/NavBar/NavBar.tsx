import "./NavBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useState } from "react";
import UserAccountBox from "../UserAccountBox/UserAccountBox";

interface NavBarProps {
    user_data: {username: string, email: string, user_id: number, created_at: string, user_icon: string};
}

const NavBar: React.FC<NavBarProps> = ({user_data}) => {

    const UTILS_API_URL = process.env.VITE_UTILS_API_URL;
    const [isDisplay, setIsDisplay] = useState<boolean>(false);
    const handleProfileClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDisplay(prev => !prev);
        // const testInsertImage = await fetch(`${UTILS_API_URL}/InsertImage`, {
        //     method: "POST",
        //     credentials: "include",
        // })
    };

    const handleClose = () => {
        setIsDisplay(false);
    };

    return (
        <nav className="NavBar">
            <h1 className="NavBarTitleText"><strong>Redemption</strong></h1>
            <div className="UserIconCircle" onClick={handleProfileClick}>
                {
                    user_data.user_icon === "" ? <FontAwesomeIcon icon={faUser} size="3x" /> : 
                    <img className="UserIconImage" src={user_data.user_icon} alt="User Icon" />
                }
            </div>
            {isDisplay &&
            <UserAccountBox onClose={handleClose} user_data={user_data}/>
            }
        </nav>
    );
};

export default NavBar;