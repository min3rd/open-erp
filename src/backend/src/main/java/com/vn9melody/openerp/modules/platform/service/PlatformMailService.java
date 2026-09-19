package com.vn9melody.openerp.modules.platform.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Transactional emails for platform operations. The frontend base URL is always
 * loaded from configuration ({@code openerp.frontend.url}) - never hardcoded.
 */
@ApplicationScoped
public class PlatformMailService {

    private static final Logger LOG = Logger.getLogger(PlatformMailService.class);

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "openerp.frontend.url", defaultValue = "https://openerp.9ms.io.vn")
    String frontendUrl;

    public void sendAdminInvitation(String toEmail, String role, String fullName) {
        String link = baseUrl() + "/platform/accept-invitation?email=" + toEmail;
        send(toEmail, "[Open-ERP] Lời mời quản trị viên nền tảng",
            String.format("Xin chào %s,%n%nBạn được cấp quyền %s trên cổng quản trị nền tảng Open-ERP.%n"
                + "Vui lòng đăng nhập và thiết lập mật khẩu/2FA tại: %s%n%nTrân trọng,%nĐội ngũ Open-ERP",
                fullName != null ? fullName : toEmail, role, link));
    }

    public void sendAdminDisabledAlert(String toEmail, String reason) {
        send(toEmail, "[Open-ERP CẢNH BÁO BẢO MẬT] Tài khoản quản trị nền tảng đã bị vô hiệu hóa",
            String.format("Tài khoản quản trị nền tảng của bạn đã bị VÔ HIỆU HÓA.%nLý do: %s%n"
                + "Mọi phiên đăng nhập đã bị thu hồi.%n%nĐội ngũ Bảo mật Open-ERP",
                reason != null ? reason : "Không cung cấp"));
    }

    public void sendAdminPasswordReset(String toEmail, String rawToken) {
        String link = baseUrl() + "/reset-password?token=" + rawToken;
        send(toEmail, "[Open-ERP] Đặt lại mật khẩu quản trị nền tảng",
            String.format("Yêu cầu đặt lại mật khẩu quản trị nền tảng đã được tạo.%n"
                + "Liên kết có hiệu lực 15 phút: %s%n%nĐội ngũ Open-ERP", link));
    }

    public void sendAdmin2FaDisabledAlert(String toEmail, String supportTicket) {
        send(toEmail, "[Open-ERP CẢNH BÁO BẢO MẬT] 2FA quản trị nền tảng đã bị tắt (break-glass)",
            String.format("2FA của tài khoản quản trị nền tảng đã bị tắt theo quy trình break-glass.%n"
                + "Ticket hỗ trợ: %s%nNếu đây không phải yêu cầu của bạn, hãy liên hệ ngay bộ phận an ninh.%n%n"
                + "Đội ngũ Bảo mật Open-ERP", supportTicket));
    }

    public void sendUserBreakGlassAlert(String toEmail, String action, String supportTicket) {
        send(toEmail, "[Open-ERP CẢNH BÁO BẢO MẬT] Thao tác break-glass trên tài khoản của bạn",
            String.format("Quản trị nền tảng đã thực hiện thao tác %s trên tài khoản của bạn.%n"
                + "Ticket hỗ trợ: %s%n%nĐội ngũ Bảo mật Open-ERP", action, supportTicket));
    }

    public void sendTenantLockedAlert(String toEmail, String tenantName, String reason) {
        send(toEmail, "[Open-ERP] Không gian làm việc đã bị tạm ngưng",
            String.format("Không gian làm việc \"%s\" đã bị tạm ngưng.%nLý do: %s%n%nĐội ngũ Open-ERP",
                tenantName, reason != null ? reason : "Không cung cấp"));
    }

    public void sendTenantExpiredAlert(String toEmail, String tenantName) {
        send(toEmail, "[Open-ERP] Gói dùng thử đã hết hạn",
            String.format("Gói dùng thử của không gian làm việc \"%s\" đã hết hạn.%n"
                + "Vui lòng liên hệ để nâng cấp gói dịch vụ.%n%nĐội ngũ Open-ERP", tenantName));
    }

    private void send(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        try {
            mailer.send(Mail.withText(toEmail, subject, body));
        } catch (Exception e) {
            LOG.warnf("Could not send platform email to %s: %s", toEmail, e.getMessage());
        }
    }

    private String baseUrl() {
        return (frontendUrl != null && !frontendUrl.isBlank())
            ? frontendUrl.replaceAll("/+$", "")
            : "https://openerp.9ms.io.vn";
    }
}
