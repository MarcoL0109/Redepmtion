import React, { useEffect, useState } from "react";
import "./ProgressBar.css";

interface VisualPart {
    percentage: string;
    color: string;
}

interface ProgressLineProps {
    label: React.ReactNode;
    backgroundColor?: string;
    duration: number;
    visualParts?: VisualPart[];
}

const ProgressLine: React.FC<ProgressLineProps> = ({label, backgroundColor = "#e5e5e5", duration, visualParts = [{ percentage: "0%", color: "white" }]}) => {
    const [widths, setWidths] = useState<string[]>(
    visualParts.map((item) => item.percentage)
    );

    useEffect(() => {
        const currentPercentages = visualParts.map(item => item.percentage);
        const is100 = currentPercentages.every(p => p === "100%");
        if (is100) {
            setWidths(currentPercentages);
            return;
        }
        const handle = requestAnimationFrame(() => {
            setWidths(currentPercentages);
        });
        return () => cancelAnimationFrame(handle);
    }, [visualParts]);

    return (
        <>
            <div className="progressLabel">{label}</div>
            <div
                className="progressVisualFull"
                style={{ backgroundColor }}
            >
                {visualParts.map((item, index) => {
                    const currentWidth = widths[index] || "0%";
                    const isFull = currentWidth === "100%";

                    return (
                    <div
                        key={index}
                        style={{
                            width: currentWidth,
                            backgroundColor: item.color,
                            animation: isFull ? `drain ${duration}s linear forwards` : 'none',
                        }}
                        className="progressVisualPart"
                    />
                    );
                })}
            </div>
        </>
    );
};

export default ProgressLine;