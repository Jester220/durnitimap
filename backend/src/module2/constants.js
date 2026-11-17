// Shared by all Module 2 features (Mahi, Nahid, Saif).
// Averages are shown only when an office/service has at least this many
// APPROVED reports, so a single unverified report is never presented as a fact.
module.exports = {
  MIN_APPROVED_REPORTS: 3,
  REPORT_STATUS_PUBLIC: "Approved",
};
