const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const mongoose = require("mongoose");
const Participant = require("../src/models/Participant");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

async function backfill() {
    try {
        console.log("Connecting to MongoDB for migration...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // Get all unique activityIds in Participant collection
        const activityIds = await Participant.distinct("activityId");
        console.log(`Found ${activityIds.length} unique activities in Participant collection.`);

        let totalUpdated = 0;

        for (const actId of activityIds) {
            // Find all participants for this activity sorted by creation order
            const participants = await Participant.find({ activityId: actId }).sort({ createdDate: 1, _id: 1 });
            console.log(`Activity ${actId}: ${participants.length} participants found.`);

            let seq = 1;
            for (const p of participants) {
                await Participant.updateOne(
                    { _id: p._id },
                    { $set: { participantNumber: seq } }
                );
                console.log(`  Assigned #${seq} to participant ${p.fullName} (${p._id})`);
                seq++;
                totalUpdated++;
            }
        }

        console.log(`\nMigration completed successfully! Total participants updated: ${totalUpdated}`);

        // Verify all records have participantNumber
        const unassigned = await Participant.countDocuments({
            $or: [
                { participantNumber: { $exists: false } },
                { participantNumber: null }
            ]
        });
        console.log(`Unassigned participant count: ${unassigned}`);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

backfill();
