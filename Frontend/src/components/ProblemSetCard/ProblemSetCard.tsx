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
    deleteMode: boolean,
    is_temp: boolean,
    handleClearToggle: number,
    handleChange: (id: number, change: ProblemSetModificationMap, is_temp: boolean) => void
    handleAddPotentialDeleteProblems: (id: number) => void
    handleRemovePotentialDeleteProblems: (id: number) => void
}


function ProblemSetCard({problem_set, editMode, deleteMode, is_temp, handleClearToggle, handleChange, handleAddPotentialDeleteProblems, handleRemovePotentialDeleteProblems}: ProblemCard) {
    const navigate = useNavigate()
    const [toggle, setToggle] = useState<number>(0);


    const handleonClick = () => {
        if (!editMode && !deleteMode) {
            navigate(`/ProblemList/${problem_set.problem_set_id}`);
        }
    }


    const formatDate = (dateString: string) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-AU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };


    useEffect(() => {
        setToggle(0);
    }, [handleClearToggle])


    useEffect(() => {
        if (toggle === 1) {
            handleAddPotentialDeleteProblems(problem_set.problem_set_id);
        } else {
            handleRemovePotentialDeleteProblems(problem_set.problem_set_id);
        }
    }, [toggle, problem_set.problem_set_id]);


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


    const handleDeleteCheckBoxChange = () => {
        setToggle(prev => prev ^ 1);
    }


    return (
        <div className={deleteMode? `FixedProblemSetCards${toggle === 1? '_hover': ''}`: "ProblemSetCards"} onClick={handleonClick}>
            {
                deleteMode ?
                <div className={`selectBoxContainer${toggle === 1 ? '_hover': ''}`}>
                    <input className="deleteCheckBox"
                            type="checkbox"
                            checked={toggle === 1}
                            onChange={handleDeleteCheckBoxChange}>
                    </input>
                </div> :
                null
            }
            
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
                    <span>{problem_set.problem_counts} Problems</span><br/>
                    <span>Last Update: {problem_set.last_update_at && formatDate(problem_set.last_update_at)}</span>                      
                </div>

                <div className="PlayButton">
                    <img className="PlayButtonIcon" src={PlayButton} alt="Play Icon"/>
                </div>
            </div>
        </div>
    )
}


export default ProblemSetCard;