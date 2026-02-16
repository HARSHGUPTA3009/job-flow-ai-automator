// const express = require('express');
// const router = express.Router();
// const Profile = require('../models/Profile'); // Adjust path as needed
// const multer = require('multer');
// const { GridFSBucket } = require('mongodb');
// const mongoose = require('mongoose');

// // Configure multer for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
//     }
//   }
// });

// // ============================================================================
// // PROFILE ROUTES
// // ============================================================================

// // GET profile by userId
// router.get('/profile/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const profile = await Profile.findOne({ userId });
    
//     if (!profile) {
//       return res.status(404).json({ error: 'Profile not found' });
//     }
    
//     res.json(profile);
//   } catch (error) {
//     console.error('Error fetching profile:', error);
//     res.status(500).json({ error: 'Failed to fetch profile' });
//   }
// });

// // POST/UPDATE profile
// router.post('/profile', async (req, res) => {
//   try {
//     const { userId, ...profileData } = req.body;
    
//     if (!userId) {
//       return res.status(400).json({ error: 'User ID is required' });
//     }

//     // Validate required fields
//     const requiredFields = ['name', 'email', 'phone', 'college', 'branch', 'year', 'cgpa'];
//     for (const field of requiredFields) {
//       if (!profileData[field] && profileData[field] !== 0) {
//         return res.status(400).json({ error: `${field} is required` });
//       }
//     }

//     // Update or create profile
//     const profile = await Profile.findOneAndUpdate(
//       { userId },
//       { userId, ...profileData },
//       { new: true, upsert: true, runValidators: true }
//     );

//     res.json(profile);
//   } catch (error) {
//     console.error('Error saving profile:', error);
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(e => e.message);
//       return res.status(400).json({ error: messages.join(', ') });
//     }
//     res.status(500).json({ error: 'Failed to save profile' });
//   }
// });

// // ============================================================================
// // RESUME ROUTES
// // ============================================================================

// // Upload resume
// router.post('/resume/upload', upload.single('file'), async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const file = req.file;

//     if (!userId) {
//       return res.status(400).json({ error: 'User ID is required' });
//     }

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Initialize GridFS
//     const db = mongoose.connection.db;
//     const bucket = new GridFSBucket(db, { bucketName: 'resumes' });

//     // Upload to GridFS
//     const uploadStream = bucket.openUploadStream(file.originalname, {
//       contentType: file.mimetype,
//       metadata: { userId }
//     });

//     uploadStream.end(file.buffer);

//     uploadStream.on('finish', async () => {
//       try {
//         // Add resume to profile
//         const profile = await Profile.findOneAndUpdate(
//           { userId },
//           {
//             $push: {
//               resumes: {
//                 fileId: uploadStream.id.toString(),
//                 name: file.originalname,
//                 uploadDate: new Date(),
//                 isActive: false
//               }
//             }
//           },
//           { new: true, upsert: true }
//         );

//         res.json({
//           message: 'Resume uploaded successfully',
//           fileId: uploadStream.id.toString(),
//           resumes: profile.resumes
//         });
//       } catch (error) {
//         console.error('Error updating profile:', error);
//         res.status(500).json({ error: 'Failed to update profile' });
//       }
//     });

//     uploadStream.on('error', (error) => {
//       console.error('Upload error:', error);
//       res.status(500).json({ error: 'Failed to upload file' });
//     });

//   } catch (error) {
//     console.error('Error uploading resume:', error);
//     res.status(500).json({ error: 'Failed to upload resume' });
//   }
// });

// // Delete resume
// router.delete('/resume/:fileId', async (req, res) => {
//   try {
//     const { fileId } = req.params;
//     const { userId } = req.body;

//     if (!userId) {
//       return res.status(400).json({ error: 'User ID is required' });
//     }

//     // Delete from GridFS
//     const db = mongoose.connection.db;
//     const bucket = new GridFSBucket(db, { bucketName: 'resumes' });
    
//     await bucket.delete(new mongoose.Types.ObjectId(fileId));

//     // Remove from profile
//     const profile = await Profile.findOneAndUpdate(
//       { userId },
//       { $pull: { resumes: { fileId } } },
//       { new: true }
//     );

//     res.json({
//       message: 'Resume deleted successfully',
//       resumes: profile.resumes
//     });
//   } catch (error) {
//     console.error('Error deleting resume:', error);
//     res.status(500).json({ error: 'Failed to delete resume' });
//   }
// });

// // Download resume
// router.get('/resume/download/:fileId', async (req, res) => {
//   try {
//     const { fileId } = req.params;

//     const db = mongoose.connection.db;
//     const bucket = new GridFSBucket(db, { bucketName: 'resumes' });

//     const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

//     downloadStream.on('error', () => {
//       res.status(404).json({ error: 'File not found' });
//     });

//     downloadStream.pipe(res);
//   } catch (error) {
//     console.error('Error downloading resume:', error);
//     res.status(500).json({ error: 'Failed to download resume' });
//   }
// });

