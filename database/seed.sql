USE durnitimap;

INSERT INTO offices (id, name, name_bn, type, division, district, upazila, address) VALUES
(1, 'Regional Passport Office, Dhaka', 'আঞ্চলিক পাসপোর্ট অফিস, ঢাকা', 'Passport Office', 'Dhaka', 'Dhaka', NULL, 'Agargaon, Dhaka'),
(2, 'BRTA Dhaka Metro Circle', 'বিআরটিএ ঢাকা মেট্রো সার্কেল', 'Transport Office', 'Dhaka', 'Dhaka', NULL, 'Mirpur, Dhaka'),
(3, 'Savar Upazila Land Office', 'সাভার উপজেলা ভূমি অফিস', 'Land Office', 'Dhaka', 'Dhaka', 'Savar', 'Savar, Dhaka');

INSERT INTO services (id, office_id, name, name_bn, description) VALUES
(1, 1, 'New e-Passport', 'নতুন ই-পাসপোর্ট', 'Application for a new machine-readable e-Passport.'),
(2, 2, 'Driving License (New)', 'ড্রাইভিং লাইসেন্স (নতুন)', 'Issue of a new driving license.'),
(3, 3, 'Land Mutation (Namjari)', 'নামজারি (মিউটেশন)', 'Change of land ownership record.');

INSERT INTO service_info (service_id, official_fee, processing_days, required_documents, source_note) VALUES
(1, 4000.00, 21, 'NID or birth certificate\nOnline application copy\nPayment receipt', 'SAMPLE DATA - replace with official figure'),
(2, 3000.00, 30, 'NID\nLearner license\nMedical certificate', 'SAMPLE DATA - replace with official figure'),
(3, 1100.00, 28, 'Deed copy\nPrevious khatian\nNID\nLand tax receipt', 'SAMPLE DATA - replace with official figure');