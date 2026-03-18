import TextareaAutosize from "react-textarea-autosize";
import "./MultipleChoiceContainer.css"
import { useState, useEffect } from "react";


interface MultipleChoiceContainerProps {
    option_label: string;
    option_text: string;
    selectedOption: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>, option_label: string) => void;
}

const MultipleChoiceContainer: React.FC<MultipleChoiceContainerProps> = ({
    option_label,
    option_text,
    selectedOption,
    onChange,
    onTextChange
        }) => {

            return (
                <div className="Options">
                    <input
                        type="radio"
                        id={option_label}
                        value={option_label}
                        checked={selectedOption === option_label}
                        onChange={onChange}
                    />
                    <label className="OptionLabel" htmlFor={option_label}>
                        {option_label}.
                        <TextareaAutosize
                            placeholder={`Option Text For ${option_label}`}
                            className="OptionText"
                            minRows={1}
                            maxRows={8}
                            cols={60}
                            defaultValue={option_text}
                            onChange={onTextChange}
                        />
                    </label>
                </div>
            );
        };

export default MultipleChoiceContainer;