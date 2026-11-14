import { formatDate, formatTime, formatCurrency } from "@/lib/format";

interface RegistrationData {
  registrationCode: string;
  name: string;
  eventTitle: string;
  ticketName: string;
  ticketPrice: number;
  startDatetime: Date;
  timezone: string;
  venueName?: string | null;
  attendanceMode: string;
}

export function registrationConfirmationEmail(data: RegistrationData) {
  const subject = `Pendaftaran Berhasil: ${data.eventTitle}`;
  const dateStr = `${formatDate(data.startDatetime, data.timezone)}, ${formatTime(data.startDatetime, data.timezone)}`;
  const priceStr = data.ticketPrice === 0 ? "GRATIS" : formatCurrency(data.ticketPrice);
  const locationStr = data.attendanceMode === "online" ? "Online" : (data.venueName ?? "Lihat detail event");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: #0ea5e9; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Pendaftaran Berhasil! 🎉</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Halo <strong>${data.name}</strong>,</p>
    <p>Pendaftaran kamu untuk <strong>${data.eventTitle}</strong> telah berhasil dikonfirmasi.</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 16px; color: #0ea5e9;">Detail Registrasi</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Kode Registrasi</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${data.registrationCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Event</td><td style="padding: 6px 0;">${data.eventTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Tiket</td><td style="padding: 6px 0;">${data.ticketName} (${priceStr})</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waktu</td><td style="padding: 6px 0;">${dateStr}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Lokasi</td><td style="padding: 6px 0;">${locationStr}</td></tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 14px;">Simpan kode registrasi ini — kamu akan membutuhkannya saat check-in.</p>
    <p style="color: #64748b; font-size: 14px;">Sampai jumpa di event!</p>
    <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Email ini dikirim oleh AsiaCommerce Event. Jangan balas email ini.
    </p>
  </div>
</body>
</html>`;

  const text = `Pendaftaran Berhasil!\n\nHalo ${data.name},\n\nKode Registrasi: ${data.registrationCode}\nEvent: ${data.eventTitle}\nTiket: ${data.ticketName}\nWaktu: ${dateStr}\nLokasi: ${locationStr}\n\nSimpan kode ini untuk check-in.`;

  return { subject, html, text };
}

export function paymentConfirmationEmail(data: RegistrationData & { amount: number }) {
  const subject = `Pembayaran Dikonfirmasi: ${data.eventTitle}`;
  const dateStr = `${formatDate(data.startDatetime, data.timezone)}, ${formatTime(data.startDatetime, data.timezone)}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: #22c55e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Pembayaran Dikonfirmasi ✅</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Halo <strong>${data.name}</strong>,</p>
    <p>Pembayaran kamu sebesar <strong>${formatCurrency(data.amount)}</strong> untuk <strong>${data.eventTitle}</strong> telah dikonfirmasi.</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 16px; color: #22c55e;">Detail Tiket</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Kode Registrasi</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${data.registrationCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Event</td><td style="padding: 6px 0;">${data.eventTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Tiket</td><td style="padding: 6px 0;">${data.ticketName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waktu</td><td style="padding: 6px 0;">${dateStr}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Jumlah Bayar</td><td style="padding: 6px 0; font-weight: bold; color: #22c55e;">${formatCurrency(data.amount)}</td></tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 14px;">Sampai jumpa di event!</p>
  </div>
</body>
</html>`;

  const text = `Pembayaran Dikonfirmasi!\n\nHalo ${data.name},\n\nPembayaran ${formatCurrency(data.amount)} untuk ${data.eventTitle} dikonfirmasi.\nKode: ${data.registrationCode}\nWaktu: ${dateStr}`;

  return { subject, html, text };
}

export function paymentPendingEmail(
  data: RegistrationData & { amount: number; paymentUrl: string }
) {
  const subject = `Selesaikan Pembayaran: ${data.eventTitle}`;
  const dateStr = `${formatDate(data.startDatetime, data.timezone)}, ${formatTime(data.startDatetime, data.timezone)}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Selesaikan Pembayaran 💳</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Halo <strong>${data.name}</strong>,</p>
    <p>Terima kasih sudah mendaftar <strong>${data.eventTitle}</strong>. Registrasimu belum aktif sampai pembayaran selesai.</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Kode Registrasi</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${data.registrationCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Tiket</td><td style="padding: 6px 0;">${data.ticketName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waktu</td><td style="padding: 6px 0;">${dateStr}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Total</td><td style="padding: 6px 0; font-weight: bold; color: #f59e0b;">${formatCurrency(data.amount)}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.paymentUrl}" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold;">Bayar Sekarang</a>
    </div>
    <p style="color: #64748b; font-size: 13px; text-align: center;">Atau buka link ini kapan saja:<br><a href="${data.paymentUrl}">${data.paymentUrl}</a></p>
  </div>
</body>
</html>`;

  const text = `Selesaikan Pembayaran\n\nHalo ${data.name},\n\nRegistrasi: ${data.registrationCode}\nEvent: ${data.eventTitle}\nTotal: ${formatCurrency(data.amount)}\n\nBayar di sini kapan saja:\n${data.paymentUrl}`;

  return { subject, html, text };
}

export function paymentPendingWhatsApp(
  data: Pick<RegistrationData, "name" | "eventTitle" | "registrationCode"> & { amount: number; paymentUrl: string }
) {
  return `Halo ${data.name} 👋\n\n💳 *Selesaikan Pembayaran*\n\nTerima kasih sudah mendaftar *${data.eventTitle}*.\n\n🎫 Kode: *${data.registrationCode}*\n💰 Total: *${formatCurrency(data.amount)}*\n\nBayar kapan saja lewat link ini:\n${data.paymentUrl}\n\n_AsiaCommerce Event_`;
}

export function registrationConfirmationWhatsApp(data: Pick<RegistrationData, "name" | "registrationCode" | "eventTitle" | "startDatetime" | "timezone">) {
  const dateStr = `${formatDate(data.startDatetime, data.timezone)}, ${formatTime(data.startDatetime, data.timezone)}`;
  return `Halo ${data.name} 👋\n\n✅ *Pendaftaran Berhasil!*\n\n📌 *${data.eventTitle}*\n📅 ${dateStr}\n🎫 Kode: *${data.registrationCode}*\n\nSimpan kode ini untuk check-in ya!\n\n_AsiaCommerce Event_`;
}

export function paymentConfirmationWhatsApp(data: Pick<RegistrationData, "name" | "registrationCode" | "eventTitle"> & { amount: number }) {
  return `Halo ${data.name} 👋\n\n✅ *Pembayaran Dikonfirmasi!*\n\nPembayaran *${formatCurrency(data.amount)}* untuk event *${data.eventTitle}* sudah kami terima.\n\n🎫 Kode: *${data.registrationCode}*\n\nSampai jumpa di event!\n\n_AsiaCommerce Event_`;
}
