const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendSubscriptionConfirmation = async ({ name, email, title, eventDate, eventLocation }) => {
    await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: email,
        subject: `Inscrição confirmada: ${title}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Inscrição confirmada!</h2>
                <p>Olá, <strong>${name}</strong>!</p>
                <p>Sua inscrição no evento abaixo foi realizada com sucesso:</p>

                <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Evento:</strong> ${title}</p>
                    <p><strong>Data:</strong> ${new Date(eventDate).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}</p>
                    <p><strong>Local:</strong> ${eventLocation ?? 'A definir'}</p>
                </div>

                <p>Até lá!</p>
            </div>
        `
    });
};