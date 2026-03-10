import { useEffect, useState } from "react";
import "./ProblemSetCard.css"

interface ProblemSets {
    problem_set: {
        problem_set_id: number, problem_set_title: string, problem_set_description: string, 
        problem_counts: number, created_by: number, created_at: string, 
        last_update_at: string
    }
}


function ProblemSetCard({problem_set}: ProblemSets) {

    return (
        <div className="ProblemSetCards">
            <div className="ProblemSetTitleContainer">
                <strong className="ProblemSetTitle">{problem_set.problem_set_title}</strong>
            </div>
            
            <div className="ProblemSetDescriptionContainer">
                <span>{problem_set.problem_set_description}</span>
            </div>
            
        </div>
    )

}



export default ProblemSetCard;