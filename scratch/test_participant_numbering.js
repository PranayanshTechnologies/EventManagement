const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const mongoose = require("mongoose");
const Participant = require("../src/models/Participant");
const Activity = require("../src/models/Activity");
const UserDirectory = require("../src/models/UserDirectory");
const participantService = require("../src/services/participantService");
const adminService = require("../src/services/adminService");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

async function runTests() {
    try {
        console.log("=== STARTING QUEUE NUMBERING TESTS ===");
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create a dedicated test user and two test activities
        const testUser = await UserDirectory.findOneAndUpdate(
            { phone: "9999988888" },
            {
                fullName: "Queue Tester",
                phone: "9999988888",
                society: "Test Heights",
                tower: "A",
                floor: "3",
                flatNumber: "302",
                isAdmin: true
            },
            { upsert: true, new: true }
        );

        const activityA = await Activity.create({
            activity: "Test Singing Activity " + Date.now(),
            venue: "Club House",
            startDateTime: new Date("2026-10-10T10:00:00Z"),
            endDateTime: new Date("2026-10-10T12:00:00Z"),
            isActive: true,
            isDeleted: false,
            createdBy: testUser._id
        });

        const activityB = await Activity.create({
            activity: "Test Painting Activity " + Date.now(),
            venue: "Community Hall",
            startDateTime: new Date("2026-10-10T14:00:00Z"),
            endDateTime: new Date("2026-10-10T16:00:00Z"),
            isActive: true,
            isDeleted: false,
            createdBy: testUser._id
        });

        console.log("Created test activities:", activityA.activity, "and", activityB.activity);

        // 2. Register 3 participants for Activity A
        console.log("\n--- Testing Activity A Number Generation ---");
        const pA1 = await participantService.registerParticipant(testUser._id, {
            activityId: activityA._id,
            fullName: "Rahul Kumar"
        });
        console.log(`Activity A - Reg 1: ${pA1.fullName} -> participantNumber = ${pA1.participantNumber}`);
        if (pA1.participantNumber !== 1) throw new Error(`Expected 1, got ${pA1.participantNumber}`);

        const pA2 = await participantService.registerParticipant(testUser._id, {
            activityId: activityA._id,
            fullName: "Amit Verma"
        });
        console.log(`Activity A - Reg 2: ${pA2.fullName} -> participantNumber = ${pA2.participantNumber}`);
        if (pA2.participantNumber !== 2) throw new Error(`Expected 2, got ${pA2.participantNumber}`);

        const pA3 = await participantService.registerParticipant(testUser._id, {
            activityId: activityA._id,
            fullName: "Manish Sharma"
        });
        console.log(`Activity A - Reg 3: ${pA3.fullName} -> participantNumber = ${pA3.participantNumber}`);
        if (pA3.participantNumber !== 3) throw new Error(`Expected 3, got ${pA3.participantNumber}`);

        // 3. Register participants for Activity B to test independence
        console.log("\n--- Testing Activity B Number Generation (Independent Queue) ---");
        const pB1 = await participantService.registerParticipant(testUser._id, {
            activityId: activityB._id,
            fullName: "Priya Singh"
        });
        console.log(`Activity B - Reg 1: ${pB1.fullName} -> participantNumber = ${pB1.participantNumber}`);
        if (pB1.participantNumber !== 1) throw new Error(`Expected Activity B first participant to be 1, got ${pB1.participantNumber}`);

        const pB2 = await participantService.registerParticipant(testUser._id, {
            activityId: activityB._id,
            fullName: "Sneha Roy"
        });
        console.log(`Activity B - Reg 2: ${pB2.fullName} -> participantNumber = ${pB2.participantNumber}`);
        if (pB2.participantNumber !== 2) throw new Error(`Expected Activity B second participant to be 2, got ${pB2.participantNumber}`);

        // 4. Test Withdrawal & Permanent Queue Position
        console.log("\n--- Testing Withdrawal & Historical Queue Preservation ---");
        await participantService.withdrawRegistration(pA1._id, testUser._id, true);
        console.log(`Withdrew Activity A participant #1 (${pA1.fullName})`);

        // Check public participants list
        const publicList = await participantService.getPublicActivityParticipants(activityA._id);
        console.log("Public list for Activity A (including withdrawn):");
        publicList.forEach((p) => {
            console.log(`  #${p.participantNumber} | ${p.fullName} | Withdrawn: ${p.isWithdraw}`);
        });

        const manishRecord = publicList.find(p => p.fullName === "Manish Sharma");
        if (manishRecord.participantNumber !== 3) {
            throw new Error(`Manish Sharma should remain #3 after Rahul withdraws, but got #${manishRecord.participantNumber}`);
        }
        console.log("✅ Manish Sharma correctly remained #3 after #1 withdrew!");

        // 5. Test Non-Reuse on next registration after withdrawal
        console.log("\n--- Testing Next Registration Number after Withdrawal (No Number Reuse) ---");
        const pA4 = await participantService.registerParticipant(testUser._id, {
            activityId: activityA._id,
            fullName: "Rohan Gupta"
        });
        console.log(`Activity A - Reg 4: ${pA4.fullName} -> participantNumber = ${pA4.participantNumber}`);
        if (pA4.participantNumber !== 4) {
            throw new Error(`Expected next participant to get #4, but got #${pA4.participantNumber}`);
        }
        console.log("✅ Next participant correctly received #4 (did not reuse #1)!");

        // 6. Test Search maintains permanent participant number
        console.log("\n--- Testing Search Queue Integrity ---");
        const searchResults = await participantService.getPublicActivityParticipants(activityA._id, { search: "Manish" });
        console.log(`Search 'Manish' returned ${searchResults.length} record(s):`);
        searchResults.forEach(p => console.log(`  #${p.participantNumber} | ${p.fullName}`));
        if (searchResults.length !== 1 || searchResults[0].participantNumber !== 3) {
            throw new Error(`Search should return Manish with participantNumber = 3, got #${searchResults[0]?.participantNumber}`);
        }
        console.log("✅ Search preserved queue number #3 for Manish!");

        // 7. Test Admin API sorting & participantNumber
        console.log("\n--- Testing Admin Participants API ---");
        const adminRes = await adminService.getActivityParticipants(activityA._id);
        console.log(`Admin API returned ${adminRes.participants.length} participants:`);
        adminRes.participants.forEach(p => {
            console.log(`  #${p.participantNumber} | ${p.fullName} | Withdrawn: ${p.isWithdraw}`);
        });
        if (adminRes.participants[0].participantNumber === undefined) {
            throw new Error("Admin API missing participantNumber!");
        }

        // Cleanup test data
        console.log("\n--- Cleaning up test records ---");
        await Participant.deleteMany({ activityId: { $in: [activityA._id, activityB._id] } });
        await Activity.deleteMany({ _id: { $in: [activityA._id, activityB._id] } });
        await UserDirectory.deleteOne({ _id: testUser._id });
        console.log("Cleaned up test data.");

        await mongoose.disconnect();
        console.log("\n🎉 ALL PARTICIPANT NUMBERING TESTS PASSED PERFECTLY!");
    } catch (err) {
        console.error("❌ Test failed:", err);
        process.exit(1);
    }
}

runTests();
