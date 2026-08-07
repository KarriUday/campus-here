import type { Designation } from "../../src/generated/prisma/enums";

export const FIRST_NAMES = [
  "Aarav", "Aditi", "Advika", "Akash", "Ananya", "Anirudh", "Anjali", "Ansh",
  "Arjun", "Ashwin", "Bhavana", "Chaitra", "Charan", "Darshan", "Deepika",
  "Dhruv", "Divya", "Gagan", "Gautham", "Harini", "Harsha", "Ishaan", "Ishita",
  "Jeevan", "Kavya", "Keerthi", "Kiran", "Krishna", "Lakshmi", "Madhav",
  "Manish", "Meera", "Mohit", "Namrata", "Nandini", "Naveen", "Nikhil",
  "Nisha", "Pallavi", "Pavan", "Poorvi", "Pooja", "Prajwal", "Pranav",
  "Preethi", "Rahul", "Rakshita", "Ramya", "Rachana", "Rithvik", "Rohan",
  "Rohit", "Sahana", "Sahil", "Sanjana", "Sanjay", "Shreya", "Shravan",
  "Siddharth", "Sinchana", "Skanda", "Sneha", "Sourav", "Spoorthi", "Sujay",
  "Suman", "Sushmitha", "Swathi", "Tanvi", "Tejas", "Uday", "Vaishnavi",
  "Varun", "Vedant", "Vidya", "Vihaan", "Vinay", "Yashas", "Yogesh", "Zoya",
];

export const LAST_NAMES = [
  "Acharya", "Bhat", "Chandra", "Desai", "Gowda", "Gupta", "Hegde", "Iyer",
  "Jain", "Joshi", "Kamath", "Kulkarni", "Kumar", "Menon", "Murthy", "Nair",
  "Naik", "Pai", "Patel", "Prasad", "Raghavan", "Rai", "Rao", "Reddy",
  "Shenoy", "Shetty", "Singh", "Sharma", "Srinivasan", "Verma",
];

export const DOMAINS = [
  {
    name: "AI/ML",
    slug: "ai-ml",
    description: "Computer vision, NLP, forecasting, recommender systems.",
  },
  {
    name: "Web",
    slug: "web",
    description: "Dashboards, portals, analytics, APIs.",
  },
  {
    name: "IoT",
    slug: "iot",
    description: "Sensors, monitoring, automation, edge devices.",
  },
  {
    name: "Cybersecurity",
    slug: "cybersecurity",
    description: "Threat detection, secure systems, cryptography.",
  },
  {
    name: "Data Science",
    slug: "data-science",
    description: "Pipelines, visualisation, statistical modelling.",
  },
  {
    name: "Cloud & DevOps",
    slug: "cloud-devops",
    description: "Containers, CI/CD, distributed systems, observability.",
  },
];

type FacultySeed = {
  fullName: string;
  designation: Designation;
  domains: string[];
};

/**
 * 40 guides. A cohort of 300 students forms 75 groups, and the departmental
 * rule is a hard cap of 2 groups per guide — so the allocation engine needs at
 * least 38 guides to have any feasible matching at all.
 */
