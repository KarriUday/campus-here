/**
 * Originality corpus — previous batches' registered titles.
 *
 * The first two entries are deliberate: the project report's worked example
 * checks "Smart Attendance via Face Recognition" against a near-identical
 * resubmission, and "Campus Security using Face ID" is the mid-band
 * (warning, not blocked) neighbour. The similarity engine's unit tests assert
 * against exactly these.
 */
export const TITLE_CORPUS: Array<{
  title: string;
  domain: string;
  guide: string;
  cycle: string;
}> = [
  { title: "Smart Attendance via Face Recognition", domain: "AI/ML", guide: "Dr. Ananya Rao", cycle: "2024-25 Major" },
  { title: "Campus Security using Face ID", domain: "AI/ML", guide: "Dr. Ramesh Bhat", cycle: "2024-25 Major" },
  { title: "IoT-Based Energy Monitoring Dashboard", domain: "IoT", guide: "Ms. Deepa Nayak", cycle: "2024-25 Major" },
  { title: "Adaptive Study Planner using ML", domain: "AI/ML", guide: "Dr. Ananya Rao", cycle: "2024-25 Major" },
  { title: "Blockchain-Based Academic Certificate Verification", domain: "Cybersecurity", guide: "Dr. Sameer Kamath", cycle: "2024-25 Major" },
  { title: "Real-Time Sign Language Interpreter", domain: "AI/ML", guide: "Dr. Meenakshi Nair", cycle: "2024-25 Major" },
  { title: "Crop Disease Detection using Deep Learning", domain: "AI/ML", guide: "Prof. Lakshmi Prasad", cycle: "2024-25 Major" },
  { title: "Smart Traffic Signal Optimization System", domain: "IoT", guide: "Dr. Vinod Murthy", cycle: "2024-25 Major" },
  { title: "Personalized News Recommendation Engine", domain: "Data Science", guide: "Dr. Sunitha Iyer", cycle: "2024-25 Major" },
  { title: "Automated Resume Screening Platform", domain: "AI/ML", guide: "Mr. Vivek Hegde", cycle: "2024-25 Major" },
  { title: "Cloud-Native Log Anomaly Detection", domain: "Cloud & DevOps", guide: "Dr. Prakash Menon", cycle: "2024-25 Major" },
  { title: "Wearable Health Monitoring with Edge Analytics", domain: "IoT", guide: "Mr. Naveen Desai", cycle: "2024-25 Major" },
  { title: "Sentiment Analysis of Regional Language Tweets", domain: "AI/ML", guide: "Dr. Chandrika Rai", cycle: "2024-25 Major" },
  { title: "Secure File Sharing with Attribute-Based Encryption", domain: "Cybersecurity", guide: "Prof. Harish Gowda", cycle: "2024-25 Major" },
  { title: "Online Examination Proctoring System", domain: "AI/ML", guide: "Dr. Kartik Joshi", cycle: "2024-25 Major" },
  { title: "Smart Waste Segregation using Computer Vision", domain: "AI/ML", guide: "Dr. Arvind Hegde", cycle: "2024-25 Major" },
  { title: "Predictive Maintenance for Industrial Motors", domain: "Data Science", guide: "Dr. Bhavya Reddy", cycle: "2024-25 Major" },
  { title: "Voice-Controlled Home Automation Hub", domain: "IoT", guide: "Mr. Sandeep Patel", cycle: "2024-25 Major" },
  { title: "Peer-to-Peer Study Material Exchange Portal", domain: "Web", guide: "Ms. Ritu Singh", cycle: "2024-25 Major" },
  { title: "Fake News Detection using Transformer Models", domain: "AI/ML", guide: "Dr. Latha Srinivasan", cycle: "2024-25 Major" },
  { title: "Hospital Queue Management System", domain: "Web", guide: "Mr. Abhishek Jain", cycle: "2023-24 Major" },
  { title: "Driver Drowsiness Detection System", domain: "AI/ML", guide: "Ms. Kavya Tejaswi", cycle: "2023-24 Major" },
  { title: "Air Quality Index Forecasting Platform", domain: "Data Science", guide: "Dr. Sunitha Iyer", cycle: "2023-24 Major" },
  { title: "Container Orchestration Cost Optimizer", domain: "Cloud & DevOps", guide: "Dr. Mohan Kumar", cycle: "2023-24 Major" },
  { title: "Handwritten Kannada Character Recognition", domain: "AI/ML", guide: "Dr. Nandini Sharma", cycle: "2023-24 Major" },
  { title: "Intrusion Detection using Network Flow Analysis", domain: "Cybersecurity", guide: "Ms. Pooja Kulkarni", cycle: "2023-24 Major" },
  { title: "Campus Navigation with Augmented Reality", domain: "Web", guide: "Ms. Divya Chandra", cycle: "2023-24 Major" },
  { title: "Solar Panel Efficiency Tracker", domain: "IoT", guide: "Mr. Prashanth Rao", cycle: "2023-24 Major" },
  { title: "Music Genre Classification using Spectrograms", domain: "AI/ML", guide: "Ms. Swetha Prasad", cycle: "2023-24 Major" },
  { title: "Supply Chain Transparency on Distributed Ledger", domain: "Cybersecurity", guide: "Dr. Ganesh Kamath", cycle: "2023-24 Major" },
  { title: "Automated Timetable Generation System", domain: "Web", guide: "Dr. Vandana Bhat", cycle: "2023-24 Major" },
  { title: "Retail Footfall Analytics using CCTV", domain: "AI/ML", guide: "Dr. Ananya Rao", cycle: "2023-24 Major" },
  { title: "Serverless Image Processing Pipeline", domain: "Cloud & DevOps", guide: "Dr. Asha Menon", cycle: "2023-24 Major" },
  { title: "Flood Early Warning Sensor Network", domain: "IoT", guide: "Mr. Vikram Singh", cycle: "2023-24 Major" },
  { title: "Chatbot for Student Grievance Redressal", domain: "AI/ML", guide: "Ms. Renita Monteiro", cycle: "2023-24 Major" },
  { title: "Plagiarism Detection for Source Code", domain: "Data Science", guide: "Ms. Rekha Gupta", cycle: "2023-24 Major" },
  { title: "Library Book Recommendation System", domain: "Data Science", guide: "Prof. Lakshmi Prasad", cycle: "2023-24 Major" },
  { title: "Gesture-Controlled Presentation Tool", domain: "AI/ML", guide: "Mr. Manoj Shenoy", cycle: "2023-24 Major" },
  { title: "Distributed Ledger for Land Records", domain: "Cybersecurity", guide: "Dr. Sameer Kamath", cycle: "2023-24 Major" },
  { title: "Smart Parking Slot Allocation System", domain: "IoT", guide: "Mr. Rajesh Naik", cycle: "2023-24 Major" },
];

