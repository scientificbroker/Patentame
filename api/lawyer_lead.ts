import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

interface LawyerLeadPayload {
  fullName: string;
  organization?: string;
  email: string;
  phone?: string;
  jurisdiction: string;
  comments?: string;
  patentTitle: string;
  patentType: string;
  inventiveStepScore?: number | null;
  probabilityPercent?: number | null;
  summarySnippet?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      fullName,
      organization,
      email,
      phone,
      jurisdiction,
      comments,
      patentTitle,
      patentType,
      inventiveStepScore,
      probabilityPercent,
      summarySnippet
    } = req.body as LawyerLeadPayload;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre o correo)' });
    }

    // Generar código de seguimiento de expediente único
    const timestampStr = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const leadCode = `PAT-${jurisdiction || 'GL'}-${timestampStr}-${randomSuffix}`;

    console.log(`[LAWYER_LEAD_RECEIVED] Code: ${leadCode}`, {
      solicitante: fullName,
      entidad: organization || 'Independiente',
      correo: email,
      telefono: phone || 'No especificado',
      jurisdiccion: jurisdiction,
      tipoPatente: patentType,
      titulo: patentTitle,
      scoreLaya: inventiveStepScore ? `${inventiveStepScore}/10` : 'N/A',
      probabilidadLaya: probabilityPercent ? `${probabilityPercent}%` : 'N/A',
      notas: comments
    });

    // Si en el entorno se configuran webhooks para CRM (Airtable / Discord / Slack / Telegram)
    const webhookUrl = process.env.LEADS_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 **NUEVO LEAD DE PATENTE RECIBIDO**: \`${leadCode}\`\n**Solicitante:** ${fullName} (${organization || 'Particular'})\n**Email:** ${email} | **Tel:** ${phone || 'N/A'}\n**Jurisdicción:** ${jurisdiction}\n**Tipo:** ${patentType}\n**Título:** ${patentTitle}\n**Probabilidad Laya:** ${probabilityPercent || 'N/A'}% (Score: ${inventiveStepScore || 'N/A'}/10)`
          })
        });
      } catch (webhookErr) {
        console.warn('Webhook delivery notice:', webhookErr);
      }
    }

    return res.status(200).json({
      success: true,
      leadCode,
      message: 'Expediente registrado con éxito para revisión por especialista'
    });

  } catch (error: any) {
    console.error('Error in api/lawyer_lead:', error);
    return res.status(500).json({ error: 'Error interno al registrar el expediente' });
  }
}
