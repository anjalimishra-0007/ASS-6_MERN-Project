import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FeeStructure from '../models/FeeStructure.js';
import Payment from '../models/Payment.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fee_management_db';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing collections
    console.log('Clearing existing records...');
    await User.deleteMany({});
    await FeeStructure.deleteMany({});
    await Payment.deleteMany({});

    // 1. Create Admin
    console.log('Creating Admin Account...');
    const admin = await User.create({
      name: 'Dr. Rajesh Sharma (Accountant/Admin)',
      email: 'admin@institute.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210'
    });

    // 2. Create Students
    console.log('Creating Student Accounts...');
    const studentsData = [
      {
        name: 'Aarav Patel',
        email: 'aarav.patel@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'CS2026001',
        course: 'B.Tech CSE',
        semester: 1,
        phone: '+91 98111 22334'
      },
      {
        name: 'Priya Nair',
        email: 'priya.nair@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'CS2026002',
        course: 'B.Tech CSE',
        semester: 1,
        phone: '+91 98222 33445'
      },
      {
        name: 'Rohan Verma',
        email: 'rohan.verma@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'BCA202601',
        course: 'BCA',
        semester: 1,
        phone: '+91 98333 44556'
      },
      {
        name: 'Sneha Kulkarni',
        email: 'sneha.k@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'BCA202602',
        course: 'BCA',
        semester: 1,
        phone: '+91 98444 55667'
      },
      {
        name: 'Vikramaditya Rao',
        email: 'vikram.rao@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'BBA202601',
        course: 'BBA',
        semester: 1,
        phone: '+91 98555 66778'
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya.d@student.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: 'BBA202602',
        course: 'BBA',
        semester: 1,
        phone: '+91 98666 77889'
      }
    ];

    const students = [];
    for (const data of studentsData) {
      const student = await User.create(data);
      students.push(student);
    }

    // 3. Create Fee Structures
    console.log('Creating Fee Structures...');
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 20); // 20 days overdue for some testing

    const futureDueDate = new Date();
    futureDueDate.setDate(futureDueDate.getDate() + 45); // 45 days in future

    const btechFee = await FeeStructure.create({
      course: 'B.Tech CSE',
      academicYear: '2025-2026',
      semester: 1,
      feeHeads: [
        { headName: 'Tuition Fee', amount: 50000 },
        { headName: 'Laboratory & Tech Fee', amount: 15000 },
        { headName: 'Examination Fee', amount: 5000 },
        { headName: 'Library & Online Resources', amount: 3000 },
        { headName: 'Student Welfare & Sports', amount: 2000 }
      ],
      totalAmount: 75000,
      dueDate: pastDueDate,
      lateFeePerDay: 50,
      remarks: 'First Semester Standard B.Tech CSE Fee'
    });

    const bcaFee = await FeeStructure.create({
      course: 'BCA',
      academicYear: '2025-2026',
      semester: 1,
      feeHeads: [
        { headName: 'Tuition Fee', amount: 35000 },
        { headName: 'Computer Lab Fee', amount: 8000 },
        { headName: 'Examination Fee', amount: 4000 },
        { headName: 'Library Fee', amount: 2000 }
      ],
      totalAmount: 49000,
      dueDate: pastDueDate,
      lateFeePerDay: 40,
      remarks: 'First Semester Regular BCA Fee'
    });

    const bbaFee = await FeeStructure.create({
      course: 'BBA',
      academicYear: '2025-2026',
      semester: 1,
      feeHeads: [
        { headName: 'Tuition Fee', amount: 40000 },
        { headName: 'Business Lab & Seminars', amount: 6000 },
        { headName: 'Examination Fee', amount: 4000 },
        { headName: 'Library & Journals', amount: 2000 }
      ],
      totalAmount: 52000,
      dueDate: futureDueDate,
      lateFeePerDay: 50,
      remarks: 'First Semester Regular BBA Fee'
    });

    // 4. Create at least 10+ Payments (Main Collection Seed)
    console.log('Seeding 12 Payment records in main collection...');
    const paymentsData = [
      // Aarav Patel (B.Tech - paid in 2 installments: 40000 + 35000 = 75000 -> FULLY PAID)
      {
        receiptNo: 'RCP-2026-0001',
        student: students[0]._id,
        feeStructure: btechFee._id,
        amountPaid: 40000,
        lateFeeIncluded: 0,
        paymentMode: 'Net Banking',
        paymentDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        transactionReference: 'HDFC984271892',
        recordedBy: admin._id,
        remarks: 'First installment paid online via HDFC net banking'
      },
      {
        receiptNo: 'RCP-2026-0002',
        student: students[0]._id,
        feeStructure: btechFee._id,
        amountPaid: 35000,
        lateFeeIncluded: 0,
        paymentMode: 'UPI',
        paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        transactionReference: 'UPI-9923847291-OKAXIS',
        recordedBy: admin._id,
        remarks: 'Final installment cleared through UPI'
      },

      // Priya Nair (B.Tech - paid 30000 out of 75000 -> PARTIALLY PAID & OVERDUE)
      {
        receiptNo: 'RCP-2026-0003',
        student: students[1]._id,
        feeStructure: btechFee._id,
        amountPaid: 20000,
        lateFeeIncluded: 0,
        paymentMode: 'Card',
        paymentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        transactionReference: 'POS-TXN-8849102',
        recordedBy: admin._id,
        remarks: 'Initial token fee paid via Debit Card at admin counter'
      },
      {
        receiptNo: 'RCP-2026-0004',
        student: students[1]._id,
        feeStructure: btechFee._id,
        amountPaid: 10000,
        lateFeeIncluded: 0,
        paymentMode: 'UPI',
        paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        transactionReference: 'UPI-7738291048-PAYTM',
        recordedBy: admin._id,
        remarks: 'Partial fee payment received via Paytm UPI'
      },

      // Rohan Verma (BCA - paid 25000 out of 49000 -> PARTIALLY PAID)
      {
        receiptNo: 'RCP-2026-0005',
        student: students[2]._id,
        feeStructure: bcaFee._id,
        amountPaid: 15000,
        lateFeeIncluded: 0,
        paymentMode: 'Cash',
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        transactionReference: 'CASH-REC-00192',
        recordedBy: admin._id,
        remarks: 'Cash deposit at campus finance counter'
      },
      {
        receiptNo: 'RCP-2026-0006',
        student: students[2]._id,
        feeStructure: bcaFee._id,
        amountPaid: 10000,
        lateFeeIncluded: 0,
        paymentMode: 'UPI',
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        transactionReference: 'UPI-5561029384-GPAY',
        recordedBy: admin._id,
        remarks: 'Second partial installment through Google Pay'
      },

      // Sneha Kulkarni (BCA - paid full 49000 in one shot -> FULLY PAID)
      {
        receiptNo: 'RCP-2026-0007',
        student: students[3]._id,
        feeStructure: bcaFee._id,
        amountPaid: 49000,
        lateFeeIncluded: 0,
        paymentMode: 'Net Banking',
        paymentDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        transactionReference: 'ICICI449018274',
        recordedBy: admin._id,
        remarks: 'Full semester payment through ICICI corporate gateway'
      },

      // Vikramaditya Rao (BBA - paid 26000 out of 52000 -> PARTIALLY PAID)
      {
        receiptNo: 'RCP-2026-0008',
        student: students[4]._id,
        feeStructure: bbaFee._id,
        amountPaid: 26000,
        lateFeeIncluded: 0,
        paymentMode: 'Card',
        paymentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        transactionReference: 'POS-TXN-991204',
        recordedBy: admin._id,
        remarks: '50% tuition installment paid via Credit Card'
      },

      // Ananya Deshmukh (BBA - paid full 52000 in 2 transactions -> FULLY PAID)
      {
        receiptNo: 'RCP-2026-0009',
        student: students[5]._id,
        feeStructure: bbaFee._id,
        amountPaid: 30000,
        lateFeeIncluded: 0,
        paymentMode: 'UPI',
        paymentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        transactionReference: 'UPI-8849102948-PHONEPE',
        recordedBy: admin._id,
        remarks: 'First phase payment received'
      },
      {
        receiptNo: 'RCP-2026-0010',
        student: students[5]._id,
        feeStructure: bbaFee._id,
        amountPaid: 22000,
        lateFeeIncluded: 0,
        paymentMode: 'Cash',
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        transactionReference: 'CASH-REC-00214',
        recordedBy: admin._id,
        remarks: 'Final balance deposited at cash window'
      },

      // Additional Payments to exceed 10 records requirement and test dashboard metrics
      {
        receiptNo: 'RCP-2026-0011',
        student: students[4]._id,
        feeStructure: bbaFee._id,
        amountPaid: 10000,
        lateFeeIncluded: 0,
        paymentMode: 'UPI',
        paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        transactionReference: 'UPI-1192837465-OKSBI',
        recordedBy: admin._id,
        remarks: 'Subsequent installment towards BBA Sem 1'
      },
      {
        receiptNo: 'RCP-2026-0012',
        student: students[2]._id,
        feeStructure: bcaFee._id,
        amountPaid: 5000,
        lateFeeIncluded: 0,
        paymentMode: 'Card',
        paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        transactionReference: 'POS-TXN-102948',
        recordedBy: admin._id,
        remarks: 'Exam fee clearance'
      }
    ];

    await Payment.insertMany(paymentsData);

    console.log('----------------------------------------------------');
    console.log('Seeding successfully completed!');
    console.log(`- Admin: admin@institute.edu (Password: Admin@123)`);
    console.log(`- Students created: ${students.length} (Password for all: Student@123)`);
    console.log(`  * Aarav Patel: aarav.patel@student.edu (Roll: CS2026001)`);
    console.log(`  * Priya Nair: priya.nair@student.edu (Roll: CS2026002)`);
    console.log(`  * Rohan Verma: rohan.verma@student.edu (Roll: BCA202601)`);
    console.log(`  * Sneha Kulkarni: sneha.k@student.edu (Roll: BCA202602)`);
    console.log(`  * Vikramaditya Rao: vikram.rao@student.edu (Roll: BBA202601)`);
    console.log(`  * Ananya Deshmukh: ananya.d@student.edu (Roll: BBA202602)`);
    console.log(`- Fee Structures: 3 created (B.Tech CSE, BCA, BBA)`);
    console.log(`- Main Collection (Payments): ${paymentsData.length} records seeded`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
