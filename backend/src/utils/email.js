/*
|--------------------------------------------------------------------------
| Email Service
|--------------------------------------------------------------------------
|
| ApnaaZoom now uses Google-only authentication.
|
| Email verification and password reset are no longer
| required for authentication, so no email provider
| is initialized here.
|
|--------------------------------------------------------------------------
*/


const sendVerificationEmail = async () => {

    throw new Error(
        "Email verification is disabled. ApnaaZoom uses Google authentication."
    );

};


const sendPasswordResetEmail = async () => {

    throw new Error(
        "Password reset is disabled. ApnaaZoom uses Google authentication."
    );

};


export {
    sendVerificationEmail,
    sendPasswordResetEmail
};
