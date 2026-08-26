import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';

const defaultTheme = createTheme();

export default function Authentication() {

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [email, setEmail] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();

    const [googleCredential, setGoogleCredential] = React.useState();
    const [googleName, setGoogleName] = React.useState();
    const [googleEmail, setGoogleEmail] = React.useState();
    const [googleAvatar, setGoogleAvatar] = React.useState();

    const [googleUsernameMode, setGoogleUsernameMode] = React.useState(false);

    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false)


    const {
        handleRegister,
        handleLogin,
        handleGoogleLogin
    } = React.useContext(AuthContext);


    let handleAuth = async () => {

        try {

            if (formState === 0) {

                let result = await handleLogin(username, password);

            }

            if (formState === 1) {

                let result = await handleRegister(
                    name,
                    username,
                    email,
                    password
                );

                console.log(result);

                setUsername("");
                setEmail("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
                setName("")

            }

        } catch (err) {

            console.log(err);

            let message = (err.response?.data?.message || "Something went wrong");

            setError(message);
        }
    }


    const handleGoogleSuccess = async (credentialResponse) => {

        try {

            setError("");

            let result = await handleGoogleLogin(
                credentialResponse.credential
            );

            if (result.token) {

                localStorage.setItem("token", result.token);

                router("/home")

            }

            if (result.requiresUsername) {

                setGoogleCredential(credentialResponse.credential);
                setGoogleName(result.name);
                setGoogleEmail(result.email);
                setGoogleAvatar(result.avatar);

                setGoogleUsernameMode(true);

            }

        } catch (err) {

            console.log(err);

            let message = (
                err.response?.data?.message ||
                "Google login failed"
            );

            setError(message);

        }
    }


    const handleGoogleUsername = async () => {

        try {

            if (!username) {
                setError("Please choose a username")
                return;
            }

            let result = await handleGoogleLogin(
                googleCredential,
                username
            );

            if (result.token) {

                localStorage.setItem("token", result.token);

                router("/home")

            }

        } catch (err) {

            console.log(err);

            let message = (
                err.response?.data?.message ||
                "Something went wrong"
            );

            setError(message);
        }
    }


    return (
        <ThemeProvider theme={defaultTheme}>

            <Grid container component="main" sx={{ height: '100vh' }}>

                <CssBaseline />

                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light'
                                ? t.palette.grey[50]
                                : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <Grid
                    item
                    xs={12}
                    sm={8}
                    md={5}
                    component={Paper}
                    elevation={6}
                    square
                >

                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >

                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>


                        {googleUsernameMode ?

                            <>

                                <h2>Welcome to ApnaaZoom</h2>

                                <p>
                                    Choose your ApnaaZoom username
                                </p>

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                />

                                <p style={{ color: "red" }}>
                                    {error}
                                </p>

                                <Button
                                    type="button"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    onClick={handleGoogleUsername}
                                >
                                    Continue
                                </Button>

                            </>

                            :

                            <>

                                <div>

                                    <Button
                                        variant={
                                            formState === 0
                                                ? "contained"
                                                : ""
                                        }
                                        onClick={() => {
                                            setFormState(0);
                                            setError("");
                                        }}
                                    >
                                        Sign In
                                    </Button>

                                    <Button
                                        variant={
                                            formState === 1
                                                ? "contained"
                                                : ""
                                        }
                                        onClick={() => {
                                            setFormState(1);
                                            setError("");
                                        }}
                                    >
                                        Sign Up
                                    </Button>

                                </div>


                                <Box
                                    component="form"
                                    noValidate
                                    sx={{
                                        mt: 1,
                                        width: "100%"
                                    }}
                                >

                                    {formState === 1 ?

                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="name"
                                            label="Full Name"
                                            name="name"
                                            value={name}
                                            autoFocus
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                        />

                                        :

                                        <></>
                                    }


                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="username"
                                        label="Username"
                                        name="username"
                                        value={username}
                                        autoFocus={formState === 0}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                    />


                                    {formState === 1 ?

                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="email"
                                            label="Email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />

                                        :

                                        <></>
                                    }


                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        value={password}
                                        type="password"
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        id="password"
                                    />


                                    <p style={{ color: "red" }}>
                                        {error}
                                    </p>


                                    <Button
                                        type="button"
                                        fullWidth
                                        variant="contained"
                                        sx={{ mt: 3, mb: 2 }}
                                        onClick={handleAuth}
                                    >
                                        {formState === 0
                                            ? "Login"
                                            : "Register"}
                                    </Button>


                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            width: "100%",
                                            my: 2
                                        }}
                                    >

                                        <Box
                                            sx={{
                                                flex: 1,
                                                height: "1px",
                                                backgroundColor: "#ddd"
                                            }}
                                        />

                                        <span
                                            style={{
                                                margin: "0 10px",
                                                color: "#777"
                                            }}
                                        >
                                            OR
                                        </span>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                height: "1px",
                                                backgroundColor: "#ddd"
                                            }}
                                        />

                                    </Box>


                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center"
                                        }}
                                    >

                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => {
                                                setError(
                                                    "Google Login Failed"
                                                );
                                            }}
                                        />

                                    </Box>

                                </Box>

                            </>

                        }

                    </Box>

                </Grid>

            </Grid>


            <Snackbar
                open={open}
                autoHideDuration={5000}
                message={message}
            />

        </ThemeProvider>
    );
}
