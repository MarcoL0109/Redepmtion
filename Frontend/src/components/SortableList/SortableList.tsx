import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import "./SortableList.css"


function Sortable({ id, index, question_text, question_type, sequence_no, answer_options, correct_answer }: { id: number; index: number; question_text: string, question_type: string, sequence_no: number, answer_options: object, correct_answer: object }) {
    const [element, setElement] = useState<Element | null>(null);
    const handleRef = useRef<HTMLButtonElement | null>(null);
    const { isDragging } = useSortable({ id, index, element, handle: handleRef });

    return (
    <li ref={setElement} className="ProblemItem" data-shadow={isDragging || undefined}>
        <div className="ListContainer">
            <div className="ButtonContainer">
                <button ref={handleRef} className="handle" />
            </div>  
            <div className="QuestionContentDiv">
                <textarea className="QuestionTextArea" 
                    defaultValue={question_text}
                    cols={80}
                    rows={4}
                    required>
                </textarea>
            </div>
        </div>
        
    </li>
    );
}


export default Sortable;
