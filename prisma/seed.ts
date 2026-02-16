import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Party
  const party = await prisma.party.upsert({
    where: { name: "Pakistan Awaam Raaj Tehreek" },
    update: {},
    create: {
      name: "Pakistan Awaam Raaj Tehreek",
      nameUrdu: "پاکستان عوام راج تحریک",
      chairman: "Iqrar Ul Hassan",
      ecpRegistered: true,
      primaryColor: "#E61726",
    },
  });
  console.log(`✅ Party: ${party.name}`);

  // 2. Create Provinces
  const provinces = [
    { name: "Punjab", nameUrdu: "پنجاب", code: "PB" },
    { name: "Sindh", nameUrdu: "سندھ", code: "SD" },
    { name: "Khyber Pakhtunkhwa", nameUrdu: "خیبر پختونخوا", code: "KP" },
    { name: "Balochistan", nameUrdu: "بلوچستان", code: "BA" },
    { name: "Azad Jammu & Kashmir", nameUrdu: "آزاد جموں و کشمیر", code: "AJK" },
    { name: "Gilgit-Baltistan", nameUrdu: "گلگت بلتستان", code: "GB" },
    { name: "Islamabad Capital Territory", nameUrdu: "اسلام آباد", code: "ICT" },
  ];

  for (const p of provinces) {
    await prisma.province.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${provinces.length} provinces created`);

  // 3. Create Districts (major ones with CNIC prefixes)
  const districts = [
    // Punjab
    { name: "Lahore", province: "PB", cnicPrefix: "35202" },
    { name: "Rawalpindi", province: "PB", cnicPrefix: "35101" },
    { name: "Faisalabad", province: "PB", cnicPrefix: "35401" },
    { name: "Multan", province: "PB", cnicPrefix: "35301" },
    { name: "Gujranwala", province: "PB", cnicPrefix: "36101" },
    { name: "Sialkot", province: "PB", cnicPrefix: "36201" },
    { name: "Sargodha", province: "PB", cnicPrefix: "36301" },
    { name: "Bahawalpur", province: "PB", cnicPrefix: "36401" },
    // Sindh
    { name: "Karachi South", province: "SD", cnicPrefix: "42101" },
    { name: "Karachi East", province: "SD", cnicPrefix: "42201" },
    { name: "Karachi Central", province: "SD", cnicPrefix: "42301" },
    { name: "Karachi West", province: "SD", cnicPrefix: "42401" },
    { name: "Hyderabad", province: "SD", cnicPrefix: "41101" },
    { name: "Sukkur", province: "SD", cnicPrefix: "41201" },
    // KPK
    { name: "Peshawar", province: "KP", cnicPrefix: "17101" },
    { name: "Mardan", province: "KP", cnicPrefix: "17201" },
    { name: "Abbottabad", province: "KP", cnicPrefix: "17301" },
    { name: "Swat", province: "KP", cnicPrefix: "17401" },
    // Balochistan
    { name: "Quetta", province: "BA", cnicPrefix: "54101" },
    // ICT
    { name: "Islamabad", province: "ICT", cnicPrefix: "61101" },
    // AJK
    { name: "Muzaffarabad", province: "AJK", cnicPrefix: "82101" },
    // GB
    { name: "Gilgit", province: "GB", cnicPrefix: "71101" },
  ];

  for (const d of districts) {
    const province = await prisma.province.findUnique({ where: { code: d.province } });
    if (province) {
      await prisma.district.upsert({
        where: { name_provinceId: { name: d.name, provinceId: province.id } },
        update: {},
        create: { name: d.name, cnicPrefix: d.cnicPrefix, provinceId: province.id },
      });
    }
  }
  console.log(`✅ ${districts.length} districts created`);

  // 4. Create NA Constituencies (1-266 general seats)
  const naConstituencies: { code: string; name: string }[] = [
    // KPK (NA-1 to NA-45)
    { code: "NA-1", name: "Chitral" }, { code: "NA-2", name: "Dir Upper" },
    { code: "NA-3", name: "Dir Lower" }, { code: "NA-4", name: "Swat-I" },
    { code: "NA-5", name: "Swat-II" }, { code: "NA-6", name: "Shangla" },
    { code: "NA-7", name: "Buner" }, { code: "NA-8", name: "Malakand" },
    { code: "NA-9", name: "Bajour" }, { code: "NA-10", name: "Mohmand" },
    { code: "NA-11", name: "Khyber" }, { code: "NA-12", name: "Orakzai" },
    { code: "NA-13", name: "Kurram" }, { code: "NA-14", name: "North Waziristan" },
    { code: "NA-15", name: "South Waziristan" },
    { code: "NA-16", name: "Peshawar-I" }, { code: "NA-17", name: "Peshawar-II" },
    { code: "NA-18", name: "Peshawar-III" }, { code: "NA-19", name: "Peshawar-IV" },
    { code: "NA-20", name: "Nowshera-I" }, { code: "NA-21", name: "Nowshera-II" },
    { code: "NA-22", name: "Mardan-I" }, { code: "NA-23", name: "Mardan-II" },
    { code: "NA-24", name: "Mardan-III" }, { code: "NA-25", name: "Swabi-I" },
    { code: "NA-26", name: "Swabi-II" }, { code: "NA-27", name: "Charsadda-I" },
    { code: "NA-28", name: "Charsadda-II" }, { code: "NA-29", name: "Kohat" },
    { code: "NA-30", name: "Hangu" }, { code: "NA-31", name: "Bannu-I" },
    { code: "NA-32", name: "Bannu-II" }, { code: "NA-33", name: "Lakki Marwat" },
    { code: "NA-34", name: "D.I.Khan-I" }, { code: "NA-35", name: "D.I.Khan-II" },
    { code: "NA-36", name: "Tank" }, { code: "NA-37", name: "Haripur" },
    { code: "NA-38", name: "Abbottabad-I" }, { code: "NA-39", name: "Abbottabad-II" },
    { code: "NA-40", name: "Mansehra-I" }, { code: "NA-41", name: "Mansehra-II" },
    { code: "NA-42", name: "Battagram" }, { code: "NA-43", name: "Torghar-Kohistan" },
    { code: "NA-44", name: "Upper Kohistan" }, { code: "NA-45", name: "Lower Kohistan" },
    // ICT (NA-46 to NA-48)
    { code: "NA-46", name: "Islamabad-I" }, { code: "NA-47", name: "Islamabad-II" },
    { code: "NA-48", name: "Islamabad-III" },
    // Punjab (NA-49 to NA-196)
    ...Array.from({ length: 148 }, (_, i) => ({
      code: `NA-${49 + i}`,
      name: `Punjab-${i + 1}`,
    })),
    // Sindh (NA-197 to NA-258)
    ...Array.from({ length: 62 }, (_, i) => ({
      code: `NA-${197 + i}`,
      name: `Sindh-${i + 1}`,
    })),
    // Balochistan (NA-259 to NA-266)
    ...Array.from({ length: 8 }, (_, i) => ({
      code: `NA-${259 + i}`,
      name: `Balochistan-${i + 1}`,
    })),
  ];

  for (const c of naConstituencies) {
    await prisma.constituency.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, name: c.name, type: "NA" },
    });
  }
  console.log(`✅ ${naConstituencies.length} NA constituencies created`);

  // 5. Create sample PA constituencies (Punjab PP-1 to PP-20)
  for (let i = 1; i <= 20; i++) {
    await prisma.constituency.upsert({
      where: { code: `PP-${i}` },
      update: {},
      create: { code: `PP-${i}`, name: `Punjab Provincial-${i}`, type: "PP" },
    });
  }
  console.log("✅ 20 sample PP constituencies created");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
