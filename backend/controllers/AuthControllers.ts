import { Request, Response } from "express";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import bcrypt from "bcrypt";

// Input validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password && password.length >= 6;
};

const validateName = (name: string): boolean => {
  return name && name.trim().length >= 2;
};

//controllers for user registration
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!validateName(name)) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    //find user by email
    const user = await User.findOne({ email: sanitizedEmail });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    //encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: sanitizedEmail,
      password: hashedPassword,
    });

    // Create free plan subscription for new user
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    try {
      await Subscription.create({
        userId: newUser._id,
        planType: "free",
        stripeCustomerId: "free-plan",
        stripeSubscriptionId: `free-${newUser._id}-${Date.now()}`,
        stripeProductId: "free-plan",
        stripePriceId: "free-plan",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: thirtyDaysFromNow,
        cancelAtPeriodEnd: false,
        credits: {
          used: 0,
          limit: 3,
        },
        thumbnailLimit: 3,
      });
    } catch (subscriptionError: any) {
      // If subscription creation fails, delete the user to maintain data consistency
      console.error("Error creating subscription for new user:", subscriptionError);
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: "An error occurred during registration. Please try again." });
    }

    //setting user data in session
    req.session.isLoggedIn = true;
    req.session.userId = newUser._id;

    return res.status(201).json({
      message: "User registered successfully",
      user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

//controllers for user login

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    //find user by email
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    //setting user data in session
    req.session.isLoggedIn = true;
    req.session.userId = user._id;

    return res
      .status(200)
      .json({
        message: "Login successful",
        user: { _id: user._id, name: user.name, email: user.email },
      });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

//controllers for user logout

export const logoutUser = async (req: Request, res: Response) => {

    req.session.destroy((error:any)=>{
        if(error){
            return res.status(500).json({ message: "An error occurred during logout" });
        }
    });
    return res.status(200).json({ message: "Logout successful" });
}

//controllers for user verify

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const {userId} = req.session;
        const user = await User.findById(userId).select("-password");
        if(!userId){
            return res.status(401).json({ message: "Invalid user" });
        }
        return res.json({user});
        
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: "An error occurred while verifying user" });
    }
}