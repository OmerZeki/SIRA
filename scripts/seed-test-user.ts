import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

async function seedTestUser() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("🔄 Creating test agency...");
    const agency = await prisma.agency.upsert({
      where: { email: "test@agency.com" },
      update: {},
      create: {
        name: "Test Agency",
        email: "test@agency.com",
        phone: "+251911111111",
        plan: "PRO",
        isActive: true,
        candidateLimit: 500,
        usersLimit: 10,
      },
    });

    console.log("✓ Agency created/updated:", agency.id);

    const hashedPassword = await bcrypt.hash("password123", 10);

    console.log("🔄 Creating test user...");
    const user = await prisma.user.upsert({
      where: { email: "agent@test.com" },
      update: {
        passwordHash: hashedPassword,
        isActive: true,
      },
      create: {
        agencyId: agency.id,
        email: "agent@test.com",
        name: "Test Agent",
        passwordHash: hashedPassword,
        role: "AGENT",
        isActive: true,
      },
    });

    console.log("\n✅ Test Data Successfully Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Email: agent@test.com");
    console.log("  Password: password123");
    console.log("  Role: AGENT");
    console.log("  Agency: Test Agency");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedTestUser();
