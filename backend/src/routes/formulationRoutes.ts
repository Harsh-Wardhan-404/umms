import express from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireManager } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 1. Create a new formulation
router.post("", authenticateToken, requireManager, async (req, res) => {
  try {
    const { productName, initialIngredients } = req.body;

    // Validate required fields
    if (!productName || !initialIngredients || !Array.isArray(initialIngredients)) {
      return res.status(400).json({
        error: "Product name and initial ingredients array are required"
      });
    }

    // Validate that total composition equals 100%
    const totalComposition = initialIngredients.reduce(
      (sum, ing) => sum + (parseFloat(ing.percentageOrComposition) || 0),
      0
    );
    if (Math.abs(totalComposition - 100) > 0.01) {
      return res.status(400).json({
        error: `Total composition must equal 100%. Current total: ${totalComposition.toFixed(2)}%`
      });
    }

    // Check if formulation already exists
    const existingFormulation = await prisma.formulation.findUnique({
      where: { productName }
    });

    if (existingFormulation) {
      return res.status(400).json({
        error: "Formulation with this product name already exists"
      });
    }

    // Create the formulation
    const formulation = await prisma.formulation.create({
      data: {
        productName
      }
    });

    // Create the first version (V1) - automatically use logged-in user's ID
    const firstVersion = await prisma.formulationVersion.create({
      data: {
        formulationId: formulation.id,
        versionNumber: 1,
        isLocked: false,
        creatorId: req.user!.userId, // Automatically from JWT token
        creationDate: new Date(),
        notes: "Initial version"
      }
    });

    // Add ingredients to the first version
    if (initialIngredients.length > 0) {
      const ingredientPromises = initialIngredients.map((ingredient: any) =>
        prisma.formulationIngredient.create({
          data: {
            formulationVersionId: firstVersion.id,
            materialId: ingredient.materialId,
            percentageOrComposition: ingredient.percentageOrComposition,
            unit: ingredient.unit,
            notes: ingredient.notes || ""
          }
        })
      );

      await Promise.all(ingredientPromises);
    }

    // Fetch the complete formulation with version and ingredients
    const completeFormulation = await prisma.formulation.findUnique({
      where: { id: formulation.id },
      include: {
        versions: {
          include: {
            ingredients: {
              include: {
                material: true
              }
            }
          },
          orderBy: { versionNumber: "desc" }
        }
      }
    });

    res.status(201).json({
      message: "Formulation created successfully",
      formulation: completeFormulation
    });

  } catch (error) {
    console.error("Error creating formulation:", error);
    res.status(500).json({
      error: "Failed to create formulation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 2. Create a new version of an existing formulation
router.post("/:formulationId/versions", authenticateToken, requireManager, async (req, res) => {
  try {
    const { formulationId } = req.params;
    const { ingredients, notes } = req.body;

    // Validate required fields
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: "Ingredients array is required"
      });
    }

    // Validate that total composition equals 100%
    const totalComposition = ingredients.reduce(
      (sum, ing) => sum + (parseFloat(ing.percentageOrComposition) || 0),
      0
    );
    if (Math.abs(totalComposition - 100) > 0.01) {
      return res.status(400).json({
        error: `Total composition must equal 100%. Current total: ${totalComposition.toFixed(2)}%`
      });
    }

    // Get the formulation
    const formulation = await prisma.formulation.findUnique({
      where: { id: formulationId }
    });

    if (!formulation) {
      return res.status(404).json({
        error: "Formulation not found"
      });
    }

    // Get the latest version number
    const latestVersion = await prisma.formulationVersion.findFirst({
      where: { formulationId },
      orderBy: { versionNumber: "desc" }
    });

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create the new version - automatically use logged-in user's ID
    const newVersion = await prisma.formulationVersion.create({
      data: {
        formulationId,
        versionNumber: newVersionNumber,
        isLocked: false,
        creatorId: req.user!.userId, // Automatically from JWT token
        creationDate: new Date(),
        notes: notes || `Version ${newVersionNumber}`
      }
    });

    // Add ingredients to the new version
    const ingredientPromises = ingredients.map((ingredient: any) =>
      prisma.formulationIngredient.create({
        data: {
          formulationVersionId: newVersion.id,
          materialId: ingredient.materialId,
          percentageOrComposition: ingredient.percentageOrComposition,
          unit: ingredient.unit,
          notes: ingredient.notes || ""
        }
      })
    );

    await Promise.all(ingredientPromises);

    // Fetch the complete new version with ingredients
    const completeVersion = await prisma.formulationVersion.findUnique({
      where: { id: newVersion.id },
      include: {
        ingredients: {
          include: {
            material: true
          }
        }
      }
    });

    res.status(201).json({
      message: `Version ${newVersionNumber} created successfully`,
      version: completeVersion
    });

  } catch (error) {
    console.error("Error creating version:", error);
    res.status(500).json({
      error: "Failed to create version",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 3. Get all formulations with their versions
router.get("", authenticateToken, async (req, res) => {
  try {
    const { locked } = req.query;

    const formulations = await prisma.formulation.findMany({
      include: {
        versions: {
          include: {
            ingredients: {
              include: {
                material: true
              }
            }
          },
          orderBy: { versionNumber: "desc" }
        }
      },
      orderBy: { productName: "asc" }
    });

    // Filter by locked status if specified
    let filteredFormulations = formulations;
    if (locked === "true") {
      filteredFormulations = formulations.filter(f => 
        f.versions.some(v => v.isLocked)
      );
    } else if (locked === "false") {
      filteredFormulations = formulations.filter(f => 
        f.versions.every(v => !v.isLocked)
      );
    }

    res.json({
      formulations: filteredFormulations,
      totalCount: filteredFormulations.length
    });

  } catch (error) {
    console.error("Error fetching formulations:", error);
    res.status(500).json({
      error: "Failed to fetch formulations",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 4. Get specific formulation with all versions
router.get("/:formulationId", authenticateToken, async (req, res) => {
  try {
    const { formulationId } = req.params;

    const formulation = await prisma.formulation.findUnique({
      where: { id: formulationId },
      include: {
        versions: {
          include: {
            ingredients: {
              include: {
                material: true
              }
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { versionNumber: "desc" }
        }
      }
    });

    if (!formulation) {
      return res.status(404).json({
        error: "Formulation not found"
      });
    }

    res.json({
      formulation
    });

  } catch (error) {
    console.error("Error fetching formulation:", error);
    res.status(500).json({
      error: "Failed to fetch formulation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 5. Get specific version of a formulation
router.get("/:formulationId/versions/:versionNumber", authenticateToken, async (req, res) => {
  try {
    const { formulationId, versionNumber } = req.params;

    const version = await prisma.formulationVersion.findFirst({
      where: {
        formulationId,
        versionNumber: parseInt(versionNumber)
      },
      include: {
        ingredients: {
          include: {
            material: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!version) {
      return res.status(404).json({
        error: "Version not found"
      });
    }

    res.json({
      version
    });

  } catch (error) {
    console.error("Error fetching version:", error);
    res.status(500).json({
      error: "Failed to fetch version",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 6. Lock/Unlock a version (approval functionality) - Only managers and admins can lock/unlock
router.patch("/:formulationId/versions/:versionNumber/lock", authenticateToken, requireManager, async (req, res) => {
  try {
    const { formulationId, versionNumber } = req.params;
    const { isLocked, notes } = req.body;

    if (typeof isLocked !== "boolean") {
      return res.status(400).json({
        error: "isLocked boolean value is required"
      });
    }

    const version = await prisma.formulationVersion.findFirst({
      where: {
        formulationId,
        versionNumber: parseInt(versionNumber)
      }
    });

    if (!version) {
      return res.status(404).json({
        error: "Version not found"
      });
    }

    // Update the lock status
    const updatedVersion = await prisma.formulationVersion.update({
      where: { id: version.id },
      data: {
        isLocked,
        notes: notes || version.notes
      }
    });

    res.json({
      message: `Version ${versionNumber} ${isLocked ? 'locked' : 'unlocked'} successfully`,
      version: updatedVersion
    });

  } catch (error) {
    console.error("Error updating version lock status:", error);
    res.status(500).json({
      error: "Failed to update version lock status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 7. Compare two versions
router.get("/:formulationId/compare", authenticateToken, async (req, res) => {
  try {
    const { formulationId } = req.params;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      return res.status(400).json({
        error: "Both version1 and version2 query parameters are required"
      });
    }

    const [v1, v2] = await Promise.all([
      prisma.formulationVersion.findFirst({
        where: {
          formulationId,
          versionNumber: parseInt(version1 as string)
        },
        include: {
          ingredients: {
            include: {
              material: true
            }
          }
        }
      }),
      prisma.formulationVersion.findFirst({
        where: {
          formulationId,
          versionNumber: parseInt(version2 as string)
        },
        include: {
          ingredients: {
            include: {
              material: true
            }
          }
        }
      })
    ]);

    if (!v1 || !v2) {
      return res.status(404).json({
        error: "One or both versions not found"
      });
    }

    // Define the type for ingredient changes
    type IngredientChange = {
      type: string;
      materialId: string;
      materialName: string;
      v1Value?: number;
      v1Unit?: string;
      v2Value?: number;
      v2Unit?: string;
    };

    // Compare ingredients
    const comparison = {
      version1: {
        versionNumber: v1.versionNumber,
        creationDate: v1.creationDate,
        isLocked: v1.isLocked,
        ingredients: v1.ingredients
      },
      version2: {
        versionNumber: v2.versionNumber,
        creationDate: v2.creationDate,
        isLocked: v2.isLocked,
        ingredients: v2.ingredients
      },
      differences: {
        ingredientChanges: [] as IngredientChange[],
        totalIngredientsV1: v1.ingredients.length,
        totalIngredientsV2: v2.ingredients.length
      }
    };

    // Find ingredient differences
    const v1Ingredients = new Map(v1.ingredients.map((i: any) => [i.materialId, i]));
    const v2Ingredients = new Map(v2.ingredients.map((i: any) => [i.materialId, i]));

    // Check for added, removed, and modified ingredients
    for (const [materialId, v2Ingredient] of v2Ingredients) {
      const v1Ingredient = v1Ingredients.get(materialId);
      if (!v1Ingredient) {
        comparison.differences.ingredientChanges.push({
          type: "added",
          materialId,
          materialName: v2Ingredient.material.name,
          v2Value: v2Ingredient.percentageOrComposition,
          v2Unit: v2Ingredient.unit
        });
      } else if (
        v1Ingredient.percentageOrComposition !== v2Ingredient.percentageOrComposition ||
        v1Ingredient.unit !== v2Ingredient.unit
      ) {
        comparison.differences.ingredientChanges.push({
          type: "modified",
          materialId,
          materialName: v2Ingredient.material.name,
          v1Value: v1Ingredient.percentageOrComposition,
          v1Unit: v1Ingredient.unit,
          v2Value: v2Ingredient.percentageOrComposition,
          v2Unit: v2Ingredient.unit
        });
      }
    }

    for (const [materialId, v1Ingredient] of v1Ingredients) {
      if (!v2Ingredients.has(materialId)) {
        comparison.differences.ingredientChanges.push({
          type: "removed",
          materialId,
          materialName: v1Ingredient.material.name,
          v1Value: v1Ingredient.percentageOrComposition,
          v1Unit: v1Ingredient.unit
        });
      }
    }

    res.json({
      comparison
    });

  } catch (error) {
    console.error("Error comparing versions:", error);
    res.status(500).json({
      error: "Failed to compare versions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 8. Rollback to a previous version (create new version based on old one)
router.post("/:formulationId/rollback/:versionNumber", authenticateToken, requireManager, async (req, res) => {
  try {
    const { formulationId, versionNumber } = req.params;
    const { notes } = req.body;

    // Get the target version to rollback to
    const targetVersion = await prisma.formulationVersion.findFirst({
      where: {
        formulationId,
        versionNumber: parseInt(versionNumber)
      },
      include: {
        ingredients: true
      }
    });

    if (!targetVersion) {
      return res.status(404).json({
        error: "Target version not found"
      });
    }

    // Get the latest version number
    const latestVersion = await prisma.formulationVersion.findFirst({
      where: { formulationId },
      orderBy: { versionNumber: "desc" }
    });

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create new version based on the target version - automatically use logged-in user's ID
    const newVersion = await prisma.formulationVersion.create({
      data: {
        formulationId,
        versionNumber: newVersionNumber,
        isLocked: false,
        creatorId: req.user!.userId, // Automatically from JWT token
        creationDate: new Date(),
        notes: `Rollback to version ${versionNumber}: ${notes || ""}`
      }
    });

    // Copy ingredients from target version
    const ingredientPromises = targetVersion.ingredients.map((ingredient: any) =>
      prisma.formulationIngredient.create({
        data: {
          formulationVersionId: newVersion.id,
          materialId: ingredient.materialId,
          percentageOrComposition: ingredient.percentageOrComposition,
          unit: ingredient.unit,
          notes: ingredient.notes || ""
        }
      })
    );

    await Promise.all(ingredientPromises);

    // Fetch the complete new version
    const completeVersion = await prisma.formulationVersion.findUnique({
      where: { id: newVersion.id },
      include: {
        ingredients: {
          include: {
            material: true
          }
        }
      }
    });

    res.status(201).json({
      message: `Rollback to version ${versionNumber} completed. New version ${newVersionNumber} created.`,
      version: completeVersion
    });

  } catch (error) {
    console.error("Error rolling back version:", error);
    res.status(500).json({
      error: "Failed to rollback version",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 9. Update ingredients for a specific version
router.put("/:formulationId/versions/:versionNumber/ingredients", authenticateToken, requireManager, async (req, res) => {
  try {
    const { formulationId, versionNumber } = req.params;
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: "Ingredients array is required"
      });
    }

    // Validate that total composition equals 100%
    const totalComposition = ingredients.reduce(
      (sum, ing) => sum + (parseFloat(ing.percentageOrComposition) || 0),
      0
    );
    if (Math.abs(totalComposition - 100) > 0.01) {
      return res.status(400).json({
        error: `Total composition must equal 100%. Current total: ${totalComposition.toFixed(2)}%`
      });
    }

    // Get the version
    const version = await prisma.formulationVersion.findFirst({
      where: {
        formulationId,
        versionNumber: parseInt(versionNumber)
      }
    });

    if (!version) {
      return res.status(404).json({
        error: "Version not found"
      });
    }

    if (version.isLocked) {
      return res.status(400).json({
        error: "Cannot modify locked version"
      });
    }

    // Delete existing ingredients
    await prisma.formulationIngredient.deleteMany({
      where: { formulationVersionId: version.id }
    });

    // Add new ingredients
    const ingredientPromises = ingredients.map((ingredient: any) =>
      prisma.formulationIngredient.create({
        data: {
          formulationVersionId: version.id,
          materialId: ingredient.materialId,
          percentageOrComposition: ingredient.percentageOrComposition,
          unit: ingredient.unit,
          notes: ingredient.notes || ""
        }
      })
    );

    await Promise.all(ingredientPromises);

    // Fetch the updated version
    const updatedVersion = await prisma.formulationVersion.findUnique({
      where: { id: version.id },
      include: {
        ingredients: {
          include: {
            material: true
          }
        }
      }
    });

    res.json({
      message: "Ingredients updated successfully",
      version: updatedVersion
    });

  } catch (error) {
    console.error("Error updating ingredients:", error);
    res.status(500).json({
      error: "Failed to update ingredients",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 10. Delete formulation
router.delete("/:formulationId", authenticateToken, requireManager, async (req, res) => {
  try {
    const { formulationId } = req.params;

    // Check if formulation exists
    const formulation = await prisma.formulation.findUnique({
      where: { id: formulationId },
      include: {
        versions: {
          include: {
            batches: true,
            finishedGoods: true,
          },
        },
      },
    });

    if (!formulation) {
      return res.status(404).json({
        error: "Formulation not found"
      });
    }

    // Check if formulation is used in batches
    const hasBatches = formulation.versions.some(v => v.batches.length > 0);
    if (hasBatches) {
      return res.status(400).json({
        error: "Cannot delete formulation that is used in batches",
        details: "This formulation has been used in production batches"
      });
    }

    // Check if formulation is used in finished goods
    const hasFinishedGoods = formulation.versions.some(v => v.finishedGoods.length > 0);
    if (hasFinishedGoods) {
      return res.status(400).json({
        error: "Cannot delete formulation that is used in finished goods",
        details: "This formulation has been used in finished goods"
      });
    }

    // Delete the formulation (cascade will delete versions and ingredients)
    await prisma.formulation.delete({
      where: { id: formulationId },
    });

    res.json({
      message: "Formulation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting formulation:", error);
    res.status(500).json({
      error: "Failed to delete formulation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
