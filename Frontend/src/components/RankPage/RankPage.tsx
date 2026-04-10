import GoldMedal from "../../assets/gold_medal.svg";
import SilverMedal from "../../assets/silver_medal.svg";
import BronzeMedal from "../../assets/bronze_medal.svg";




export interface RankPageProps {
    players: {
        playerRank: number,
        playerName: string;
        playerScore: number;
    }[];
}


function RankPage({players} : RankPageProps) {


    return (
        <table className="JoinerList">
            <thead>
                <tr>
                    <th></th>
                    <th className={`PlayerListRow_Norm`}>Rank</th>
                    <th className={`PlayerListRow_Norm"`}>Player Name</th>
                </tr>
            </thead>
            <tbody>
                {
                    players.map((players, index) => 
                        
                        <tr key={index}>
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
                        </tr>
                    )
                } 
            </tbody>
        </table>
    )
}

export default RankPage