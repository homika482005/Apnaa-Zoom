import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, name, token) => {

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await resend.emails.send({
        from: "ApnaaZoom <onboarding@resend.dev>",
        to: email,
        subject: "Verify your ApnaaZoom account",
        html: `
            <h2>Welcome to ApnaaZoom, ${name}</h2>

            <p>Please verify your email address to activate your account.</p>

            <p>
                <a href="${verificationLink}">
                    Verify Email
                </a>
            </p>

            <p>This verification link will expire soon.</p>
        `
    });
}

export { sendVerificationEmail };
