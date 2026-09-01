const express = require("express");
const { User, Account } = require("../db");
const z = require("zod");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");
const { JWT_SECRET } = require("../config");
const router = express.Router(); // new router create-> emport kro -> index.js

const match_cri = z.object({
  username: z.string().email(),

  password: z.string().min(6),

  firstName: z.string().max(50).trim(),

  lastName: z.string().max(50).trim(),
});

//-------SIGN-UP ROUTE----------------
router.post("/signup", async (req, res) => {
  console.log("Request received", req.body);
  const { success } = match_cri.safeParse(req.body); // checks if what the user sent matches your Zod schema and returns an object:
  // success is boolean type-> it will result as yes or no only

  if (!success) {
    console.log(success);
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  // Database doesn’t already contain another user

  const existingUser = await User.findOne({ username: req.body.username });

  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const userId = user._id; // by default mongodb id ko userid declare kar deta hai

    //------- Create a new account------------
    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });

    // modern day tech: - Signup → account created → token sent back → user is logged in ✅
    const token = jwt.sign(
      {
        userId,
      },
      JWT_SECRET,
    );

    res.status(200).json({
      message: "User created successfully",
      token: token,
    });
  } catch (e) {
    res.json({
      message: "Do not know myself!",
    });
  }
});

const signinBody = z.object({
  username: z.string().email(),
  password: z.string().min(6),
});

//---------SIGN-IN ROUTER---------------
router.post("/signin", async (req, res) => {
  console.log("Sign in req body", req.body);

  const { success } = signinBody.safeParse(req.body);

  console.log("Sign in success or not ", success);

  if (!success) {
    return res.status(411).json({
      message: "Email already taken/ invalid inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET,
    );

    res.json({
      token: token,
    });

    return;
  }

  res.status(411).json({
    message: "Error while logging in",
  });
});

const patch_pass = z.object({
  password: z.string().min(6).optional(),
  firstName: z.string().max(50).trim().optional(),
  lastName: z.string().max(50).trim().optional(),
});

//---- UPDATE USER INFO ROUTE-----------
router.put("/", authMiddleware, async (req, res) => {
  // need to update password, firstName & lastName optional
  const { success } = patch_pass.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "Password is too small, error while uploading information",
    });
  }

  try {
    const userId = req.userId;
    console.log(userId);
    const updatedData = {};
    // password is required
    if (req.body.password) {
      updatedData.password = req.body.password;
    }

    // only add if user actually sent them
    if (req.body.firstName) {
      updatedData.firstName = req.body.firstName;
    }

    if (req.body.lastName) {
      updatedData.lastName = req.body.lastName;
    }

    await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      message: "Updated Successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(403).json({
      message: "Error while uplaoding info",
    });
  }
});

//---SEARCH FOR FRIEND SEND MONEY--------
router.get("/bulk", async (req, res) => {
  // filter query
  const filter = req.query.filter || "";
  // database query, these are mongodb operators $or, $regex- pattern matching
  const users = await User.find({
    $or: [{ firstName: { $regex: filter } }, { lastName: { $regex: filter } }],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