export const FACULTY: FacultySeed[] = [
  { fullName: "Dr. Ananya Rao", designation: "ASSOCIATE_PROFESSOR", domains: ["AI/ML", "Data Science"] },
  { fullName: "Prof. Kiran Shetty", designation: "PROFESSOR", domains: ["Web", "Cloud & DevOps"] },
  { fullName: "Ms. Deepa Nayak", designation: "ASSISTANT_PROFESSOR", domains: ["IoT"] },
  { fullName: "Dr. Ramesh Bhat", designation: "PROFESSOR", domains: ["AI/ML", "Cybersecurity"] },
  { fullName: "Mr. Vivek Hegde", designation: "ASSISTANT_PROFESSOR", domains: ["AI/ML"] },
  { fullName: "Prof. Lakshmi Prasad", designation: "PROFESSOR", domains: ["Data Science", "AI/ML"] },
  { fullName: "Ms. Ritu Singh", designation: "ASSISTANT_PROFESSOR", domains: ["Web"] },
  { fullName: "Dr. Sameer Kamath", designation: "ASSOCIATE_PROFESSOR", domains: ["Cybersecurity"] },
  { fullName: "Mr. Naveen Desai", designation: "ASSISTANT_PROFESSOR", domains: ["IoT", "Cloud & DevOps"] },
  { fullName: "Ms. Kavya Tejaswi", designation: "ASSISTANT_PROFESSOR", domains: ["AI/ML", "Web"] },
  { fullName: "Dr. Prakash Menon", designation: "PROFESSOR", domains: ["Cloud & DevOps"] },
  { fullName: "Ms. Renita Monteiro", designation: "ASSISTANT_PROFESSOR", domains: ["AI/ML", "Cybersecurity"] },
  { fullName: "Dr. Sunitha Iyer", designation: "ASSOCIATE_PROFESSOR", domains: ["Data Science"] },
  { fullName: "Mr. Girish Pai", designation: "ASSISTANT_PROFESSOR", domains: ["Web", "IoT"] },
  { fullName: "Dr. Meenakshi Nair", designation: "ASSOCIATE_PROFESSOR", domains: ["AI/ML"] },
  { fullName: "Prof. Harish Gowda", designation: "PROFESSOR", domains: ["Cybersecurity", "Cloud & DevOps"] },
  { fullName: "Ms. Shruthi Acharya", designation: "ASSISTANT_PROFESSOR", domains: ["Data Science", "Web"] },
  { fullName: "Dr. Vinod Murthy", designation: "ASSOCIATE_PROFESSOR", domains: ["IoT"] },
  { fullName: "Mr. Abhishek Jain", designation: "ASSISTANT_PROFESSOR", domains: ["Web"] },
  { fullName: "Dr. Chandrika Rai", designation: "ASSOCIATE_PROFESSOR", domains: ["AI/ML", "Data Science"] },
  { fullName: "Ms. Pooja Kulkarni", designation: "ASSISTANT_PROFESSOR", domains: ["Cybersecurity"] },
  { fullName: "Dr. Suresh Raghavan", designation: "PROFESSOR", domains: ["Cloud & DevOps", "Web"] },
  { fullName: "Mr. Manoj Shenoy", designation: "ASSISTANT_PROFESSOR", domains: ["IoT", "AI/ML"] },
  { fullName: "Dr. Bhavya Reddy", designation: "ASSOCIATE_PROFESSOR", domains: ["Data Science"] },
  { fullName: "Ms. Anitha Verma", designation: "ASSISTANT_PROFESSOR", domains: ["Web", "Cloud & DevOps"] },
  { fullName: "Dr. Kartik Joshi", designation: "ASSOCIATE_PROFESSOR", domains: ["AI/ML"] },
  { fullName: "Mr. Rajesh Naik", designation: "ASSISTANT_PROFESSOR", domains: ["Cybersecurity", "IoT"] },
  { fullName: "Dr. Latha Srinivasan", designation: "PROFESSOR", domains: ["Data Science", "AI/ML"] },
  { fullName: "Ms. Divya Chandra", designation: "ASSISTANT_PROFESSOR", domains: ["Web"] },
  { fullName: "Dr. Mohan Kumar", designation: "ASSOCIATE_PROFESSOR", domains: ["Cloud & DevOps"] },
  { fullName: "Mr. Sandeep Patel", designation: "ASSISTANT_PROFESSOR", domains: ["IoT"] },
  { fullName: "Dr. Nandini Sharma", designation: "ASSOCIATE_PROFESSOR", domains: ["AI/ML", "Web"] },
  { fullName: "Ms. Rekha Gupta", designation: "ASSISTANT_PROFESSOR", domains: ["Cybersecurity", "Data Science"] },
  { fullName: "Dr. Arvind Hegde", designation: "PROFESSOR", domains: ["AI/ML"] },
  { fullName: "Mr. Prashanth Rao", designation: "ASSISTANT_PROFESSOR", domains: ["Cloud & DevOps", "IoT"] },
  { fullName: "Dr. Vandana Bhat", designation: "ASSOCIATE_PROFESSOR", domains: ["Web", "Data Science"] },
  { fullName: "Ms. Swetha Prasad", designation: "ASSISTANT_PROFESSOR", domains: ["AI/ML"] },
  { fullName: "Dr. Ganesh Kamath", designation: "ASSOCIATE_PROFESSOR", domains: ["Cybersecurity"] },
  { fullName: "Mr. Vikram Singh", designation: "ASSISTANT_PROFESSOR", domains: ["IoT", "Web"] },
  { fullName: "Dr. Asha Menon", designation: "PROFESSOR", domains: ["Data Science", "Cloud & DevOps"] },
];

export const VENUES = [
  "Seminar Hall 1",
  "Seminar Hall 2",
  "Lab 3",
  "Lab 5",
  "CSE Conference Room",
  "Project Lab A",
];
