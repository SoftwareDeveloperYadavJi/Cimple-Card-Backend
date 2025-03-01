import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/mailSender.js";

const prisma = new PrismaClient();

// Nodemailer transporter setup
// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
// });

// // Function to send an email
// async function sendEmail(appointmentDetails: {
//   name: string;
//   email: string;
//   phoneNumber: string;
//   message: string;
// }) {
//   const mailOptions = {
//     from: "your-email@example.com", // Replace with your email
//     to: appointmentDetails.email,
//     subject: "Appointment Confirmation",
//     text: `Dear ${appointmentDetails.name},
    
// Thank you for scheduling an appointment. Below are the details:

// - **Phone Number:** ${appointmentDetails.phoneNumber}
// - **Message:** ${appointmentDetails.message || "N/A"}

// Please contact us if you have any questions.

// Best regards,  
// Your Company`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent: " + info.response);
//   } catch (error) {
//     console.error("Error sending email: ", error);
//   }
// }

// Controller for creating an appointment
export const createAppointment:any = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, email, message, timing, publicId, cardId } = req.body;

    // Validate the required fields
    if (!name || !phoneNumber || !email || !message || !publicId || !cardId) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, phoneNumber, email, message, publicId, cardId) are required.",
      });
    }

    // Ensure the user and card exist
    const user = await prisma.user.findUnique({
      where: { publicId },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found.",
      });
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        name,
        phoneNumber,
        email,
        message,
        timing: timing ? new Date(timing) : undefined, // Use provided timing or default to now
        userId:user.id,
        cardId,
      },
    });
 await sendEmail(appointment)
    return res.status(201).json({
      success: true,
      message: "Appointment created successfully.",
      appointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the appointment.",
      error: error.message,
    });
  }
};

// Controller for retrieving all appointments
export const getAllAppointments: any = async (req: Request, res: Response) => {
  try {
    // Ensure the user is authenticated
    const userId = req.user?.id; // Assuming `req.user` is populated by authentication middleware
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to access your appointments.",
      });
    }

    // Fetch appointments only for the logged-in user
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId, // Assuming the `appointment` table has a `userId` field
      },
    });

    return res.status(200).json({
      success: true,
      appointments,
      message: "Appointments retrieved successfully.",
    });
  } catch (error: any) {
    console.error("Error retrieving appointments:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateAppointment:any = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Appointment ID from URL params
    const { name, phoneNumber, email, message } = req.body;
    
    // Get the logged-in user's ID from the request (e.g., from JWT token)
    const userId = req.user?.id; // Assuming req.user contains authenticated user data

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Fetch the appointment to check if it belongs to the logged-in user
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if the appointment belongs to the logged-in user
    if (appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own appointments",
      });
    }

    // Update the appointment in the database
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { name, phoneNumber, email, message },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully!",
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
  
  // Controller for deleting an appointment
  export const deleteAppointment:any = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Appointment ID from URL params
      
      // Get the logged-in user's ID from the request (e.g., from JWT token)
      const userId = req.user?.id; // Assuming req.user contains authenticated user data
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }
  
      // Fetch the appointment to check if it belongs to the logged-in user
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
  
      // Check if the appointment belongs to the logged-in user
      if (appointment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own appointments",
        });
      }
  
      // Delete the appointment from the database
      await prisma.appointment.delete({
        where: { id: parseInt(id) },
      });
  
      return res.status(200).json({
        success: true,
        message: "Appointment deleted successfully!",
      });
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };
  