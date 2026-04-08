import GoldMedal from "../../assets/gold_medal.svg";
import SilverMedal from "../../assets/silver_medal.svg";
import BronzeMedal from "../../assets/bronze_medal.svg";




export interface RankPageProps {
    players: {
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
                    <th className={`PlayerListRow_Norm`}>Rank </th>
                    <th className={`PlayerListRow_Norm"`}>Player Name</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><img className="historyImage" src={GoldMedal} alt="Gold Medal Icon"/></td>
                    <td className={`PlayerListRow_Norm"`}>{1}</td>
                    <td className={`PlayerListRow_Norm`}>Wingman</td>
                </tr>

                <tr>
                    <td><img className="historyImage" src={SilverMedal} alt="Silver Medal Icon"/></td>
                    <td className={`PlayerListRow_Norm"`}>{2}</td>
                    <td className={`PlayerListRow_Norm`}>Marco</td>
                </tr>

                <tr>
                    <td><img className="historyImage" src={BronzeMedal} alt="Bronze Medal Icon"/></td>
                    <td className={`PlayerListRow_Norm"`}>{3}</td>
                    <td className={`PlayerListRow_Norm`}>Testing</td>
                </tr>
                    
            </tbody>
        </table>
    )
}

export default RankPage