// // ============================================================================
// // OFF-CAMPUS APPLICATION ROUTES
// // ============================================================================

// // Create models for other collections (add these at the top of the file)
// const OffCampusApplicationSchema = new mongoose.Schema({
//   userId: { type: String, required: true, index: true },
//   company: { type: String, required: true },
//   jobTitle: { type: String, required: true },
//   jobLink: String,
//   salary: Number,
//   currency: { type: String, default: 'INR' },
//   appliedDate: { type: String, required: true },
//   statusUpdatedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
//   status: { 
//     type: String, 
//     enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
//     default: 'applied'
//   },
//   notes: String,
//   followUpDates: [String],
//   source: {
//     type: String,
//     enum: ['linkedin', 'indeed', 'naukri', 'direct', 'other'],
//     default: 'linkedin'
//   }
// }, { timestamps: true });

// const CompanyDriveSchema = new mongoose.Schema({
//   userId: { type: String, required: true, index: true },
//   companyName: { type: String, required: true },
//   roles: [String],
//   cutoffCGPA: Number,
//   batchDate: String,
//   resultsDate: String,
//   averagePackage: Number,
//   numberOfSelected: Number,
//   totalApplied: Number
// }, { timestamps: true });

// const OnCampusApplicationSchema = new mongoose.Schema({
//   userId: { type: String, required: true, index: true },
//   companyName: { type: String, required: true },
//   role: String,
//   appliedDate: String,
//   status: {
//     type: String,
//     enum: ['applied', 'shortlisted', 'interview_1', 'interview_2', 'interview_3', 'rejected', 'offer'],
//     default: 'applied'
//   },
//   interviewRounds: Number,
//   offerPackage: Number,
//   offerLocation: String
// }, { timestamps: true });

// const OffCampusApplication = mongoose.model('OffCampusApplication', OffCampusApplicationSchema);
// const CompanyDrive = mongoose.model('CompanyDrive', CompanyDriveSchema);
// const OnCampusApplication = mongoose.model('OnCampusApplication', OnCampusApplicationSchema);

// // GET off-campus applications
// router.get('/off-campus/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const applications = await OffCampusApplication.find({ userId }).sort({ createdAt: -1 });
//     res.json(applications);
//   } catch (error) {
//     console.error('Error fetching applications:', error);
//     res.status(500).json({ error: 'Failed to fetch applications' });
//   }
// });

// // POST off-campus application
// router.post('/off-campus', async (req, res) => {
//   try {
//     const application = new OffCampusApplication(req.body);
//     await application.save();
//     res.json(application);
//   } catch (error) {
//     console.error('Error creating application:', error);
//     res.status(500).json({ error: 'Failed to create application' });
//   }
// });

// // PUT off-campus application
// router.put('/off-campus/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const application = await OffCampusApplication.findByIdAndUpdate(
//       id,
//       { ...req.body, statusUpdatedDate: new Date().toISOString().split('T')[0] },
//       { new: true }
//     );
//     res.json(application);
//   } catch (error) {
//     console.error('Error updating application:', error);
//     res.status(500).json({ error: 'Failed to update application' });
//   }
// });

// // DELETE off-campus application
// router.delete('/off-campus/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     await OffCampusApplication.findByIdAndDelete(id);
//     res.json({ message: 'Application deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting application:', error);
//     res.status(500).json({ error: 'Failed to delete application' });
//   }
// });

// // ============================================================================
// // COMPANY DRIVE ROUTES
// // ============================================================================

// router.get('/company-drives/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const drives = await CompanyDrive.find({ userId }).sort({ createdAt: -1 });
//     res.json(drives);
//   } catch (error) {
//     console.error('Error fetching drives:', error);
//     res.status(500).json({ error: 'Failed to fetch drives' });
//   }
// });

// router.post('/company-drives', async (req, res) => {
//   try {
//     const drive = new CompanyDrive(req.body);
//     await drive.save();
//     res.json(drive);
//   } catch (error) {
//     console.error('Error creating drive:', error);
//     res.status(500).json({ error: 'Failed to create drive' });
//   }
// });

// router.delete('/company-drives/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     await CompanyDrive.findByIdAndDelete(id);
//     res.json({ message: 'Drive deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting drive:', error);
//     res.status(500).json({ error: 'Failed to delete drive' });
//   }
// });

// // ============================================================================
// // ON-CAMPUS APPLICATION ROUTES
// // ============================================================================

// router.get('/on-campus/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const applications = await OnCampusApplication.find({ userId }).sort({ createdAt: -1 });
//     res.json(applications);
//   } catch (error) {
//     console.error('Error fetching on-campus applications:', error);
//     res.status(500).json({ error: 'Failed to fetch applications' });
//   }
// });

// router.post('/on-campus', async (req, res) => {
//   try {
//     const application = new OnCampusApplication(req.body);
//     await application.save();
//     res.json(application);
//   } catch (error) {
//     console.error('Error creating on-campus application:', error);
//     res.status(500).json({ error: 'Failed to create application' });
//   }
// });

// module.exports = router;