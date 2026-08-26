import { Resend } from "resend";

const resend = new Resend(
    process.env.RESEND_API_KEY
);


const sendVerificationEmail = async (
    email,
    name,
    token
) => {

    const verificationLink =
        `${process.env.FRONTEND_URL}/verify-email?token=${token}`;


    const result = await resend.emails.send({

        from:
            "ApnaaZoom <onboarding@resend.dev>",

        to:
            email,

        subject:
            "Verify your ApnaaZoom account",

        html: `
            <h2>
                Welcome to ApnaaZoom, ${name}
            </h2>

            <p>
                Please verify your email address
                to activate your account.
            </p>

            <p>
                <a href="${verificationLink}">
                    Verify Email
                </a>
            </p>

            <p>
                This verification link will expire
                in 15 minutes.
            </p>
        `
    });


    if (result.error) {

        throw new Error(
            result.error.message
        );

    }

}


const sendPasswordResetEmail = async (
    email,
    name,
    token
) => {

    const resetLink =
        `${process.env.FRONTEND_URL}/reset-password?token=${token}`;


    const result = await resend.emails.send({

        from:
            "ApnaaZoom <onboarding@resend.dev>",

        to:
            email,

        subject:
            "Reset your ApnaaZoom password",

        html: `
            <h2>
                Hello ${name}
            </h2>

            <p>
                We received a request to reset
                your ApnaaZoom password.
            </p>

            <p>
                <a href="${resetLink}">
                    Reset Password
                </a>
            </p>

            <p>
                This password reset link will expire
                in 15 minutes.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>
        `
    });


    if (result.error) {

        throw new Error(
            result.error.message
        );

    }

}


export {
    sendVerificationEmail,
    sendPasswordResetEmail
};
