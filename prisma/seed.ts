import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { error } from "console";
import { Work_Sans } from "next/font/google";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.user.upsert({
        where: { email: "demo@creatorhq.dev" },
        update: {},
        create: {
            email: "demo@creatorhq.dev",
            name: "Demo Creator",
        },
    });
    console.log(`✔ User: ${user.email} (${user.id})`);

    const workspace = await prisma.workspace.upsert({
        where: { slug: "demo-creator" },
        update: {
            slug: "demo-creator",
            name: "Demo Creator",
            currency: "USD",},
        create: {
            slug: "demo-creator",
            name: "Demo Creator",
            currency: "USD",
        },
    });
    console.log(`✔ Workspace: ${workspace.slug} (${workspace.id})`);

    
    const membership = await prisma.membership.upsert({
        where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
        update: {role: "OWNER" },
        create: {
            userId: user.id,
            workspaceId: workspace.id,
            role: "OWNER",
        },
    });
    console.log(`✔ Membership: ${user.email} → ${workspace.slug} as ${membership.role}`);


    const brandData = [
        { 
            name: "Glow Skincare", 
            website: "https://glowskincare.example", 
            notes: "Prefers Reels. Net-30.", 
            contacts: [
                { name: "Maya Chen", email: "maya@glowskincare.example", title: "Influencer Marketing Manager", isPrimary: true },
                { name: "Leo Park", email: "leo@glowskincare.example", title: "Finance" },
            ],
        },
        { 
            name: "Peak Outdoor Co", 
            website: "https://peakoutdoor.example", 
            notes: "Seasonal campaigns, Q2 and Q4.",
            contacts: [
                { name: "Lauren Lopez", email: "lauren@peakoutdoor.example", title: "Influencer Marketing Manager", isPrimary: true },
                { name: "Mike Samuels", email: "mike@peakoutdoor.example", title: "Agent" },
            ],
        },
        { 
            name: "ByteBox Tech", 
            website: "https://bytebox.example", 
            notes: "YouTube integrations only.",
            contacts: [
                { name: "Ronald Beasley", email: "ronald@bytebox.example", title: "Influencer Marketing Manager", isPrimary: true },
                { name: "Matt Richards", email: "matt@bytebox.example", title: "Creative Director" },
            ],
        },
    ];

    const brands = [];

    for (const data of brandData){
        const {name, website, notes, contacts} = data;
        const brand = await prisma.brand.upsert({
            where: { workspaceId_name: { workspaceId: workspace.id, name } },
            update: { website, notes },
            create: { workspaceId: workspace.id, name, website, notes },
        });

        await prisma.contact.deleteMany({ where: { brandId: brand.id } });
        await prisma.contact.createMany({
            data: contacts.map((contact) => ({ ...contact, brandId: brand.id})),
        });
        brands.push(brand);
        console.log(`✔ Brand: ${brand.name}`);
    }
   

}

main()
    .catch((error) => {
        console.error("Seed failed", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });