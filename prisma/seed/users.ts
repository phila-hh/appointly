/**
 * @file Seed users — localized  names.
 *
 * Creates:
 *   - 2 admins
 *   - 3 DEMO business owners  (owners of the 3 heavily-seeded businesses)
 *   - 52 regular business owners
 *   - 3 DEMO customers
 *   - 107 regular customers
 *
 * Total: 167 users
 */

import { getPrisma } from "./helpers";
import { hash } from "bcryptjs";

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SeededUsers {
  admins: SeedUser[];
  demoOwners: SeedUser[];
  regularOwners: SeedUser[];
  demoCustomers: SeedUser[];
  regularCustomers: SeedUser[];
  allOwners: SeedUser[];
  allCustomers: SeedUser[];
}

export async function seedUsers(): Promise<SeededUsers> {
  const prisma = getPrisma();
  console.log("👤 Creating users...");

  const pw = await hash("password123", 10);
  const now = new Date();

  const mkUser = async (data: {
    name: string;
    email: string;
    phone: string;
    role: "ADMIN" | "BUSINESS_OWNER" | "CUSTOMER";
    emailPreferences?: object;
  }) =>
    prisma.user.create({
      data: {
        ...data,
        password: pw,
        emailVerified: now,
        emailPreferences: data.emailPreferences ?? {
          bookingReminders: true,
          reviewRequests: true,
          marketingEmails: false,
        },
      },
    });

  // ── Admins ──────────────────────────────────────────────────────────────
  const admins = await Promise.all([
    mkUser({ name: "Gebremedhin Hagos",  email: "admin.gebremedhin@gmail.com", phone: "+251-914-000001", role: "ADMIN" }),
    mkUser({ name: "Nigisti Berhe",      email: "admin.nigisti@gmail.com",     phone: "+251-914-000002", role: "ADMIN" }),
  ]);

  // ── Demo business owners (3) ─────────────────────────────────────────────
  const demoOwners = await Promise.all([
    mkUser({ name: "Tekleab Kahsay",     email: "tekleab.kahsay@gmail.com",    phone: "+251-914-100001", role: "BUSINESS_OWNER", emailPreferences: { bookingReminders: true, reviewRequests: true, marketingEmails: true } }),
    mkUser({ name: "Abrehet Weldu",      email: "abrehet.weldu@gmail.com",     phone: "+251-914-100002", role: "BUSINESS_OWNER", emailPreferences: { bookingReminders: true, reviewRequests: true, marketingEmails: true } }),
    mkUser({ name: "Mehari Gebrehiwet",  email: "mehari.gebrehiwet@gmail.com", phone: "+251-914-100003", role: "BUSINESS_OWNER", emailPreferences: { bookingReminders: true, reviewRequests: true, marketingEmails: true } }),
  ]);

  // ── Regular business owners (52) ─────────────────────────────────────────
  const regularOwnerData = [
    { name: "Hagos Tsegay",            email: "hagos.tsegay@gmail.com",           phone: "+251-914-200001" },
    { name: "Berhane Abrha",           email: "berhane.abrha@gmail.com",          phone: "+251-914-200002" },
    { name: "Kidane Gebremariam",      email: "kidane.gebremariam@gmail.com",     phone: "+251-914-200003" },
    { name: "Fissehaye Desta",         email: "fissehaye.desta@gmail.com",        phone: "+251-914-200004" },
    { name: "Tsegay Weldu",            email: "tsegay.weldu@gmail.com",           phone: "+251-914-200005" },
    { name: "Gidey Hailu",             email: "gidey.hailu@gmail.com",            phone: "+251-914-200006" },
    { name: "Ataklti Tesfay",          email: "ataklti.tesfay@gmail.com",         phone: "+251-914-200007" },
    { name: "Zenebe Kahsay",           email: "zenebe.kahsay@gmail.com",          phone: "+251-914-200008" },
    { name: "Mulu Berhe",              email: "mulu.berhe@gmail.com",             phone: "+251-914-200009" },
    { name: "Letay Gebrehiwet",        email: "letay.gebrehiwet@gmail.com",       phone: "+251-914-200010" },
    { name: "Gebreselassie Abrha",     email: "gebreselassie.abrha@gmail.com",    phone: "+251-914-200011" },
    { name: "Amanuel Hagos",           email: "amanuel.hagos.owner@gmail.com",    phone: "+251-914-200012" },
    { name: "Yohannes Kidane",         email: "yohannes.kidane.owner@gmail.com",  phone: "+251-914-200013" },
    { name: "Goitom Tsegay",           email: "goitom.tsegay@gmail.com",          phone: "+251-914-200014" },
    { name: "Hadush Gebremariam",      email: "hadush.gebremariam@gmail.com",     phone: "+251-914-200015" },
    { name: "Tesfay Gebremichael",     email: "tesfay.gebremichael@gmail.com",    phone: "+251-914-200016" },
    { name: "Bereket Hailu",           email: "bereket.hailu.owner@gmail.com",    phone: "+251-914-200017" },
    { name: "Gebremedhin Desta",       email: "gebremedhin.desta@gmail.com",      phone: "+251-914-200018" },
    { name: "Alem Weldu",              email: "alem.weldu@gmail.com",             phone: "+251-914-200019" },
    { name: "Kahsay Gebreyesus",       email: "kahsay.gebreyesus@gmail.com",     phone: "+251-914-200020" },
    { name: "Tekle Abrha",             email: "tekle.abrha@gmail.com",            phone: "+251-914-200021" },
    { name: "Haile Tsegay",            email: "haile.tsegay@gmail.com",           phone: "+251-914-200022" },
    { name: "Gebrehiwet Berhe",        email: "gebrehiwet.berhe@gmail.com",       phone: "+251-914-200023" },
    { name: "Asgedom Kahsay",          email: "asgedom.kahsay@gmail.com",         phone: "+251-914-200024" },
    { name: "Fitsum Hagos",            email: "fitsum.hagos@gmail.com",           phone: "+251-914-200025" },
    { name: "Niguse Kidane",           email: "niguse.kidane@gmail.com",          phone: "+251-914-200026" },
    { name: "Weldemariam Tesfay",      email: "weldemariam.tesfay@gmail.com",     phone: "+251-914-200027" },
    { name: "Araya Desta",             email: "araya.desta@gmail.com",            phone: "+251-914-200028" },
    { name: "Gebremeskel Hailu",       email: "gebremeskel.hailu@gmail.com",      phone: "+251-914-200029" },
    { name: "Tadesse Weldu",           email: "tadesse.weldu@gmail.com",          phone: "+251-914-200030" },
    { name: "Desta Gebremariam",       email: "desta.gebremariam@gmail.com",      phone: "+251-914-200031" },
    { name: "Seyoum Abrha",            email: "seyoum.abrha@gmail.com",          phone: "+251-914-200032" },
    { name: "Fikadu Tsegay",           email: "fikadu.tsegay@gmail.com",          phone: "+251-914-200033" },
    { name: "Halefom Berhe",           email: "halefom.berhe@gmail.com",          phone: "+251-914-200034" },
    { name: "Kiros Gebrehiwet",        email: "kiros.gebrehiwet@gmail.com",       phone: "+251-914-200035" },
    { name: "Aregawi Kahsay",          email: "aregawi.kahsay@gmail.com",         phone: "+251-914-200036" },
    { name: "Gebreab Hagos",           email: "gebreab.hagos@gmail.com",          phone: "+251-914-200037" },
    { name: "Woldegebriel Tesfay",     email: "woldegebriel.tesfay@gmail.com",    phone: "+251-914-200038" },
    { name: "Birhane Desta",           email: "birhane.desta@gmail.com",          phone: "+251-914-200039" },
    { name: "Gebretsadik Hailu",       email: "gebretsadik.hailu@gmail.com",      phone: "+251-914-200040" },
    { name: "Teklehaimanot Weldu",     email: "teklehaimanot.weldu@gmail.com",    phone: "+251-914-200041" },
    { name: "Abraha Gebremariam",      email: "abraha.gebremariam@gmail.com",     phone: "+251-914-200042" },
    { name: "Sibhat Berhe",            email: "sibhat.berhe@gmail.com",           phone: "+251-914-200043" },
    { name: "Gebrekidan Tsegay",       email: "gebrekidan.tsegay@gmail.com",      phone: "+251-914-200044" },
    { name: "Russom Abrha",            email: "russom.abrha@gmail.com",           phone: "+251-914-200045" },
    { name: "Embaye Kahsay",           email: "embaye.kahsay@gmail.com",          phone: "+251-914-200046" },
    { name: "Gebregiorgis Hagos",      email: "gebregiorgis.hagos@gmail.com",     phone: "+251-914-200047" },
    { name: "Alganesh Kidane",         email: "alganesh.kidane@gmail.com",        phone: "+251-914-200048" },
    { name: "Tesfalem Tesfay",         email: "tesfalem.tesfay@gmail.com",        phone: "+251-914-200049" },
    { name: "Gebreyohannes Desta",     email: "gebreyohannes.desta@gmail.com",    phone: "+251-914-200050" },
    { name: "Kibreab Hailu",           email: "kibreab.hailu@gmail.com",          phone: "+251-914-200051" },
    { name: "Mesfin Weldu",            email: "mesfin.weldu@gmail.com",           phone: "+251-914-200052" },
  ];

  const regularOwners: SeedUser[] = [];
  for (const d of regularOwnerData) {
    const u = await mkUser({ ...d, role: "BUSINESS_OWNER" });
    regularOwners.push({ id: u.id, name: u.name!, email: u.email, role: u.role });
  }

  // ── Demo customers (3) ────────────────────────────────────────────────────
  const demoCustomers = await Promise.all([
    mkUser({ name: "Bereket Gebremedhin",  email: "bereket.gebremedhin@gmail.com",  phone: "+251-914-300001", role: "CUSTOMER", emailPreferences: { bookingReminders: true, reviewRequests: true, marketingEmails: true } }),
    mkUser({ name: "Semhar Tekleab",       email: "semhar.tekleab@gmail.com",       phone: "+251-914-300002", role: "CUSTOMER", emailPreferences: { bookingReminders: true, reviewRequests: true, marketingEmails: false } }),
    mkUser({ name: "Yonas Hagos",          email: "yonas.hagos@gmail.com",          phone: "+251-914-300003", role: "CUSTOMER", emailPreferences: { bookingReminders: false, reviewRequests: true, marketingEmails: false } }),
  ]);

  // ── Regular customers (107) ────────────────────────────────────────────────
  const regularCustomerData = [
    { name: "Abrham Tsegay",           email: "abrham.tsegay@gmail.com",           phone: "+251-914-400001" },
    { name: "Rahwa Berhe",             email: "rahwa.berhe@gmail.com",             phone: "+251-914-400002" },
    { name: "Gebrehiwet Abrha",        email: "gebrehiwet.abrha@gmail.com",        phone: "+251-914-400003" },
    { name: "Tirhas Kahsay",           email: "tirhas.kahsay@gmail.com",           phone: "+251-914-400004" },
    { name: "Hagos Gebremariam",       email: "hagos.gebremariam@gmail.com",       phone: "+251-914-400005" },
    { name: "Lemlem Desta",            email: "lemlem.desta@gmail.com",            phone: "+251-914-400006" },
    { name: "Tesfay Hailu",            email: "tesfay.hailu.cust@gmail.com",       phone: "+251-914-400007" },
    { name: "Freweini Weldu",          email: "freweini.weldu@gmail.com",          phone: "+251-914-400008" },
    { name: "Kidane Tsegay",           email: "kidane.tsegay.cust@gmail.com",      phone: "+251-914-400009" },
    { name: "Letekidan Berhe",         email: "letekidan.berhe@gmail.com",         phone: "+251-914-400010" },
    { name: "Berhane Gebrehiwet",      email: "berhane.gebrehiwet@gmail.com",      phone: "+251-914-400011" },
    { name: "Medhin Abrha",            email: "medhin.abrha@gmail.com",            phone: "+251-914-400012" },
    { name: "Tsegay Kahsay",           email: "tsegay.kahsay.cust@gmail.com",      phone: "+251-914-400013" },
    { name: "Rigat Gebremariam",       email: "rigat.gebremariam@gmail.com",       phone: "+251-914-400014" },
    { name: "Gebremedhin Hailu",       email: "gebremedhin.hailu.cust@gmail.com",  phone: "+251-914-400015" },
    { name: "Almaz Weldu",             email: "almaz.weldu@gmail.com",             phone: "+251-914-400016" },
    { name: "Liwam Desta",             email: "liwam.desta@gmail.com",             phone: "+251-914-400017" },
    { name: "Yemane Tsegay",           email: "yemane.tsegay@gmail.com",           phone: "+251-914-400018" },
    { name: "Sennait Berhe",           email: "sennait.berhe@gmail.com",           phone: "+251-914-400019" },
    { name: "Hadush Abrha",            email: "hadush.abrha.cust@gmail.com",       phone: "+251-914-400020" },
    { name: "Letay Kahsay",            email: "letay.kahsay.cust@gmail.com",       phone: "+251-914-400021" },
    { name: "Goitom Gebrehiwet",       email: "goitom.gebrehiwet.cust@gmail.com",  phone: "+251-914-400022" },
    { name: "Mihret Gebremariam",      email: "mihret.gebremariam@gmail.com",      phone: "+251-914-400023" },
    { name: "Fissehaye Hailu",         email: "fissehaye.hailu.cust@gmail.com",    phone: "+251-914-400024" },
    { name: "Azeb Weldu",              email: "azeb.weldu@gmail.com",              phone: "+251-914-400025" },
    { name: "Gebreab Desta",           email: "gebreab.desta.cust@gmail.com",      phone: "+251-914-400026" },
    { name: "Abrehet Tsegay",          email: "abrehet.tsegay.cust@gmail.com",     phone: "+251-914-400027" },
    { name: "Mulu Berhe",              email: "mulu.berhe.cust@gmail.com",         phone: "+251-914-400028" },
    { name: "Ataklti Abrha",           email: "ataklti.abrha.cust@gmail.com",      phone: "+251-914-400029" },
    { name: "Zenebe Kahsay",           email: "zenebe.kahsay.cust@gmail.com",      phone: "+251-914-400030" },
    { name: "Gebreselassie Gebrehiwet",email: "gebreselassie.gebrehiwet@gmail.com",phone: "+251-914-400031" },
    { name: "Nigisti Gebremariam",     email: "nigisti.gebremariam.cust@gmail.com", phone: "+251-914-400032" },
    { name: "Weldegebriel Hailu",      email: "weldegebriel.hailu@gmail.com",      phone: "+251-914-400033" },
    { name: "Tekle Weldu",             email: "tekle.weldu.cust@gmail.com",        phone: "+251-914-400034" },
    { name: "Birhane Desta",           email: "birhane.desta.cust@gmail.com",      phone: "+251-914-400035" },
    { name: "Haile Tsegay",            email: "haile.tsegay.cust@gmail.com",       phone: "+251-914-400036" },
    { name: "Asgedom Berhe",           email: "asgedom.berhe@gmail.com",           phone: "+251-914-400037" },
    { name: "Kahsay Abrha",            email: "kahsay.abrha.cust@gmail.com",       phone: "+251-914-400038" },
    { name: "Fitsum Gebrehiwet",       email: "fitsum.gebrehiwet@gmail.com",       phone: "+251-914-400039" },
    { name: "Araya Gebremariam",       email: "araya.gebremariam@gmail.com",       phone: "+251-914-400040" },
    { name: "Gebremeskel Kahsay",      email: "gebremeskel.kahsay@gmail.com",      phone: "+251-914-400041" },
    { name: "Seyoum Hailu",            email: "seyoum.hailu@gmail.com",            phone: "+251-914-400042" },
    { name: "Kiros Weldu",             email: "kiros.weldu@gmail.com",             phone: "+251-914-400043" },
    { name: "Aregawi Desta",           email: "aregawi.desta@gmail.com",           phone: "+251-914-400044" },
    { name: "Halefom Tsegay",          email: "halefom.tsegay@gmail.com",          phone: "+251-914-400045" },
    { name: "Gebretsadik Berhe",       email: "gebretsadik.berhe@gmail.com",       phone: "+251-914-400046" },
    { name: "Abraha Abrha",            email: "abraha.abrha.cust@gmail.com",       phone: "+251-914-400047" },
    { name: "Sibhat Kahsay",           email: "sibhat.kahsay@gmail.com",           phone: "+251-914-400048" },
    { name: "Gebrekidan Gebrehiwet",   email: "gebrekidan.gebrehiwet@gmail.com",   phone: "+251-914-400049" },
    { name: "Russom Gebremariam",      email: "russom.gebremariam@gmail.com",      phone: "+251-914-400050" },
    { name: "Embaye Hailu",            email: "embaye.hailu@gmail.com",            phone: "+251-914-400051" },
    { name: "Kibreab Weldu",           email: "kibreab.weldu@gmail.com",           phone: "+251-914-400052" },
    { name: "Tesfalem Desta",          email: "tesfalem.desta@gmail.com",          phone: "+251-914-400053" },
    { name: "Gebreyohannes Tsegay",    email: "gebreyohannes.tsegay@gmail.com",    phone: "+251-914-400054" },
    { name: "Niguse Berhe",            email: "niguse.berhe.cust@gmail.com",       phone: "+251-914-400055" },
    { name: "Teklehaimanot Abrha",     email: "teklehaimanot.abrha@gmail.com",     phone: "+251-914-400056" },
    { name: "Gebregiorgis Kahsay",     email: "gebregiorgis.kahsay.cust@gmail.com",phone: "+251-914-400057" },
    { name: "Alganesh Gebrehiwet",     email: "alganesh.gebrehiwet.cust@gmail.com",phone: "+251-914-400058" },
    { name: "Mesfin Gebremariam",      email: "mesfin.gebremariam@gmail.com",      phone: "+251-914-400059" },
    { name: "Weldemariam Hailu",       email: "weldemariam.hailu.cust@gmail.com",  phone: "+251-914-400060" },
    { name: "Isaias Weldu",            email: "isaias.weldu@gmail.com",            phone: "+251-914-400061" },
    { name: "Yordanos Desta",          email: "yordanos.desta@gmail.com",          phone: "+251-914-400062" },
    { name: "Samson Tsegay",           email: "samson.tsegay@gmail.com",           phone: "+251-914-400063" },
    { name: "Elsa Berhe",              email: "elsa.berhe@gmail.com",              phone: "+251-914-400064" },
    { name: "Dawit Abrha",             email: "dawit.abrha.cust@gmail.com",        phone: "+251-914-400065" },
    { name: "Hiwet Kahsay",            email: "hiwet.kahsay@gmail.com",            phone: "+251-914-400066" },
    { name: "Filmon Gebrehiwet",       email: "filmon.gebrehiwet@gmail.com",       phone: "+251-914-400067" },
    { name: "Eden Gebremariam",        email: "eden.gebremariam@gmail.com",        phone: "+251-914-400068" },
    { name: "Biniam Hailu",            email: "biniam.hailu.cust@gmail.com",       phone: "+251-914-400069" },
    { name: "Selam Weldu",             email: "selam.weldu@gmail.com",             phone: "+251-914-400070" },
    { name: "Abel Desta",              email: "abel.desta@gmail.com",              phone: "+251-914-400071" },
    { name: "Tsehay Tsegay",           email: "tsehay.tsegay@gmail.com",           phone: "+251-914-400072" },
    { name: "Robel Berhe",             email: "robel.berhe@gmail.com",             phone: "+251-914-400073" },
    { name: "Saron Abrha",             email: "saron.abrha@gmail.com",             phone: "+251-914-400074" },
    { name: "Henok Kahsay",            email: "henok.kahsay@gmail.com",            phone: "+251-914-400075" },
    { name: "Ruth Gebrehiwet",         email: "ruth.gebrehiwet@gmail.com",         phone: "+251-914-400076" },
    { name: "Nahom Gebremariam",       email: "nahom.gebremariam@gmail.com",       phone: "+251-914-400077" },
    { name: "Bethlehem Hailu",          email: "bethlehem.hailu@gmail.com",         phone: "+251-914-400078" },
    { name: "Solomon Weldu",           email: "solomon.weldu@gmail.com",           phone: "+251-914-400079" },
    { name: "Mahlet Desta",            email: "mahlet.desta@gmail.com",            phone: "+251-914-400080" },
    { name: "Ermias Tsegay",           email: "ermias.tsegay@gmail.com",           phone: "+251-914-400081" },
    { name: "Hanna Berhe",             email: "hanna.berhe@gmail.com",             phone: "+251-914-400082" },
    { name: "Kirubel Abrha",           email: "kirubel.abrha@gmail.com",           phone: "+251-914-400083" },
    { name: "Mekdes Kahsay",           email: "mekdes.kahsay@gmail.com",           phone: "+251-914-400084" },
    { name: "Samuel Gebrehiwet",       email: "samuel.gebrehiwet@gmail.com",       phone: "+251-914-400085" },
    { name: "Sara Gebremariam",        email: "sara.gebremariam@gmail.com",        phone: "+251-914-400086" },
    { name: "Daniel Hailu",            email: "daniel.hailu.cust@gmail.com",       phone: "+251-914-400087" },
    { name: "Eyerusalem Weldu",        email: "eyerusalem.weldu@gmail.com",        phone: "+251-914-400088" },
    { name: "Yared Desta",             email: "yared.desta@gmail.com",             phone: "+251-914-400089" },
    { name: "Liya Tsegay",             email: "liya.tsegay@gmail.com",             phone: "+251-914-400090" },
    { name: "Natnael Berhe",           email: "natnael.berhe@gmail.com",           phone: "+251-914-400091" },
    { name: "Bezawit Abrha",           email: "bezawit.abrha@gmail.com",           phone: "+251-914-400092" },
    { name: "Kaleb Kahsay",            email: "kaleb.kahsay@gmail.com",            phone: "+251-914-400093" },
    { name: "Tsion Gebrehiwet",        email: "tsion.gebrehiwet@gmail.com",        phone: "+251-914-400094" },
    { name: "Mikael Gebremariam",      email: "mikael.gebremariam@gmail.com",      phone: "+251-914-400095" },
    { name: "Frehiwet Hailu",          email: "frehiwet.hailu@gmail.com",          phone: "+251-914-400096" },
    { name: "Bereket Weldu",           email: "bereket.weldu@gmail.com",           phone: "+251-914-400097" },
    { name: "Meseret Desta",           email: "meseret.desta@gmail.com",           phone: "+251-914-400098" },
    { name: "Kidist Tsegay",           email: "kidist.tsegay@gmail.com",           phone: "+251-914-400099" },
    { name: "Yohannes Berhe",          email: "yohannes.berhe.cust@gmail.com",     phone: "+251-914-400100" },
    { name: "Haimanot Abrha",          email: "haimanot.abrha@gmail.com",          phone: "+251-914-400101" },
    { name: "Ephrem Kahsay",           email: "ephrem.kahsay@gmail.com",           phone: "+251-914-400102" },
    { name: "Tigist Gebrehiwet",       email: "tigist.gebrehiwet@gmail.com",       phone: "+251-914-400103" },
    { name: "Temesgen Gebremariam",    email: "temesgen.gebremariam@gmail.com",    phone: "+251-914-400104" },
    { name: "Amanuel Hailu",           email: "amanuel.hailu.cust@gmail.com",      phone: "+251-914-400105" },
    { name: "Selamawit Weldu",         email: "selamawit.weldu@gmail.com",         phone: "+251-914-400106" },
    { name: "Gebremedhin Berhe",       email: "gebremedhin.berhe.cust@gmail.com",  phone: "+251-914-400107" },
  ];

  const regularCustomers: SeedUser[] = [];
  for (const d of regularCustomerData) {
    const u = await mkUser({ ...d, role: "CUSTOMER" });
    regularCustomers.push({ id: u.id, name: u.name!, email: u.email, role: u.role });
  }

  const toSeedUser = (u: { id: string; name: string | null; email: string; role: string }): SeedUser => ({
    id: u.id, name: u.name ?? "", email: u.email, role: u.role,
  });

  const result: SeededUsers = {
    admins: admins.map(toSeedUser),
    demoOwners: demoOwners.map(toSeedUser),
    regularOwners,
    demoCustomers: demoCustomers.map(toSeedUser),
    regularCustomers,
    allOwners: [...demoOwners.map(toSeedUser), ...regularOwners],
    allCustomers: [...demoCustomers.map(toSeedUser), ...regularCustomers],
  };

  console.log(
    `✅ Created ${admins.length} admins, ${result.allOwners.length} business owners, ${result.allCustomers.length} customers.\n`
  );
  return result;
}
