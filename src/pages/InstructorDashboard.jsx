import { Button } from "react-bootstrap"

const InstructorDashboard = () => {
    return (
        <>
            <h2>What would you like to do today?</h2>
            <div className="instructor-buttons">
                <Button variant="outline-info" size="lg">Upload</Button>
                <Button variant="outline-info" size="lg">Exams</Button>
            </div>
        </>
    )
}

export default InstructorDashboard