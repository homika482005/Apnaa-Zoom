import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
    "ApnaaZoom <noreply@apnaazoom.publicvcm.com>";


const sendVerificationEmail = async (
    email,
    name,
    token
) => {

    const verificationLink =
        `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await resend.emails.send({

        from: FROM_EMAIL,

        to: email,

        subject:
            "Verify your ApnaaZoom account",

        html: `

            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                "
            >

                <h2>
                    Welcome to ApnaaZoom, ${name}
                </h2>

                <p>
                    Please verify your email address
                    to activate your ApnaaZoom account.
                </p>

                <p>
                    <a
                        href="${verificationLink}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #1976d2;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        "
                    >
                        Verify Email
                    </a>
                </p>

                <p>
                    This verification link will expire
                    in 15 minutes.
                </p>

                <p>
                    If you did not create this account,
                    you can safely ignore this email.
                </p>

            </div>

        `

    });

};


const sendPasswordResetEmail = async (
    email,
    name,
    token
) => {

    const resetLink =
        `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await resend.emails.send({

        from: FROM_EMAIL,

        to: email,

        subject:
            "Reset your ApnaaZoom password",

        html: `

            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                "
            >

                <h2>
                    Hello ${name}
                </h2>

                <p>
                    We received a request to reset
                    your ApnaaZoom password.
                </p>

                <p>
                    <a
                        href="${resetLink}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #1976d2;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        "
                    >
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

            </div>

        `

    });

};


export {
    sendVerificationEmail,
    sendPasswordResetEmail
};
