package com.smartcampus.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private String absoluteLink(String link) {
        if (link == null || link.isBlank()) return null;
        if (link.startsWith("http://") || link.startsWith("https://")) return link;
        String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        return link.startsWith("/") ? base + link : base + "/" + link;
    }

    private static final String PRIMARY = "#0c1f3a";
    private static final String PRIMARY_LIGHT = "#1e3a5f";
    private static final String BG = "#f0f2f5";
    private static final String WHITE = "#ffffff";
    private static final String TEXT = "#1e293b";
    private static final String TEXT_MUTED = "#64748b";
    private static final String BORDER = "#e2e8f0";

    public void sendOtpEmail(String toEmail, String otpCode, int expiryMinutes) {
        String subject = "Academic Curator – Verification Code";
        String html = buildLayout(
            "Verify your email",
            "<p style=\"margin:0 0 24px;color:" + TEXT_MUTED + ";font-size:15px;line-height:1.6;\">"
                + "Use the code below to verify your email address. This code expires in <strong>" + expiryMinutes + " minutes</strong>."
                + "</p>"
                + "<div style=\"background:" + BG + ";border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;\">"
                + "  <span style=\"font-size:36px;font-weight:800;letter-spacing:8px;color:" + PRIMARY + ";font-family:'Courier New',monospace;\">" + otpCode + "</span>"
                + "</div>"
                + "<p style=\"margin:0;color:" + TEXT_MUTED + ";font-size:13px;line-height:1.5;\">"
                + "If you did not request this code, you can safely ignore this email."
                + "</p>"
        );
        send(toEmail, subject, html);
    }

    public void sendNotificationEmail(String toEmail, String recipientName, String title, String message, String link) {
        String subject = "Academic Curator – " + (title != null ? title : "Update");
        String safeName = escapeHtml(recipientName != null ? recipientName : "there");
        String safeTitle = escapeHtml(title != null ? title : "Notification");
        String safeMessage = escapeHtml(message != null ? message : "").replace("\n", "<br>");

        StringBuilder body = new StringBuilder();
        body.append("<p style=\"margin:0 0 16px;color:").append(TEXT).append(";font-size:15px;line-height:1.6;\">")
            .append("Hi ").append(safeName).append(",</p>");
        body.append("<p style=\"margin:0 0 24px;color:").append(TEXT_MUTED).append(";font-size:14px;line-height:1.6;\">")
            .append("You have a new update on Academic Curator.").append("</p>");
        body.append("<div style=\"background:").append(BG).append(";border-radius:12px;padding:20px;margin:0 0 24px;border-left:3px solid ").append(PRIMARY_LIGHT).append(";\">")
            .append("<p style=\"margin:0 0 8px;color:").append(PRIMARY).append(";font-size:15px;font-weight:700;\">").append(safeTitle).append("</p>")
            .append("<p style=\"margin:0;color:").append(TEXT).append(";font-size:14px;line-height:1.6;white-space:pre-line;\">").append(safeMessage).append("</p>")
            .append("</div>");

        String resolvedLink = absoluteLink(link);
        if (resolvedLink != null) {
            String safeLink = escapeHtml(resolvedLink);
            body.append("<div style=\"text-align:center;margin:0 0 24px;\">")
                .append("<a href=\"").append(safeLink).append("\" style=\"display:inline-block;background:").append(PRIMARY).append(";color:").append(WHITE).append(";text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;\">Open in app</a>")
                .append("</div>");
        }

        body.append("<p style=\"margin:0;color:").append(TEXT_MUTED).append(";font-size:12px;line-height:1.5;\">")
            .append("You can manage your notification preferences from the Notifications page.").append("</p>");

        String html = buildLayout(safeTitle, body.toString());
        send(toEmail, subject, html);
    }

    public void sendContactEmail(String toEmail, String replyToEmail, String senderName, String subject, String messageBody) {
        String mailSubject = "[Contact] " + subject;
        String safeName = escapeHtml(senderName);
        String safeEmail = escapeHtml(replyToEmail);
        String safeSubject = escapeHtml(subject);
        String safeBody = escapeHtml(messageBody).replace("\n", "<br>");

        String html = buildLayout(
            "New contact message",
            "<p style=\"margin:0 0 24px;color:" + TEXT_MUTED + ";font-size:15px;line-height:1.6;\">"
                + "Someone reached out via the Academic Curator contact form."
                + "</p>"
                + "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;margin:0 0 24px;font-size:13px;color:" + TEXT + ";\">"
                + "  <tr><td style=\"padding:8px 0;color:" + TEXT_MUTED + ";width:110px;\">From</td>"
                + "      <td style=\"padding:8px 0;font-weight:600;\">" + safeName + "</td></tr>"
                + "  <tr><td style=\"padding:8px 0;color:" + TEXT_MUTED + ";\">Email</td>"
                + "      <td style=\"padding:8px 0;font-weight:600;\"><a href=\"mailto:" + safeEmail + "\" style=\"color:" + PRIMARY_LIGHT + ";text-decoration:none;\">" + safeEmail + "</a></td></tr>"
                + "  <tr><td style=\"padding:8px 0;color:" + TEXT_MUTED + ";\">Subject</td>"
                + "      <td style=\"padding:8px 0;font-weight:600;\">" + safeSubject + "</td></tr>"
                + "</table>"
                + "<div style=\"background:" + BG + ";border-radius:12px;padding:20px;margin:0 0 24px;\">"
                + "  <p style=\"margin:0 0 8px;color:" + TEXT_MUTED + ";font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">Message</p>"
                + "  <p style=\"margin:0;color:" + TEXT + ";font-size:14px;line-height:1.7;white-space:pre-line;\">" + safeBody + "</p>"
                + "</div>"
                + "<p style=\"margin:0;color:" + TEXT_MUTED + ";font-size:12px;line-height:1.5;\">"
                + "Reply directly to this email to respond to " + safeName + "."
                + "</p>"
        );

        sendWithReplyTo(toEmail, mailSubject, html, replyToEmail, senderName);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public void sendPasswordResetEmail(String toEmail, String resetUrl, int expiryMinutes) {
        String subject = "Academic Curator – Reset Your Password";
        String html = buildLayout(
            "Reset your password",
            "<p style=\"margin:0 0 24px;color:" + TEXT_MUTED + ";font-size:15px;line-height:1.6;\">"
                + "We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>" + expiryMinutes + " minutes</strong>."
                + "</p>"
                + "<div style=\"text-align:center;margin:0 0 24px;\">"
                + "  <a href=\"" + resetUrl + "\" style=\"display:inline-block;background:" + PRIMARY + ";color:" + WHITE + ";text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;\">"
                + "    Reset Password"
                + "  </a>"
                + "</div>"
                + "<p style=\"margin:0 0 16px;color:" + TEXT_MUTED + ";font-size:13px;line-height:1.5;\">"
                + "Or copy and paste this link into your browser:"
                + "</p>"
                + "<div style=\"background:" + BG + ";border-radius:8px;padding:12px 16px;word-break:break-all;margin:0 0 24px;\">"
                + "  <a href=\"" + resetUrl + "\" style=\"color:" + PRIMARY_LIGHT + ";font-size:13px;text-decoration:none;\">" + resetUrl + "</a>"
                + "</div>"
                + "<p style=\"margin:0;color:" + TEXT_MUTED + ";font-size:13px;line-height:1.5;\">"
                + "If you did not request a password reset, you can safely ignore this email."
                + "</p>"
        );
        send(toEmail, subject, html);
    }

    private String buildLayout(String heading, String bodyContent) {
        return "<!DOCTYPE html>"
            + "<html lang=\"en\">"
            + "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>"
            + "<body style=\"margin:0;padding:0;background:" + BG + ";font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">"
            + "<div style=\"max-width:520px;margin:0 auto;padding:40px 20px;\">"
            // Header
            + "  <div style=\"background:" + PRIMARY + ";border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;\">"
            + "    <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 auto;\"><tr>"
            + "      <td style=\"width:40px;height:40px;background:#d5e1f0;border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;\">"
            + "        &#127891;"
            + "      </td>"
            + "      <td style=\"padding-left:12px;text-align:left;vertical-align:middle;\">"
            + "        <div style=\"color:" + WHITE + ";font-size:16px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;\">ACADEMIC CURATOR</div>"
            + "        <div style=\"color:rgba(255,255,255,0.5);font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;line-height:1.2;\">Institutional Ecosystem</div>"
            + "      </td>"
            + "    </tr></table>"
            + "  </div>"
            // Body
            + "  <div style=\"background:" + WHITE + ";padding:36px;border-left:1px solid " + BORDER + ";border-right:1px solid " + BORDER + ";\">"
            + "    <h1 style=\"margin:0 0 20px;font-size:22px;font-weight:700;color:" + TEXT + ";\">" + heading + "</h1>"
            + bodyContent
            + "  </div>"
            // Footer
            + "  <div style=\"background:" + BG + ";border:1px solid " + BORDER + ";border-top:none;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;\">"
            + "    <p style=\"margin:0 0 8px;color:" + TEXT_MUTED + ";font-size:12px;\">Academic Curator &bull; Institutional Ecosystem</p>"
            + "    <p style=\"margin:0;color:#94a3b8;font-size:11px;\">This is an automated message. Please do not reply to this email.</p>"
            + "  </div>"
            + "</div>"
            + "</body>"
            + "</html>";
    }

    private void send(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail, "Academic Curator");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private void sendWithReplyTo(String to, String subject, String htmlContent, String replyTo, String replyToName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail, "Academic Curator");
            helper.setTo(to);
            helper.setReplyTo(replyTo, replyToName);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}
