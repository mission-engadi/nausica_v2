import nodemailer from "nodemailer";

export async function sendInvitationEmail(data: any) {
    console.log("Email service: Preparing to send invitation email...");

    // Check for required environment variables
    const requiredEnv = ["EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS"];
    const missingEnv = requiredEnv.filter(key => !process.env[key] || process.env[key]?.includes("your-") || process.env[key]?.includes("example.com"));
    
    if (missingEnv.length > 0) {
        console.warn(`Email service configuration incomplete. Missing or placeholder: ${missingEnv.join(", ")}`);
        return { 
            success: false, 
            error: `Configurazione email incompleta. Variabili mancanti o non configurate: ${missingEnv.join(", ")}` 
        };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: parseInt(process.env.EMAIL_PORT || "587") === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000
    });

    const mailOptions = {
        from: `"Portale Nausica" <${process.env.EMAIL_USER}>`,
        to: "info@nausicadellavalle.org",
        subject: `Nuovo Invito: ${data.church} - ${data.location}`,
        text: `
      Hai ricevuto una nuova richiesta d'invito.
      
      Dettagli:
      Nome: ${data.name}
      Email: ${data.email}
      Chiesa/Org: ${data.church}
      Periodo: dal ${data.startDate} al ${data.endDate}
      Luogo: ${data.location}
    `,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #001F3F; border-bottom: 2px solid #EAB308; padding-bottom: 10px;">Nuova Richiesta d'Invito</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Chiesa/Org:</strong> ${data.church}</p>
        <p><strong>Periodo:</strong> dal ${data.startDate} al ${data.endDate}</p>
        <p><strong>Luogo:</strong> ${data.location}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Questo messaggio è stato generato automaticamente dal Portale Nausica.</p>
      </div>
    `,
    };

    try {
        console.log(`Email service: Attempting to send mail via ${process.env.EMAIL_HOST}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log("Email service: Success! Message ID:", info.messageId);
        return { success: true };
    } catch (error: any) {
        console.error("Email service: SMTP ERROR:", error.code || "UNKNOWN", error.message);
        return { 
            success: false, 
            error: `Errore SMTP (${error.code || "unknown"}): ${error.message}` 
        };
    }
}
