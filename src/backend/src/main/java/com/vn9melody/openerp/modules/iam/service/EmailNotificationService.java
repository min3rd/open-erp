package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class EmailNotificationService {
    private static final Logger LOG = Logger.getLogger(EmailNotificationService.class);

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "openerp.frontend.url", defaultValue = "https://openerp.9ms.io.vn")
    String frontendUrl;

    public void sendVerificationOtp(String toEmail, String otpCode) {
        LOG.infof("Sending verification OTP [%s] to email: %s", otpCode, toEmail);
        try {
            mailer.send(Mail.withText(
                toEmail,
                "[Open-ERP] Mã xác thực kích hoạt tài khoản",
                String.format("Xin chào,\n\nMã xác thực 6 số kích hoạt tài khoản của bạn là: %s\nMã có hiệu lực trong 15 phút.\n\nTrân trọng,\nĐội ngũ Open-ERP", otpCode)
            ));
        } catch (Exception e) {
            LOG.warnf("Could not send email via SMTP (Local dev fallback): %s", e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        LOG.infof("Sending password reset email to: %s with token: %s", toEmail, resetToken);
        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "https://openerp.9ms.io.vn";
        String resetLink = baseUrl + "/reset-password?token=" + resetToken;
        try {
            mailer.send(Mail.withText(
                toEmail,
                "[Open-ERP] Yêu cầu đặt lại mật khẩu",
                String.format("Xin chào,\n\nBạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Open-ERP.\nVui lòng bấm vào liên kết sau để đổi mật khẩu (hạn dùng 15 phút):\n%s\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ Open-ERP", resetLink)
            ));
        } catch (Exception e) {
            LOG.warnf("Could not send email via SMTP: %s", e.getMessage());
        }
    }

    public void send2FaDisabledAlert(String toEmail) {
        LOG.warnf("Security alert: 2FA was disabled for user: %s", toEmail);
        try {
            mailer.send(Mail.withText(
                toEmail,
                "[Open-ERP CẢNH BÁO BẢO MẬT] Xác thực 2 yếu tố (2FA) đã bị vô hiệu hóa",
                "Xin chào,\n\nXác thực 2 yếu tố (2FA) trên tài khoản của bạn vừa bị TẮT.\nNếu đây không phải thao tác của bạn, tài khoản của bạn có thể đã bị xâm nhập. Vui lòng đăng nhập và đổi mật khẩu ngay lập tức!\n\nTrân trọng,\nĐội ngũ Bảo mật Open-ERP"
            ));
        } catch (Exception e) {
            LOG.warnf("Could not send email alert: %s", e.getMessage());
        }
    }
}
