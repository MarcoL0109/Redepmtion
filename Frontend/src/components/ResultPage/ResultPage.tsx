import { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router-dom"
import RankPage from "../RankPage/RankPage";


function ResultPage() {

    const {userId, username, roomId} = useParams();
    const location = useLocation();
    const playerRank = location.state?.playerRank;
    const rankList = location.state?.rankList;
    const isHost = location.state?.isHost;


    return (
        <div>
            <h1>
                {isHost ? (
                    "Your Game Has Ended!!"
                ) : (
                    <>
                        {`You Ranked ${playerRank}`}
                        {playerRank === 1 ? "st" : 
                        playerRank === 2 ? "nd" : 
                        playerRank === 3 ? "rd" : "th"}
                    </>
                )}
            </h1>

        </div>
    )
}



export default ResultPage