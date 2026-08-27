import "./App.css";

import {
    BrowserRouter as Router,
    Route,
    Routes
} from "react-router-dom";


import LandingPage
    from "./pages/landing";

import Authentication
    from "./pages/authentication";

import HomeComponent
    from "./pages/home";

import History
    from "./pages/history";

import VideoMeetComponent
    from "./pages/VideoMeet";


import {
    AuthProvider
} from "./contexts/AuthContext";


function App() {

    return (

        <div className="App">

            <Router>

                <AuthProvider>

                    <Routes>

                        {/* Landing */}

                        <Route
                            path="/"
                            element={
                                <LandingPage />
                            }
                        />


                        {/* Google Authentication */}

                        <Route
                            path="/auth"
                            element={
                                <Authentication />
                            }
                        />


                        {/* Dashboard */}

                        <Route
                            path="/home"
                            element={
                                <HomeComponent />
                            }
                        />


                        {/* Meeting History */}

                        <Route
                            path="/history"
                            element={
                                <History />
                            }
                        />


                        {/* Meeting */}

                        <Route
                            path="/meeting/:url"
                            element={
                                <VideoMeetComponent />
                            }
                        />


                        {/* Unknown route */}

                        <Route
                            path="*"
                            element={
                                <LandingPage />
                            }
                        />

                    </Routes>

                </AuthProvider>

            </Router>

        </div>

    );

}


export default App;
