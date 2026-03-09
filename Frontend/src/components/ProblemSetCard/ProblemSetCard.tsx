import { useEffect, useState } from "react";

interface ProblemSets {
    problem_set: {
        id: number, title: string, description: string, 
        counts: number, created_by: number, created_at: string, 
        last_update_at: string
    }
}


function ProblemSetCard(props: ProblemSets) {

    return (
        <div>This is product card...</div>
    )

}



export default ProblemSetCard;