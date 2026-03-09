import "./InputPINBox.css"


function InputPinBox(){
    return (
        
        <div className="InputPINBoxDiv">
            <form className="PINForm">
                <input className="RoomCodeInput" type="text" placeholder="Enter PIN Code" required/>
                <button className="ConfirmButton">
                    <strong>Enter</strong>
                </button>
            </form>
            
        </div>
    )
}



export default InputPinBox