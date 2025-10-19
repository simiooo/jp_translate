import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useTranslation } from "react-i18next";
import { useAuthActions } from "~/store/auth";
import { Toast } from "~/components/ToastCompat";
import Spinner from "~/components/Spinner";

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerification, getEmailVerificationStatus } = useAuthActions();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    email_verified: boolean;
    verification_sent_at: string;
    verification_attempts: number;
  } | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    // If token is provided in URL, verify email automatically
    if (token) {
      handleVerifyEmail(token);
    } else {
      // Otherwise, check current verification status
      checkVerificationStatus();
    }
  }, [token]);

  const checkVerificationStatus = async () => {
    try {
      const status = await getEmailVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Failed to get verification status:", error);
      Toast.error(t("Failed to get verification status"));
    }
  };

  const handleVerifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      await verifyEmail(verificationToken);
      Toast.success(t("Email verified successfully"));
      navigate("/email-verification-success");
    } catch (error) {
      console.error("Email verification failed:", error);
      Toast.error(t("Email verification failed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerification();
      Toast.success(t("Verification email sent successfully"));
      // Refresh verification status
      await checkVerificationStatus();
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      Toast.error(t("Failed to resend verification email"));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  // If token is provided and we're verifying
  if (token && isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t("Verifying Email")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Spinner />
              <p className="text-muted-foreground">{t("Please wait while we verify your email address...")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If token verification failed
  if (token && !isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">{t("Verification Failed")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{t("The verification link is invalid or has expired.")}</p>
            <div className="space-y-2">
              <Button onClick={handleResendVerification} disabled={isResending} className="w-full">
                {isResending ? t("Sending...") : t("Resend Verification Email")}
              </Button>
              <Button variant="outline" onClick={handleGoToHome} className="w-full">
                {t("Go to Home")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main verification page (no token provided)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("Verify Your Email")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {t("We've sent a verification email to your email address. Please check your inbox and click the verification link to complete your registration.")}
            </p>
            {verificationStatus && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {t("Last verification email sent:")}{" "}
                  {new Date(verificationStatus.verification_sent_at).toLocaleString()}
                </p>
                <p>{t("Verification attempts:")} {verificationStatus.verification_attempts}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleResendVerification} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? t("Sending...") : t("Resend Verification Email")}
            </Button>
            <Button variant="outline" onClick={handleGoToHome} className="w-full">
              {t("Go to Home")}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t("Didn't receive the email? Check your spam folder or try resending.")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}