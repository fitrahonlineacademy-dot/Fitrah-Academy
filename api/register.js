
const { randomBytes } = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  try {
    const {
      parent_name,
      phone,
      email,
      child_name,
      child_age,
      current_level,
      preferred_service,
      subjects,
      classes_per_week,
      preferred_time,
      preferred_days,
      area,
      additional_notes,
      consent
    } = req.body || {};

    const required = [
      parent_name,
      phone,
      child_name,
      child_age,
      preferred_service,
      classes_per_week,
      preferred_time
    ];

    if (
      required.some(v => typeof v !== "string" || !v.trim()) ||
      !Array.isArray(subjects) ||
      subjects.length === 0 ||
      !Array.isArray(preferred_days) ||
      consent !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields."
      });
    }

    if (!["Home-Based Teaching", "Online Classes", "Both"].includes(preferred_service)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service selected."
      });
    }

    if (
      subjects.length > 10 ||
      subjects.some(s => typeof s !== "string" || s.length > 100) ||
      preferred_days.length > 7 ||
      preferred_days.some(d => typeof d !== "string" || d.length > 30)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details."
      });
    }

    if (
      preferred_service !== "Online Classes" &&
      !String(area || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide your area for home-based teaching."
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database configuration is missing.");
    }

    const reference = "FIT-" +
      randomBytes(5).toString("hex").toUpperCase();

    const record = {
      reference_number: reference,
      parent_name: parent_name.trim(),
      phone: phone.trim(),
      email: email ? String(email).trim() : null,
      child_name: child_name.trim(),
      child_age: child_age.trim(),
      current_level: current_level || null,
      preferred_service,
      subjects,
      classes_per_week: classes_per_week.trim(),
      preferred_time: preferred_time.trim(),
      preferred_days,
      area: area || null,
      additional_notes: additional_notes || null,
      consent: true
    };

    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/registration_enquiries`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(record)
      }
    );

    if (!response.ok) {
  const errorDetails = await response.text();
  throw new Error(`Supabase returned ${response.status}: ${errorDetails}`);
}
    return res.status(200).json({
      success: true,
      reference
    });

  } catch (error) {
    console.error("Registration submission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "We could not submit your registration. Please try again or contact us on WhatsApp."
    });
  }
};
