import "./ProblemSetCard.css";
import PlayButton from "../../assets/play.svg";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import {ProblemSetModificationMap} from "../HomePage/HomePage"



interface ProblemCard {
    problem_set: {
        problem_set_id: number, problem_set_title: string, problem_set_description: string, 
        problem_counts: number, created_by: number, created_at?: string, 
        last_update_at?: string
    },
    editMode: boolean,
    is_temp: boolean
    handleChange: (id: number, change: ProblemSetModificationMap, is_temp: boolean) => void
}


function ProblemSetCard({problem_set, editMode, is_temp, handleChange}: ProblemCard) {
    const navigate = useNavigate()


    const handleonClick = () => {
        if (!editMode) {
            navigate("/ProblemList", { state: { problem_set_id: problem_set.problem_set_id} });
        }
    }


    const handleProblemSetTitleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const current_problem_set_title = event.target.value;
        handleChange(problem_set.problem_set_id, {
            problem_set_title: current_problem_set_title,
        }, is_temp)
    }


    const handleProblemSetDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const current_problem_set_description = event.target.value;
        handleChange(problem_set.problem_set_id, {
            problem_set_description: current_problem_set_description,
        }, is_temp)
    }


    return (
        <div className="ProblemSetCards" onClick={handleonClick}>
            <div className="ProblemSetTitleContainer">
                {
                    editMode ? 
                    <TextareaAutosize
                        defaultValue={problem_set.problem_set_title}
                        placeholder={"Enter Problem Set title"}
                        minRows={1}
                        maxRows={3}
                        cols={35}
                        required
                        onChange={handleProblemSetTitleChange}>
                    </TextareaAutosize> : 
                    <strong className="ProblemSetTitle">{problem_set.problem_set_title}</strong>
                }        
            </div>
            
            <div className="ProblemSetDescriptionContainer">
                {
                    editMode ? 
                    <TextareaAutosize
                        defaultValue={problem_set.problem_set_description}
                        placeholder={"Enter Problem Set Description"}
                        minRows={1}
                        maxRows={4}
                        cols={35}
                        onChange={handleProblemSetDescriptionChange}>
                    </TextareaAutosize> : 
                    <span>{problem_set.problem_set_description}</span>
                }
            </div>

            <div className="bottomContainer">
                <div className="ProblemSetCountContainer">
                    <span>{problem_set.problem_counts} Problems</span>
                </div>

                <div className="PlayButton">
                    <img className="PlayButtonIcon" src={PlayButton} alt="Play Icon"/>
                </div>
            </div>
        </div>
    )
}


export default ProblemSetCard;