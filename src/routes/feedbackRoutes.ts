import { Router } from "express";
import { prisma } from "../index";
import { authenticateToken, requireManager, requireAdmin } from "../middleware/auth";

const router = Router();

// Issue tag options
const VALID_ISSUE_TAGS = [
  "Product Quality",
  "Packaging Damage",
  "Delivery Delay",
  "Incorrect Product",
  "Quantity Mismatch",
  "Other"
];

// Create feedback
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      dispatchId,
      clientId,
      productId,
      ratingQuality,
      ratingPackaging,
      ratingDelivery,
      clientRemarks,
      issueTags
    } = req.body;

    // Validate required fields
    if (!dispatchId || !clientId || !productId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "dispatchId, clientId, and productId are required"
      });
    }

    // Validate ratings
    if (
      !ratingQuality || !ratingPackaging || !ratingDelivery ||
      ratingQuality < 1 || ratingQuality > 5 ||
      ratingPackaging < 1 || ratingPackaging > 5 ||
      ratingDelivery < 1 || ratingDelivery > 5
    ) {
      return res.status(400).json({
        error: "Invalid ratings",
        message: "All ratings must be integers between 1 and 5"
      });
    }

    // Validate that if any rating < 3, issue tags are required
    if (
      (ratingQuality < 3 || ratingPackaging < 3 || ratingDelivery < 3) &&
      (!issueTags || issueTags.length === 0)
    ) {
      return res.status(400).json({
        error: "Issue tags required",
        message: "At least one issue tag is required when any rating is below 3"
      });
    }

    // Validate issue tags
    if (issueTags && issueTags.length > 0) {
      const invalidTags = issueTags.filter((tag: string) => !VALID_ISSUE_TAGS.includes(tag));
      if (invalidTags.length > 0) {
        return res.status(400).json({
          error: "Invalid issue tags",
          message: `Invalid issue tags: ${invalidTags.join(", ")}. Valid options: ${VALID_ISSUE_TAGS.join(", ")}`
        });
      }
    }

    // Validate client remarks length
    if (clientRemarks && clientRemarks.length > 500) {
      return res.status(400).json({
        error: "Client remarks too long",
        message: "Client remarks must not exceed 500 characters"
      });
    }

    // Check if dispatch exists
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        feedback: true
      }
    });

    if (!dispatch) {
      return res.status(404).json({
        error: "Dispatch not found",
        message: "The specified dispatch does not exist"
      });
    }

    // Check if dispatch status is Delivered
    if (dispatch.status !== "Delivered") {
      return res.status(400).json({
        error: "Invalid dispatch status",
        message: "Feedback can only be submitted for delivered dispatches"
      });
    }

    // Check if feedback already exists for this dispatch
    if (dispatch.feedback) {
      return res.status(400).json({
        error: "Feedback already exists",
        message: "Feedback has already been submitted for this dispatch"
      });
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        dispatchId,
        clientId,
        productId,
        ratingQuality: parseInt(ratingQuality),
        ratingPackaging: parseInt(ratingPackaging),
        ratingDelivery: parseInt(ratingDelivery),
        clientRemarks: clientRemarks || "",
        issueTags: issueTags || []
      },
      include: {
        dispatch: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    res.status(500).json({
      error: "Failed to create feedback",
      message: error.message
    });
  }
});

// Get all feedback with filters
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      minRating,
      maxRating,
      issueTags,
      startDate,
      endDate,
      page = "1",
      limit = "10"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (minRating || maxRating) {
      const min = minRating ? parseInt(minRating as string) : 1;
      const max = maxRating ? parseInt(maxRating as string) : 5;
      
      // Filter by average rating
      where.OR = [
        { ratingQuality: { gte: min, lte: max } },
        { ratingPackaging: { gte: min, lte: max } },
        { ratingDelivery: { gte: min, lte: max } }
      ];
    }

    if (issueTags) {
      const tags = Array.isArray(issueTags) ? issueTags : [issueTags];
      where.issueTags = {
        hasSome: tags
      };
    }

    if (startDate || endDate) {
      where.feedbackDate = {};
      if (startDate) {
        where.feedbackDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.feedbackDate.lte = new Date(endDate as string);
      }
    }

    // Get total count
    const total = await prisma.feedback.count({ where });

    // Get feedback
    const feedbacks = await prisma.feedback.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        feedbackDate: "desc"
      },
      include: {
        dispatch: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      feedbacks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      error: "Failed to fetch feedback",
      message: error.message
    });
  }
});

