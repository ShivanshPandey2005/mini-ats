import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records
  await prisma.stageHistory.deleteMany({});
  await prisma.candidate.deleteMany({});

  const now = new Date();
  const daysAgo = (days: number, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d;
  };

  const candidateData = [
    {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "+1 (555) 234-5678",
      position: "Frontend Developer",
      resumeLink: "https://example.com/resumes/sarah-chen.pdf",
      notes: "Strong React and TypeScript background. Portfolio has impressive interactive visualizations.",
      stage: "Interview",
      createdAt: daysAgo(14),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(11),
          notes: "Profile matched requirements. Invited for recruiter screening.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(7),
          notes: "Aced phone screen. Scheduled technical interview round with the UI team.",
        },
      ],
    },
    {
      name: "Marcus Johnson",
      email: "marcus.j@example.com",
      phone: "+1 (555) 345-6789",
      position: "Backend Engineer",
      resumeLink: "https://example.com/resumes/marcus-johnson.pdf",
      notes: "Experienced in Go, distributed microservices, and PostgreSQL query optimization.",
      stage: "Hired",
      createdAt: daysAgo(35),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(30),
          notes: "Great background in cloud-native microservices.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(22),
          notes: "Passed recruiter screen. Moving to system design interview.",
        },
        {
          fromStage: "Interview",
          toStage: "Offer",
          changedAt: daysAgo(12),
          notes: "Excellent performance in architecture round. Formal offer extended.",
        },
        {
          fromStage: "Offer",
          toStage: "Hired",
          changedAt: daysAgo(3),
          notes: "Offer accepted! Scheduled to start on the 1st of next month.",
        },
      ],
    },
    {
      name: "Elena Rostova",
      email: "elena.rostova@example.com",
      phone: "+1 (555) 456-7890",
      position: "Product Manager",
      resumeLink: "https://example.com/resumes/elena-rostova.pdf",
      notes: "B2B SaaS product leader with 6+ years leading cross-functional roadmaps and growth experiments.",
      stage: "Offer",
      createdAt: daysAgo(20),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(16),
          notes: "Recruiter screen completed. Impressive metrics on user retention.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(10),
          notes: "Completed product execution and leadership interviews.",
        },
        {
          fromStage: "Interview",
          toStage: "Offer",
          changedAt: daysAgo(2),
          notes: "Executive committee approved competitive offer package.",
        },
      ],
    },
    {
      name: "Amara Patel",
      email: "amara.patel@example.com",
      phone: "+1 (555) 567-8901",
      position: "UX Designer",
      resumeLink: "https://example.com/resumes/amara-patel.pdf",
      notes: "Design systems expert, Figma wizard, and passionate about accessible UI design.",
      stage: "Interview",
      createdAt: daysAgo(12),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(8),
          notes: "Design portfolio review passed with flying colors.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(4),
          notes: "Whiteboard challenge scheduled with the product design team.",
        },
      ],
    },
    {
      name: "David Kim",
      email: "david.kim@example.com",
      phone: "+1 (555) 678-9012",
      position: "DevOps Engineer",
      resumeLink: "https://example.com/resumes/david-kim.pdf",
      notes: "Kubernetes, Terraform, AWS, and CI/CD pipeline automation specialist.",
      stage: "Screening",
      createdAt: daysAgo(5),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(3),
          notes: "Initial phone screening scheduled for this Thursday.",
        },
      ],
    },
    {
      name: "Liam O'Connor",
      email: "liam.oc@example.com",
      phone: "+1 (555) 789-0123",
      position: "Frontend Developer",
      resumeLink: "https://example.com/resumes/liam-oconnor.pdf",
      notes: "Next.js, Tailwind CSS, and Web Vitals performance tuning specialist.",
      stage: "Applied",
      createdAt: daysAgo(2),
      history: [],
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+1 (555) 890-1234",
      position: "Data Analyst",
      resumeLink: "https://example.com/resumes/priya-sharma.pdf",
      notes: "SQL, Python, dbt, and Tableau expert with experience modeling growth analytics.",
      stage: "Interview",
      createdAt: daysAgo(18),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(14),
          notes: "Screened by Data Lead. SQL assessment submitted.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(6),
          notes: "Passed SQL challenge with 100% accuracy. Final case study presentation set.",
        },
      ],
    },
    {
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1 (555) 901-2345",
      position: "Backend Engineer",
      resumeLink: "https://example.com/resumes/james-wilson.pdf",
      notes: "Node.js, GraphQL, and Redis caching. Looking for higher scale challenges.",
      stage: "Rejected",
      createdAt: daysAgo(25),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(22),
          notes: "Introductory call completed.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(17),
          notes: "Technical coding round conducted.",
        },
        {
          fromStage: "Interview",
          toStage: "Rejected",
          changedAt: daysAgo(10),
          notes: "Candidate lacked required depth in concurrency and distributed transactions.",
        },
      ],
    },
    {
      name: "Sofia Rodriguez",
      email: "sofia.r@example.com",
      phone: "+1 (555) 012-3456",
      position: "Full Stack Engineer",
      resumeLink: "https://example.com/resumes/sofia-rodriguez.pdf",
      notes: "Full-stack proficiency in TypeScript, React, Node.js, and Prisma ORM.",
      stage: "Hired",
      createdAt: daysAgo(42),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(36),
          notes: "Phone screen done with HR partner.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(28),
          notes: "Completed full-stack pair programming session.",
        },
        {
          fromStage: "Interview",
          toStage: "Offer",
          changedAt: daysAgo(15),
          notes: "Very positive feedback from all interviewers.",
        },
        {
          fromStage: "Offer",
          toStage: "Hired",
          changedAt: daysAgo(8),
          notes: "Signed offer letter. Equipment shipped.",
        },
      ],
    },
    {
      name: "Tariq Al-Mansoor",
      email: "tariq.m@example.com",
      phone: "+1 (555) 123-4567",
      position: "DevOps Engineer",
      resumeLink: "https://example.com/resumes/tariq-mansoor.pdf",
      notes: "SRE background with strong focus on Prometheus, Grafana, and incident response.",
      stage: "Screening",
      createdAt: daysAgo(4),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(1),
          notes: "Phone screen in progress.",
        },
      ],
    },
    {
      name: "Chloe Dubois",
      email: "chloe.dubois@example.com",
      phone: "+1 (555) 234-8901",
      position: "UX Designer",
      resumeLink: "https://example.com/resumes/chloe-dubois.pdf",
      notes: "Strong user research focus, usability testing facilitator, and design strategist.",
      stage: "Applied",
      createdAt: daysAgo(1),
      history: [],
    },
    {
      name: "Lucas Meyer",
      email: "lucas.meyer@example.com",
      phone: "+1 (555) 345-9012",
      position: "QA Engineer",
      resumeLink: "https://example.com/resumes/lucas-meyer.pdf",
      notes: "Playwright, Cypress, and API automated testing framework architect.",
      stage: "Screening",
      createdAt: daysAgo(9),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(6),
          notes: "Screened for automated testing test suite leadership.",
        },
      ],
    },
    {
      name: "Aisha Kamara",
      email: "aisha.k@example.com",
      phone: "+1 (555) 456-0123",
      position: "Product Manager",
      resumeLink: "https://example.com/resumes/aisha-kamara.pdf",
      notes: "Fintech PM with deep domain expertise in regulatory compliance and payments infrastructure.",
      stage: "Rejected",
      createdAt: daysAgo(19),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(15),
          notes: "Initial review completed.",
        },
        {
          fromStage: "Screening",
          toStage: "Rejected",
          changedAt: daysAgo(13),
          notes: "Position requires enterprise SaaS experience rather than consumer fintech.",
        },
      ],
    },
    {
      name: "Kenji Sato",
      email: "kenji.sato@example.com",
      phone: "+1 (555) 567-1234",
      position: "Mobile Developer",
      resumeLink: "https://example.com/resumes/kenji-sato.pdf",
      notes: "React Native and Swift developer with published apps on App Store and Play Store.",
      stage: "Offer",
      createdAt: daysAgo(26),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(21),
          notes: "Portfolio and code samples reviewed favorably.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(14),
          notes: "Technical mobile architecture interview completed.",
        },
        {
          fromStage: "Interview",
          toStage: "Offer",
          changedAt: daysAgo(4),
          notes: "Offer letter delivered. Awaiting candidate decision.",
        },
      ],
    },
    {
      name: "Hannah Abbott",
      email: "hannah.a@example.com",
      phone: "+1 (555) 678-2345",
      position: "Frontend Developer",
      resumeLink: "https://example.com/resumes/hannah-abbott.pdf",
      notes: "Passionate junior-mid developer with stellar open source contributions.",
      stage: "Applied",
      createdAt: daysAgo(3),
      history: [],
    },
    {
      name: "Carlos Mendoza",
      email: "carlos.m@example.com",
      phone: "+1 (555) 789-3456",
      position: "Backend Engineer",
      resumeLink: "https://example.com/resumes/carlos-mendoza.pdf",
      notes: "Java, Spring Boot, and Kafka event streaming in high-throughput banking systems.",
      stage: "Interview",
      createdAt: daysAgo(15),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(11),
          notes: "HR recruiter screening cleared.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(5),
          notes: "System design session with Principal Architect.",
        },
      ],
    },
    {
      name: "Zoe Taylor",
      email: "zoe.taylor@example.com",
      phone: "+1 (555) 890-4567",
      position: "Data Analyst",
      resumeLink: "https://example.com/resumes/zoe-taylor.pdf",
      notes: "Business intelligence, PowerBI, statistical modeling, and customer segmentation.",
      stage: "Applied",
      createdAt: daysAgo(6),
      history: [],
    },
    {
      name: "Vikram Nambiar",
      email: "vikram.n@example.com",
      phone: "+1 (555) 901-5678",
      position: "Engineering Manager",
      resumeLink: "https://example.com/resumes/vikram-nambiar.pdf",
      notes: "Seasoned engineering leader managed teams of 15+ engineers across three time zones.",
      stage: "Interview",
      createdAt: daysAgo(24),
      history: [
        {
          fromStage: "Applied",
          toStage: "Screening",
          changedAt: daysAgo(19),
          notes: "Screening call with VP of Engineering.",
        },
        {
          fromStage: "Screening",
          toStage: "Interview",
          changedAt: daysAgo(9),
          notes: "Leadership evaluation and panel interview completed.",
        },
      ],
    },
  ];

  for (const item of candidateData) {
    const { history, ...candidateFields } = item;
    const candidate = await prisma.candidate.create({
      data: {
        ...candidateFields,
        stageHistory: {
          create: history.map((h) => ({
            fromStage: h.fromStage,
            toStage: h.toStage,
            notes: h.notes,
            changedAt: h.changedAt,
          })),
        },
      },
    });

    console.log(`Created candidate: ${candidate.name} (${candidate.stage})`);
  }

  console.log(`Successfully seeded ${candidateData.length} candidates!`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
