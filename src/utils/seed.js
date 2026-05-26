require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cold-flyer";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // ── Load models ────────────────────────────────────────────────────
    const User = require("../models/User");
    const Product = require("../models/Product");
    const Service = require("../models/Service");
    const Blog = require("../models/Blog");
    const RecentWork = require("../models/RecentWork");
    const Coupon = require("../models/Coupon");
    const Technician = require("../models/Technician");
    const Customer = require("../models/Customer");
    const Expense = require("../models/Expense");
    const ActivityLog = require("../models/ActivityLog");
    const Order = require("../models/Order");
    const ServiceBooking = require("../models/ServiceBooking");

    // ── Backfill userId for existing users ────────────────────────────
    const { randomInt } = require("crypto");
    const usersWithoutId = await User.find({ userId: { $exists: false } });
    for (const user of usersWithoutId) {
      user.userId = `USR-${randomInt(10000, 99999)}`;
      await user.save();
    }
    if (usersWithoutId.length > 0) {
      console.log(`✓ Backfilled userId for ${usersWithoutId.length} existing users`);
    }

    // ── Clear all collections ──────────────────────────────────────────
    const models = [
      User,
      Product,
      Service,
      Blog,
      RecentWork,
      Coupon,
      Technician,
      Customer,
      Expense,
      ActivityLog,
      Order,
      ServiceBooking,
    ];
    for (const Model of models) {
      await Model.deleteMany({});
    }
    console.log("✓ Cleared existing data\n");

    // ══════════════════════════════════════════════════════════════════
    //  1. USERS (6)
    // ══════════════════════════════════════════════════════════════════
    const users = await User.create([
      {
        name: "Admin User",
        userId: "USR-10001",
        email: "admin@coldflyer.com",
        phone: "01700000001",
        password: "Admin@1234",
        role: "admin",
        isEmailVerified: true,
        addresses: [
          {
            label: "Office",
            isDefault: true,
            fullName: "Admin User",
            phone: "01700000001",
            district: "Dhaka",
            thana: "Gulshan",
            address: "123 Gulshan Ave, Level 5",
          },
        ],
      },
      {
        name: "Rafiq Hasan",
        userId: "USR-10002",
        email: "tech@coldflyer.com",
        phone: "01700000002",
        password: "Tech@1234",
        role: "technician",
        isEmailVerified: true,
        gender: "male",
      },
      {
        name: "Fatima Begum",
        userId: "USR-10003",
        email: "fatima@example.com",
        phone: "01711112222",
        password: "User@1234",
        role: "user",
        isEmailVerified: true,
        gender: "female",
        addresses: [
          {
            label: "Home",
            isDefault: true,
            fullName: "Fatima Begum",
            phone: "01711112222",
            district: "Dhaka",
            thana: "Mirpur",
            address: "45 Lake Road, Block C, Mirpur 2",
          },
        ],
      },
      {
        name: "Karim Uddin",
        userId: "USR-10004",
        email: "karim@example.com",
        phone: "01722223333",
        password: "User@1234",
        role: "user",
        isEmailVerified: true,
        gender: "male",
        addresses: [
          {
            label: "Home",
            isDefault: true,
            fullName: "Karim Uddin",
            phone: "01722223333",
            district: "Chattogram",
            thana: "Halishahar",
            address: "78 Beach Road",
          },
        ],
      },
      {
        name: "Nusrat Jahan",
        userId: "USR-10005",
        email: "nusrat@example.com",
        phone: "01733334444",
        password: "User@1234",
        role: "user",
        isEmailVerified: true,
        gender: "female",
        addresses: [
          {
            label: "Home",
            isDefault: true,
            fullName: "Nusrat Jahan",
            phone: "01733334444",
            district: "Dhaka",
            thana: "Uttara",
            address: "12 Sector 7, Road 15",
          },
        ],
      },
      {
        name: "Shahidul Islam",
        userId: "USR-10006",
        email: "shahidul@example.com",
        phone: "01744445555",
        password: "User@1234",
        role: "user",
        isEmailVerified: true,
        gender: "male",
        addresses: [
          {
            label: "Home",
            isDefault: true,
            fullName: "Shahidul Islam",
            phone: "01744445555",
            district: "Sylhet",
            thana: "Jalalabad",
            address: "88 Tea Garden Road",
          },
        ],
      },
    ]);
    console.log(`✓ Seeded ${users.length} users`);

    const adminUser = users[0];
    const techUser = users[1];
    const regularUsers = users.slice(2);

    // ══════════════════════════════════════════════════════════════════
    //  2. PRODUCTS (20)
    // ══════════════════════════════════════════════════════════════════
    const products = await Product.create([
      // ── AC Units (8) ──
      {
        name: "Samsung Split AC 1.5 Ton",
        sku: "SAM-SPLIT-15",
        productType: "unit",
        category: "Split AC",
        brand: "Samsung",
        price: 55000,
        originalPrice: 62000,
        description:
          "Energy-efficient 1.5 ton split air conditioner with digital inverter technology and auto-clean feature. Ideal for medium-sized rooms up to 180 sq ft.",
        stock: 25,
        rating: 4.5,
        reviewCount: 128,
        featured: true,
        bestSeller: true,
        features: ["Digital Inverter", "Auto Clean", "Fast Cooling", "Sleep Mode", "Turbo Mode"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Installation Kit", "User Manual"],
        warranty: "5 Years Compressor / 1 Year Product",
        specs: { capacity: "1.5 Ton", btu: "18000 BTU/h", eer: "3.5 W/W", refrigerant: "R32" },
        tag: "Featured",
      },
      {
        name: "LG Dual Inverter Split AC 2 Ton",
        sku: "LG-DUAL-20",
        productType: "unit",
        category: "Split AC",
        brand: "LG",
        price: 72000,
        originalPrice: 78000,
        description:
          "Premium dual inverter split AC with AI cooling, gold fin condenser, and smart diagnosis. Perfect for large rooms up to 240 sq ft.",
        stock: 15,
        rating: 4.7,
        reviewCount: 89,
        featured: true,
        newArrival: true,
        features: ["Dual Inverter", "AI Cooling", "Gold Fin", "Smart Diagnosis", "ThinQ App"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Installation Kit", "Warranty Card"],
        warranty: "10 Years Compressor / 2 Years Product",
        specs: { capacity: "2 Ton", btu: "24000 BTU/h", eer: "4.2 W/W", refrigerant: "R32" },
        tag: "New",
      },
      {
        name: "Gree Window AC 1 Ton",
        sku: "GREE-WIN-10",
        productType: "unit",
        category: "Window AC",
        brand: "Gree",
        price: 32000,
        originalPrice: 36000,
        description:
          "Affordable and reliable window air conditioner perfect for small rooms and offices. Low noise operation with energy saver mode.",
        stock: 40,
        rating: 4.2,
        reviewCount: 210,
        bestSeller: true,
        features: ["Compact Design", "Low Noise", "Energy Saver", "Easy Install", "Washable Filter"],
        inBox: ["AC Unit", "Remote", "Installation Frame", "Weather Seal", "Manual"],
        warranty: "3 Years Compressor / 1 Year Product",
        specs: { capacity: "1 Ton", btu: "12000 BTU/h", coolingArea: "120 sq ft" },
      },
      {
        name: "Daikin Cassette AC 3 Ton",
        sku: "DAI-CASS-30",
        productType: "unit",
        category: "Cassette AC",
        brand: "Daikin",
        price: 125000,
        originalPrice: 135000,
        description:
          "Commercial-grade cassette AC with 360-degree airflow for large spaces like showrooms, restaurants, and conference rooms.",
        stock: 8,
        rating: 4.8,
        reviewCount: 45,
        featured: true,
        features: ["360° Airflow", "Slim Design", "Auto Swing", "Built-in Drain Pump", "Remote Control"],
        inBox: ["Cassette Unit", "Remote", "Installation Kit", "Drain Pipe", "Grille"],
        warranty: "5 Years Compressor / 2 Years Product",
        specs: { capacity: "3 Ton", btu: "36000 BTU/h", eer: "3.8 W/W" },
        tag: "Featured",
      },
      {
        name: "General Split AC 1 Ton",
        sku: "GEN-SPLIT-10",
        productType: "unit",
        category: "Split AC",
        brand: "General",
        price: 42000,
        originalPrice: 46000,
        description:
          "Durable and efficient 1 ton split AC from General. Known for reliability and consistent cooling performance.",
        stock: 30,
        rating: 4.3,
        reviewCount: 76,
        features: ["Rapid Cooling", "Anti-bacterial Filter", "Quiet Operation", "Auto Restart"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Installation Kit"],
        warranty: "5 Years Compressor / 1 Year Product",
        specs: { capacity: "1 Ton", btu: "12000 BTU/h", eer: "3.2 W/W", refrigerant: "R410A" },
      },
      {
        name: "Mitsubishi Heavy Duty Split AC 2 Ton",
        sku: "MIT-HD-20",
        productType: "unit",
        category: "Split AC",
        brand: "Mitsubishi",
        price: 85000,
        originalPrice: 92000,
        description:
          "Heavy-duty split AC built for commercial use. Superior build quality with Japanese compressor technology.",
        stock: 10,
        rating: 4.9,
        reviewCount: 34,
        featured: true,
        features: ["Japanese Compressor", "Heavy Duty", "Anti-corrosion", "Super Silent", "Wide Angle Louver"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Pro Installation Kit"],
        warranty: "7 Years Compressor / 3 Years Product",
        specs: { capacity: "2 Ton", btu: "24000 BTU/h", eer: "3.9 W/W", refrigerant: "R32" },
        tag: "Featured",
      },
      {
        name: "Panasonic Inverter Split AC 1.5 Ton",
        sku: "PAN-INV-15",
        productType: "unit",
        category: "Split AC",
        brand: "Panasonic",
        price: 58000,
        originalPrice: 64000,
        description:
          "Panasonic inverter split AC with nanoe-G air purification and eco-friendly R32 refrigerant. Smart controls included.",
        stock: 20,
        rating: 4.6,
        reviewCount: 95,
        newArrival: true,
        features: ["nanoe-G Purification", "Inverter", "Eco Mode", "Smart Control", "Mildew Resistant"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Installation Kit", "WiFi Module"],
        warranty: "5 Years Compressor / 1 Year Product",
        specs: { capacity: "1.5 Ton", btu: "18000 BTU/h", eer: "4.0 W/W", refrigerant: "R32" },
        tag: "New",
      },
      {
        name: "Samsung Wind-Free Split AC 2 Ton",
        sku: "SAM-WF-20",
        productType: "unit",
        category: "Split AC",
        brand: "Samsung",
        price: 78000,
        originalPrice: 85000,
        description:
          "Samsung Wind-Free technology gently cools through 21,000 micro-holes. Premium cooling without direct draft.",
        stock: 12,
        rating: 4.7,
        reviewCount: 67,
        featured: true,
        bestSeller: true,
        features: ["Wind-Free Cooling", "Digital Inverter", "Triple Protector Plus", "HD Filter", "WiFi"],
        inBox: ["Indoor Unit", "Outdoor Unit", "Remote", "Installation Kit", "User Manual"],
        warranty: "5 Years Compressor / 1 Year Product",
        specs: { capacity: "2 Ton", btu: "24000 BTU/h", eer: "4.5 W/W", refrigerant: "R32" },
        tag: "Featured",
      },
      // ── Parts & Spares (12) ──
      {
        name: "AC Compressor 1.5 Ton (Rotary)",
        sku: "COMP-ROTARY-15",
        productType: "part",
        category: "Compressor",
        brand: "Copeland",
        price: 8500,
        originalPrice: 9500,
        description:
          "High-quality rotary compressor compatible with most 1.5 ton split AC units. Low vibration and quiet operation.",
        stock: 50,
        rating: 4.3,
        reviewCount: 67,
        bestSeller: true,
        features: ["Rotary Type", "Low Vibration", "Quiet Operation", "Energy Efficient"],
        warranty: "1 Year Replacement",
        specs: { type: "Rotary", capacity: "1.5 Ton", voltage: "220V", power: "1.2 kW" },
      },
      {
        name: "AC PCB Board Universal",
        sku: "PCB-UNIV-01",
        productType: "part",
        category: "PCB",
        brand: "Universal",
        price: 2200,
        description:
          "Universal AC PCB board compatible with multiple brands including Samsung, LG, Gree, and General. Overload protection built-in.",
        stock: 100,
        rating: 4.0,
        reviewCount: 34,
        features: ["Universal Compatible", "Overload Protection", "LED Display Support"],
        warranty: "6 Months",
        specs: { type: "Universal", voltage: "220V", brand: "Multiple" },
      },
      {
        name: "AC Fan Motor (Indoor)",
        sku: "FAN-INDR-01",
        productType: "part",
        category: "Fan Motor",
        brand: "Mitsubishi",
        price: 1800,
        description: "Replacement indoor unit fan motor for split AC systems. Ball bearings for silent operation.",
        stock: 75,
        rating: 4.1,
        reviewCount: 23,
        features: ["Silent Operation", "Ball Bearings", "Thermal Protection"],
        warranty: "6 Months",
        specs: { type: "Indoor Fan Motor", speed: "3 Speed", voltage: "220V" },
      },
      {
        name: "AC Capacitor 50uF",
        sku: "CAP-50UF-01",
        productType: "part",
        category: "Capacitor",
        brand: "Rubycon",
        price: 450,
        description:
          "High-quality 50 microfarad AC capacitor for compressor and fan motor starting. Temperature resistant with safety vent.",
        stock: 200,
        rating: 4.4,
        reviewCount: 156,
        bestSeller: true,
        features: ["Long Life", "Temperature Resistant", "Safety Vent"],
        warranty: "3 Months",
        specs: { capacitance: "50uF", voltage: "450V", tolerance: "±5%" },
      },
      {
        name: "Universal AC Remote Control",
        sku: "REM-UNIV-01",
        productType: "part",
        category: "Remote",
        brand: "Universal",
        price: 350,
        description:
          "Universal AC remote compatible with all major brands including Samsung, LG, Gree, Daikin, and Panasonic. Easy code setup.",
        stock: 300,
        rating: 4.0,
        reviewCount: 312,
        bestSeller: true,
        features: ["Universal Code", "LCD Display", "Sleep Timer", "Energy Saver"],
        warranty: "No Warranty",
        specs: { type: "Universal", battery: "2x AAA", range: "8m" },
      },
      {
        name: 'AC Copper Pipe 1/4" + 3/8" (10ft)',
        sku: "COPPER-10FT",
        productType: "part",
        category: "Installation",
        brand: "Standard",
        price: 2800,
        description:
          "Pre-insulated copper pipe set for split AC installation. Anti-corrosion with flexible insulation. 10 feet length.",
        stock: 60,
        rating: 4.6,
        reviewCount: 89,
        features: ["Pre-insulated", "Anti-corrosion", "Flexible", "10ft Length"],
        warranty: "No Warranty",
        specs: { length: "10 ft", liquidLine: '1/4"', gasLine: '3/8"', insulation: '1/2"' },
        tag: null,
      },
      {
        name: "Digital Thermostat (Programmable)",
        sku: "THERM-DIG-01",
        productType: "part",
        category: "Thermostat",
        brand: "Honeywell",
        price: 3200,
        description:
          "Programmable digital thermostat with 7-day scheduling. Compatible with most split and central AC systems.",
        stock: 35,
        rating: 4.5,
        reviewCount: 48,
        newArrival: true,
        features: ["7-Day Programmable", "Touch Screen", "Energy Reports", "WiFi Connected"],
        warranty: "2 Years",
        specs: { type: "Programmable", voltage: "24V", stages: "1 Heat / 1 Cool" },
      },
      {
        name: "AC Contactor 2 Pole 40A",
        sku: "CONT-2P-40A",
        productType: "part",
        category: "Electrical",
        brand: "Schneider",
        price: 650,
        description:
          "2-pole 40-amp contactor for AC compressor and fan motor switching. Reliable performance from Schneider Electric.",
        stock: 120,
        rating: 4.2,
        reviewCount: 41,
        features: ["High Durability", "Arc Suppression", "Side Clamp Terminals"],
        warranty: "1 Year",
        specs: { type: "2 Pole", current: "40A", voltage: "240V", coil: "24V AC" },
      },
      {
        name: "Expansion Valve (TXV) 2 Ton",
        sku: "TXV-2TON-01",
        productType: "part",
        category: "Valve",
        brand: "Danfoss",
        price: 1800,
        description:
          "Thermal expansion valve for precise refrigerant flow control. Compatible with R32 and R410A systems.",
        stock: 45,
        rating: 4.3,
        reviewCount: 27,
        features: ["Precise Flow Control", "R32/R410A Compatible", "Adjustable Superheat"],
        warranty: "1 Year",
        specs: { type: "TXV", capacity: "2 Ton", refrigerant: "R32/R410A" },
      },
      {
        name: 'Filter Drier (3/8")',
        sku: "FILTER-38-01",
        productType: "part",
        category: "Filter",
        brand: "Emerson",
        price: 350,
        description:
          "Bi-flow filter drier for moisture and contaminant removal. Essential for AC repair and maintenance.",
        stock: 150,
        rating: 4.1,
        reviewCount: 33,
        features: ["Bi-flow", "Moisture Removal", "Acid Capture"],
        warranty: "No Warranty",
        specs: { size: '3/8"', type: "Bi-flow", connection: "Flare" },
      },
      {
        name: "AC Installation Cable (4 Core, 10m)",
        sku: "CABLE-4C-10M",
        productType: "part",
        category: "Installation",
        brand: "Standard",
        price: 1200,
        description:
          "4-core copper cable for split AC power and communication connection. 10 meters length with PVC insulation.",
        stock: 80,
        rating: 4.0,
        reviewCount: 19,
        features: ["4 Core Copper", "PVC Insulated", "Flame Retardant", "10m Length"],
        warranty: "No Warranty",
        specs: { cores: "4", length: "10m", gauge: "2.5mm²", insulation: "PVC" },
      },
      {
        name: "AC Outdoor Unit Stand (Stainless Steel)",
        sku: "STAND-SS-01",
        productType: "part",
        category: "Installation",
        brand: "Standard",
        price: 2200,
        description:
          "Heavy-duty stainless steel stand for outdoor AC unit. Rust-proof with anti-vibration pads. Supports up to 60kg.",
        stock: 40,
        rating: 4.5,
        reviewCount: 72,
        features: ["Stainless Steel", "Rust-proof", "Anti-vibration Pads", "60kg Capacity"],
        warranty: "2 Years",
        specs: { material: "Stainless Steel", maxLoad: "60kg", height: "2ft" },
      },
    ]);
    console.log(`✓ Seeded ${products.length} products`);

    // ══════════════════════════════════════════════════════════════════
    //  3. SERVICES (10)
    // ══════════════════════════════════════════════════════════════════
    const services = await Service.create([
      {
        name: "AC Deep Cleaning",
        slug: "ac-deep-cleaning",
        category: "maintenance",
        description:
          "Complete disassembly cleaning of indoor and outdoor units. Includes coil cleaning, filter wash, and sanitization. Recommended every 6 months.",
        serviceType: "preventative_care",
        basePrice: 1500,
        priceType: "fixed",
        includes: ["Indoor Unit Disassembly", "Coil Cleaning", "Filter Wash", "Outdoor Unit Cleaning", "Sanitization"],
        exclusions: ["Gas Top-up", "Part Replacement"],
        requirements: ["Access to outdoor unit", "Power shutoff"],
        qualifications: ["Certified Technician"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "AC Gas Refill",
        slug: "ac-gas-refill",
        category: "repair",
        description:
          "Refill refrigerant gas (R32/R410A) with comprehensive leak check and pressure testing. Restores cooling performance.",
        serviceType: "repair",
        basePrice: 3000,
        priceType: "fixed",
        includes: ["Gas Top-up", "Leak Detection", "Pressure Test", "Performance Check"],
        exclusions: ["Leak Repair", "Part Replacement"],
        requirements: ["AC must be at least 1 year old"],
        qualifications: ["EPA Certified Technician"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "AC Installation",
        slug: "ac-installation",
        category: "installation",
        description:
          "Professional installation of split AC units including wall mounting, piping, electrical connection, and system testing.",
        serviceType: "installation",
        basePrice: 3500,
        priceType: "fixed",
        includes: ["Unit Mounting", "Piping (up to 10ft)", "Electrical Connection", "Testing", "Remote Setup"],
        exclusions: ["Extra Piping", "Electrical Panel Upgrade", "Gas Top-up"],
        requirements: ["AC unit on-site", "Electrical point nearby"],
        qualifications: ["Certified Installer"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "AC Compressor Replacement",
        slug: "ac-compressor-replacement",
        category: "repair",
        description:
          "Replace faulty compressor with new or reconditioned unit. Includes full system flush, filter drier replacement, and vacuum.",
        serviceType: "repair",
        basePrice: 8000,
        priceType: "quote",
        includes: ["Compressor Replacement", "System Flush", "Filter Drier Replacement", "Vacuum & Gas Top-up"],
        exclusions: ["Compressor Cost", "Additional Parts"],
        requirements: ["Compressor model confirmed", "System must be accessible"],
        qualifications: ["Master Technician"],
        isActive: true,
      },
      {
        name: "AC Electrical Repair",
        slug: "ac-electrical-repair",
        category: "repair",
        description:
          "Diagnose and fix electrical issues including PCB problems, capacitor failure, wiring faults, and sensor malfunctions.",
        serviceType: "repair",
        basePrice: 1200,
        priceType: "fixed",
        includes: ["Diagnostic Check", "PCB Repair/Replace", "Capacitor Replacement", "Wiring Fix"],
        exclusions: ["Major Part Cost"],
        requirements: ["Power supply check"],
        qualifications: ["Electrical Certified"],
        isActive: true,
      },
      {
        name: "AC Health Checkup",
        slug: "ac-health-checkup",
        category: "maintenance",
        description:
          "Comprehensive AC inspection covering all components: compressor, fan motor, PCB, capacitor, gas pressure, and thermals. Includes detailed report.",
        serviceType: "inspection",
        basePrice: 800,
        priceType: "fixed",
        includes: ["Full Inspection", "Temperature Check", "Current Draw Test", "Filter Clean", "Detailed Report"],
        exclusions: ["Repairs", "Part Replacement"],
        requirements: ["AC must be operational"],
        qualifications: ["Certified Technician"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Emergency AC Repair",
        slug: "emergency-ac-repair",
        category: "repair",
        description:
          "24/7 emergency AC repair service. Same-day response within Dhaka city. Get your AC running again within hours.",
        serviceType: "emergency",
        basePrice: 2500,
        priceType: "fixed",
        includes: ["Priority Dispatch", "Diagnostic Check", "Basic Repair", "Same-day Service"],
        exclusions: ["Major Part Cost", "Gas Refill"],
        requirements: ["Available access to unit"],
        qualifications: ["Master Technician"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "AC Efficiency Tuning",
        slug: "ac-efficiency-tuning",
        category: "maintenance",
        description:
          "Optimize your AC for maximum energy efficiency. Includes coil cleaning, gas pressure adjustment, and thermostat calibration.",
        serviceType: "efficiency_tuning",
        basePrice: 2000,
        priceType: "fixed",
        includes: [
          "Coil Cleaning",
          "Gas Pressure Adjustment",
          "Thermostat Calibration",
          "Airflow Optimization",
          "Efficiency Report",
        ],
        exclusions: ["Part Replacement", "Major Repairs"],
        requirements: ["AC must be functional"],
        qualifications: ["Certified Technician"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Central AC Maintenance",
        slug: "central-ac-maintenance",
        category: "maintenance",
        description:
          "Full maintenance package for central AC and ducted systems. Includes duct cleaning, filter replacement, and blower servicing.",
        serviceType: "preventative_care",
        basePrice: 8000,
        priceType: "quote",
        includes: ["Duct Cleaning", "Filter Replacement", "Blower Servicing", "Condenser Coil Clean", "System Test"],
        exclusions: ["Duct Repair", "Major Part Replacement"],
        requirements: ["System access", "Power shutoff"],
        qualifications: ["Commercial HVAC Certified"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "AC Consultation & Sizing",
        slug: "ac-consultation-sizing",
        category: "support",
        description:
          "Professional consultation for selecting the right AC capacity and type for your space. Includes site visit and load calculation.",
        serviceType: "consultation",
        basePrice: 1000,
        priceType: "fixed",
        includes: ["Site Visit", "Room Measurement", "Load Calculation", "Model Recommendation", "Installation Quote"],
        exclusions: ["AC Unit", "Installation"],
        requirements: ["Site access during business hours"],
        qualifications: ["HVAC Consultant"],
        isFeatured: true,
        isActive: true,
      },
    ]);
    console.log(`✓ Seeded ${services.length} services`);

    // ══════════════════════════════════════════════════════════════════
    //  4. BLOGS (6)
    // ══════════════════════════════════════════════════════════════════
    const blogs = await Blog.create([
      {
        title: "When Should You Service Your AC? A Complete Guide",
        slug: "when-should-you-service-your-ac",
        excerpt:
          "Learn the signs that indicate your air conditioner needs professional servicing and how regular maintenance can extend its lifespan by up to 7 years.",
        content: `Regular AC servicing is essential for maintaining optimal performance and energy efficiency. Most experts recommend servicing your AC at least twice a year — once before summer and once before winter.

## Signs You Need AC Service

1. **Reduced Cooling**: If your AC isn't cooling as effectively as before, it may need servicing.
2. **Unusual Noises**: Grinding, squeaking, or rattling sounds indicate mechanical issues.
3. **Higher Electricity Bills**: A sudden spike in bills often means your AC is working harder than necessary.
4. **Water Leaks**: Pooling water around your indoor unit suggests drainage problems.
5. **Bad Odors**: Musty or burning smells require immediate attention.

## Benefits of Regular Servicing

- **Extended Lifespan**: Regular maintenance can add 5-7 years to your AC's life.
- **Energy Efficiency**: A well-maintained AC uses 15-20% less electricity.
- **Better Air Quality**: Clean filters and coils mean healthier indoor air.
- **Fewer Breakdowns**: Preventative maintenance catches issues early.`,
        category: "Tips",
        tags: ["maintenance", "tips", "guide"],
        author: adminUser._id,
        featured: true,
        views: 1250,
        seo: {
          metaTitle: "AC Service Guide | Cold Flyer",
          metaDescription: "Complete guide on when to service your AC.",
        },
      },
      {
        title: "Split AC vs Window AC: Which One Should You Buy?",
        slug: "split-ac-vs-window-ac",
        excerpt:
          "Compare split and window air conditioners across key factors: price, efficiency, installation, and suitability for Bangladesh homes.",
        content: `Choosing between a split AC and a window AC depends on several factors including room size, budget, and installation constraints.

## Split AC Pros & Cons

**Pros:**
- Quieter operation (compressor outside)
- Better cooling for larger rooms
- Modern aesthetic
- Better air distribution

**Cons:**
- Higher upfront cost
- Professional installation required
- Takes more wall space

## Window AC Pros & Cons

**Pros:**
- Lower cost
- Easy installation (DIY-friendly)
- Portable / removable
- Lower maintenance

**Cons:**
- Noisier operation
- Blocks window
- Less energy efficient
- Limited to smaller rooms

## Which Should You Choose?

For rooms up to 150 sq ft, a window AC is cost-effective. For larger spaces or multiple rooms, a split AC offers better performance and aesthetics.`,
        category: "Buying Guide",
        tags: ["buying-guide", "split-ac", "window-ac"],
        author: adminUser._id,
        featured: true,
        views: 890,
        seo: {
          metaTitle: "Split AC vs Window AC | Cold Flyer",
          metaDescription: "Compare split and window air conditioners.",
        },
      },
      {
        title: "5 Energy Saving Tips for Your Air Conditioner This Summer",
        slug: "5-energy-saving-tips-for-your-ac",
        excerpt:
          "Reduce your electricity bills with these practical energy-saving tips for AC users in Bangladesh. Save up to 30% on cooling costs.",
        content: `Summer in Bangladesh means high temperatures and high electricity bills. Here are 5 proven tips to keep your AC running efficiently.

## 1. Set the Right Temperature
Keep your thermostat at 24°C (75°F). Every degree lower increases energy consumption by 6-8%.

## 2. Use the Timer
Set your AC to turn off 30 minutes before you leave or go to bed. The room stays cool while you save energy.

## 3. Clean Filters Monthly
Dirty filters reduce airflow and force your AC to work harder. Clean or replace filters every 30 days.

## 4. Seal Windows and Doors
Prevent cool air from escaping. Use curtains or blinds during peak sunlight hours.

## 5. Schedule Regular Maintenance
A well-maintained AC uses 15-20% less energy. Schedule professional servicing before summer starts.`,
        category: "Tips",
        tags: ["energy-saving", "tips", "summer"],
        author: regularUsers[0]._id,
        featured: false,
        views: 2100,
        seo: {
          metaTitle: "5 Energy Saving Tips for AC | Cold Flyer",
          metaDescription: "Reduce AC electricity bills with these tips.",
        },
      },
      {
        title: "Understanding AC Inverter Technology: Is It Worth the Extra Cost?",
        slug: "understanding-ac-inverter-technology",
        excerpt:
          "A deep dive into inverter AC technology, how it saves energy, and whether the higher upfront cost is justified for Bangladesh households.",
        content: `Inverter technology has revolutionized the air conditioning industry. But is it worth the extra investment? Let's find out.

## How Inverter AC Works

Unlike traditional ACs that turn the compressor on and off, inverter ACs continuously vary compressor speed to maintain the desired temperature. This eliminates the energy spike from frequent restarting.

## Energy Savings

- **Non-inverter**: Compressor cycles on/off — high energy spikes
- **Inverter**: Compressor runs continuously at variable speed — 30-50% more efficient

## When Inverter Makes Sense

1. You use AC for 8+ hours daily
2. Electricity rates are high in your area
3. You want quieter operation
4. You plan to stay in your home for 3+ years

## Verdict

Inverter ACs typically pay for themselves within 2-3 years through energy savings for heavy users. For occasional use (4-5 hours/day), a non-inverter may be more cost-effective.`,
        category: "Buying Guide",
        tags: ["inverter", "technology", "buying-guide"],
        author: adminUser._id,
        featured: true,
        views: 1560,
        seo: {
          metaTitle: "Inverter AC Technology Explained | Cold Flyer",
          metaDescription: "Is inverter AC worth the extra cost?",
        },
      },
      {
        title: "Smart Home 2026: Integrating Your AC with Home Automation",
        slug: "smart-home-ac-integration-2026",
        excerpt:
          "Explore how modern ACs integrate with smart home systems. From WiFi control to voice commands and energy monitoring.",
        content: `Smart home integration is transforming how we interact with our air conditioners. Here's what's available in 2026.

## WiFi-Enabled ACs

Most modern ACs now come with built-in WiFi modules. The Samsung Wind-Free and LG Dual Inverter series both support app-based control.

## Voice Control

Compatible with:
- **Amazon Alexa**: Turn on/off, set temperature, change mode
- **Google Assistant**: Same functionality plus energy monitoring
- **Apple HomeKit**: Select Panasonic and LG models support Siri

## Automation Scenarios

1. **Geo-fencing**: AC turns on when you're 10 minutes from home
2. **Schedule**: Set different temperatures for day/night
3. **Energy Monitoring**: Track consumption in real-time
4. **Maintenance Alerts**: Get notified when filters need cleaning

## Setting Up in Bangladesh

All major brands sold in Bangladesh now support smart features. Installation is straightforward — just connect to your home WiFi.`,
        category: "Smart Home",
        tags: ["smart-home", "iot", "wifi", "automation"],
        author: adminUser._id,
        featured: false,
        views: 734,
        seo: {
          metaTitle: "Smart Home AC Integration 2026 | Cold Flyer",
          metaDescription: "Integrate your AC with home automation systems.",
        },
      },
      {
        title: "AC Maintenance Tips for Dhaka's Dusty Environment",
        slug: "ac-maintenance-tips-dhaka-dust",
        excerpt:
          "Dhaka's high pollution and dust levels require special AC maintenance practices. Learn how to protect your unit and ensure optimal performance.",
        content: `Dhaka's air quality index (AQI) often exceeds 150, making it one of the most challenging environments for AC operation. Here's how to cope.

## Why Dust Matters

High dust levels clog filters faster, reduce cooling efficiency, and can damage the compressor over time. ACs in Dhaka need 2x more frequent cleaning than those in cleaner environments.

## Maintenance Schedule for Dhaka

- **Filter cleaning**: Every 15-20 days (vs monthly in cleaner areas)
- **Professional servicing**: Every 3-4 months (vs 6 months)
- **Coil cleaning**: Every 6 months
- **Deep cleaning**: Yearly before summer

## Additional Protection

1. **Install a voltage stabilizer** — Dhaka's voltage fluctuations can damage PCB
2. **Use a protective cover** for outdoor units in construction-heavy areas
3. **Consider anti-dust filters** — available as add-ons for most brands

## When to Call a Professional

If you notice reduced airflow despite clean filters, or hear unusual sounds, call a professional immediately. Delaying repairs in dusty conditions accelerates damage.`,
        category: "Tips",
        tags: ["dhaka", "dust", "maintenance", "tips"],
        author: regularUsers[2]._id,
        featured: false,
        views: 1802,
        seo: {
          metaTitle: "AC Maintenance for Dhaka Dust | Cold Flyer",
          metaDescription: "AC maintenance tips for Dhaka's dusty environment.",
        },
      },
    ]);
    console.log(`✓ Seeded ${blogs.length} blogs`);

    // ══════════════════════════════════════════════════════════════════
    //  5. RECENT WORKS (4)
    // ══════════════════════════════════════════════════════════════════
    const recentWorks = await RecentWork.create([
      {
        title: "AC Installation — Gulshan Bank Head Office",
        slug: "ac-installation-gulshan-bank",
        description:
          "Complete installation of 12 Daikin cassette AC units for a 5-story bank head office in Gulshan. Included ducting, thermostat installation, and zone-based temperature control.",
        excerpt: "12 Daikin cassette units installed for a commercial bank building.",
        category: "Commercial",
        tags: ["commercial", "cassette", "daikin", "installation"],
        clientName: "Trust Bank Ltd.",
        completionDate: new Date("2026-03-15"),
        featured: true,
        author: adminUser._id,
        views: 340,
        image: {
          url: "https://placehold.co/800x600/2563eb/ffffff?text=Bank+AC+Installation",
          alt: "Bank building AC installation",
        },
      },
      {
        title: "Residential Split AC Setup — Mirpur DOHS",
        slug: "residential-split-ac-mirpur-dohs",
        description:
          "Installation of 5 Samsung Wind-Free split AC units for a 3-story residence in Mirpur DOHS. Included concealed piping, smart thermostat integration, and WiFi setup.",
        excerpt: "5 Samsung split units with smart home integration.",
        category: "Residential",
        tags: ["residential", "samsung", "split-ac", "smart-home"],
        clientName: "Mr. Rahman",
        completionDate: new Date("2026-04-02"),
        featured: true,
        author: adminUser._id,
        views: 215,
        image: {
          url: "https://placehold.co/800x600/16a34a/ffffff?text=Residential+AC+Setup",
          alt: "Residential AC installation",
        },
      },
      {
        title: "Emergency Repair — After-Sales Service",
        slug: "emergency-repair-after-sales",
        description:
          "Emergency compressor replacement for a LG 2 Ton unit in Uttara. Customer reported complete cooling failure. Diagnosed faulty compressor, replaced within 6 hours of call.",
        excerpt: "Compressor replacement completed within 6 hours.",
        category: "Repair",
        tags: ["emergency", "repair", "lg", "compressor"],
        clientName: "Mrs. Jahan",
        completionDate: new Date("2026-04-20"),
        featured: false,
        author: techUser._id,
        views: 98,
      },
      {
        title: "Deep Maintenance — Mirpur Residential Society",
        slug: "deep-maintenance-mirpur-society",
        description:
          "Scheduled maintenance for 20 AC units across a residential society in Mirpur. Included deep cleaning, gas pressure check, filter replacement, and performance tuning for all units.",
        excerpt: "20 AC units serviced in a single residential society.",
        category: "Maintenance",
        tags: ["maintenance", "bulk", "cleaning", "residential"],
        clientName: "Mirpur Paradise Housing",
        completionDate: new Date("2026-05-10"),
        featured: true,
        author: techUser._id,
        views: 175,
        image: {
          url: "https://placehold.co/800x600/dc2626/ffffff?text=AC+Maintenance",
          alt: "Bulk AC maintenance project",
        },
      },
    ]);
    console.log(`✓ Seeded ${recentWorks.length} recent works`);

    // ══════════════════════════════════════════════════════════════════
    //  6. COUPONS (6)
    // ══════════════════════════════════════════════════════════════════
    const coupons = await Coupon.create([
      {
        code: "SUMMER25",
        description: "25% off on all AC units and HVAC systems",
        discountType: "percentage",
        discountValue: 25,
        maxDiscount: 2000,
        minOrderValue: 5000,
        maxUsage: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        applicableTo: "products",
      },
      {
        code: "FREESHIP",
        description: "Free shipping on orders over ৳2,000",
        discountType: "free_shipping",
        discountValue: 0,
        minOrderValue: 2000,
        maxUsage: 200,
        perUserLimit: 3,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "WELCOME10",
        description: "10% off for first-time customers",
        discountType: "percentage",
        discountValue: 10,
        maxDiscount: 1000,
        minOrderValue: 0,
        maxUsage: 500,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
        firstOrderOnly: true,
      },
      {
        code: "FIXED500",
        description: "৳500 off on orders above ৳10,000",
        discountType: "fixed",
        discountValue: 500,
        minOrderValue: 10000,
        maxUsage: 50,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "EXPIRED20",
        description: "20% off — expired coupon for testing",
        discountType: "percentage",
        discountValue: 20,
        maxDiscount: 1500,
        minOrderValue: 3000,
        maxUsage: 10,
        perUserLimit: 1,
        validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "SERVICE10",
        description: "10% off on all AC services",
        discountType: "percentage",
        discountValue: 10,
        maxDiscount: 1000,
        minOrderValue: 0,
        maxUsage: 100,
        perUserLimit: 2,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        isActive: true,
        applicableTo: "services",
      },
    ]);
    console.log(`✓ Seeded ${coupons.length} coupons`);

    // ══════════════════════════════════════════════════════════════════
    //  7. TECHNICIANS (3)
    // ══════════════════════════════════════════════════════════════════
    const technicians = await Technician.create([
      {
        user: techUser._id,
        employeeId: "TECH-001",
        specializations: ["Split AC Repair", "Compressor Replacement", "Electrical Diagnostics", "Installation"],
        certifications: [
          {
            name: "HVAC Master Certified",
            issuedBy: "Bangladesh Technical Board",
            issuedAt: new Date("2023-06-01"),
            expiresAt: new Date("2026-06-01"),
          },
          {
            name: "EPA Section 608",
            issuedBy: "US EPA",
            issuedAt: new Date("2024-01-15"),
            expiresAt: new Date("2027-01-15"),
          },
        ],
        skills: [
          { skill: "Split AC Repair", level: "expert" },
          { skill: "Compressor Work", level: "expert" },
          { skill: "Electrical", level: "expert" },
          { skill: "Installation", level: "intermediate" },
        ],
        serviceAreas: [
          { zone: "Dhaka North", additionalFee: 0 },
          { zone: "Dhaka South", additionalFee: 200 },
        ],
        availability: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "14:00", end: "18:00" },
          saturday: { start: "09:00", end: "14:00" },
          sunday: { start: "", end: "" },
        },
        rating: 4.8,
        reviewCount: 45,
        totalJobs: 230,
        completedJobs: 225,
        status: "available",
        tools: ["Digital Manifold", "Vacuum Pump", "Multimeter", "Torch Kit"],
        isActive: true,
        hireDate: new Date("2023-08-01"),
        nid: "1234567890",
        bloodGroup: "O+",
        emergencyContact: "01799999901",
        salary: 35000,
        addedBy: "Admin",
        addedDate: "2023-08-01",
      },
      {
        user: regularUsers[3]._id, // Assign to Shahidul temporarily for seed
        employeeId: "TECH-002",
        specializations: ["Window AC", "Gas Refill", "Maintenance"],
        certifications: [
          { name: "AC Service Certified", issuedBy: "Bangladesh Technical Board", issuedAt: new Date("2024-03-01") },
        ],
        skills: [
          { skill: "Window AC Repair", level: "expert" },
          { skill: "Gas Refill", level: "expert" },
          { skill: "Maintenance", level: "intermediate" },
        ],
        serviceAreas: [{ zone: "Chattogram", additionalFee: 0 }],
        availability: {
          monday: { start: "09:00", end: "17:00" },
          tuesday: { start: "09:00", end: "17:00" },
          wednesday: { start: "09:00", end: "17:00" },
          thursday: { start: "09:00", end: "17:00" },
          friday: { start: "09:00", end: "13:00" },
          saturday: { start: "", end: "" },
          sunday: { start: "", end: "" },
        },
        rating: 4.5,
        reviewCount: 28,
        totalJobs: 150,
        completedJobs: 145,
        status: "available",
        tools: ["Basic Tool Kit", "Pressure Gauges"],
        isActive: true,
        hireDate: new Date("2024-04-01"),
        nid: "9876543210",
        bloodGroup: "B+",
        emergencyContact: "01799999902",
        salary: 25000,
        addedBy: "Admin",
        addedDate: "2024-04-01",
      },
    ]);
    console.log(`✓ Seeded ${technicians.length} technicians`);

    // ══════════════════════════════════════════════════════════════════
    //  8. CUSTOMERS (10)
    // ══════════════════════════════════════════════════════════════════
    const customers = await Customer.create([
      {
        name: "Md. Shamsul Alam",
        customerId: "CUST-10001",
        phone: "01710001001",
        email: "shamsul@example.com",
        company: "Alam Group",
        address: "42 Gulshan Ave",
        brand: "Samsung",
        model: "Split AC 1.5 Ton",
        unit: "2 units",
        service: "Installation",
        amount: 70000,
        status: "active",
        source: "website",
      },
      {
        name: "Nasrin Sultana",
        customerId: "CUST-10002",
        phone: "01710001002",
        email: "nasrin@example.com",
        brand: "LG",
        model: "Dual Inverter 2 Ton",
        unit: "1 unit",
        service: "Repair",
        amount: 4500,
        status: "active",
        source: "admin",
      },
      {
        name: "Abdur Rahim",
        customerId: "CUST-10003",
        phone: "01710001003",
        company: "Rahim Enterprise",
        address: "55 Motijheel C/A",
        brand: "Daikin",
        model: "Cassette 3 Ton",
        unit: "4 units",
        service: "Installation",
        amount: 450000,
        status: "active",
        source: "website",
      },
      {
        name: "Taslima Akhter",
        customerId: "CUST-10004",
        phone: "01710001004",
        address: "78 Elephant Road",
        brand: "Gree",
        model: "Window AC 1 Ton",
        unit: "1 unit",
        service: "Deep Cleaning",
        amount: 1500,
        status: "active",
        source: "admin",
      },
      {
        name: "Kamal Hossain",
        customerId: "CUST-10005",
        phone: "01710001005",
        email: "kamal@example.com",
        address: "34 Dhanmondi 27",
        brand: "General",
        model: "Split 1 Ton",
        unit: "3 units",
        service: "Maintenance",
        amount: 8000,
        status: "active",
        source: "website",
      },
      {
        name: "Shamima Yeasmin",
        customerId: "CUST-10006",
        phone: "01710001006",
        address: "12 Banani DOHS",
        brand: "Samsung",
        model: "Wind-Free 2 Ton",
        unit: "2 units",
        service: "Installation",
        amount: 140000,
        status: "active",
        source: "admin",
      },
      {
        name: "Faruk Ahmed",
        customerId: "CUST-10007",
        phone: "01710001007",
        company: "Faruk Electronics",
        address: "89 New Market",
        brand: "Mitsubishi",
        model: "Heavy Duty 2 Ton",
        unit: "1 unit",
        service: "Repair",
        amount: 3200,
        status: "active",
        source: "website",
      },
      {
        name: "Jhorna Biswas",
        customerId: "CUST-10008",
        phone: "01710001008",
        address: "56 Shantinagar",
        brand: "Panasonic",
        model: "Inverter 1.5 Ton",
        unit: "1 unit",
        service: "Gas Refill",
        amount: 3000,
        status: "active",
        source: "admin",
      },
      {
        name: "Mizanur Rahman",
        customerId: "CUST-10009",
        phone: "01710001009",
        address: "23 Mohammadpur",
        brand: "LG",
        model: "Dual Inverter 1.5 Ton",
        unit: "1 unit",
        service: "Emergency Repair",
        amount: 2500,
        status: "blocked",
        source: "website",
      },
      {
        name: "Roksana Parvin",
        customerId: "CUST-10010",
        phone: "01710001010",
        email: "roksana@example.com",
        address: "67 Uttara Sector 4",
        brand: "Samsung",
        model: "Split 1 Ton",
        unit: "2 units",
        service: "Health Checkup",
        amount: 1600,
        status: "active",
        source: "admin",
      },
    ]);
    console.log(`✓ Seeded ${customers.length} customers`);

    // ══════════════════════════════════════════════════════════════════
    //  9. EXPENSES (8)
    // ══════════════════════════════════════════════════════════════════
    const expenses = await Expense.create([
      { item: "Office Rent — May 2026", amount: 45000, date: "2026-05-01", category: "rent" },
      { item: "Electricity Bill — April", amount: 8500, date: "2026-04-28", category: "utilities" },
      { item: "Internet & Phone Bills", amount: 3500, date: "2026-05-01", category: "utilities" },
      { item: "Technician Tool Kit Purchase", amount: 15000, date: "2026-04-15", category: "equipment" },
      { item: "Refrigerant Gas (R32) Restock", amount: 28000, date: "2026-04-20", category: "equipment" },
      { item: "Transport — Site Visits (April)", amount: 4500, date: "2026-04-30", category: "transport" },
      { item: "Social Media Marketing Campaign", amount: 12000, date: "2026-05-10", category: "marketing" },
      { item: "Office Stationery & Supplies", amount: 2800, date: "2026-05-12", category: "other" },
    ]);
    console.log(`✓ Seeded ${expenses.length} expenses`);

    // ══════════════════════════════════════════════════════════════════
    //  10. ACTIVITY LOGS (10)
    // ══════════════════════════════════════════════════════════════════
    const activities = await ActivityLog.create([
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Logged in",
        detail: "Admin dashboard access",
        type: "login",
        date: "2026-05-26",
        time: "09:15 AM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "New order received",
        detail: "Order CF-2026-45231 placed by Fatima Begum",
        type: "user",
        date: "2026-05-25",
        time: "02:30 PM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Customer added",
        detail: "Shamsul Alam added as new customer",
        type: "customer",
        date: "2026-05-25",
        time: "11:00 AM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Expense recorded",
        detail: "Office rent for May 2026 — ৳45,000",
        type: "expense",
        date: "2026-05-24",
        time: "10:00 AM",
      },
      {
        user: "Rafiq Hasan",
        userUID: String(techUser._id),
        action: "Service completed",
        detail: "AC Deep Cleaning — Mirpur 12",
        type: "general",
        date: "2026-05-24",
        time: "04:45 PM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Product added",
        detail: "New product: Digital Thermostat (Programmable)",
        type: "general",
        date: "2026-05-23",
        time: "03:20 PM",
      },
      {
        user: "Rafiq Hasan",
        userUID: String(techUser._id),
        action: "Attendance marked",
        detail: "Present — Full day",
        type: "attendance",
        date: "2026-05-23",
        time: "09:00 AM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Blog published",
        detail: "Understanding AC Inverter Technology",
        type: "general",
        date: "2026-05-22",
        time: "01:00 PM",
      },
      {
        user: "Admin User",
        userUID: String(adminUser._id),
        action: "Coupon created",
        detail: "SUMMER25 — 25% off on AC units",
        type: "general",
        date: "2026-05-21",
        time: "12:00 PM",
      },
      {
        user: "Fatima Begum",
        userUID: String(regularUsers[0]._id),
        action: "New user registered",
        detail: "Account created via website",
        type: "user",
        date: "2026-05-20",
        time: "10:30 AM",
      },
    ]);
    console.log(`✓ Seeded ${activities.length} activity logs`);

    // ══════════════════════════════════════════════════════════════════
    //  11. ORDERS (5)
    // ══════════════════════════════════════════════════════════════════
    // Provide explicit orderNumber — pre('save') hook may not fire during bulk create
    const orders = await Order.create([
      {
        orderNumber: "CF-2026-10001",
        user: regularUsers[0]._id,
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            price: products[0].price,
            quantity: 1,
            total: products[0].price,
          },
          {
            product: products[14]._id,
            name: products[14].name,
            price: products[14].price,
            quantity: 2,
            total: products[14].price * 2,
          },
        ],
        itemCount: 3,
        subtotal: 55000 + 350 * 2,
        shippingCost: 0,
        tax: 0,
        total: 55700,
        currency: "BDT",
        status: "delivered",
        paymentStatus: "paid",
        paymentMethod: "card",
        billingAddress: { fullName: "Fatima Begum", phone: "01711112222", city: "Dhaka", country: "Bangladesh" },
        shippingAddress: {
          fullName: "Fatima Begum",
          phone: "01711112222",
          district: "Dhaka",
          thana: "Mirpur",
          address: "45 Lake Road, Block C, Mirpur 2",
        },
        estimatedDelivery: new Date("2026-05-18"),
        deliveredAt: new Date("2026-05-17"),
        source: "website",
        internalNotes: "Customer requested morning delivery",
      },
      {
        orderNumber: "CF-2026-10002",
        user: regularUsers[1]._id,
        items: [
          {
            product: products[3]._id,
            name: products[3].name,
            price: products[3].price,
            quantity: 1,
            total: products[3].price,
          },
        ],
        itemCount: 1,
        subtotal: 125000,
        shippingCost: 0,
        tax: 0,
        total: 125000,
        currency: "BDT",
        status: "shipped",
        paymentStatus: "paid",
        paymentMethod: "card",
        billingAddress: { fullName: "Karim Uddin", phone: "01722223333", city: "Chattogram", country: "Bangladesh" },
        shippingAddress: {
          fullName: "Karim Uddin",
          phone: "01722223333",
          district: "Chattogram",
          thana: "Halishahar",
          address: "78 Beach Road",
        },
        estimatedDelivery: new Date("2026-05-30"),
        source: "website",
      },
      {
        orderNumber: "CF-2026-10003",
        user: regularUsers[2]._id,
        items: [
          {
            product: products[5]._id,
            name: products[5].name,
            price: products[5].price,
            quantity: 1,
            total: products[5].price,
          },
        ],
        itemCount: 1,
        subtotal: 85000,
        shippingCost: 60,
        tax: 4250,
        total: 89310,
        currency: "BDT",
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "cod",
        billingAddress: { fullName: "Nusrat Jahan", phone: "01733334444", city: "Dhaka", country: "Bangladesh" },
        shippingAddress: {
          fullName: "Nusrat Jahan",
          phone: "01733334444",
          district: "Dhaka",
          thana: "Uttara",
          address: "12 Sector 7, Road 15",
        },
        source: "website",
      },
      {
        orderNumber: "CF-2026-10004",
        user: regularUsers[3]._id,
        items: [
          {
            product: products[1]._id,
            name: products[1].name,
            price: products[1].price,
            quantity: 1,
            total: products[1].price,
          },
          {
            product: products[15]._id,
            name: products[15].name,
            price: products[15].price,
            quantity: 1,
            total: products[15].price,
          },
        ],
        itemCount: 2,
        subtotal: 72000 + 3200,
        shippingCost: 60,
        tax: 3760,
        total: 79020,
        currency: "BDT",
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "card",
        billingAddress: { fullName: "Shahidul Islam", phone: "01744445555", city: "Sylhet", country: "Bangladesh" },
        shippingAddress: {
          fullName: "Shahidul Islam",
          phone: "01744445555",
          district: "Sylhet",
          thana: "Jalalabad",
          address: "88 Tea Garden Road",
        },
        source: "website",
      },
      {
        orderNumber: "CF-2026-10005",
        user: regularUsers[0]._id,
        items: [
          {
            product: products[9]._id,
            name: products[9].name,
            price: products[9].price,
            quantity: 1,
            total: products[9].price,
          },
        ],
        itemCount: 1,
        subtotal: 2200,
        shippingCost: 60,
        tax: 110,
        total: 2370,
        currency: "BDT",
        status: "cancelled",
        paymentStatus: "refunded",
        paymentMethod: "card",
        billingAddress: { fullName: "Fatima Begum", phone: "01711112222", city: "Dhaka", country: "Bangladesh" },
        shippingAddress: {
          fullName: "Fatima Begum",
          phone: "01711112222",
          district: "Dhaka",
          thana: "Mirpur",
          address: "45 Lake Road, Block C, Mirpur 2",
        },
        source: "website",
        internalNotes: "Customer cancelled — ordered wrong part",
      },
    ]);
    console.log(`✓ Seeded ${orders.length} orders`);

    // ══════════════════════════════════════════════════════════════════
    //  12. SERVICE BOOKINGS (4)
    // ══════════════════════════════════════════════════════════════════
    const bookings = await ServiceBooking.create([
      {
        bookingNumber: "SB-2026-00001",
        user: regularUsers[0]._id,
        service: services[0]._id,
        items: [{ name: services[0].name, price: services[0].basePrice, quantity: 1 }],
        subtotal: 1500,
        total: 1500,
        status: "completed",
        completedAt: new Date("2026-05-20"),
        scheduledDate: new Date("2026-05-19"),
        scheduledTime: { start: "10:00", end: "12:00" },
        serviceAddress: {
          fullName: "Fatima Begum",
          phone: "01711112222",
          district: "Dhaka",
          thana: "Mirpur",
          address: "45 Lake Road, Block C, Mirpur 2",
        },
        propertyDetails: { propertyType: "Apartment", issues: ["Low cooling", "Dust build-up"] },
        diagnosis: "Coils heavily caked with dust. Filters clogged. Gas pressure normal.",
        workDone:
          "Full disassembly cleaning of indoor and outdoor units. Coils cleaned with chemical wash. Filters replaced.",
        customerRating: 5,
        customerReview: "Excellent service! AC feels like new. Technician was very thorough.",
        paymentStatus: "paid",
        source: "website",
      },
      {
        bookingNumber: "SB-2026-00002",
        user: regularUsers[1]._id,
        service: services[1]._id,
        items: [{ name: services[1].name, price: services[1].basePrice, quantity: 1 }],
        subtotal: 3000,
        total: 3000,
        status: "scheduled",
        scheduledDate: new Date("2026-05-28"),
        scheduledTime: { start: "14:00", end: "16:00" },
        serviceAddress: {
          fullName: "Karim Uddin",
          phone: "01722223333",
          district: "Chattogram",
          thana: "Halishahar",
          address: "78 Beach Road",
        },
        propertyDetails: { propertyType: "House", issues: ["Not cooling enough", "Gas leak suspected"] },
        paymentStatus: "pending",
        source: "website",
      },
      {
        bookingNumber: "SB-2026-00003",
        user: regularUsers[2]._id,
        service: services[6]._id,
        items: [{ name: services[6].name, price: services[6].basePrice, quantity: 1 }],
        subtotal: 2500,
        total: 2500,
        status: "confirmed",
        serviceAddress: {
          fullName: "Nusrat Jahan",
          phone: "01733334444",
          district: "Dhaka",
          thana: "Uttara",
          address: "12 Sector 7, Road 15",
        },
        propertyDetails: { propertyType: "Apartment", issues: ["AC completely stopped working"] },
        paymentStatus: "pending",
        source: "website",
      },
      {
        bookingNumber: "SB-2026-00004",
        user: regularUsers[3]._id,
        service: services[2]._id,
        items: [{ name: services[2].name, price: services[2].basePrice, quantity: 1 }],
        subtotal: 3500,
        total: 3500,
        status: "pending",
        serviceAddress: {
          fullName: "Shahidul Islam",
          phone: "01744445555",
          district: "Sylhet",
          thana: "Jalalabad",
          address: "88 Tea Garden Road",
        },
        propertyDetails: { propertyType: "House", issues: ["New AC needs installation"] },
        paymentStatus: "pending",
        source: "website",
      },
    ]);
    console.log(`✓ Seeded ${bookings.length} bookings`);

    // ══════════════════════════════════════════════════════════════════
    //  DONE
    // ══════════════════════════════════════════════════════════════════
    await mongoose.disconnect();

    const total = [
      users.length,
      products.length,
      services.length,
      blogs.length,
      recentWorks.length,
      coupons.length,
      technicians.length,
      customers.length,
      expenses.length,
      activities.length,
      orders.length,
      bookings.length,
    ].reduce((a, b) => a + b, 0);

    console.log(`\n✓✓ Seed complete! ${total} records across 12 models`);
    console.log("──────────────────────────────────────");
    console.log("  Admin:    admin@coldflyer.com / Admin@1234");
    console.log("  Tech:     tech@coldflyer.com / Tech@1234");
    console.log("  Users:    fatima@example.com / User@1234");
    console.log("──────────────────────────────────────");
    console.log(`  Users:           ${users.length}`);
    console.log(`  Products:        ${products.length}`);
    console.log(`  Services:        ${services.length}`);
    console.log(`  Blogs:           ${blogs.length}`);
    console.log(`  Recent Works:    ${recentWorks.length}`);
    console.log(`  Coupons:         ${coupons.length}`);
    console.log(`  Technicians:     ${technicians.length}`);
    console.log(`  Customers:       ${customers.length}`);
    console.log(`  Expenses:        ${expenses.length}`);
    console.log(`  Activity Logs:   ${activities.length}`);
    console.log(`  Orders:          ${orders.length}`);
    console.log(`  Bookings:        ${bookings.length}`);
    console.log("──────────────────────────────────────");

    process.exit(0);
  } catch (err) {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  }
}

seed();
