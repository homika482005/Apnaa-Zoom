import React, {
    useContext,
    useState
} from 'react'

import withAuth from '../utils/withAuth'

import { useNavigate } from 'react-router-dom'

import "../App.css";

import {
    Button,
    IconButton,
    TextField
} from '@mui/material';

import RestoreIcon from '@mui/icons-material/Restore';

import { AuthContext } from '../contexts/AuthContext';


function HomeComponent() {

    let navigate = useNavigate();

    const [meetingCode, setMeetingCode] =
        useState("");


    const {
        addToUserHistory,
        handleLogout
    } = useContext(AuthContext);


    let handleJoinVideoCall = async () => {

        if (!meetingCode) {
            return;
        }

        try {

            await addToUserHistory(
                meetingCode
            );

            navigate(`/${meetingCode}`);

        } catch (e) {

            console.log(e);

        }

    }


    let handleLogoutUser = async () => {

        await handleLogout();

    }


    return (
        <>

            <div className="navBar">

                <div
                    style={{
                        display: "flex",
                        alignItems: "center"
                    }}
                >

                    <h2>
                        ApnaaZoom
                    </h2>

                </div>


                <div
                    style={{
                        display: "flex",
                        alignItems: "center"
                    }}
                >

                    <IconButton
                        onClick={() => {
                            navigate("/history")
                        }}
                    >
                        <RestoreIcon />
                    </IconButton>

                    <p>
                        History
                    </p>


                    <Button
                        onClick={
                            handleLogoutUser
                        }
                    >
                        Logout
                    </Button>

                </div>

            </div>


            <div className="meetContainer">

                <div className="leftPanel">

                    <div>

                        <h2>
                            Simple, Secure & Reliable Video Calls
                        </h2>

                        <p>
                            Connect with anyone, anywhere, anytime.
                        </p>


                        <div
                            style={{
                                display: 'flex',
                                gap: "10px"
                            }}
                        >

                            <TextField
                                onChange={e =>
                                    setMeetingCode(
                                        e.target.value
                                    )
                                }
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                            />


                            <Button
                                onClick={
                                    handleJoinVideoCall
                                }
                                variant="contained"
                            >
                                Join
                            </Button>

                        </div>

                    </div>

                </div>


                <div className="rightPanel">

                    <img
                        srcSet='/logo3.png'
                        alt=""
                    />

                </div>

            </div>

        </>
    )

}


export default withAuth(
    HomeComponent
)
