export {
  fetchProducts,
  fetchProduct,
  scanBarcode,
  compareProducts,
  fetchStats,
  fetchRecommendations,
  fetchPassport,
  fetchPortfolioScore,
  fetchAuditLog,
  fetchProductEvidence,
  submitProductEvidence,
  fetchLeaderboard,
} from "./products";
export { registerUser, loginUser, fetchCurrentUser, updateProfile } from "./auth";
export { fetchReviews, submitReview, deleteReview } from "./reviews";
export {
  fetchCarbonSummary,
  fetchCarbonLogs,
  logCarbonPurchase,
  deleteCarbonLog,
  downloadCarbonExport,
} from "./carbon";
export { fetchRecipes, fetchRecipe, fetchMethodology } from "./recipes";
export {
  fetchConflictLog,
  triggerRescore,
  createManufacturer,
  fetchManufacturers,
  linkProductManufacturer,
  acknowledgeFee,
  fetchTransparencyStats,
} from "./admin";
export { fetchFavorites, addFavorite, removeFavorite, clearServerFavorites } from "./favorites";
