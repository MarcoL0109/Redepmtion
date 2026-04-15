import GoldMedal from "../../assets/gold_medal.svg";
import SilverMedal from "../../assets/silver_medal.svg";
import BronzeMedal from "../../assets/bronze_medal.svg";
import "./RankPage.css";




export interface RankPageProps {
    players: {
        playerIndex: number,
        playerRank: number,
        playerName: string;
        playerScore: number;
    }[],
    isHost: boolean,
    clientPlayerIndex?: number,
    handleKickPlayer?: (index: string) => void,
}


function RankPage({players, isHost, clientPlayerIndex, handleKickPlayer} : RankPageProps) {


    return (
        <table className="JoinerList">
            <thead>
                <tr>
                    <th></th>
                    <th className={`PlayerListRow_Norm`}>Rank</th>
                    <th className={`PlayerListRow_Norm"`}>Player Name</th>
                    <th className={`PlayerListRow_Norm"`}>Score</th>
                </tr>
            </thead>
            <tbody>
                {
                    players.map((players, index) => 
                        <tr key={index} className={`rankListRow${clientPlayerIndex === players.playerIndex ? "_self" : ""}`}>
                            {
                                players.playerRank === 1 && 
                                <td><img className="historyImage" src={GoldMedal} alt="Gold Medal Icon"/></td>
                            }
                            {
                                players.playerRank === 2 && 
                                <td><img className="historyImage" src={SilverMedal} alt="Gold Medal Icon"/></td>
                            }
                            {
                                players.playerRank === 3 && 
                                <td><img className="historyImage" src={BronzeMedal} alt="Gold Medal Icon"/></td>
                            }
                            <td className={`PlayerListRow_Norm"`}>{players.playerRank}</td>
                            <td className={`PlayerListRow_Norm`}>{players.playerName}</td>
                            <td className={`PlayerListRow_Norm`}>{players.playerScore}</td>
                            {
                                (isHost && handleKickPlayer) &&
                                <td>
                                    <button className="KickPlayerButton" onClick={() => handleKickPlayer((players.playerIndex).toString())}>Kick Player</button>
                                </td>
                            }
                        </tr>
                    )
                } 
            </tbody>
        </table>
    )
}

export default RankPage