import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { User } from "../models/User";
import { Workshop } from "../models/Workshop";
import { Registration } from "../models/Registration";

const DEV_CREDENTIALS = {
  admin: { name: "Admin User", email: "admin@workshop.test", password: "Admin1234!" },
  manager: { name: "Manager User", email: "manager@workshop.test", password: "Manager1234!" },
  staff: { name: "Staff User", email: "staff@workshop.test", password: "Staff1234!" },
} as const;

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the seed script with NODE_ENV=production");
  }

  await connectToDatabase();

  console.log("Wiping existing Users, Workshops, and Registrations...");
  await Promise.all([
    User.deleteMany({}),
    Workshop.deleteMany({}),
    Registration.deleteMany({}),
  ]);

  console.log("Creating seeded users...");
  const [adminHash, managerHash, staffHash] = await Promise.all([
    bcrypt.hash(DEV_CREDENTIALS.admin.password, 10),
    bcrypt.hash(DEV_CREDENTIALS.manager.password, 10),
    bcrypt.hash(DEV_CREDENTIALS.staff.password, 10),
  ]);

  const admin = await User.create({
    name: DEV_CREDENTIALS.admin.name,
    email: DEV_CREDENTIALS.admin.email,
    passwordHash: adminHash,
    role: "admin",
  });

  const manager = await User.create({
    name: DEV_CREDENTIALS.manager.name,
    email: DEV_CREDENTIALS.manager.email,
    passwordHash: managerHash,
    role: "manager",
  });

  const staff = await User.create({
    name: DEV_CREDENTIALS.staff.name,
    email: DEV_CREDENTIALS.staff.email,
    passwordHash: staffHash,
    role: "staff",
  });

  console.log("Creating sample workshops...");

  const introReactHooks = await Workshop.create({
    code: "WS-101",
    title: "Intro to React Hooks",
    instructor: "Alice Fernando",
    dateTime: daysFromNow(-14),
    capacity: 20,
    activeCount: 2,
    status: "completed",
    location: "Room A1",
    description: "A hands-on introduction to React hooks.",
    createdBy: admin._id,
  });

  const advancedTypeScript = await Workshop.create({
    code: "WS-102",
    title: "Advanced TypeScript Patterns",
    instructor: "Bimal Perera",
    dateTime: daysFromNow(2),
    capacity: 5,
    activeCount: 4,
    status: "scheduled",
    location: "Room B2",
    description: "Near-full session covering advanced generics and type patterns.",
    createdBy: admin._id,
  });

  const nodeFundamentals = await Workshop.create({
    code: "WS-103",
    title: "Node.js Fundamentals",
    instructor: "Chamodi Silva",
    dateTime: daysFromNow(4),
    capacity: 3,
    activeCount: 3,
    status: "scheduled",
    location: "Room C3",
    description: "Fully booked session on Node.js fundamentals.",
    createdBy: admin._id,
  });

  await Workshop.create({
    code: "WS-104",
    title: "Cloud Deployment with Docker",
    instructor: "Dinesh Kumar",
    dateTime: daysFromNow(10),
    capacity: 25,
    activeCount: 0,
    status: "scheduled",
    location: "Room D4",
    description: "Future workshop with no registrations yet.",
    createdBy: admin._id,
  });

  const databaseDesign = await Workshop.create({
    code: "WS-105",
    title: "Database Design Workshop",
    instructor: "Esther Wong",
    dateTime: daysFromNow(-30),
    capacity: 12,
    activeCount: 0,
    status: "cancelled",
    location: "Room E5",
    description: "This workshop was cancelled.",
    createdBy: admin._id,
  });

  const uiUxPrinciples = await Workshop.create({
    code: "WS-106",
    title: "UI/UX Design Principles",
    instructor: "Farah Jayasuriya",
    dateTime: daysFromNow(1),
    capacity: 30,
    activeCount: 1,
    status: "scheduled",
    location: "Room F6",
    description: "Happening this week.",
    createdBy: admin._id,
  });

  console.log("Creating sample registrations...");

  await Registration.insertMany([
    // Intro to React Hooks (completed): 2 active, 1 cancelled
    {
      workshopId: introReactHooks._id,
      attendeeName: "Nadia Khan",
      attendeeEmail: "nadia.khan@example.com",
      status: "active",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-20),
    },
    {
      workshopId: introReactHooks._id,
      attendeeName: "Oliver Smith",
      attendeeEmail: "oliver.smith@example.com",
      status: "active",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-19),
    },
    {
      workshopId: introReactHooks._id,
      attendeeName: "Priya Raman",
      attendeeEmail: "priya.raman@example.com",
      status: "cancelled",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-21),
      cancelledBy: manager._id,
      cancelledAt: daysFromNow(-18),
    },

    // Advanced TypeScript Patterns (near-full, capacity 5, activeCount 4): 4 active, 1 cancelled
    {
      workshopId: advancedTypeScript._id,
      attendeeName: "Quinn Walker",
      attendeeEmail: "quinn.walker@example.com",
      status: "active",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-3),
    },
    {
      workshopId: advancedTypeScript._id,
      attendeeName: "Ravi Gunasekara",
      attendeeEmail: "ravi.gunasekara@example.com",
      status: "active",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-3),
    },
    {
      workshopId: advancedTypeScript._id,
      attendeeName: "Sana Malik",
      attendeeEmail: "sana.malik@example.com",
      status: "active",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-2),
    },
    {
      workshopId: advancedTypeScript._id,
      attendeeName: "Tharindu Bandara",
      attendeeEmail: "tharindu.bandara@example.com",
      status: "active",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-1),
    },
    {
      workshopId: advancedTypeScript._id,
      attendeeName: "Uma Devi",
      attendeeEmail: "uma.devi@example.com",
      status: "cancelled",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-4),
      cancelledBy: staff._id,
      cancelledAt: daysFromNow(-2),
    },

    // Node.js Fundamentals (completely full, capacity 3, activeCount 3): 3 active
    {
      workshopId: nodeFundamentals._id,
      attendeeName: "Victor Alvarez",
      attendeeEmail: "victor.alvarez@example.com",
      status: "active",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-1),
    },
    {
      workshopId: nodeFundamentals._id,
      attendeeName: "Wendy Zhao",
      attendeeEmail: "wendy.zhao@example.com",
      status: "active",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-1),
    },
    {
      workshopId: nodeFundamentals._id,
      attendeeName: "Xavier Rodrigo",
      attendeeEmail: "xavier.rodrigo@example.com",
      status: "active",
      registeredBy: manager._id,
      registeredAt: daysFromNow(0),
    },

    // Database Design Workshop (cancelled workshop): 1 cancelled registration
    {
      workshopId: databaseDesign._id,
      attendeeName: "Yasmin Haddad",
      attendeeEmail: "yasmin.haddad@example.com",
      status: "cancelled",
      registeredBy: manager._id,
      registeredAt: daysFromNow(-32),
      cancelledBy: admin._id,
      cancelledAt: daysFromNow(-30),
    },

    // UI/UX Design Principles (this week): 1 active
    {
      workshopId: uiUxPrinciples._id,
      attendeeName: "Zane Mitchell",
      attendeeEmail: "zane.mitchell@example.com",
      status: "active",
      registeredBy: staff._id,
      registeredAt: daysFromNow(-1),
    },
  ]);

  console.log("\nSeed complete. Dev login credentials:\n");
  console.log(`  Admin   -> email: ${DEV_CREDENTIALS.admin.email}   password: ${DEV_CREDENTIALS.admin.password}`);
  console.log(`  Manager -> email: ${DEV_CREDENTIALS.manager.email} password: ${DEV_CREDENTIALS.manager.password}`);
  console.log(`  Staff   -> email: ${DEV_CREDENTIALS.staff.email}   password: ${DEV_CREDENTIALS.staff.password}`);
  console.log("");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
