"use client";

import { useState, use } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  searchParamsPromise: Promise<{ callbackUrl?: string; error?: string }>;
}

type Step = "method" | "phone" | "otp";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Gagal memulai login Google. Coba lagi.",
  OAuthCallback: "Gagal menyelesaikan login Google. Coba lagi.",
  OAuthCreateAccount: "Gagal membuat akun. Coba lagi.",
  Default: "Terjadi kesalahan. Coba lagi.",
};

export function LoginForm({ searchParamsPromise }: LoginFormProps) {
  const searchParams = use(searchParamsPromise);
  const callbackUrl = searchParams.callbackUrl ?? "/";
  const error = searchParams.error;

  const [step, setStep] = useState<Step>("method");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    await signIn("google", { callbackUrl });
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setOtpError(data.error ?? "Gagal mengirim OTP.");
        return;
      }

      setOtpSent(true);
      setStep("otp");
    } catch {
      setOtpError("Gagal mengirim OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json() as { error?: string; token?: string };

      if (!res.ok) {
        setOtpError(data.error ?? "OTP tidak valid.");
        return;
      }

      await signIn("credentials", {
        phone,
        otpToken: data.token,
        callbackUrl,
      });
    } catch {
      setOtpError("Gagal verifikasi OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
        </div>
      )}

      {step === "method" && (
        <>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Lanjutkan dengan Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => setStep("phone")}
          >
            <svg className="h-4 w-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Lanjutkan dengan WhatsApp
          </Button>
        </>
      )}

      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kode OTP akan dikirim ke nomor ini
            </p>
          </div>
          {otpError && (
            <p className="text-sm text-red-600">{otpError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !phone}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Kirim Kode OTP
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("method")}
          >
            Kembali
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Kode OTP dikirim ke</p>
            <p className="font-medium text-foreground">{phone}</p>
          </div>
          <div>
            <Label htmlFor="otp">Kode OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              className="mt-1 text-center text-xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kode berlaku 5 menit
            </p>
          </div>
          {otpError && (
            <p className="text-sm text-red-600">{otpError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || otp.length < 4}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Verifikasi OTP
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => { setOtpSent(false); setStep("phone"); setOtp(""); }}
          >
            Kirim ulang OTP
          </Button>
        </form>
      )}

      {otpSent && step === "otp" && (
        <p className="text-xs text-center text-green-600">
          ✓ OTP berhasil dikirim
        </p>
      )}
    </div>
  );
}
