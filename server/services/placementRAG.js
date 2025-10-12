const OffCampusApplication = require("../models/OffCampusApplication");
const OnCampusApplication = require("../models/OnCampusApplication");
const CompanyDrive = require("../models/CompanyDrive");
const User = require("../models/User");

class PlacementRAG {
  // Create documents from user's placement data
  async createUserDocuments(userId) {
    try {
      const user = await User.findById(userId);
      const offCampusApps = await OffCampusApplication.find({ userId });
      const onCampusApps = await OnCampusApplication.find({ userId });
      const drives = await CompanyDrive.find({});

      const documents = [];

      // User Profile Document
      documents.push({
        content: `User Profile:
Name: ${user.name}
College: ${user.college}
Branch: ${user.branch}
Year: ${user.year}
CGPA: ${user.cgpa}
Skills: ${user.skills.join(", ")}
Preferred Roles: ${user.preferredRoles.join(", ")}
Preferred Locations: ${user.preferredLocations.join(", ")}`,
        metadata: {
          type: "profile",
          userId: userId,
          timestamp: new Date(),
        },
      });

      // Off-Campus Applications Documents
      offCampusApps.forEach((app, idx) => {
        documents.push({
          content: `Off-Campus Application #${idx + 1}:
Company: ${app.company}
Job Title: ${app.jobTitle}
Status: ${app.status}
Applied Date: ${app.appliedDate}
Salary: ${app.salary || "Not specified"} ${app.currency}
Notes: ${app.notes || "None"}
Source: ${app.source}
Job Link: ${app.jobLink}`,
          metadata: {
            type: "offcampus_app",
            company: app.company,
            status: app.status,
            appId: app._id,
            userId: userId,
          },
        });
      });

      // On-Campus Applications Documents
      onCampusApps.forEach((app, idx) => {
        documents.push({
          content: `On-Campus Application #${idx + 1}:
Company: ${app.companyName}
Role: ${app.role}
Status: ${app.status}
Applied Date: ${app.appliedDate}
Interview Rounds: ${app.interviewRounds || "Not scheduled"}
Offer Package: ${app.offerPackage || "Not received"} LPA
Offer Location: ${app.offerLocation || "Not specified"}`,
          metadata: {
            type: "oncampus_app",
            company: app.companyName,
            status: app.status,
            appId: app._id,
            userId: userId,
          },
        });
      });

      // Company Drives Documents
      drives.forEach((drive, idx) => {
        documents.push({
          content: `Company Drive #${idx + 1}:
Company: ${drive.companyName}
Roles: ${drive.roles.join(", ")}
Cutoff CGPA: ${drive.cutoffCGPA}
Batch Date: ${drive.batchDate}
Results Date: ${drive.resultsDate}
Average Package: ${drive.averagePackage} LPA
Number Selected: ${drive.numberOfSelected}
Total Applied: ${drive.totalApplied}
Selection Rate: ${((drive.numberOfSelected / drive.totalApplied) * 100).toFixed(2)}%`,
          metadata: {
            type: "company_drive",
            company: drive.companyName,
            driveId: drive._id,
          },
        });
      });

      // Analytics Summary Document
      const analytics = this.calculateAnalytics(offCampusApps, onCampusApps);
      documents.push({
        content: `Placement Statistics:
Total Applications: ${analytics.totalApplications}
Off-Campus Applications: ${offCampusApps.length}
On-Campus Applications: ${onCampusApps.length}
Response Rate: ${analytics.responseRate.toFixed(2)}%
Interview Rate: ${analytics.interviewRate.toFixed(2)}%
Offer Rate: ${analytics.offerRate.toFixed(2)}%
Applications by Status: ${JSON.stringify(analytics.statusBreakdown)}`,
        metadata: {
          type: "analytics",
          userId: userId,
          timestamp: new Date(),
        },
      });

      return documents;
    } catch (error) {
      console.error("❌ Error creating documents:", error);
      return [];
    }
  }

  // Calculate analytics
  calculateAnalytics(offCampusApps, onCampusApps) {
    const responsesReceived = offCampusApps.filter((a) =>
      ["screening", "interview", "offer", "accepted"].includes(a.status)
    ).length;

    const interviewsScheduled = offCampusApps.filter((a) =>
      ["interview", "offer", "accepted"].includes(a.status)
    ).length;

    const offersReceived = offCampusApps.filter((a) =>
      ["offer", "accepted"].includes(a.status)
    ).length;

    const statusBreakdown = {
      applied: offCampusApps.filter((a) => a.status === "applied").length,
      screening: offCampusApps.filter((a) => a.status === "screening").length,
      interview: offCampusApps.filter((a) => a.status === "interview").length,
      offer: offCampusApps.filter((a) => a.status === "offer").length,
      rejected: offCampusApps.filter((a) => a.status === "rejected").length,
      accepted: offCampusApps.filter((a) => a.status === "accepted").length,
    };

    return {
      totalApplications: offCampusApps.length + onCampusApps.length,
      responseRate:
        offCampusApps.length > 0
          ? (responsesReceived / offCampusApps.length) * 100
          : 0,
      interviewRate:
        offCampusApps.length > 0
          ? (interviewsScheduled / offCampusApps.length) * 100
          : 0,
      offerRate:
        offCampusApps.length > 0 ? (offersReceived / offCampusApps.length) * 100 : 0,
      statusBreakdown,
    };
  }
}

module.exports = new PlacementRAG();