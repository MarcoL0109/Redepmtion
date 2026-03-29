import "./Overlay.css";


type OverlaysProps = {
    isOpen: boolean;
    children ?: React.ReactNode;
};


function Overlays({ isOpen, children}: OverlaysProps) {
    return (
        <>
        {
            isOpen ? (
                <div className="overlay">
                    <div className="overlay__background"></div>
                    <div className="overlay__container">
                        <div className="overlay__controls">
                        </div>
                        {children}
                    </div>
                </div>
            ): null
        }
        </>
    )
    
}


export default Overlays