/** Titles for groups in the current cycle. Deliberately distinct from the corpus. */
export const CURRENT_TITLES: Array<{ title: string; domain: string; statement: string }> = [
  { title: "Federated Learning for Privacy-Preserving Health Records", domain: "AI/ML", statement: "Train diagnostic models across hospitals without moving patient data off-site, using federated averaging with differential privacy guarantees." },
  { title: "Explainable Credit Risk Scoring Dashboard", domain: "Data Science", statement: "Score loan applications with a gradient-boosted model and surface SHAP-based explanations so a reviewer can justify every decision." },
  { title: "Zero-Trust Microservice Access Broker", domain: "Cybersecurity", statement: "Issue short-lived, workload-scoped credentials between microservices and revoke them on anomaly detection." },
  { title: "Low-Power Mesh Network for Rural Weather Stations", domain: "IoT", statement: "Relay sensor readings across a LoRa mesh with store-and-forward buffering for intermittent uplinks." },
  { title: "Collaborative Whiteboard with Conflict-Free Replication", domain: "Web", statement: "Support simultaneous editing across devices with CRDT-based state merging and offline reconciliation." },
  { title: "Autoscaling Predictor for Kubernetes Workloads", domain: "Cloud & DevOps", statement: "Forecast pod-level demand from historical metrics and pre-warm replicas ahead of traffic spikes." },
  { title: "Multilingual Lecture Transcription and Summarisation", domain: "AI/ML", statement: "Transcribe classroom audio across code-switched English and Kannada, then produce structured revision notes." },
  { title: "Supply-Side Energy Trading Simulator", domain: "Data Science", statement: "Model peer-to-peer rooftop solar trading under varying tariff policies and visualise settlement outcomes." },
  { title: "Adversarial Robustness Benchmark for Vision Models", domain: "AI/ML", statement: "Evaluate deployed classifiers against perturbation attacks and report a per-class robustness score." },
  { title: "Assistive Reading Device for Low-Vision Users", domain: "IoT", statement: "Capture printed text on a wearable camera and deliver paced audio output with adjustable verbosity." },
  { title: "Incident Response Runbook Automation", domain: "Cloud & DevOps", statement: "Convert written runbooks into executable workflows that gather diagnostics before paging an engineer." },
  { title: "Accessibility Audit Crawler for Institutional Sites", domain: "Web", statement: "Crawl departmental pages and report WCAG violations ranked by the number of students affected." },
  { title: "Behavioural Biometrics for Continuous Authentication", domain: "Cybersecurity", statement: "Authenticate a session continuously from typing rhythm and pointer dynamics rather than a one-time login." },
  { title: "Groundwater Depletion Forecasting for Taluks", domain: "Data Science", statement: "Combine rainfall, borewell and cropping data to project district-level groundwater trends." },
  { title: "Curriculum Gap Analyser against Industry Postings", domain: "AI/ML", statement: "Compare syllabus outcomes with scraped job requirements and highlight uncovered skills." },
  { title: "Acoustic Leak Detection in Municipal Water Mains", domain: "IoT", statement: "Place hydrophone nodes along distribution pipes and localise leaks from correlated acoustic signatures." },
  { title: "Differential Privacy Budget Tracker for Research Datasets", domain: "Cybersecurity", statement: "Account for cumulative privacy loss across successive queries and refuse those that exhaust the budget." },
  { title: "Crowd Density Estimation for Campus Event Safety", domain: "AI/ML", statement: "Estimate headcount from overhead footage and warn stewards before a corridor reaches unsafe occupancy." },
  { title: "Timetable Conflict Resolver with Constraint Programming", domain: "Web", statement: "Model room, staff and cohort constraints and produce a feasible timetable with explained violations." },
  { title: "Cold-Chain Integrity Ledger for Vaccine Transport", domain: "IoT", statement: "Log temperature excursions to tamper-evident storage and flag consignments that breached tolerance." },
  { title: "Query Cost Advisor for Analytical Warehouses", domain: "Cloud & DevOps", statement: "Predict the scan cost of a SQL query before execution and suggest partition-aware rewrites." },
  { title: "Dialect-Aware Speech Interface for Agricultural Advisories", domain: "AI/ML", statement: "Recognise regional Kannada dialects and deliver crop advisories as spoken responses." },
  { title: "Bias Audit Toolkit for Admission Screening Models", domain: "Data Science", statement: "Measure disparate impact across protected attributes and report which features drive the gap." },
  { title: "Peer Code Review Quality Scorer", domain: "Data Science", statement: "Score review comments for actionability and coverage, and surface reviews that rubber-stamped a change." },
  { title: "Battery Health Prognosis for Electric Two-Wheelers", domain: "IoT", statement: "Estimate remaining useful life from charge-discharge telemetry and warn before capacity collapse." },
  { title: "Ransomware Canary Files with Behavioural Triggers", domain: "Cybersecurity", statement: "Seed decoy documents across a share and halt the offending process on first anomalous access pattern." },
  { title: "Progressive Offline Portal for Rural Examination Centres", domain: "Web", statement: "Serve exam material and collect responses offline, reconciling to the server when connectivity returns." },
  { title: "Spot Instance Interruption Forecaster", domain: "Cloud & DevOps", statement: "Predict pre-emption windows from historical reclaim data and drain workloads ahead of termination." },
  { title: "Sign-Off Traceability Graph for Regulated Releases", domain: "Cloud & DevOps", statement: "Link every deployed artefact to the approvals, tests and tickets that authorised it." },
  { title: "Handwriting Legibility Feedback for Primary Education", domain: "AI/ML", statement: "Score letter formation from tablet strokes and give children targeted, encouraging correction." },
];
