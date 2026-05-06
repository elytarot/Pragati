// src/utils/sms.js — MSG91 SMS integration (India)
const axios = require("axios");

const MSG91_API = "https://api.msg91.com/api/v5";

/**
 * Send SMS via MSG91
 * @param {string} mobile - 10-digit mobile number (India)
 * @param {string} message - SMS message text (max 160 chars for single SMS)
 * @param {string} templateId - MSG91 template ID
 */
const sendSMS = async (mobile, message, templateId) => {
  if (!process.env.MSG91_AUTH_KEY) {
    console.log(`[SMS DEV] To: ${mobile} | Msg: ${message.substring(0, 80)}...`);
    return { success: true, dev: true };
  }

  // Ensure 10-digit number with 91 country code
  const cleanMobile = mobile.replace(/\D/g, "");
  const fullMobile  = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  try {
    const response = await axios.post(
      `${MSG91_API}/flow/`,
      {
        template_id: templateId || process.env.MSG91_TEMPLATE_ID,
        short_url:   "1",
        recipients:  [{ mobiles: fullMobile, message }],
      },
      {
        headers: {
          authkey:        process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
          "accept":       "application/json",
        },
      }
    );
    return { success: true, msgId: response.data?.request_id };
  } catch (err) {
    console.error("[SMS Error]", err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

// Pre-built message templates
const SMS_TEMPLATES = {
  iepReviewDue: (childName, bbId, reviewDate) =>
    `PRAGATI Alert: IEP review for ${childName} (${bbId}) is due on ${reviewDate}. Please complete the quarterly review. -Bright Beginnings`,

  baselinePending: (childName, bbId, days) =>
    `PRAGATI Reminder: ${childName} (${bbId}) enrolled ${days} days ago. Baseline assessment still pending. -Bright Beginnings`,

  iepNotCreated: (childName, bbId) =>
    `PRAGATI: ${childName} (${bbId}) has baseline done but no IEP created. Please create IEP. -Bright Beginnings`,

  noIntervention: (childName, bbId, days) =>
    `PRAGATI Alert: No intervention logged for ${childName} (${bbId}) in ${days} days. -Bright Beginnings`,

  deviceFollowup: (childName, bbId) =>
    `PRAGATI Reminder: Device follow-up check due for ${childName} (${bbId}). Please verify condition. -Bright Beginnings`,

  newUserWelcome: (name, email, tempPass) =>
    `Welcome to PRAGATI! Your login: Email: ${email} | Password: ${tempPass} | URL: pragati.brightbeginnings.org -Bright Beginnings`,
};

module.exports = { sendSMS, SMS_TEMPLATES };
