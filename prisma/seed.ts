import "dotenv/config";
import { prisma } from "../src/lib/db";
import { auth } from "../src/lib/auth";
import type { Brand } from "../src/generated/prisma/client";

async function main() {
  const DEMO_EMAIL = "demo@creatorhq.dev";
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error("DEMO_PASSWORD is not set in .env");
  }

  // User: create through Better Auth so the password is hashed and an Account row exists
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });
  if (!existingUser) {
    await auth.api.signUpEmail({
      body: { email: DEMO_EMAIL, password: demoPassword, name: "Demo Creator" },
    });
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_EMAIL },
  });
  console.log(`✔ User: ${user.email} (${user.id})`);

  // Workspace: the sign-up hook already created one, so find it and rename it
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, role: "OWNER" },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    throw new Error("Demo user has no workspace. Did the sign-up hook fail?");
  }

  const workspace = await prisma.workspace.update({
    where: { id: membership.workspaceId },
    data: { name: "Demo Creator", slug: "demo-creator", currency: "USD" },
  });
  console.log(
    `✔ Workspace: ${workspace.slug} (${workspace.id}), ${user.email} is ${membership.role}`,
  );

  const brandData = [
    {
      name: "Glow Skincare",
      website: "https://glowskincare.example",
      notes: "Prefers Reels. Net-30.",
      contacts: [
        {
          name: "Maya Chen",
          email: "maya@glowskincare.example",
          title: "Influencer Marketing Manager",
          isPrimary: true,
        },
        {
          name: "Leo Park",
          email: "leo@glowskincare.example",
          title: "Finance",
        },
      ],
    },
    {
      name: "Peak Outdoor Co",
      website: "https://peakoutdoor.example",
      notes: "Seasonal campaigns, Q2 and Q4.",
      contacts: [
        {
          name: "Lauren Lopez",
          email: "lauren@peakoutdoor.example",
          title: "Influencer Marketing Manager",
          isPrimary: true,
        },
        {
          name: "Mike Samuels",
          email: "mike@peakoutdoor.example",
          title: "Agent",
        },
      ],
    },
    {
      name: "ByteBox Tech",
      website: "https://bytebox.example",
      notes: "YouTube integrations only.",
      contacts: [
        {
          name: "Ronald Beasley",
          email: "ronald@bytebox.example",
          title: "Influencer Marketing Manager",
          isPrimary: true,
        },
        {
          name: "Matt Richards",
          email: "matt@bytebox.example",
          title: "Creative Director",
        },
      ],
    },
  ];

  const brands: Brand[] = [];

  for (const data of brandData) {
    const { name, website, notes, contacts } = data;
    const brand = await prisma.brand.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name } },
      update: { website, notes },
      create: { workspaceId: workspace.id, name, website, notes },
    });

    await prisma.contact.deleteMany({ where: { brandId: brand.id } });
    await prisma.contact.createMany({
      data: contacts.map((contact) => ({ ...contact, brandId: brand.id })),
    });
    brands.push(brand);
    console.log(`✔ Brand: ${brand.name}`);
  }

  // Invoices block campaign deletion, so clear them first (payments cascade)
  await prisma.invoice.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.campaign.deleteMany({ where: { workspaceId: workspace.id } });

  const brandByName = (name: string) => {
    const brand = brands.find((b) => b.name === name);
    if (!brand) throw new Error(`Seed: brand "${name}" not found`);
    return brand;
  };

  const daysFromNow = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const inProduction = await prisma.campaign.create({
    data: {
      title: "Summer Glow Launch",
      status: "IN_PRODUCTION",
      feeCents: 250000,
      startDate: daysFromNow(-10),
      endDate: daysFromNow(20),
      workspaceId: workspace.id,
      brandId: brandByName("Glow Skincare").id,
      deliverables: {
        create: [
          {
            type: "REEL",
            platform: "INSTAGRAM",
            status: "SUBMITTED",
            dueDate: daysFromNow(5),
            revisionCount: 1,
          },
          {
            type: "STORY",
            platform: "INSTAGRAM",
            status: "IN_PROGRESS",
            dueDate: daysFromNow(7),
          },
          {
            type: "STORY",
            platform: "INSTAGRAM",
            status: "NOT_STARTED",
            dueDate: daysFromNow(7),
          },
        ],
      },
    },
  });
  console.log(`✔ Campaign: ${inProduction.title} (${inProduction.status})`);

  const lead = await prisma.campaign.create({
    data: {
      title: "Spring Laptop Launch Inquiry",
      status: "LEAD",
      feeCents: null,
      workspaceId: workspace.id,
      brandId: brandByName("ByteBox Tech").id,
      deliverables: {
        create: [
          { type: "INTEGRATION", platform: "YOUTUBE", status: "NOT_STARTED" },
        ],
      },
    },
  });

  console.log(`✔ Campaign: ${lead.title} (${lead.status})`);

  const negotiating = await prisma.campaign.create({
    data: {
      title: "Fall Trail Gear Series",
      status: "NEGOTIATING",
      feeCents: 350000, // $3,500 proposed; may change
      startDate: daysFromNow(14),
      endDate: daysFromNow(45),
      workspaceId: workspace.id,
      brandId: brandByName("Peak Outdoor Co").id,
      deliverables: {
        create: [
          { type: "REEL", platform: "INSTAGRAM", status: "NOT_STARTED" },
          { type: "VIDEO", platform: "TIKTOK", status: "NOT_STARTED" },
        ],
      },
    },
  });

  console.log(`✔ Campaign: ${negotiating.title} (${negotiating.status})`);

  const contracted = await prisma.campaign.create({
    data: {
      title: "ByteBox Pro Laptop Review",
      status: "CONTRACTED",
      feeCents: 500000, // $5,000
      startDate: daysFromNow(3),
      endDate: daysFromNow(30),
      workspaceId: workspace.id,
      brandId: brandByName("ByteBox Tech").id,
      deliverables: {
        create: [
          {
            type: "INTEGRATION",
            platform: "YOUTUBE",
            status: "NOT_STARTED",
            dueDate: daysFromNow(21),
          },
        ],
      },
    },
  });
  console.log(`✔ Campaign: ${contracted.title} (${contracted.status})`);

  const posted = await prisma.campaign.create({
    data: {
      title: "Summer Camping Essentials",
      status: "POSTED",
      feeCents: 280000, // $2,800
      startDate: daysFromNow(-30),
      endDate: daysFromNow(-1),
      workspaceId: workspace.id,
      brandId: brandByName("Peak Outdoor Co").id,
      deliverables: {
        create: [
          {
            type: "VIDEO",
            platform: "YOUTUBE",
            status: "POSTED",
            dueDate: daysFromNow(-5),
            postedAt: daysFromNow(-6),
            liveUrl: "https://youtube.example/watch/camping-essentials",
          },
          {
            type: "REEL",
            platform: "INSTAGRAM",
            status: "POSTED",
            dueDate: daysFromNow(-3),
            postedAt: daysFromNow(-2), // posted a day late
            liveUrl: "https://instagram.example/reel/camping-essentials",
            revisionCount: 2,
          },
        ],
      },
    },
  });
  console.log(`✔ Campaign: ${posted.title} (${posted.status})`);

  const paid = await prisma.campaign.create({
    data: {
      title: "Spring Hydration Routine",
      status: "PAID",
      feeCents: 180000, // $1,800
      startDate: daysFromNow(-75),
      endDate: daysFromNow(-45),
      workspaceId: workspace.id,
      brandId: brandByName("Glow Skincare").id,
      deliverables: {
        create: [
          {
            type: "REEL",
            platform: "INSTAGRAM",
            status: "POSTED",
            dueDate: daysFromNow(-55),
            postedAt: daysFromNow(-56),
            liveUrl: "https://instagram.example/reel/spring-hydration",
          },
          {
            type: "STORY",
            platform: "INSTAGRAM",
            status: "POSTED",
            dueDate: daysFromNow(-55),
            postedAt: daysFromNow(-55),
            liveUrl: "https://instagram.example/stories/spring-hydration",
          },
        ],
      },
    },
  });
  console.log(`✔ Campaign: ${paid.title} (${paid.status})`);

  // Invoices: numbers are handed out from the workspace counter, like sendInvoice does
  let nextNumber = 1;
  const invoice = async (
    campaign: { id: string; title: string; feeCents: number | null },
    {
      status,
      issuedDaysAgo,
      payments = [],
    }: {
      status: "DRAFT" | "SENT" | "PAID";
      issuedDaysAgo: number;
      payments?: { amountCents: number; paidDaysAgo: number }[];
    },
  ) => {
    const amount = campaign.feeCents ?? 0;
    const issueDate = daysFromNow(-issuedDaysAgo);
    const created = await prisma.invoice.create({
      data: {
        workspaceId: workspace.id,
        campaignId: campaign.id,
        status,
        number: status === "DRAFT" ? null : nextNumber++,
        sentAt: status === "DRAFT" ? null : issueDate,
        currency: workspace.currency,
        issueDate,
        dueDate: daysFromNow(-issuedDaysAgo + 30),
        totalCents: amount,
        lineItems: {
          create: [
            {
              description: campaign.title,
              quantity: 1,
              unitAmountCents: amount,
              position: 0,
            },
          ],
        },
        payments: {
          create: payments.map((p) => ({
            amountCents: p.amountCents,
            paidOn: daysFromNow(-p.paidDaysAgo),
            method: "BANK_TRANSFER" as const,
          })),
        },
      },
    });
    console.log(
      `✔ Invoice: ${created.number ?? "draft"} for ${campaign.title} (${status})`,
    );
  };

  await invoice(paid, {
    status: "PAID",
    issuedDaysAgo: 50,
    payments: [{ amountCents: paid.feeCents ?? 0, paidDaysAgo: 35 }],
  });
  // Issued 40 days ago on net-30, so it shows as overdue
  await invoice(posted, { status: "SENT", issuedDaysAgo: 40 });
  // Sending an invoice moves its campaign to INVOICED in the app; mirror that here
  await prisma.campaign.update({
    where: { id: posted.id },
    data: { status: "INVOICED" },
  });
  await invoice(contracted, { status: "DRAFT", issuedDaysAgo: 0 });

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { nextInvoiceNumber: nextNumber },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
