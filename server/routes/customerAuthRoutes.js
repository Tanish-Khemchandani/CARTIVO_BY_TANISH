const express = require("express");
const customerAuthController = require("../controllers/customerAuthController");
const { requireCustomer, getCustomerFromRequest } = require("../middleware/requireCustomer");

const router = express.Router();

// a signed-out "am I logged in?" check the AuthModal needs on page load;
// returns 401 (not an error to the client) when no session exists
router.get("/me", (req, res, next) => {
  getCustomerFromRequest(req)
    .then((session) => {
      if (!session) return res.status(401).json({ success: false, message: "Not signed in" });
      return customerAuthController.me(req, res, next);
    })
    .catch(next);
});

// profile edits and password changes need a real session
router.patch("/me", requireCustomer, customerAuthController.updateProfile);
router.patch("/password", requireCustomer, customerAuthController.changePassword);

router.post("/register", customerAuthController.register);
router.post("/login", customerAuthController.login);
router.post("/logout", customerAuthController.logout);

module.exports = router;
