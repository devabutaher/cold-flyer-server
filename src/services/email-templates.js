/**
 * Cold Flyer — Professional HTML Email Templates
 *
 * Centralized, reusable email template system.
 * Brand colors extracted from globals.css (Tailwind theme):
 *   Primary:   #D97706  (oklch 0.646 0.222 41.116)
 *   Secondary: #FEF3C7  (oklch 0.954 0.038 75.164)
 *   Background:#FCFCFC  (oklch 0.990 0 0)
 *   Foreground:#1A1A1A  (oklch 0 0 0)
 *   Muted:     #F5F5F5  (oklch 0.970 0 0)
 *   Destructive:#DC2626 (oklch 0.630 0.190 23.030)
 *   Success:   #16A34A
 *
 * Fonts: DM Sans (headings), Outfit (body), system-ui fallback
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BRAND_NAME = "Cold Flyer";

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#D97706",
  primaryDark: "#B45309",
  primaryLight: "#FEF3C7",
  secondary: "#FEF3C7",
  background: "#FCFCFC",
  foreground: "#1A1A1A",
  muted: "#F5F5F5",
  mutedForeground: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  success: "#16A34A",
  destructive: "#DC2626",
  warning: "#F59E0B",
  info: "#3B82F6",
  footerBg: "#1F2937",
  footerText: "#D1D5DB",
};

// ── Status badge colors ─────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  confirmed: { bg: "#DBEAFE", text: "#1E40AF", label: "Confirmed" },
  scheduled: { bg: "#E0E7FF", text: "#3730A3", label: "Scheduled" },
  in_progress: { bg: "#FEE2E2", text: "#991B1B", label: "In Progress" },
  completed: { bg: "#D1FAE5", text: "#065F46", label: "Completed" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
  processing: { bg: "#FEF3C7", text: "#92400E", label: "Processing" },
  shipped: { bg: "#DBEAFE", text: "#1E40AF", label: "Shipped" },
  delivered: { bg: "#D1FAE5", text: "#065F46", label: "Delivered" },
  failed: { bg: "#FEE2E2", text: "#991B1B", label: "Failed" },
  refunded: { bg: "#E0E7FF", text: "#3730A3", label: "Refunded" },
  paid: { bg: "#D1FAE5", text: "#065F46", label: "Paid" },
  unpaid: { bg: "#FEF3C7", text: "#92400E", label: "Unpaid" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const escapeHtml = (str) => {
  if (!str) return "";
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  const apos = "&" + "#039;";
  return String(str).replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot).replace(/'/g, apos);
};

const formatCurrency = (amount, currency = "BDT") => {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Component Builders ───────────────────────────────────────────────────────

/**
 * Build a styled action button for email CTAs.
 */
