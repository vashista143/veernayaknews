import User from '../models/User.js';
import { uploadToR2 } from '../config/r2.js';

// POST /api/reporter/apply - Submit reporter application
export const applyForReporter = async (req, res) => {
  try {
    const { address, phone } = req.body;

    if (!address?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Address and phone number are required.' });
    }

    const idProofFile = req.files?.idProof?.[0];
    const receiptFile = req.files?.paymentReceipt?.[0];

    if (!idProofFile) {
      return res.status(400).json({ success: false, message: 'Valid ID proof document is required.' });
    }

    if (!receiptFile) {
      return res.status(400).json({ success: false, message: 'Payment verification receipt is required.' });
    }

    // Upload files to Cloudflare R2
    const [idProofUrl, paymentReceiptUrl] = await Promise.all([
      uploadToR2({
        originalname: idProofFile.originalname,
        buffer: idProofFile.buffer,
        mimetype: idProofFile.mimetype,
      }),
      uploadToR2({
        originalname: receiptFile.originalname,
        buffer: receiptFile.buffer,
        mimetype: receiptFile.mimetype,
      }),
    ]);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.reporterStatus = 'Pending';
    user.reporterDetails = {
      address: address.trim(),
      phone: phone.trim(),
      idProof: idProofUrl,
      paymentReceipt: paymentReceiptUrl,
      totalAmount: 3000,
      appliedAt: new Date(),
      adminRemarks: '',
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Reporter application submitted successfully.',
      user: {
        id: user._id,
        role: user.role,
        reporterStatus: user.reporterStatus,
        reporterDetails: user.reporterDetails,
      },
    });
  } catch (error) {
    console.error('Reporter application error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reporter/status - Get current reporter application status
export const getReporterStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('reporterStatus reporterDetails role');
    return res.status(200).json({
      success: true,
      reporterStatus: user?.reporterStatus || 'None',
      reporterDetails: user?.reporterDetails || null,
      role: user?.role || 'user',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};