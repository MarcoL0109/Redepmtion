import { useRef, useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import TextareaAutosize from "react-textarea-autosize";
import MultipleChoiceContainer from "../MultipleChoiceContainer/MultipleChoiceContainer";
import "./SortableList.css"
import { AnswerOptions, CorrectAnswer, UpdatedValues } from '../ProblemList/ProblemList';




function Sortable({ id, index, question_text, question_type, sequence_no, answer_options, correct_answer, case_sensitive, time_allowed_in_seconds, is_temp, ProblemsChange, RemoveProblemChange, PotentialDelete, RevertCount }: 
    { id: number; index: number; question_text: string, question_type: string, sequence_no: number,
        answer_options: AnswerOptions, correct_answer: CorrectAnswer, case_sensitive: number, time_allowed_in_seconds: number, is_temp: boolean,
        ProblemsChange:( id: number, change: UpdatedValues, is_temp: boolean) => void,
        RemoveProblemChange: (id: number, attribute: keyof UpdatedValues) => void,
        PotentialDelete: (id: number) => void, RevertCount: number}) {
    const [element, setElement] = useState<Element | null>(null);
    const handleRef = useRef<HTMLButtonElement | null>(null);
    const { isDragging } = useSortable({ id, index, element, handle: handleRef });
    const [mode, setMode] = useState<string>("Multiple Choice");
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [blankAnswer, setBlankAnswer] = useState<string>("");
    const [isCaseSensitive, setIsCaseSensitive] = useState<number>(0);
    const [timeAllow, setTimeAllow] = useState<number>(10);
    const [currentAnswerOptions, setCurrentAnswerOptions] = useState(answer_options);
    const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(correct_answer);
    const time_range = [5, 10, 15, 20, 25, 30];


    useEffect(() => {
        setMode(question_type);
        setSelectedOption(correct_answer.MC);
        setBlankAnswer(correct_answer.Blanks);
        setIsCaseSensitive(case_sensitive);
        setTimeAllow(time_allowed_in_seconds);
    }, [RevertCount]);


    useEffect(() => {
        if (JSON.stringify(currentAnswerOptions) === JSON.stringify(answer_options)) {
            RemoveProblemChange(id, "answer_options");
        }
    }, [currentAnswerOptions, answer_options]);


    useEffect(() => {
        if (JSON.stringify(currentCorrectAnswer) === JSON.stringify(correct_answer)) {
            RemoveProblemChange(id, "correct_answer");
        }
    }, [currentCorrectAnswer, correct_answer]);


    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Set which option is chosen first, then set the correct answer after.
        setSelectedOption(event.target.value);
        setCurrentCorrectAnswer(prevCorrectAnswers => ({
            ...prevCorrectAnswers,
            "MC": event.target.value,
        }))
        const prevCorrectAnswers = currentCorrectAnswer;
        ProblemsChange(id, {
            "correct_answer": {
                ...prevCorrectAnswers,
                "MC": event.target.value,
            }
        }, is_temp)
    };

    const handleCorrectBlankAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const correctBlankAnswer = event.target.value;
        const prevCorrectAnswer = currentCorrectAnswer;

        setCurrentCorrectAnswer(prevCorrectAnswers => ({
            ...prevCorrectAnswers,
            "Blanks": correctBlankAnswer,
        }))

        ProblemsChange(id, {
            "correct_answer": {
                ...prevCorrectAnswer,
                "Blanks": correctBlankAnswer,
            }
        }, is_temp)
    }


    const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMode = event.target.value;
        setMode(selectedMode);
        ProblemsChange(id, {"question_type": selectedMode}, is_temp)
        if (selectedMode === question_type) {
            RemoveProblemChange(id, "question_type");
        }
    }


    const handleToggleCaseSensitive = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        const numeric_checked = checked === false ? 0 : 1
        setIsCaseSensitive(numeric_checked);
        ProblemsChange(id, {"case_sensitive": numeric_checked}, is_temp);
        if (numeric_checked === case_sensitive) {
            RemoveProblemChange(id, "case_sensitive");
        }
    }


    const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected_seconds = event.target.value;
        const formatted_seconds = parseInt(selected_seconds.replace(/s$/, ''), 10);
        setTimeAllow(formatted_seconds);
        ProblemsChange(id, {"time_allowed_in_seconds": formatted_seconds}, is_temp);
        if (formatted_seconds === time_allowed_in_seconds) {
            RemoveProblemChange(id, "time_allowed_in_seconds");
        }
    }


    const handleQuestionTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const new_question_text = event.target.value;
        ProblemsChange(id, {"question_text": new_question_text}, is_temp);
        if (new_question_text === question_text) {
            RemoveProblemChange(id, "question_text");
        }
    }


    const handleOptionTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, option_label: string) => {
        const new_option_text = event.target.value;
        const current_answer_options = currentAnswerOptions || {};
        // This is using the initial values of optional text as a state and extend that value;
        setCurrentAnswerOptions(prevOptions => {
            const updatedOptions = {
                ...prevOptions,
                [option_label]: new_option_text
            };
            return updatedOptions;
        });

        ProblemsChange(id, {
            answer_options: {
                ...current_answer_options,
                [option_label]: new_option_text
            }
        }, is_temp);
    }


    const handleDelete = () => {
        PotentialDelete(id);
    }
    

    return (
    <li ref={setElement} className="ProblemItem" data-shadow={isDragging || undefined}>
        <div className="ListContainer">
            <div className="ButtonContainer">
                <button ref={handleRef} className="handle" />
            </div>  
            <div className="QuestionContentDiv">
                <div className="TextAreaContainer">
                    <TextareaAutosize className="QuestionTextArea" 
                        defaultValue={question_text}
                        placeholder="Input question text"
                        minRows={1}
                        maxRows={8}
                        cols={55}
                        onChange={handleQuestionTextChange}>
                    </TextareaAutosize>

                    {
                        mode === "Multiple Choice" ?
                        <div className="MCAnswerOptionContainer">
                            <MultipleChoiceContainer
                                option_label="A"
                                option_text={answer_options.A}
                                selectedOption={selectedOption}
                                onChange={handleOptionChange}
                                onTextChange={(event) => handleOptionTextChange(event, "A")}
                            />
                            <MultipleChoiceContainer
                                option_label="B"
                                option_text={answer_options.B}
                                selectedOption={selectedOption}
                                onChange={handleOptionChange}
                                onTextChange={(event) => handleOptionTextChange(event, "B")} 
                            />
                            <MultipleChoiceContainer
                                option_label="C"
                                option_text={answer_options.C}
                                selectedOption={selectedOption}
                                onChange={handleOptionChange}
                                onTextChange={(event) => handleOptionTextChange(event, "C")} 
                            />
                            <MultipleChoiceContainer
                                option_label="D"
                                option_text={answer_options.D}
                                selectedOption={selectedOption}
                                onChange={handleOptionChange}
                                onTextChange={(event) => handleOptionTextChange(event, "D")} 
                            />
                        </div>:
                        <div className="BlankAnswerContainer">
                            <div className="CaseSensitiveContainer">
                                <input className="CaseSensitiveModeInput" checked={isCaseSensitive === 1} onChange={handleToggleCaseSensitive} type="checkbox" id={"CaseSensitiveMode"}/>
                                <label className="CaseSensitiveModeLabel" htmlFor="CaseSensitiveMode">Case Sensitive</label>
                            </div>
                            <div className="BlankAnswerContainer">
                                <input className="BlankAnswerInput" type="text" defaultValue={blankAnswer} onChange={handleCorrectBlankAnswerChange}/>
                            </div>
                            
                        </div>
                    }
                </div>
                
                <div className="ModeSelectionContainer">
                    <select className="ModeSelection" onChange={handleTimeChange} value={timeAllow}>
                        {
                            time_range.map(time => (
                                <option key={time} value={time} className="ModeOptions">{time}s</option>
                            ))
                        }
                    </select>
                    <select className="ModeSelection" onChange={handleModeChange} value={mode}>
                        <option className="ModeOptions" value="Multiple Choice">
                            MC
                        </option>
                        <option className="ModeOptions" value="Blanks">
                            Blanks
                        </option>
                    </select>
                </div>

                <div className="DeleteButtonContainer">
                    <button onClick={handleDelete} className="DeleteButton"><strong>Delete</strong></button>
                </div>
                
            </div>
        </div>
        
    </li>
    );
}


export default Sortable;