const buildButton = (url, text) => {
  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background: ${COLORS.primary};">
          <a href="${escapeHtml(url)}"
             target="_blank"
             style="display: inline-block; padding: 14px 32px; font-family: Outfit, system-ui, sans-serif; font-size: 15px; font-weight: 600; color: ${COLORS.white}; text-decoration: none; border-radius: 8px; letter-spacing: 0.01em;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Build a smaller secondary/ghost button.
 */
const buildSecondaryButton = (url, text) => {
  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 16px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; border: 2px solid ${COLORS.primary};">
          <a href="${escapeHtml(url)}"
             target="_blank"
             style="display: inline-block; padding: 10px 24px; font-family: Outfit, system-ui, sans-serif; font-size: 14px; font-weight: 600; color: ${COLORS.primary}; text-decoration: none; border-radius: 6px; letter-spacing: 0.01em;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Build a status badge pill.
 */
const buildStatusBadge = (status) => {
  const config = STATUS_COLORS[status] || { bg: COLORS.muted, text: COLORS.mutedForeground, label: status };
  return `
    <span style="display: inline-block; padding: 6px 14px; font-family: Outfit, system-ui, sans-serif; font-size: 12px; font-weight: 600; color: ${config.text}; background: ${config.bg}; border-radius: 999px; letter-spacing: 0.02em; text-transform: uppercase;">
      ${escapeHtml(config.label)}
    </span>
  `;
};

/**
 * Build an order items table for email.
 * items: Array of { name, quantity, price, total, image? }
 */
const buildOrderTable = (items, { showImage = false, currency = "BDT" } = {}) => {
  if (!items || items.length === 0) return "";

  const rows = items
    .map(
      (item, _i) => `
        <tr>
          ${
            showImage && item.image
              ? `<td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.border}; vertical-align: middle; width: 60px;">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover;" />
          </td>`
              : ""
          }
          <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.border}; font-family: Outfit, system-ui, sans-serif; font-size: 14px; color: ${COLORS.foreground};">
            ${escapeHtml(item.name)}
            ${item.sku ? `<br/><span style="font-size: 12px; color: ${COLORS.mutedForeground};">SKU: ${escapeHtml(item.sku)}</span>` : ""}
          </td>
          <td align="center" style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.border}; font-family: Outfit, system-ui, sans-serif; font-size: 14px; color: ${COLORS.mutedForeground};">
            ${item.quantity}
          </td>
          <td align="right" style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.border}; font-family: Outfit, system-ui, sans-serif; font-size: 14px; color: ${COLORS.foreground}; font-weight: 600;">
            ${formatCurrency(item.total || item.price * item.quantity, currency)}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr>
          ${showImage ? '<th style="padding: 8px; border-bottom: 2px solid #E5E7EB; text-align: left; width: 60px;"></th>' : ""}
          <th style="padding: 8px; border-bottom: 2px solid #E5E7EB; font-family: Outfit, system-ui, sans-serif; font-size: 12px; font-weight: 600; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 0.04em; text-align: left;">Item</th>
          <th align="center" style="padding: 8px; border-bottom: 2px solid #E5E7EB; font-family: Outfit, system-ui, sans-serif; font-size: 12px; font-weight: 600; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 0.04em;">Qty</th>
          <th align="right" style="padding: 8px; border-bottom: 2px solid #E5E7EB; font-family: Outfit, system-ui, sans-serif; font-size: 12px; font-weight: 600; color: ${COLORS.mutedForeground}; text-transform: uppercase; letter-spacing: 0.04em;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

/**
 * Build a service booking items table.
 * items: Array of { name, price, quantity }
 */
const buildServiceTable = (items, { currency = "BDT" } = {}) => {
  if (!items || items.length === 0) return "";
  return buildOrderTable(
    items.map((i) => ({
      name: i.name || "Service",
      quantity: i.quantity || 1,
      price: i.price || 0,
      total: (i.price || 0) * (i.quantity || 1),
    })),
    { showImage: false, currency },
  );
};

/**
 * Build a summary line row (e.g. Subtotal, Shipping, Tax, Total).
 */
const buildSummaryLine = (label, value, { bold = false, large = false, borderTop = false } = {}) => {
  return `
    <tr>
      <td style="padding: ${borderTop ? "12px 0 4px" : "4px 0"}; ${borderTop ? `border-top: 2px solid ${COLORS.border};` : ""} font-family: Outfit, system-ui, sans-serif; font-size: ${large ? "16px" : "14px"}; color: ${COLORS.mutedForeground}; ${bold ? "font-weight: 600;" : ""}">
        ${escapeHtml(label)}
      </td>
      <td align="right" style="padding: ${borderTop ? "12px 0 4px" : "4px 0"}; ${borderTop ? `border-top: 2px solid ${COLORS.border};` : ""} font-family: Outfit, system-ui, sans-serif; font-size: ${large ? "16px" : "14px"}; color: ${COLORS.foreground}; ${bold ? "font-weight: 700;" : ""}">
        ${value}
      </td>
    </tr>
  `;
};

/**
 * Build a horizontal divider.
 */
const buildDivider = () => {
  return `<hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 24px 0;" />`;
};

/**
 * Build a verification code block (large centered text).
 */
const buildVerificationCode = (code) => {
  return `
    <div style="margin: 24px 0; text-align: center;">
      <div style="display: inline-block; padding: 16px 32px; background: ${COLORS.muted}; border-radius: 12px; border: 1px solid ${COLORS.border};">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: ${COLORS.foreground};">
          ${escapeHtml(code)}
        </span>
      </div>
    </div>
  `;
};

// ── Main Email Wrapper ───────────────────────────────────────────────────────

/**
 * Build the full HTML email with header, body, and footer.
 *
 * @param {string}  content      - The inner HTML body content (fully formed).
 * @param {object}  [options]    - Optional settings.
 * @param {string}  [options.previewText] - Email preview text (for inbox).
 * @param {string}  [options.headerText]  - Custom header salutation (default: "Hello,").
 * @returns {string} Full HTML document as a string.
 */
const buildEmailHtml = (content, options = {}) => {
  const previewText = options.previewText || "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${BRAND_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  ${previewText ? `<!--[if !mso]><!-- --><div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div><!--<![endif]-->` : ""}
  <style type="text/css">
    /* Client-safe reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-padding {
        padding: 0 16px !important;
      }
      .content-cell {
        padding: 24px 16px !important;
      }
      .header-cell {
        padding: 20px 16px !important;
      }
      .footer-cell {
        padding: 20px 16px !important;
      }
      .button-link {
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .button-td {
        display: block !important;
        width: 100% !important;
      }
      .button-table {
        width: 100% !important;
      }
      .responsive-table {
        width: 100% !important;
      }
      .responsive-stack {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 4px 0 !important;
      }
      .hide-mobile {
        display: none !important;
      }
    }
    @media only screen and (max-width: 420px) {
      .content-cell {
        padding: 16px 12px !important;
      }
      .header-cell {
        padding: 16px 12px !important;
      }
      .footer-cell {
        padding: 16px 12px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: Outfit, system-ui, -apple-system, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="600" align="center"><tr><td>
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="email-container" style="width: 100%; max-width: 600px; background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); padding: 28px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-family: 'DM Sans', system-ui, sans-serif; font-size: 24px; font-weight: 700; color: ${COLORS.white}; letter-spacing: -0.02em;">
                      ${BRAND_NAME}
                    </h1>
                    <p style="margin: 4px 0 0; font-family: Outfit, system-ui, sans-serif; font-size: 13px; color: rgba(255,255,255,0.85); letter-spacing: 0.03em; font-weight: 300;">
                      Premium HVAC & Cooling Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="content-cell" style="padding: 32px; background-color: ${COLORS.white};">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                <tr>
                  <td style="font-family: Outfit, system-ui, sans-serif; font-size: 15px; line-height: 1.6; color: ${COLORS.foreground};">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="footer-cell" style="background-color: ${COLORS.footerBg}; padding: 28px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <p style="margin: 0; font-family: 'DM Sans', system-ui, sans-serif; font-size: 16px; font-weight: 600; color: ${COLORS.white};">
                      ${BRAND_NAME}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <p style="margin: 0; font-family: Outfit, system-ui, sans-serif; font-size: 13px; color: ${COLORS.footerText}; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="display: inline-block;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="${FRONTEND_URL}" style="font-family: Outfit, system-ui, sans-serif; font-size: 13px; color: ${COLORS.footerText}; text-decoration: none;">Website</a>
                        </td>
                        <td style="padding: 0 8px; color: ${COLORS.footerText};">&middot;</td>
                        <td style="padding: 0 8px;">
                          <a href="mailto:support@coldflyer.com" style="font-family: Outfit, system-ui, sans-serif; font-size: 13px; color: ${COLORS.footerText}; text-decoration: none;">Support</a>
                        </td>
                        <td style="padding: 0 8px; color: ${COLORS.footerText};">&middot;</td>
                        <td style="padding: 0 8px;">
                          <a href="${FRONTEND_URL}/contact" style="font-family: Outfit, system-ui, sans-serif; font-size: 13px; color: ${COLORS.footerText}; text-decoration: none;">Contact</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <p style="margin: 0; font-family: Outfit, system-ui, sans-serif; font-size: 11px; color: rgba(255,255,255,0.4);">
                      This is an automated message from ${BRAND_NAME}. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Build a complete email with a greeting, body content, and optional button.
 *
 * @param {object}   params
 * @param {string}   params.name          - Recipient's name (or "there").
 * @param {string}   params.previewText   - Preview text for inbox.
 * @param {string}   params.greeting      - Greeting line (overrides default "Hello {name},").
 * @param {string}   params.content       - Main body HTML (will be wrapped).
 * @param {string}   [params.buttonUrl]   - Optional CTA button URL.
 * @param {string}   [params.buttonText]  - Optional CTA button text.
 * @param {string}   [params.additionalFooter] - Extra footer content.
 * @returns {string} Full HTML email.
 */
const buildStandardEmail = ({ name, previewText, greeting, content, buttonUrl, buttonText, additionalFooter }) => {
  const safeName = name ? escapeHtml(name) : "there";
  const greetingLine = greeting || `Hello ${safeName},`;
  let body = `<p style="margin: 0 0 16px; font-size: 16px; color: ${COLORS.foreground};">${greetingLine}</p>`;
  body += content;

  if (buttonUrl && buttonText) {
    body += buildButton(buttonUrl, buttonText);
  }

  if (additionalFooter) {
    body += buildDivider();
    body += `<p style="margin: 0; font-size: 13px; color: ${COLORS.mutedForeground};">${additionalFooter}</p>`;
  }

  body += buildDivider();
  body += `<p style="margin: 0; font-size: 14px; color: ${COLORS.mutedForeground};">Best regards,<br/><strong style="color: ${COLORS.foreground};">The ${BRAND_NAME} Team</strong></p>`;

  return buildEmailHtml(body, { previewText });
};

module.exports = {
  // Main builders
  buildEmailHtml,
  buildStandardEmail,

  // Component helpers
  buildButton,
  buildSecondaryButton,
  buildStatusBadge,
  buildOrderTable,
  buildServiceTable,
  buildSummaryLine,
  buildDivider,
  buildVerificationCode,
  buildStandardEmail,

  // Utilities
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateTime,

  // Constants
  COLORS,
  STATUS_COLORS,
  BRAND_NAME,
  FRONTEND_URL,
};