// Get all feedback for a specific client with analytics
router.get("/client/:clientId", authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;

    // Get all feedback for this client
    const feedbacks = await prisma.feedback.findMany({
      where: { clientId },
      orderBy: {
        feedbackDate: "desc"
      },
      include: {
        dispatch: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true
              }
            }
          }
        }
      }
    });

    // Calculate averages
    let totalQuality = 0;
    let totalPackaging = 0;
    let totalDelivery = 0;
    const issueCounts: { [key: string]: number } = {};

    feedbacks.forEach(feedback => {
      totalQuality += feedback.ratingQuality;
      totalPackaging += feedback.ratingPackaging;
      totalDelivery += feedback.ratingDelivery;

      feedback.issueTags.forEach(tag => {
        issueCounts[tag] = (issueCounts[tag] || 0) + 1;
      });
    });

    const count = feedbacks.length;
    const averages = count > 0 ? {
      overall: ((totalQuality + totalPackaging + totalDelivery) / (count * 3)).toFixed(2),
      quality: (totalQuality / count).toFixed(2),
      packaging: (totalPackaging / count).toFixed(2),
      delivery: (totalDelivery / count).toFixed(2)
    } : {
      overall: 0,
      quality: 0,
      packaging: 0,
      delivery: 0
    };

    res.json({
      feedbacks,
      averages,
      issueCounts,
      totalFeedbacks: count
    });
  } catch (error: any) {
    console.error("Error fetching client feedback:", error);
    res.status(500).json({
      error: "Failed to fetch client feedback",
      message: error.message
    });
  }
});

// Get single feedback by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        dispatch: {
          include: {
            invoice: {
              include: {
                client: true
              }
            }
          }
        },
        client: true
      }
    });

    if (!feedback) {
      return res.status(404).json({
        error: "Feedback not found",
        message: "The specified feedback does not exist"
      });
    }

    res.json({ feedback });
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      error: "Failed to fetch feedback",
      message: error.message
    });
  }
});

// Update feedback
router.patch("/:id", authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ratingQuality,
      ratingPackaging,
      ratingDelivery,
      clientRemarks,
      issueTags
    } = req.body;

    const updateData: any = {};

    if (ratingQuality !== undefined) {
      if (ratingQuality < 1 || ratingQuality > 5) {
        return res.status(400).json({
          error: "Invalid rating",
          message: "Quality rating must be between 1 and 5"
        });
      }
      updateData.ratingQuality = parseInt(ratingQuality);
    }

    if (ratingPackaging !== undefined) {
      if (ratingPackaging < 1 || ratingPackaging > 5) {
        return res.status(400).json({
          error: "Invalid rating",
          message: "Packaging rating must be between 1 and 5"
        });
      }
      updateData.ratingPackaging = parseInt(ratingPackaging);
    }

    if (ratingDelivery !== undefined) {
      if (ratingDelivery < 1 || ratingDelivery > 5) {
        return res.status(400).json({
          error: "Invalid rating",
          message: "Delivery rating must be between 1 and 5"
        });
      }
      updateData.ratingDelivery = parseInt(ratingDelivery);
    }

    if (clientRemarks !== undefined) {
      if (clientRemarks.length > 500) {
        return res.status(400).json({
          error: "Client remarks too long",
          message: "Client remarks must not exceed 500 characters"
        });
      }
      updateData.clientRemarks = clientRemarks;
    }

    if (issueTags !== undefined) {
      if (issueTags.length > 0) {
        const invalidTags = issueTags.filter((tag: string) => !VALID_ISSUE_TAGS.includes(tag));
        if (invalidTags.length > 0) {
          return res.status(400).json({
            error: "Invalid issue tags",
            message: `Invalid issue tags: ${invalidTags.join(", ")}`
          });
        }
      }
      updateData.issueTags = issueTags;
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        dispatch: {
          include: {
            invoice: true
          }
        },
        client: true
      }
    });

    res.json({
      message: "Feedback updated successfully",
      feedback
    });
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      error: "Failed to update feedback",
      message: error.message
    });
  }
});

// Delete feedback
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return res.status(404).json({
        error: "Feedback not found",
        message: "The specified feedback does not exist"
      });
    }

    await prisma.feedback.delete({
      where: { id }
    });

    res.json({
      message: "Feedback deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      error: "Failed to delete feedback",
      message: error.message
    });
  }
});

export default router;

