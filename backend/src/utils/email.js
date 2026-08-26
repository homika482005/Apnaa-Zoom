/*
|--------------------------------------------------------------------------
| Email Service
|--------------------------------------------------------------------------
|
| ApnaaZoom uses Google authentication only.
|
| Email verification and password reset are no longer
| part of the authentication flow.
|
|--------------------------------------------------------------------------
*/


export const sendVerificationEmail = async () => {

    throw new Error(
        "Email verification is disabled. ApnaaZoom uses Google authentication."
    );

};


export const sendPasswordResetEmail = async () => {

    throw new Error(
        "Password reset is disabled. ApnaaZoom uses Google authentication."
    );

};
