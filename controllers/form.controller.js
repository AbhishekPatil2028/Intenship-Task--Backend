import Form from "../models/form.model.js";

//  Helper: email validation
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// CREATE (POST)
export const createForm = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;

    //  VALIDATION
    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    //  SANITIZE
    const data = await Form.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ (GET)
export const getAllForms = async (req, res) => {
  try {
    const data = await Form.find({ isDeleted:false}).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE (PUT)
export const updateForm = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;

    //  VALIDATION (same as create)
    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    const updated = await Form.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      },
      {
        new: true,
        runValidators: true // 🔥 important
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteForm = async (req, res) => {
  try {
    const deleted = await Form.findByIdAndUpdate(req.params.id,{isDeleted:true},{new:true});

    if (!deleted) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
